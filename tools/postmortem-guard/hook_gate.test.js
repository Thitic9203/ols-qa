#!/usr/bin/env node
'use strict';

/* Pins the SHELL half of the debt gate — the half that actually blocks a commit.
 *
 * Every other suite in this directory feeds the rules a hand-made list and never touches
 * the code that reads the ledger off disk. That gap is what let report #0003 happen: the
 * inlined awk read the status column by position, its output flowed into
 * `[ "$COUNT" -gt 0 ]`, and an unreadable ledger produced an empty string that the test
 * quietly evaluated as false. Twenty-nine green unit tests said nothing about it.
 *
 * So this file runs the real script against real files on disk, and asserts the REFUSAL,
 * not merely that it ran.
 *
 *   node tools/postmortem-guard/hook_gate.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const COUNTER = path.join(__dirname, 'ledger_open_count.sh');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** Run the counter. Returns {code, out} — never throws on a non-zero exit.
 *  `locale` forces LC_ALL for that run; '' leaves whatever the runner inherited. */
function count(ledgerPath, locale) {
  const env = { ...process.env };
  if (locale === undefined) { /* caller does not care — inherit */ }
  else if (locale === '') { delete env.LC_ALL; delete env.LANG; }
  else { env.LC_ALL = locale; env.LANG = locale; }
  try {
    const out = execFileSync('bash', [COUNTER, ledgerPath], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: out.trim() };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || '').trim() + String(e.stderr || '').trim() };
  }
}

const HEADER = [
  '| ID | เกิดเมื่อ | อาการ | ที่มา | สถานะ | รายงาน |',
  '|----|-----------|-------|-------|-------|--------|',
];
const OPEN_ROW = '| PM-2026-09-06-01 | 2026-09-06 | อาการอย่างหนึ่ง | ที่มา | OPEN | — |';
const DONE_ROW = '| PM-2026-09-05-01 | 2026-09-05 | อาการอีกอย่าง | ที่มา | DONE | 20260905-post-mortem-report-0001-a-real-topic-here.md |';

let tmp;
function fixture(name, lines) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-gate-'));
try {
  // ── counts it can trust ────────────────────────────────────────────────────────

  check('a clean ledger with no OPEN row counts 0', () => {
    const r = count(fixture('none.md', [...HEADER, DONE_ROW]));
    assert.deepStrictEqual([r.code, r.out], [0, '0']);
  });

  check('OPEN rows are counted, and only OPEN rows', () => {
    const two = OPEN_ROW.replace('-01 |', '-02 |');
    const wontfix = OPEN_ROW.replace('-01 |', '-03 |').replace('| OPEN | — |', '| WONTFIX | เหตุผล 2026-09-06 |');
    const r = count(fixture('some.md', [...HEADER, DONE_ROW, OPEN_ROW, two, wontfix]));
    assert.deepStrictEqual([r.code, r.out], [0, '2']);
  });

  check('a table that appears after prose is still found — the header locates it, not a line number', () => {
    const r = count(fixture('prose.md', ['# หัวข้อ', '', 'ย่อหน้าอธิบาย', '', ...HEADER, OPEN_ROW]));
    assert.deepStrictEqual([r.code, r.out], [0, '1']);
  });

  check('an unrelated table above the ledger is not mistaken for it', () => {
    const legend = ['| สถานะ | ความหมาย | เงื่อนไข |', '|---|---|---|', '| `OPEN` | ยังไม่มีรายงาน | ทุกชั้นเตือน |'];
    const r = count(fixture('legend.md', ['# หัวข้อ', '', ...legend, '', ...HEADER, OPEN_ROW]));
    assert.deepStrictEqual([r.code, r.out], [0, '1']);
  });

  // ── refusals: every one of these used to read as "no debt" ──────────────────────

  check('a ledger that does not exist is REFUSED, never counted as zero', () => {
    const r = count(path.join(tmp, 'nothing-here.md'));
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.startsWith('REFUSE:'), r.out);
  });

  check('a directory in place of the ledger is REFUSED', () => {
    const d = path.join(tmp, 'adir');
    fs.mkdirSync(d, { recursive: true });
    const r = count(d);
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.includes('not a regular file'), r.out);
  });

  check('an UNREADABLE ledger is REFUSED — this is the exact hole from report #0003', () => {
    if (typeof process.getuid === 'function' && process.getuid() === 0) {
      console.log('      (skipped: running as root, where permissions cannot be tested)');
      return;
    }
    const p = fixture('locked.md', [...HEADER, OPEN_ROW]);
    fs.chmodSync(p, 0o000);
    try {
      const r = count(p);
      assert.strictEqual(r.code, 2, 'an unreadable ledger did not refuse');
      assert.ok(r.out.includes('unreadable'), r.out);
    } finally {
      fs.chmodSync(p, 0o644);
    }
  });

  check('a row with a column REMOVED is REFUSED — the other half of #0003', () => {
    // -F'|' gives a correct 6-column row NF=8, so a 5-column row is NF=7 and slipped
    // past the old `NF < 7` guard, after which $6 read a different column entirely.
    const cut = '| PM-2026-09-06-01 | 2026-09-06 | อาการอย่างหนึ่ง | OPEN | — |';
    const r = count(fixture('cut.md', [...HEADER, cut]));
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.includes('5 columns') && r.out.includes('header has 6'), r.out);
  });

  check('a row with a column ADDED is REFUSED too', () => {
    const wide = OPEN_ROW.replace(/\|$/, '| เกินมา |');
    const r = count(fixture('wide.md', [...HEADER, wide]));
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.includes('7 columns'), r.out);
  });

  check('a ledger with no table header at all is REFUSED', () => {
    const r = count(fixture('nohdr.md', ['# หัวข้อ', '', 'ไม่มีตารางเลย']));
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.includes('no ledger table header'), r.out);
  });

  check('a row whose id is not a ledger id is REFUSED, not silently skipped', () => {
    const bad = OPEN_ROW.replace('PM-2026-09-06-01', 'PM-20260906-01');
    const r = count(fixture('badid.md', [...HEADER, bad]));
    assert.strictEqual(r.code, 2);
    assert.ok(r.out.includes('not a ledger id'), r.out);
  });

  check('no path argument is REFUSED', () => {
    let code = 0; let out = '';
    try { execFileSync('bash', [COUNTER], { encoding: 'utf8' }); } catch (e) { code = e.status; out = String(e.stdout || ''); }
    assert.strictEqual(code, 2);
    assert.ok(out.includes('no ledger path'), out);
  });

  check('every refusal says REFUSE and exits 2 — one shape, so a caller cannot misread it', () => {
    const cases = [
      path.join(tmp, 'missing.md'),
      fixture('nohdr2.md', ['ไม่มีตาราง']),
      fixture('cut2.md', [...HEADER, '| PM-2026-09-06-01 | 2026-09-06 | x | OPEN | — |']),
    ];
    for (const c of cases) {
      const r = count(c);
      assert.strictEqual(r.code, 2, c);
      assert.ok(/^REFUSE:/.test(r.out), `${c}: ${r.out}`);
      assert.ok(!/^\d+$/.test(r.out), `${c} printed a bare number for something it could not read`);
    }
  });

  // ── the answer must not depend on the machine's locale ─────────────────────────
  //
  // The header names are Thai. On the awk this machine ships (version 20200816), `==`
  // compares by COLLATION once the locale is a UTF-8 one, and an en_US collation table
  // orders every Thai string equal to every other:
  //
  //   LC_ALL=en_US.UTF-8 awk 'BEGIN{ print ("อาการ" == "สถานะ") }'   →  1
  //   LC_ALL=C           awk 'BEGIN{ print ("อาการ" == "สถานะ") }'   →  0
  //
  // So a loop that assigns `status_col = i` on every match kept the LAST Thai column
  // (รายงาน) and `$status_col == "OPEN"` never matched — the counter answered 0 on a
  // ledger with an OPEN row, and the fail-closed fallback of report #0003 became
  // fail-open on the default locale of the machine it runs on. Nothing measured this,
  // because every suite ran in whatever locale the test runner happened to inherit.

  check('the count is identical under every locale — a header is resolved by name, not by collation', () => {
    const f = fixture('locale.md', [...HEADER, OPEN_ROW, DONE_ROW]);
    const seen = {};
    for (const loc of ['C', 'en_US.UTF-8', 'th_TH.UTF-8', 'C.UTF-8', '']) {
      const r = count(f, loc);
      seen[loc || '(inherited)'] = `${r.out} (exit ${r.code})`;
    }
    const answers = new Set(Object.values(seen));
    assert.strictEqual(answers.size, 1,
      'the counter gives different answers in different locales:\n  ' +
      Object.entries(seen).map(([k, v]) => `${k.padEnd(14)} -> ${v}`).join('\n  '));
    assert.strictEqual([...answers][0], '1 (exit 0)',
      'the one OPEN row was not counted: ' + [...answers][0]);
  });

  check('a header name matching two columns is REFUSED, never resolved to whichever came last', () => {
    // PM-010's rule applied here: with two candidates no rule can say which holds the
    // data, so the only safe answer is to refuse. This is also the second, independent
    // net under the collation bug above — had it been here, that bug would have arrived
    // as a loud refusal instead of a silent 0.
    const f = fixture('dup-col.md', [
      '| ID | เกิดเมื่อ | สถานะ | ที่มา | สถานะ | รายงาน |',
      '|----|-----------|-------|-------|-------|--------|',
      '| PM-2026-09-06-01 | 2026-09-06 | OPEN | ที่มา | OPEN | — |',
    ]);
    const r = count(f);
    assert.strictEqual(r.code, 2, 'a duplicated header column was accepted: ' + r.out);
    assert.ok(/^REFUSE:/.test(r.out), r.out);
  });

  // ── the callers are actually wired to it ───────────────────────────────────────

  check('the pre-commit hook asks the Node gate and falls back to this script — it parses nothing itself', () => {
    const src = fs.readFileSync(path.join(ROOT, 'scripts', 'hooks', 'pre-commit'), 'utf8');
    assert.ok(src.includes('--gate'), 'pre-commit no longer asks check.js --gate');
    assert.ok(src.includes('ledger_open_count.sh'), 'pre-commit no longer has the fail-closed fallback');
    assert.ok(!/awk -F'\|'/.test(src), 'pre-commit is parsing the ledger itself again — that is the #0003 bug');
    assert.ok(src.includes('block_on_debt'), 'pre-commit lost its blocking helper');
  });

  check('the reminder hook checks readability, not just existence', () => {
    const src = fs.readFileSync(path.join(ROOT, '.claude', 'hooks', 'postmortem-debt.sh'), 'utf8');
    assert.ok(src.includes('-r "$LEDGER"'), 'the reminder can go silent on an unreadable ledger again');
    assert.ok(!/awk -F'\|'/.test(src), 'the reminder is parsing the ledger itself again');
  });

  check('the counter takes its path as an argument — no environment override to bypass it', () => {
    const src = fs.readFileSync(COUNTER, 'utf8');
    assert.ok(src.includes('LEDGER="${1:-}"'), 'the ledger path is no longer an argument');
    for (const bad of ['LEDGER:-$', 'SKIP_', '--force', 'PENDING_OVERRIDE']) {
      assert.ok(!src.includes(bad), `an override "${bad}" appeared`);
    }
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
