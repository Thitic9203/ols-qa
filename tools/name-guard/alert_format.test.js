#!/usr/bin/env node
'use strict';
/* Pins the Discord alert contract. It drifted twice by hand (wrong shape, wrong language,
 * DM instead of the channel) before this test existed — each rule below is one of those.
 *
 *   node tools/name-guard/alert_format.test.js
 */
const assert = require('assert');
const { build, esc } = require('./alert_format');

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
};

const findings = {
  env: 'preprod', ok: true,
  sources: { media: { count: 46 }, courses: { count: 45 }, 'own:sorat': { count: 95 }, 'own:carroll': { count: 36 } },
  findings: [
    { id: 'a', source: 'media', title: 'ผจญภัย 3 มิติ', hits: [{ rule: 'gibberish', why: 'x' }] },
    { id: 'a', source: 'own:carroll', title: 'ผจญภัย 3 มิติ', hits: [{ rule: 'gibberish', why: 'x' }] },
    { id: 'b', source: 'media', title: 'ชื่อซ้ำ', hits: [{ rule: 'duplicate-name', why: 'x' }] },
    { id: 'c', source: 'media', title: 'ชื่อซ้ำ', hits: [{ rule: 'duplicate-name', why: 'x' }] },
  ],
};
const clean = { env: 'preprod', ok: true, sources: { media: { count: 46 } }, findings: [] };
const broken = { env: 'preprod', ok: false, error: 'login failed', sources: {}, findings: [] };

for (const [label, report] of [['findings', findings], ['clean', clean], ['failed scan', broken]]) {
  const msg = build(report);
  const lines = msg.split('\n');
  check(label + ': headline is bold and first', () => {
    assert.ok(/^\*\*[^*]+:\*\*/.test(lines[0]), 'line 1 must open with a bold label: ' + lines[0]);
  });
  check(label + ': every field line is a blockquote with a bold English label', () => {
    for (const l of lines.slice(1)) {
      if (l.startsWith('> • ')) continue;                       // bullet inside a section
      assert.ok(l.startsWith('> '), 'not quoted: ' + l);
      const m = l.match(/^> \*\*([^*]+):\*\*/);
      assert.ok(m, 'no bold label: ' + l);
      assert.ok(/^[\x20-\x7E]+$/.test(m[1]), 'field label must stay English/ASCII: ' + m[1]);
    }
  });
  check(label + ': fits one Discord message', () => assert.ok(msg.length <= 2000, 'too long: ' + msg.length));
}

check('an item appearing in two sources is reported once', () => {
  const msg = build(findings);
  const hits = msg.split('\n').filter((l) => l.includes('ผจญภัย')).length;
  assert.strictEqual(hits, 1, 'expected 1 line, got ' + hits);
});

check('duplicate titles are listed by name, not just counted', () => {
  assert.ok(build(findings).includes('`ชื่อซ้ำ`'));
});

check('creator libraries collapse into one scope entry', () => {
  const scope = build(findings).split('\n').find((l) => l.startsWith('> **Scope:**'));
  assert.ok(!scope.includes('own:sorat'), 'per-account names should not be in Scope: ' + scope);
  assert.ok(/creator 2 /.test(scope), 'expected a creator-library total: ' + scope);
});

check('a failed scan never reads as a pass', () => {
  const msg = build(broken);
  assert.ok(/Status:\*\* Failed/.test(msg));
  assert.ok(!/Clean/.test(msg));
});

check('markdown in titles is escaped', () => {
  assert.strictEqual(esc('QA_OLS *x*'), 'QA\\_OLS \\*x\\*');
});

/* A missing cover is not a bad name. An alert that says "พบชื่อไม่เหมาะสม 34 รายการ" about 34
 * perfectly readable titles sends the reader to rename content that needs no renaming — the
 * owner called that out on 2026-08-13. Each problem is counted and asked for as itself. */
const coverOnly = {
  ok: true, env: 'preprod', sources: { media: { count: 46 } },
  findings: [
    { id: 'a', title: 'การสำรวจศักยภาพตนเองเพื่อการเลือกเส้นทางอาชีพ', source: 'media', status: 'PUBLISHED',
      hits: [{ rule: 'missing-cover', field: 'coverImageUrl' }] },
    { id: 'b', title: 'ปลดล็อกเส้นทางสู่ 4 อาชีพยอดฮิต', source: 'media', status: 'PUBLISHED',
      hits: [{ rule: 'missing-cover', field: 'coverImageUrl' }] },
  ],
};

check('a missing cover is never reported as a bad name', () => {
  const msg = build(coverOnly);
  assert.ok(/ไม่มีปก 2 รายการ/.test(msg), 'headline should count covers: ' + msg.split('\n')[0]);
  assert.ok(!/พบชื่อไม่เหมาะสม/.test(msg), 'must not claim the names are unfit');
});

check('a cover-only alert does not ask anyone to rename anything', () => {
  const msg = build(coverOnly);
  assert.ok(/อัปโหลดปก/.test(msg), 'should ask for a cover');
  assert.ok(!/เปลี่ยนเป็นชื่อ/.test(msg), 'must not ask for a rename: ' + msg);
});

check('names and covers are counted separately when both are wrong', () => {
  const mixed = { ...coverOnly, findings: coverOnly.findings.concat([
    { id: 'c', title: 'ทดสอบระบบ QA', source: 'media', status: 'PUBLISHED', hits: [{ rule: 'test-trace', field: 'title' }] },
  ]) };
  const head = build(mixed).split('\n')[0];
  assert.ok(/พบชื่อไม่เหมาะสม 1 รายการ/.test(head), head);
  assert.ok(/ไม่มีปก 2 รายการ/.test(head), head);
});

check('an item with BOTH a bad name and no cover is counted once, as a name problem', () => {
  const both = { ...coverOnly, findings: [
    { id: 'z', title: 'ทดสอบ', source: 'media', status: 'PUBLISHED',
      hits: [{ rule: 'test-trace', field: 'title' }, { rule: 'missing-cover', field: 'coverImageUrl' }] },
  ] };
  const head = build(both).split('\n')[0];
  assert.ok(/พบชื่อไม่เหมาะสม 1 รายการ/.test(head), head);
  assert.ok(!/ไม่มีปก/.test(head), 'must not double-count the same item: ' + head);
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
