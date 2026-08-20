#!/usr/bin/env node
'use strict';
/* Pins that a big finding set still produces a SENDABLE alert.
 *
 * Story. On 2026-08-18 17:00 the pre-prod run found real problems and the channel got nothing:
 *
 *   FORMAT GATE BLOCKED THE ALERT — findings were found but nothing was sent.
 *
 * The gate was right — the message was over Discord's 2000-character limit — but a gate that
 * blocks every alert about a large finding set turns "we found 36 things" into silence, which
 * is the one outcome this guard exists to prevent. It got worse, not better, on 2026-08-20
 * once a creator library that had never been readable came into coverage: 2481 characters.
 *
 * The cause is not the number of findings. It is that the examples quote content titles
 * verbatim, and a title can be a whole paragraph — one pre-prod media item carries ~280
 * characters of Lorem Ipsum as its name. Four of those and the message is gone.
 *
 * So the format must fit by construction: cap what one quoted title may occupy, then drop
 * examples until it fits. Counts are never reduced — "และอีก N" absorbs whatever was dropped,
 * so the reader is never told there is less to fix than there is.
 *
 *   node tools/name-guard/alert_length.test.js
 */
const assert = require('assert');
const { build } = require('./alert_format');
const { verify } = require('./alert_gate');

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
};

const LOREM = 'RGS - สร้างวิดีโอ (เผยแพร่ - แก้ไข) Lorem Ipsum is simply dummy text of the printing '
  + 'and typesetting industry. Lorem Ipsum has been the standard dummy text ever since 1966, when '
  + 'designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, '
  + 'took a 1914 Cicero translation.';

const many = (n, make) => Array.from({ length: n }, (_, i) => make(i));

// Shaped like the real 2026-08-20 report: 21 bad names (one of them a paragraph),
// 5 missing covers, 5 duplicate titles, plus a cross-creator FYI.
const big = {
  env: 'preprod', ok: true,
  sources: { media: { count: 53 }, courses: { count: 53 }, 'own:carroll': { count: 60 } },
  findings: [
    { id: 'lorem', source: 'media', type: 'VIDEO', title: LOREM, hits: [{ rule: 'test-trace', why: 'ทดสอบ' }] },
    ...many(20, (i) => ({ id: 'g' + i, source: 'media', type: 'ARTICLE', title: '[Beer][RGS] - ทดสอบสื่อการเรียนรู้ชุดที่ ' + i, hits: [{ rule: 'gibberish', why: 'x' }] })),
    ...many(5, (i) => ({ id: 'c' + i, source: 'courses', type: 'courses', title: 'ทบทวนหลักการเขียนย่อหน้าให้ได้ใจความ ชุด ' + i, hits: [{ rule: 'missing-cover', why: 'x', field: 'coverImageUrl' }] })),
    ...many(5, (i) => ({ id: 'd' + i, source: 'learning-paths', type: 'learning-paths', title: 'ระบบร่างกายมนุษย์: ระบบหายใจและปอด ' + i, hits: [{ rule: 'duplicate-name', why: 'x' }] })),
  ],
};

const msg = build(big);

check('a big finding set still fits one Discord message', () => {
  assert.ok(msg.length <= 2000, 'built ' + msg.length + ' chars — the gate would refuse to send it, '
    + 'and the channel would hear nothing about ' + big.findings.length + ' real findings');
});

check('and passes all seven gate checks, so it is actually sendable', () => {
  const v = verify(msg);
  assert.deepStrictEqual(v.failures, [], JSON.stringify(v.failures));
});

check('no single quoted title is allowed to eat the message', () => {
  for (const seg of msg.match(/`[^`]*`/g) || []) {
    assert.ok(seg.length <= 80, 'a quoted title occupies ' + seg.length + ' chars: ' + seg.slice(0, 60) + '…');
  }
});

check('a truncated title is marked as truncated, not silently cut', () => {
  assert.ok(/…`/.test(msg), 'the paragraph-length title must show it was shortened');
});

check('the counts still tell the whole truth', () => {
  assert.ok(/พบชื่อไม่เหมาะสม 21 รายการ/.test(msg), 'headline lost the real count: ' + msg.split('\n')[0]);
  assert.ok(/ไม่มีปก 5 รายการ/.test(msg));
  assert.ok(/ชื่อซ้ำ 5 ชื่อ/.test(msg));
});

check('dropped examples are accounted for, never just omitted', () => {
  const shown = (msg.match(/`[^`]*`/g) || []).length;
  const promised = [...msg.matchAll(/และอีก (\d+)/g)].reduce((a, m) => a + Number(m[1]), 0);
  assert.ok(shown + promised >= 31, 'showed ' + shown + ' + promised ' + promised
    + ' — fewer than the 31 findings the reader must know about');
});

check('a small finding set is not truncated for no reason', () => {
  const small = { env: 'preprod', ok: true, sources: { media: { count: 5 } },
    findings: [{ id: 's', source: 'media', type: 'ARTICLE', title: 'RGS - บทความทดสอบ', hits: [{ rule: 'test-trace', why: 'ทดสอบ' }] }] };
  const m = build(small);
  assert.ok(m.includes('`RGS - บทความทดสอบ`'), 'short titles must survive verbatim: ' + m);
});

console.log();
if (failed) { console.log(failed + ' FAILED'); process.exit(1); }
console.log('all green');
