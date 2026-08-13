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

// ---- L6 nothing automated may touch training at all ---------------------------------
// The owner's instruction is hands-off, not read-only-ish: training carries real people's live
// work, so it is not scanned, not polled, and not alerted on. The scheduled cloud job that used
// to do exactly that was deleted; these checks stop it coming back by accident.
const WF_DIR = path.join(__dirname, '..', '..', '.github', 'workflows');
const workflows = () => (fs.existsSync(WF_DIR) ? fs.readdirSync(WF_DIR).filter((f) => /\.ya?ml$/.test(f)) : []);

t('L6 no workflow runs the name-guard scanner on a schedule', () => {
  for (const f of workflows()) {
    const src = fs.readFileSync(path.join(WF_DIR, f), 'utf8');
    if (!/tools\/name-guard\//.test(src)) continue;
    assert.ok(!/^\s*schedule:/m.test(src), f + ' schedules a name-guard run — training must not be polled');
  }
});
t('L6 no workflow names a training environment', () => {
  for (const f of workflows()) {
    const src = fs.readFileSync(path.join(WF_DIR, f), 'utf8');
    assert.ok(!/training/i.test(src), f + ' references a training environment');
  }
});
t('L6 no workflow runs a mutator or passes --apply', () => {
  for (const f of workflows()) {
    const src = fs.readFileSync(path.join(WF_DIR, f), 'utf8');
    assert.ok(!/--apply/.test(src), f + ' passes --apply');
    for (const m of ['fix_names', 'fix_media', 'cycle_rename', 'delete_media', 'hide.js', 'unpublish_dups', 'approve_media']) {
      assert.ok(!src.includes(m), f + ' runs the mutator ' + m);
    }
  }
});

// ---- hands-off: reads are refused too, not only writes ------------------------------
// The write guard alone was not enough. A read logs in as a real person and ends in an alert
// about their live work — so the scanner refuses the environment outright. These pin that.
t('hands-off flags a training label', () => {
  const v = G.isProtectedEnv(TRAINING);
  assert.strictEqual(v.protected, true);
  assert.ok(v.reasons.length > 0);
});
t('hands-off catches a training host hidden behind an innocent label', () => {
  assert.strictEqual(G.isProtectedEnv({ key: 'preprod', origin: 'https://obectraining69-ols.example.test' }).protected, true);
});
t('hands-off catches a renamed training label (training70, obectraining…)', () => {
  ['training70', 'obectraining69', 'TRAINING'].forEach((k) => {
    assert.strictEqual(G.isProtectedEnv({ key: k, origin: 'https://x.example.test' }).protected, true, k);
  });
});
t('hands-off leaves pre-prod alone', () => {
  assert.strictEqual(G.isProtectedEnv(PREPROD).protected, false);
});
t('scan.js refuses a hands-off env before it loads a browser, and exits 2 not 0', () => {
  const src = fs.readFileSync(path.join(__dirname, 'scan.js'), 'utf8');
  const guardAt = src.indexOf('isProtectedEnv');
  const playwrightAt = src.indexOf("require('playwright')");
  assert.ok(guardAt > 0, 'scan.js does not consult the hands-off guard');
  assert.ok(guardAt < playwrightAt, 'the refusal must come before playwright loads');
  assert.ok(/handsOff\.protected[\s\S]{0,400}process\.exit\(2\)/.test(src), 'a refused scan must exit 2 — exit 0 reads as "scanned, clean"');
  assert.ok(!/GUARD_FORCE|--force/.test(src), 'scan.js must not carry an override flag');
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
