#!/usr/bin/env node
'use strict';

/* Pins the post-mortem rules — layer 9 of the ten.
 *
 * The other layers are only as durable as this file. A future edit that quietly
 * loosens a rule (accepting an unknown status, tolerating a missing 5 Whys, letting a
 * DONE row name a report nobody wrote) fails here, which is the point: the failure
 * mode this whole system exists to prevent is a defence that stops defending silently.
 *
 *   node tools/postmortem-guard/postmortem_rules.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./postmortem_rules');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'docs', 'post-mortem');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** A report that passes every rule — each test below breaks exactly one thing in it. */
function goodReport(n = 1) {
  return [
    `# Post-Mortem Report #${R.pad4(n)} — ตัวอย่างที่ผ่านทุกกฎ`,
    '',
    ...R.REQUIRED_META.map((k) => `**${k}:** ค่า`),
    '',
    ...R.REQUIRED_HEADINGS.flatMap((h) => [h, 'เนื้อหา', '']),
    R.REQUIRED_FIVE_WHYS,
    '1. ทำไม — เพราะ',
    '',
    `${R.RULE_MARKER} CLAUDE.md หัวข้อทดสอบ`,
    '',
  ].join('\n');
}

const GOOD_NAME = '20260905-post-mortem-report-0001-deleted-working-links-on-unverified-claim.md';

// ── filenames ───────────────────────────────────────────────────────────────────

check('the filename carries a 4-digit running number and an English topic slug', () => {
  assert.deepStrictEqual(R.parseReportName(GOOD_NAME), {
    date: '2026-09-05',
    n: 1,
    padded: '0001',
    slug: 'deleted-working-links-on-unverified-claim',
  });
  for (const bad of [
    'post-mortem-report-0001-some-topic-here.md',            // no date
    '2026-09-05-post-mortem-report-0001-some-topic.md',      // dashed date
    '20260905-postmortem-report-0001-some-topic.md',         // missing hyphen
    '20260905-post-mortem-report-0001-some-topic.markdown',  // wrong extension
    '20260905-post-mortem-report-0001.md',                   // no slug at all
    '20260905-post-mortem-report-1-some-topic-here.md',      // number not padded
    '20260905-post-mortem-report-00001-some-topic.md',       // padded to 5
    '20260905-post-mortem-report-0001-Some-Topic-Here.md',   // not lowercase
    '20260905-post-mortem-report-0001-ลบลิงก์ที่ใช้ได้.md',        // not ASCII
  ]) {
    assert.strictEqual(R.parseReportName(bad), null, `accepted "${bad}"`);
  }
});

check('the running number is padded to 4 and keeps counting: 0001, 0002, 0003, 0010', () => {
  assert.deepStrictEqual([1, 2, 3, 10, 999].map(R.pad4), ['0001', '0002', '0003', '0010', '0999']);
});

check('a slug that says nothing is refused', () => {
  const short = '20260905-post-mortem-report-0001-link-bug.md';
  assert.ok(R.validateReport(short, goodReport(1)).some((p) => p.includes('at least')));

  const tooMany = '20260905-post-mortem-report-0001-' + Array(R.SLUG_MAX_WORDS + 1).fill('word').join('-') + '.md';
  assert.ok(R.validateReport(tooMany, goodReport(1)).some((p) => p.includes('max ' + R.SLUG_MAX_WORDS)));

  const initial = '20260905-post-mortem-report-0001-a-broken-thing.md';
  assert.ok(R.validateReport(initial, goodReport(1)).some((p) => p.includes('single-character word')));
});

// ── report structure ────────────────────────────────────────────────────────────

check('a complete report passes', () => {
  assert.deepStrictEqual(R.validateReport(GOOD_NAME, goodReport(1)), []);
});

check('every required section is genuinely required (drop one at a time)', () => {
  for (const heading of R.REQUIRED_HEADINGS) {
    const text = goodReport(1).replace(heading + '\n', '');
    const problems = R.validateReport(GOOD_NAME, text);
    assert.ok(problems.some((p) => p.includes(heading)), `dropping "${heading}" was tolerated`);
  }
});

check('every metadata line is genuinely required (drop one at a time)', () => {
  for (const key of R.REQUIRED_META) {
    const text = goodReport(1).replace(`**${key}:** ค่า\n`, '');
    const problems = R.validateReport(GOOD_NAME, text);
    assert.ok(problems.some((p) => p.includes(key)), `dropping **${key}:** was tolerated`);
  }
});

check('5 Whys is required — a cause without it is usually a symptom', () => {
  const text = goodReport(1).replace(R.REQUIRED_FIVE_WHYS + '\n', '');
  assert.ok(R.validateReport(GOOD_NAME, text).some((p) => p.includes('5 Whys')));
});

check('a report that changes no rule is refused (this is what stops a repeat)', () => {
  const text = goodReport(1).replace(R.RULE_MARKER, '**ไม่ใช่มาร์กเกอร์:**');
  assert.ok(R.validateReport(GOOD_NAME, text).some((p) => p.includes(R.RULE_MARKER)));
});

check('the title number must match the filename number, padding included', () => {
  const wrongNumber = R.validateReport('20260905-post-mortem-report-0002-some-other-topic.md', goodReport(1));
  assert.ok(wrongNumber.some((p) => p.includes('title says #0001') && p.includes('#0002')));

  // "#1" names the same report as "#0001", and is still refused: one written form only.
  const unpaddedTitle = goodReport(1).replace('#0001', '#1');
  assert.ok(R.validateReport(GOOD_NAME, unpaddedTitle).some((p) => p.includes('padded form')));
});

check('an unfilled template cannot be filed as a finished report', () => {
  for (const sentinel of R.UNFILLED_SENTINELS) {
    const text = goodReport(1) + '\n' + sentinel + '\n';
    assert.ok(
      R.validateReport(GOOD_NAME, text).some((p) => p.includes(sentinel)),
      `unfilled marker "${sentinel}" was tolerated`,
    );
  }
});

// ── ledger ──────────────────────────────────────────────────────────────────────

const LEDGER_HEAD = [
  '| ID | เกิดเมื่อ | อาการ | ที่มา | สถานะ | รายงาน |',
  '|----|-----------|-------|-------|-------|--------|',
];
const ledger = (...rows) => [...LEDGER_HEAD, ...rows].join('\n') + '\n';

check('the ledger table is found by its header, never by line number', () => {
  const withPreamble = 'ข้อความ\n\nอีกย่อหน้า\n\n' + ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | OPEN | — |');
  const { rows, problems } = R.parseLedger(withPreamble);
  assert.deepStrictEqual(problems, []);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].id, 'PM-2026-09-05-01');
});

check('a ledger with no table at all is a finding, not an empty pass', () => {
  const { rows, problems } = R.parseLedger('# หัวข้อ\n\nไม่มีตาราง\n');
  assert.strictEqual(rows.length, 0);
  assert.ok(problems.some((p) => p.includes('no ledger table')));
});

check('a column added or removed stops the parse instead of shifting what is read', () => {
  const shifted = '| ID | เกิดเมื่อ | อาการ | ที่มา | เพิ่ม | สถานะ | รายงาน |\n|--|--|--|--|--|--|--|\n';
  const { problems } = R.parseLedger(shifted);
  assert.ok(problems.some((p) => p.includes('6 columns')));
});

check('only OPEN / DONE / WONTFIX are accepted — an unparseable status is refused', () => {
  assert.deepStrictEqual(R.STATUSES, ['OPEN', 'DONE', 'WONTFIX']);
  const { rows } = R.parseLedger(ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | LATER | — |'));
  assert.ok(R.validateLedger(rows).some((p) => p.includes('LATER')));
});

check('a malformed id, date, or empty symptom is each caught', () => {
  const cases = [
    ['| PM-20260905-01 | 2026-09-05 | อาการ | ที่มา | OPEN | — |', 'PM-YYYY-MM-DD-NN'],
    ['| PM-2026-09-05-01 | 05/09/2026 | อาการ | ที่มา | OPEN | — |', 'YYYY-MM-DD'],
    ['| PM-2026-09-05-01 | 2026-09-05 | — | ที่มา | OPEN | — |', 'อาการ is empty'],
  ];
  for (const [row, expect] of cases) {
    const { rows } = R.parseLedger(ledger(row));
    assert.ok(R.validateLedger(rows).some((p) => p.includes(expect)), `tolerated: ${row}`);
  }
});

check('duplicate ids are caught', () => {
  const { rows } = R.parseLedger(ledger(
    '| PM-2026-09-05-01 | 2026-09-05 | ก | ที่มา | OPEN | — |',
    '| PM-2026-09-05-01 | 2026-09-05 | ข | ที่มา | OPEN | — |',
  ));
  assert.ok(R.validateLedger(rows).some((p) => p.includes('duplicate id')));
});

check('DONE must name a real report filename, OPEN must name none', () => {
  const done = R.parseLedger(ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | DONE | เขียนแล้ว |')).rows;
  assert.ok(R.validateLedger(done).some((p) => p.includes('must name a report file')));

  const open = R.parseLedger(ledger(`| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | OPEN | ${GOOD_NAME} |`)).rows;
  assert.ok(R.validateLedger(open).some((p) => p.includes('OPEN but a report is named')));
});

check('WONTFIX needs the owner\'s reason and the date they decided it', () => {
  const bare = R.parseLedger(ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | WONTFIX | — |')).rows;
  assert.ok(R.validateLedger(bare).some((p) => p.includes("owner's reason")));

  const undated = R.parseLedger(ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | WONTFIX | เจ้าของงานบอกว่าไม่ต้อง |')).rows;
  assert.ok(R.validateLedger(undated).some((p) => p.includes('date the owner decided')));

  const ok = R.parseLedger(ledger('| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | WONTFIX | เจ้าของงานสั่ง 2026-09-05 |')).rows;
  assert.deepStrictEqual(R.validateLedger(ok), []);
});

check('openRows returns exactly the rows still owing a report', () => {
  const { rows } = R.parseLedger(ledger(
    '| PM-2026-09-05-01 | 2026-09-05 | ก | ที่มา | OPEN | — |',
    `| PM-2026-09-05-02 | 2026-09-05 | ข | ที่มา | DONE | ${GOOD_NAME} |`,
    '| PM-2026-09-05-03 | 2026-09-05 | ค | ที่มา | WONTFIX | เหตุผล 2026-09-05 |',
  ));
  assert.deepStrictEqual(R.openRows(rows).map((r) => r.id), ['PM-2026-09-05-01']);
});

// ── cross-checks ────────────────────────────────────────────────────────────────

check('a DONE row naming a report nobody wrote is caught', () => {
  const { rows } = R.parseLedger(ledger(`| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | DONE | ${GOOD_NAME} |`));
  const problems = R.crossCheck({ reportNames: [], rows, indexText: '' });
  assert.ok(problems.some((p) => p.includes('does not exist in docs/post-mortem/')));
});

check('a report with no ledger row is caught — the ledger would be under-reporting', () => {
  const problems = R.crossCheck({ reportNames: [GOOD_NAME], rows: [], indexText: GOOD_NAME });
  assert.ok(problems.some((p) => p.includes('no DONE row in PENDING.md points at it')));
});

check('a report missing from the index is caught, and an index entry with no file too', () => {
  const { rows } = R.parseLedger(ledger(`| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | DONE | ${GOOD_NAME} |`));
  const missingFromIndex = R.crossCheck({ reportNames: [GOOD_NAME], rows, indexText: 'ไม่มีอะไร' });
  assert.ok(missingFromIndex.some((p) => p.includes('missing from the index')));

  const ghost = R.crossCheck({
    reportNames: [], rows: [], indexText: '20260101-post-mortem-report-0009-a-report-that-never-existed.md',
  });
  assert.ok(ghost.some((p) => p.includes('which does not exist')));
});

check('numbering must run 0001..N — a gap means a report was deleted', () => {
  const names = [
    '20260905-post-mortem-report-0001-first-real-topic.md',
    '20260906-post-mortem-report-0003-third-real-topic.md',
  ];
  const { rows } = R.parseLedger(ledger(
    `| PM-2026-09-05-01 | 2026-09-05 | ก | ที่มา | DONE | ${names[0]} |`,
    `| PM-2026-09-06-01 | 2026-09-06 | ข | ที่มา | DONE | ${names[1]} |`,
  ));
  const problems = R.crossCheck({ reportNames: names, rows, indexText: names.join(' ') });
  assert.ok(
    problems.some((p) => p.includes('numbering must run') && p.includes('0001, 0003')),
    'a gap between 0001 and 0003 was tolerated: ' + problems.join(' | '),
  );
});

check('two rows cannot claim the same report', () => {
  const { rows } = R.parseLedger(ledger(
    `| PM-2026-09-05-01 | 2026-09-05 | ก | ที่มา | DONE | ${GOOD_NAME} |`,
    `| PM-2026-09-05-02 | 2026-09-05 | ข | ที่มา | DONE | ${GOOD_NAME} |`,
  ));
  const problems = R.crossCheck({ reportNames: [GOOD_NAME], rows, indexText: GOOD_NAME });
  assert.ok(problems.some((p) => p.includes('already claimed by line')));
});

check('"ผิดซ้ำจาก" must point at a report that exists', () => {
  const text = goodReport(1) + `\n${R.REPEAT_MARKER} #7\n`;
  const { rows } = R.parseLedger(ledger(`| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | DONE | ${GOOD_NAME} |`));
  const problems = R.crossCheck({
    reportNames: [GOOD_NAME], reportTexts: { [GOOD_NAME]: text }, rows, indexText: GOOD_NAME,
  });
  assert.ok(problems.some((p) => p.includes('#7')));
  assert.deepStrictEqual(R.repeatsOf(text), [7]);
});

// ── the live folder ─────────────────────────────────────────────────────────────

check('the live docs/post-mortem/ folder is present and its pieces exist', () => {
  for (const f of ['README.md', 'TEMPLATE.md', 'PENDING.md']) {
    assert.ok(fs.existsSync(path.join(DIR, f)), `docs/post-mortem/${f} is missing`);
  }
});

check('the template carries every heading the rules demand (else nobody can pass)', () => {
  const tpl = fs.readFileSync(path.join(DIR, 'TEMPLATE.md'), 'utf8');
  for (const h of R.REQUIRED_HEADINGS) assert.ok(tpl.includes(h), `TEMPLATE.md lacks "${h}"`);
  for (const k of R.REQUIRED_META) assert.ok(tpl.includes(`**${k}:**`), `TEMPLATE.md lacks **${k}:**`);
  assert.ok(tpl.includes(R.REQUIRED_FIVE_WHYS), 'TEMPLATE.md lacks the 5 Whys section');
  assert.ok(tpl.includes(R.RULE_MARKER), 'TEMPLATE.md lacks the rule marker');
});

check('the live ledger parses and validates', () => {
  const { rows, problems } = R.parseLedger(fs.readFileSync(path.join(DIR, 'PENDING.md'), 'utf8'));
  assert.deepStrictEqual(problems, [], 'live PENDING.md does not parse');
  assert.deepStrictEqual(R.validateLedger(rows), [], 'live PENDING.md has invalid rows');
});

check('every live report passes the structural rules', () => {
  for (const f of fs.readdirSync(DIR).filter((n) => R.REPORT_FILE_RE.test(n))) {
    const problems = R.validateReport(f, fs.readFileSync(path.join(DIR, f), 'utf8'));
    assert.deepStrictEqual(problems, [], `${f}: ${problems.join(' | ')}`);
  }
});

// ── the defence layers themselves ───────────────────────────────────────────────

check('the ten layers are all wired — each named file exists and mentions the debt', () => {
  const wired = [
    ['CLAUDE.md', 'post-mortem'],
    ['docs/post-mortem/PENDING.md', 'OPEN'],
    ['.claude/hooks/postmortem-debt.sh', 'PENDING.md'],
    ['.claude/hooks/inject-context.sh', 'postmortem-debt.sh'],
    ['.claude/hooks/pre-compact.sh', 'postmortem-debt.sh'],
    ['.claude/settings.json', 'postmortem-debt.sh'],
    ['scripts/hooks/pre-commit', 'postmortem-guard'],
    ['tools/postmortem-guard/check.js', 'PENDING.md'],
    ['.github/workflows/tests.yml', 'postmortem-guard'],
  ];
  for (const [rel, needle] of wired) {
    const p = path.join(ROOT, rel);
    assert.ok(fs.existsSync(p), `${rel} is missing — a layer was removed`);
    assert.ok(fs.readFileSync(p, 'utf8').includes(needle), `${rel} no longer mentions "${needle}" — that layer is unwired`);
  }
});

check('the guard has no override flag (an override that exists eventually gets used)', () => {
  const src = fs.readFileSync(path.join(__dirname, 'check.js'), 'utf8')
    + fs.readFileSync(path.join(ROOT, '.claude', 'hooks', 'postmortem-debt.sh'), 'utf8');
  for (const bad of ['--force', 'SKIP_POSTMORTEM', 'POSTMORTEM_OK', 'no-verify']) {
    assert.ok(!src.includes(bad), `an override "${bad}" appeared`);
  }
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
