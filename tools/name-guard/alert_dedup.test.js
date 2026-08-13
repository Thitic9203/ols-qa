#!/usr/bin/env node
'use strict';
/* Pins "say it once": the same findings must never produce a second message.
 *
 * The scan runs every 30 minutes and findings outlive that, so without this the channel fills
 * with identical alerts — which already happened (34 items posted three times, 2026-08-13).
 *
 *   node tools/name-guard/alert_dedup.test.js
 */
const assert = require('assert');
const D = require('./alert_dedup');

let failed = 0;
function t(name, fn) {
  try { fn(); console.log('PASS  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + ' -> ' + (e && e.message)); }
}

const rep = (findings, extra) => Object.assign({
  ok: true, env: 'preprod', sources: { media: { count: 46 } }, findings,
}, extra || {});
const f = (id, rule, field) => ({ id, title: 'x', source: 'media', hits: [{ rule, field: field || 'title' }] });

// ---- fingerprint identity -----------------------------------------------------------
t('same findings → same fingerprint', () => {
  assert.strictEqual(D.fingerprint(rep([f('a', 'profanity')])), D.fingerprint(rep([f('a', 'profanity')])));
});
t('finding order does not change the fingerprint', () => {
  const one = rep([f('a', 'profanity'), f('b', 'gibberish')]);
  const two = rep([f('b', 'gibberish'), f('a', 'profanity')]);
  assert.strictEqual(D.fingerprint(one), D.fingerprint(two));
});
t('catalogue counts drifting does NOT change the fingerprint', () => {
  const before = rep([f('a', 'profanity')]);
  const after = rep([f('a', 'profanity')], { sources: { media: { count: 999 } } });
  assert.strictEqual(D.fingerprint(before), D.fingerprint(after));
});
t('a new finding changes the fingerprint', () => {
  assert.notStrictEqual(D.fingerprint(rep([f('a', 'profanity')])),
    D.fingerprint(rep([f('a', 'profanity'), f('b', 'gibberish')])));
});
t('a fixed finding changes the fingerprint', () => {
  assert.notStrictEqual(D.fingerprint(rep([f('a', 'profanity'), f('b', 'gibberish')])),
    D.fingerprint(rep([f('a', 'profanity')])));
});
t('a different environment is a different alert', () => {
  assert.notStrictEqual(D.fingerprint(rep([f('a', 'profanity')])),
    D.fingerprint(rep([f('a', 'profanity')], { env: 'training69' })));
});
t('a failed scan fingerprints on its reason', () => {
  const a = D.fingerprint({ ok: false, env: 'preprod', error: 'login failed' });
  const b = D.fingerprint({ ok: false, env: 'preprod', error: 'login failed' });
  const c = D.fingerprint({ ok: false, env: 'preprod', error: 'timeout' });
  assert.strictEqual(a, b);
  assert.notStrictEqual(a, c);
});

// ---- decide -------------------------------------------------------------------------
const content = '**Inappropriate content:** [Content Naming][preprod] พบชื่อไม่เหมาะสม 34 รายการ\n'
  + '> **Environment:** preprod\n> **Status:** Needs fix\n> **Scope:** media 46 · courses 45\n'
  + '> **Items:**\n> • `a` — media · คำไม่สุภาพ';

t('unchanged findings are NOT sent again', () => {
  const r = rep([f('a', 'profanity')]);
  const d = D.decide({ report: r, content, lastFingerprint: D.fingerprint(r) });
  assert.strictEqual(d.send, false);
});
t('changed findings ARE sent', () => {
  const prev = D.fingerprint(rep([f('a', 'profanity')]));
  const now = rep([f('a', 'profanity'), f('b', 'gibberish')]);
  assert.strictEqual(D.decide({ report: now, content, lastFingerprint: prev }).send, true);
});
t('first ever alert is sent (no history)', () => {
  assert.strictEqual(D.decide({ report: rep([f('a', 'profanity')]), content }).send, true);
});
t('--force always sends', () => {
  const r = rep([f('a', 'profanity')]);
  assert.strictEqual(D.decide({ report: r, content, lastFingerprint: D.fingerprint(r), force: true }).send, true);
});
t('an identical message already in the channel stops the repost (no local state)', () => {
  const r = rep([f('a', 'profanity')]);
  assert.strictEqual(D.decide({ report: r, content, lastChannelContent: content }).send, false);
});
t('the channel check ignores a drifting Scope line', () => {
  const older = content.replace('media 46 · courses 45', 'media 44 · courses 40');
  const r = rep([f('a', 'profanity')]);
  assert.strictEqual(D.decide({ report: r, content, lastChannelContent: older }).send, false);
});
t('a channel message with different items does not suppress', () => {
  const older = content.replace('`a`', '`zzz`');
  const r = rep([f('a', 'profanity')]);
  assert.strictEqual(D.decide({ report: r, content, lastChannelContent: older }).send, true);
});

// ---- which channel messages count as ours -------------------------------------------
t('recognises our own alerts for this env', () => {
  assert.ok(D.isOurAlert(content, 'preprod'));
  assert.ok(D.isOurAlert('**Name guard:** [Content Naming][preprod] สแกนไม่สำเร็จ', 'preprod'));
});
t('ignores another environment and other people messages', () => {
  assert.ok(!D.isOurAlert(content, 'training69'));
  assert.ok(!D.isOurAlert('hey team, any update?', 'preprod'));
  assert.ok(!D.isOurAlert('🔔 **QA Review Requested** — Ticket OLS-1', 'preprod'));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nall dedup checks passed — one alert per change, not per run');
process.exit(failed ? 1 : 0);
