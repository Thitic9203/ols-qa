#!/usr/bin/env node
'use strict';
/* Pins the write guard: the training environment must be unwritable through every route.
 *
 * This is layer 6 of the guard itself — the checks below are what stops a later edit from
 * quietly widening the allowlist, dropping a denylist, or letting the scheduled cloud job
 * start passing --apply. A green run here is the evidence that training is still read-only.
 *
 *   node tools/name-guard/write_guard.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const G = require('./write_guard');

let failed = 0;
const pending = [];
function fail(name, e) { failed++; console.log('FAIL  ' + name + ' -> ' + (e && e.message)); }
function t(name, fn) {
  try {
    const r = fn();
    // async cases (the L5 interceptor) settle before the summary below
    if (r && typeof r.then === 'function') {
      pending.push(r.then(() => console.log('PASS  ' + name), (e) => fail(name, e)));
      return;
    }
    console.log('PASS  ' + name);
  } catch (e) { fail(name, e); }
}

const PREPROD = { key: 'preprod', origin: 'https://preprod-ols.example.test' };
const TRAINING = { key: 'training69', origin: 'https://obectraining69-ols.example.test' };

// ---- L1 allowlist: deny by default -------------------------------------------------
t('L1 preprod is the one writable env', () => {
  assert.strictEqual(G.classifyEnv(PREPROD).writable, true);
});
t('L1 an env nobody vouched for is denied', () => {
  const v = G.classifyEnv({ key: 'staging', origin: 'https://staging-ols.example.test' });
  assert.strictEqual(v.writable, false);
  assert.ok(v.layers.includes('L1'));
});
t('L1 missing label is denied (fail closed)', () => {
  assert.strictEqual(G.classifyEnv({ origin: 'https://preprod-ols.example.test' }).writable, false);
});
t('L1 missing origin is denied (fail closed)', () => {
  assert.strictEqual(G.classifyEnv({ key: 'preprod' }).writable, false);
});
t('L1 empty/garbage env is denied', () => {
  assert.strictEqual(G.classifyEnv({}).writable, false);
  assert.strictEqual(G.classifyEnv(null).writable, false);
});
t('L1 the allowlist does not contain a training env', () => {
  assert.ok(!G.WRITABLE_ENVS.some((e) => /training/i.test(e)));
});

// ---- L2 label denylist --------------------------------------------------------------
t('L2 the training label is denied', () => {
  const v = G.classifyEnv(TRAINING);
  assert.strictEqual(v.writable, false);
  assert.ok(v.layers.includes('L2'));
});
t('L2 a renamed training label (training70) is still denied', () => {
  const v = G.classifyEnv({ key: 'training70', origin: 'https://obectraining70-ols.example.test' });
  assert.strictEqual(v.writable, false);
  assert.ok(v.layers.includes('L2'));
});

// ---- L3 host denylist, independent of the label -------------------------------------
t('L3 a training host relabelled as preprod is STILL denied', () => {
  const v = G.classifyEnv({ key: 'preprod', origin: 'https://obectraining69-ols.example.test' });
  assert.strictEqual(v.writable, false, 'a training host must never be writable, whatever it is called');
  assert.ok(v.layers.includes('L3'));
});
t('L3 removing the label check alone would not open training', () => {
  // simulate L2 being gone: only the host matters here
  const v = G.classifyEnv({ key: 'preprod', origin: TRAINING.origin });
  assert.ok(v.reasons.some((r) => /host/.test(r)));
});

// ---- L4 assertWritable throws and reports ------------------------------------------
t('L4 assertWritable passes for preprod', () => {
  const v = G.assertWritable(PREPROD, { script: 'fix_names.js' });
  assert.strictEqual(v.writable, true);
});
t('L4 assertWritable throws for training', () => {
  assert.throws(() => G.assertWritable(TRAINING, { script: 'fix_names.js' }), /BLOCKED/);
});
t('L4 the thrown error carries script + layers for the alert', () => {
  try { G.assertWritable(TRAINING, { script: 'delete_media.js', action: 'delete' }); assert.fail('should throw'); }
  catch (e) {
    assert.strictEqual(e.name, 'WriteGuardError');
    assert.strictEqual(e.detail.script, 'delete_media.js');
    assert.ok(e.detail.layers.length > 0);
  }
});

// ---- L7 every refusal is audited ----------------------------------------------------
t('L7 a blocked attempt calls the auditor', () => {
  const seen = [];
  try { G.assertWritable(TRAINING, { script: 'hide.js', audit: (d) => seen.push(d) }); } catch (_) {}
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].script, 'hide.js');
});
t('L7 an auditor that throws still does not unblock the write', () => {
  assert.throws(() => G.assertWritable(TRAINING, { audit: () => { throw new Error('discord down'); } }), /BLOCKED/);
});
t('L7 an allowed write is not audited as a refusal', () => {
  const seen = [];
  G.assertWritable(PREPROD, { audit: (d) => seen.push(d) });
  assert.strictEqual(seen.length, 0);
});

// ---- L5 network interceptor ---------------------------------------------------------
function fakeCtx() {
  const ctx = { handler: null, route: async (_p, h) => { ctx.handler = h; } };
  return ctx;
}
function fakeRoute(method, url) {
  const r = { acted: null, request: () => ({ method: () => method, url: () => url }) };
  r.continue = () => { r.acted = 'continue'; };
  r.abort = (reason) => { r.acted = 'abort:' + reason; };
  return r;
}
async function l5(env, method, url) {
  const ctx = fakeCtx();
  await G.armContext(ctx, env, { script: 'test' });
  const r = fakeRoute(method, url);
  await ctx.handler(r);
  return r.acted;
}

t('L5 GET to training is allowed (scanning stays possible)', async () => {
  assert.strictEqual(await l5(TRAINING, 'GET', TRAINING.origin + '/api/media'), 'continue');
});
t('L5 PUT to training is aborted at the network layer', async () => {
  assert.ok(String(await l5(TRAINING, 'PUT', TRAINING.origin + '/api/media/1')).startsWith('abort'));
});
t('L5 DELETE to training is aborted', async () => {
  assert.ok(String(await l5(TRAINING, 'DELETE', TRAINING.origin + '/api/media/1')).startsWith('abort'));
});
t('L5 POST to a training host during a "preprod" run is aborted', async () => {
  // the exact shape of a wrong OLS_ORIGIN / a stray tab pointed at the wrong env
  assert.ok(String(await l5({ key: 'preprod', origin: PREPROD.origin }, 'POST', TRAINING.origin + '/api/uploads'))
    .startsWith('abort'));
});
t('L5 PUT to preprod is allowed', async () => {
  assert.strictEqual(await l5(PREPROD, 'PUT', PREPROD.origin + '/api/media/1'), 'continue');
});

// ---- L6 the scheduled cloud job must stay read-only ---------------------------------
t('L6 the training workflow never runs a mutator and never passes --apply', () => {
  const wf = path.join(__dirname, '..', '..', '.github', 'workflows', 'name-guard.yml');
  const src = fs.readFileSync(wf, 'utf8');
  assert.ok(!/--apply/.test(src), 'the cloud job must never pass --apply');
  for (const m of ['fix_names', 'fix_media', 'cycle_rename', 'delete_media', 'hide.js', 'unpublish_dups', 'approve_media']) {
    assert.ok(!src.includes(m), 'the cloud job must not run the mutator ' + m);
  }
});
t('L6 the training workflow only runs the read-only scanner + notifier', () => {
  const wf = path.join(__dirname, '..', '..', '.github', 'workflows', 'name-guard.yml');
  const src = fs.readFileSync(wf, 'utf8');
  const nodeCalls = (src.match(/node\s+tools\/name-guard\/([a-z_]+)\.js/g) || [])
    .map((s) => s.split('/').pop().replace('.js', ''));
  for (const c of nodeCalls) {
    assert.ok(['scan', 'notify'].includes(c), 'unexpected script in the cloud job: ' + c);
  }
});

// ---- read/write classification ------------------------------------------------------
t('read methods are exactly GET/HEAD/OPTIONS', () => {
  ['GET', 'head', 'Options'].forEach((m) => assert.ok(G.isReadMethod(m)));
  ['POST', 'PUT', 'PATCH', 'DELETE', ''].forEach((m) => assert.ok(!G.isReadMethod(m)));
});

Promise.all(pending).then(() => {
  console.log(failed ? '\n' + failed + ' FAILED' : '\nall write-guard checks passed — training stays read-only');
  process.exit(failed ? 1 : 0);
});
