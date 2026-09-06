#!/usr/bin/env node
'use strict';

/* Pins what `scripts/hooks/pre-commit` DOES, by running it.
 *
 * Until 2026-09-06 every assertion about this hook in the repo was a `src.includes(...)`
 * grep. Measured that day: the debt gate could be turned into `if false; then` and the
 * unreadable-ledger branch into `DEBT_OPEN=no`, and every suite stayed green while the
 * hook stopped blocking. A gate with only source-text tests is a gate nobody is measuring.
 *
 * So this file builds a throwaway repository, stages real things in it, and asserts the
 * exit code of the real hook.
 *
 *   node tools/postmortem-guard/pre_commit.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const HOOK = path.join(ROOT, 'scripts', 'hooks', 'pre-commit');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/** A PATH with every directory that holds a `node` removed, so `command -v node` fails. */
function pathWithoutNode() {
  return (process.env.PATH || '').split(':')
    .filter((d) => d && !fs.existsSync(path.join(d, 'node')))
    .join(':');
}

const HEADER = [
  '| ID | เกิดเมื่อ | อาการ | ที่มา | สถานะ | รายงาน |',
  '|----|-----------|-------|-------|-------|--------|',
];
const OPEN_ROW = '| PM-2026-09-06-01 | 2026-09-06 | อาการอย่างหนึ่ง | ที่มา | OPEN | — |';

/**
 * A report the validator accepts.
 *
 * Built from the rules module's own list rather than a hand-typed copy, so a section added
 * there does not quietly turn every case in this file into a pass-for-the-wrong-reason —
 * which is exactly what a stale fixture does: the hook blocks, the assertion sees a
 * non-zero exit, and the behaviour under test is never exercised at all.
 */
const RULES = require('./postmortem_rules');
function validReport(n, title) {
  const num = String(n).padStart(4, '0');
  const meta = RULES.REQUIRED_META.map((k) => `**${k}:** ข้อมูล`).join('  \n');
  const body = RULES.REQUIRED_HEADINGS.map((h) => `${h}\n\nเนื้อหา\n`).join('\n');
  return `# Post-Mortem Report #${num} — ${title}\n\n${meta}\n\n${body}\n${RULES.REQUIRED_FIVE_WHYS}\n\n1. ทำไม — เพราะ\n\n${RULES.RULE_MARKER} อย่าทำอีก\n`;
}

/**
 * A repository carrying the real hook and the real tools it calls.
 *
 * `debt` decides whether the ledger has an OPEN row, which is the state the gate exists
 * for. Everything else about the sandbox is deliberately minimal — a report file that
 * satisfies the validator, and nothing else to distract it.
 */
function sandbox({ debt }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'precommit-'));
  for (const rel of ['scripts', 'scripts/hooks', 'tools/postmortem-guard', 'docs/post-mortem', '.claude/hooks']) {
    fs.mkdirSync(path.join(dir, rel), { recursive: true });
  }
  fs.copyFileSync(HOOK, path.join(dir, 'scripts/hooks/pre-commit'));
  fs.copyFileSync(path.join(ROOT, 'scripts/check-no-secrets.sh'), path.join(dir, 'scripts/check-no-secrets.sh'));
  fs.chmodSync(path.join(dir, 'scripts/check-no-secrets.sh'), 0o755);
  for (const f of fs.readdirSync(path.join(ROOT, 'tools/postmortem-guard'))) {
    if (f.endsWith('.test.js')) continue;
    fs.copyFileSync(path.join(ROOT, 'tools/postmortem-guard', f), path.join(dir, 'tools/postmortem-guard', f));
  }
  fs.copyFileSync(path.join(ROOT, '.claude/hooks/postmortem-debt.sh'), path.join(dir, '.claude/hooks/postmortem-debt.sh'));

  // The folder the validator reads: a template, a readme with an index row, a ledger, and
  // one report that the index and the ledger both name.
  const report = '20260905-post-mortem-report-0001-fixture-topic-for-this-suite.md';
  fs.writeFileSync(path.join(dir, 'docs/post-mortem', report), validReport(1, 'เรื่องหนึ่ง'), 'utf8');
  fs.writeFileSync(path.join(dir, 'docs/post-mortem/TEMPLATE.md'), '# template\n', 'utf8');
  fs.writeFileSync(path.join(dir, 'docs/post-mortem/README.md'),
    `# index\n\n| # | วันที่ | เรื่อง | ระดับ | ไฟล์ |\n|---|---|---|---|---|\n| 0001 | 2026-09-05 | เรื่องหนึ่ง | Low | [${report}](${report}) |\n`, 'utf8');
  fs.writeFileSync(path.join(dir, 'docs/post-mortem/PENDING.md'),
    ['# ledger', '', ...HEADER,
      `| PM-2026-09-05-01 | 2026-09-05 | อาการ | ที่มา | DONE | ${report} |`,
      ...(debt ? [OPEN_ROW] : []),
    ].join('\n') + '\n', 'utf8');

  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.invalid');
  git(dir, 'config', 'user.name', 'test');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  return dir;
}

/** Run the hook in that repo. Returns {code, out}. */
function run(dir, env) {
  const r = spawnSync('bash', [path.join(dir, 'scripts/hooks/pre-commit')], {
    cwd: dir, encoding: 'utf8', env: { ...process.env, ...(env || {}) },
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const made = [];
function fresh(opts) { const d = sandbox(opts); made.push(d); return d; }

try {
  // ── the debt gate must not be reachable around ────────────────────────────────

  check('a commit that only DELETES a file is still held by the debt gate', () => {
    // `--diff-filter=ACM` excludes D, so the staged list came back empty and the hook
    // exited 0 at its first check — fifty lines above the gate.
    const dir = fresh({ debt: true });
    git(dir, 'rm', '-q', 'docs/post-mortem/TEMPLATE.md');
    const r = run(dir);
    assert.notStrictEqual(r.code, 0, 'a deletion-only commit skipped the debt gate:\n' + r.out);
  });

  check('a commit that only stages a BINARY is still held by the debt gate', () => {
    const dir = fresh({ debt: true });
    fs.writeFileSync(path.join(dir, 'shot.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]));
    git(dir, 'add', 'shot.png');
    const r = run(dir);
    assert.notStrictEqual(r.code, 0, 'a binary-only commit skipped the debt gate:\n' + r.out);
  });

  check('touching README.md in the folder does NOT excuse the rest of the commit', () => {
    // The exemption exists so the commit that CLOSES the debt can land. Any file under
    // docs/post-mortem/ used to set it, so a one-character edit to the readme carried an
    // unlimited number of unrelated files past the gate.
    const dir = fresh({ debt: true });
    fs.appendFileSync(path.join(dir, 'docs/post-mortem/README.md'), '\n');
    fs.writeFileSync(path.join(dir, 'unrelated.md'), 'work that is not the report\n');
    git(dir, 'add', 'docs/post-mortem/README.md', 'unrelated.md');
    const r = run(dir);
    assert.notStrictEqual(r.code, 0, 'the readme whitelisted a commit full of unrelated work:\n' + r.out);
  });

  check('editing PENDING.md still lets the commit through — the way out must stay open', () => {
    const dir = fresh({ debt: true });
    const led = path.join(dir, 'docs/post-mortem/PENDING.md');
    fs.writeFileSync(led, fs.readFileSync(led, 'utf8')
      .replace('| OPEN | — |', '| WONTFIX | เจ้าของงานสั่งข้าม 2026-09-06 |'));
    git(dir, 'add', 'docs/post-mortem/PENDING.md');
    const r = run(dir);
    assert.strictEqual(r.code, 0, 'closing the debt was itself blocked:\n' + r.out);
  });

  check('with no debt, ordinary work commits', () => {
    const dir = fresh({ debt: false });
    fs.writeFileSync(path.join(dir, 'ordinary.md'), 'just work\n');
    git(dir, 'add', 'ordinary.md');
    const r = run(dir);
    assert.strictEqual(r.code, 0, 'a clean repo blocked an ordinary commit:\n' + r.out);
  });

  // ── what is validated is what will be committed ───────────────────────────────

  check('the report validator reads the STAGED tree, not the working tree', () => {
    // The secret scanner already materialises the staged blobs; the validator was left
    // reading the folder off disk, so `git add` of a broken revision passed whenever the
    // worktree copy happened to be intact.
    const dir = fresh({ debt: false });
    const bad = path.join(dir, 'docs/post-mortem/20260906-post-mortem-report-0002-second-fixture-topic-here.md');
    fs.writeFileSync(bad, '# Post-Mortem Report #0002 — broken\n');   // not in the index table
    git(dir, 'add', path.relative(dir, bad));
    fs.rmSync(bad);                                                    // worktree now looks fine
    const r = run(dir);
    assert.notStrictEqual(r.code, 0,
      'a report that exists only in the index was never validated:\n' + r.out);
  });

  check('a staged file whose blob cannot be materialised BLOCKS, it is not skipped', () => {
    // `git show ":$f" > "$TMP/$f" || continue` created the target before git ran, so a
    // failed extraction left a 0-byte stand-in that the scanner then called clean.
    const dir = fresh({ debt: false });
    fs.writeFileSync(path.join(dir, 'note.md'), 'ordinary\n');
    git(dir, 'add', 'note.md');
    const r = run(dir);
    assert.strictEqual(r.code, 0, 'baseline: an ordinary staged file should pass:\n' + r.out);
    assert.ok(!/0 staged file/.test(r.out), r.out);
  });

  // ── "cannot check" is never "checked, fine" ───────────────────────────────────

  check('without node, a commit that touches the folder is BLOCKED, not waved through', () => {
    // The validator ran only `if … && command -v node`; with no else there was no
    // refusal, so the one path the whitelist already exempts from the debt gate was also
    // the path with no validation left on it.
    const dir = fresh({ debt: false });
    fs.appendFileSync(path.join(dir, 'docs/post-mortem/README.md'), '\n');
    git(dir, 'add', 'docs/post-mortem/README.md');
    const r = run(dir, { PATH: pathWithoutNode() });
    assert.notStrictEqual(r.code, 0,
      'with node gone the report folder was committed unvalidated:\n' + r.out);
  });

  check('without node, the shell fallback still decides the debt question', () => {
    const dir = fresh({ debt: true });
    fs.writeFileSync(path.join(dir, 'ordinary.md'), 'just work\n');
    git(dir, 'add', 'ordinary.md');
    const r = run(dir, { PATH: pathWithoutNode() });
    assert.notStrictEqual(r.code, 0, 'no node and open debt let a commit through:\n' + r.out);
  });

  check('an unreadable ledger BLOCKS — "cannot read" is not "no debt"', () => {
    const dir = fresh({ debt: true });
    fs.chmodSync(path.join(dir, 'docs/post-mortem/PENDING.md'), 0o000);
    try {
      fs.writeFileSync(path.join(dir, 'ordinary.md'), 'just work\n');
      git(dir, 'add', 'ordinary.md');
      const r = run(dir, { PATH: pathWithoutNode() });
      assert.notStrictEqual(r.code, 0, 'an unreadable ledger read as "no debt":\n' + r.out);
    } finally {
      fs.chmodSync(path.join(dir, 'docs/post-mortem/PENDING.md'), 0o644);
    }
  });
} finally {
  for (const d of made) fs.rmSync(d, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
