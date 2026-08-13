#!/usr/bin/env node
'use strict';
/* Pins the pre-send gate: an alert that does not match the accepted format never leaves.
 *
 * Each check below corresponds to a defect that actually shipped — a wrong header, literal
 * markdown, a dropped field, a headline counting things the message never listed. The gate is
 * mechanical because a human proof-read cannot catch these: the draft always looks right to
 * whoever wrote it.
 *
 *   node tools/name-guard/alert_gate.test.js
 */
const assert = require('assert');
const G = require('./alert_gate');
const { build } = require('./alert_format');

let failed = 0;
function t(name, fn) {
  try { fn(); console.log('PASS  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + ' -> ' + (e && e.message)); }
}
const has = (v, needle) => v.failures.some((f) => f.includes(needle));

const report = {
  ok: true,
  env: 'preprod',
  sources: { media: { count: 46 } },
  findings: [
    { id: 'a', title: 'ทดสอบระบบ', source: 'media', type: 'ARTICLE', status: 'PUBLISHED',
      hits: [{ rule: 'test-trace', field: 'title' }] },
    { id: 'b', title: 'เส้นทางอาชีพสายสุขภาพ', source: 'media', type: 'VIDEO', status: 'PUBLISHED',
      hits: [{ rule: 'missing-cover', field: 'coverImageUrl' }] },
  ],
};
const good = build(report);

// ---- the real generator must always satisfy its own gate ----------------------------
t('a findings alert passes all seven checks', () => {
  const v = G.verify(good);
  assert.ok(v.ok, v.failures.join(' | '));
});
t('a clean alert passes too — the format does not change with the outcome', () => {
  const v = G.verify(build({ ok: true, env: 'preprod', sources: {}, findings: [] }));
  assert.ok(v.ok, v.failures.join(' | '));
});
t('a failed scan still carries every field', () => {
  const v = G.verify(build({ ok: false, env: 'preprod', error: 'login failed', sources: {}, findings: [] }));
  assert.ok(v.ok, v.failures.join(' | '));
});

// ---- L1 every field present ---------------------------------------------------------
for (const field of G.FIELDS) {
  t('L1 catches a dropped field: ' + field, () => {
    const broken = good.split('\n').filter((l) => !new RegExp('^> \\*\\*' + field.replace(' ', ' ') + ':\\*\\*').test(l)).join('\n');
    const v = G.verify(broken);
    assert.ok(!v.ok && has(v, 'L1 missing field: ' + field), v.failures.join(' | '));
  });
}

// ---- L2 order -----------------------------------------------------------------------
t('L2 catches fields in the wrong order', () => {
  const lines = good.split('\n');
  const i = lines.findIndex((l) => l.startsWith('> **Environment:**'));
  const j = lines.findIndex((l) => l.startsWith('> **Status:**'));
  [lines[i], lines[j]] = [lines[j], lines[i]];
  const v = G.verify(lines.join('\n'));
  assert.ok(!v.ok && has(v, 'L2 fields out of order'), v.failures.join(' | '));
});

// ---- L3 line shape ------------------------------------------------------------------
t('L3 catches a wrong header line', () => {
  const v = G.verify(good.replace(/^.*$/m, '❌ **Retest Result** — something'));
  assert.ok(!v.ok && has(v, 'L3 header line'), v.failures.join(' | '));
});
t('L3 catches a stray line that is neither field nor bullet', () => {
  const v = G.verify(good + '\nps. also check the other thing');
  assert.ok(!v.ok && has(v, 'L3 line'), v.failures.join(' | '));
});

// ---- L4 no invented fields ----------------------------------------------------------
t('L4 catches an added field', () => {
  const v = G.verify(good + '\n> **Scope:** media 46 · courses 45');
  assert.ok(!v.ok && has(v, 'L4 unexpected field: Scope'), v.failures.join(' | '));
});

// ---- L5 markdown safety -------------------------------------------------------------
t('L5 catches an unescaped underscore in a value', () => {
  const v = G.verify(good.replace('> **Environment:** preprod', '> **Environment:** pre_prod'));
  assert.ok(!v.ok && has(v, 'L5 unescaped _'), v.failures.join(' | '));
});
t('L5 catches literal ** inside a value', () => {
  const v = G.verify(good.replace('> **Status:** Needs fix', '> **Status:** **Needs fix**'));
  assert.ok(!v.ok && has(v, 'L5 literal **'), v.failures.join(' | '));
});
t('L5 leaves code spans alone — titles legitimately contain _ inside backticks', () => {
  const v = G.verify(build({ ...report, findings: [{ id: 'c', title: 'QA_OLS33 media', source: 'media',
    type: 'VIDEO', status: 'PUBLISHED', hits: [{ rule: 'test-trace', field: 'title' }] }] }));
  assert.ok(v.ok, v.failures.join(' | '));
});

// ---- L6 substance -------------------------------------------------------------------
t('L6 catches an empty field value', () => {
  const v = G.verify(good.replace('> **Environment:** preprod', '> **Environment:**'));
  assert.ok(!v.ok && has(v, 'L6 field has no value'), v.failures.join(' | '));
});
t('L6 catches a bullet block with no bullets', () => {
  const lines = good.split('\n');
  const at = lines.findIndex((l) => l === '> **Prevention:**');
  const end = lines.findIndex((l, i) => i > at && l.startsWith('> **FYI:**'));
  const v = G.verify(lines.slice(0, at + 1).concat(lines.slice(end)).join('\n'));
  assert.ok(!v.ok && has(v, 'L6 Prevention has no bullets'), v.failures.join(' | '));
});
t('L6 catches a message over the Discord limit', () => {
  const v = G.verify(good.replace('> **FYI:** ', '> **FYI:** ' + 'ก'.repeat(2100)));
  assert.ok(!v.ok && has(v, 'over Discord'), v.failures.join(' | '));
});

// ---- L7 no claim without evidence ---------------------------------------------------
t('L7 catches a headline that counts findings the message never lists', () => {
  const lines = good.split('\n').filter((l) => !l.startsWith('> • '));
  const v = G.verify(lines.join('\n'));
  assert.ok(!v.ok && has(v, 'L7 headline counts findings'), v.failures.join(' | '));
});
t('L7 catches an unfilled placeholder', () => {
  const v = G.verify(good.replace('preprod', 'undefined'));
  assert.ok(!v.ok && has(v, 'L7 unfilled placeholder'), v.failures.join(' | '));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nall gate checks passed — a malformed alert cannot be sent');
process.exit(failed ? 1 : 0);
