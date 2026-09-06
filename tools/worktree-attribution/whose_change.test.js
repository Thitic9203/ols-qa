#!/usr/bin/env node
'use strict';

/* Pins `scripts/whose-change.sh` — the answer to "is this modified file anyone's work?"
 *
 * Written after report #0007: a ` M README.md` was called another session's work three
 * times, protected, and reported back to the owner as their problem, while it was really a
 * leftover from the SessionStart hook's own fast-forward — byte-identical to a commit in
 * this repo's history. One hash comparison settles it, and none was ever run.
 *
 * Runs against a throwaway repo so the cases are real git states, not stubs.
 *
 *   node tools/worktree-attribution/whose_change.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'whose-change.sh');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function run(cwd, ...files) {
  const r = spawnSync('bash', [SCRIPT, ...files], { cwd, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

/** A repo whose file has two committed versions, so an old one can be restored on top. */
function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'whose-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 'test@example.invalid');
  git(dir, 'config', 'user.name', 'test');
  fs.writeFileSync(path.join(dir, 'VERSION.md'), 'version 1\n');
  git(dir, 'add', 'VERSION.md');
  git(dir, 'commit', '-qm', 'v1');
  const first = git(dir, 'rev-parse', 'HEAD').trim();
  fs.writeFileSync(path.join(dir, 'VERSION.md'), 'version 2\n');
  git(dir, 'add', 'VERSION.md');
  git(dir, 'commit', '-qm', 'v2');
  return { dir, first };
}

check('an old committed version left in the worktree is STALE, and names the commit', () => {
  const { dir, first } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, 'VERSION.md'), 'version 1\n');   // the #0007 shape
    const r = run(dir);
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(/^STALE\s+VERSION\.md/m.test(r.out), r.out);
    assert.ok(r.out.includes(first.slice(0, 9)), 'it did not name the commit it matches:\n' + r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('content nobody ever committed is EDITED — real work, never called stale', () => {
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, 'VERSION.md'), 'a line someone typed just now\n');
    const r = run(dir);
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(/^EDITED\s+VERSION\.md/m.test(r.out), r.out);
    assert.ok(!/STALE/.test(r.out), 'someone\'s real edit was reported as a leftover:\n' + r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('with no modified file it says so and does not invent one', () => {
  const { dir } = makeRepo();
  try {
    const r = run(dir);
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(/no modified tracked files/.test(r.out), r.out);
    assert.ok(!/STALE|EDITED/.test(r.out), r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('a leftover from a commit that is no longer reachable is STALE, not EDITED', () => {
  // This is report #0007's own shape, and the first version of this tool answered it
  // wrongly. `reset --soft` moves HEAD back and leaves the worktree alone, so the bytes on
  // disk belong to a commit no ref points at any more. `git rev-list --all` walks refs, so
  // it cannot see that commit — and the tool then said "content exists nowhere in history,
  // somebody typed it, leave it", which is precisely the guess the tool was written to
  // replace, about the very file that produced the report. The reflog remembers it.
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, 'VERSION.md'), 'version 3\n');
    git(dir, 'add', 'VERSION.md');
    git(dir, 'commit', '-qm', 'v3');
    const v3 = git(dir, 'rev-parse', 'HEAD').trim();
    git(dir, 'reset', '--soft', 'HEAD~1');
    git(dir, 'restore', '--staged', 'VERSION.md');   // index back to v2, worktree still v3
    const r = run(dir);
    assert.strictEqual(r.code, 0, r.out);
    assert.ok(/^STALE\s+VERSION\.md/m.test(r.out),
      'a leftover of an unreachable commit was called somebody\'s work:\n' + r.out);
    assert.ok(r.out.includes(v3.slice(0, 9)), 'it did not name the commit it matches:\n' + r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('a file it could not read is reported AND makes the exit non-zero', () => {
  // The header declares `exit 0 every file classified · exit 2 could not look`, and the
  // UNREADABLE branch fell through to the unconditional `exit 0` at the end — so a caller
  // that correctly checked the status was told every file was classified when none was.
  // No case covered it, so the contract was an unverified claim about our own code.
  const { dir } = makeRepo();
  try {
    fs.writeFileSync(path.join(dir, 'VERSION.md'), 'something new\n');
    fs.chmodSync(path.join(dir, 'VERSION.md'), 0o000);
    const r = run(dir);
    assert.ok(/UNREADABLE/.test(r.out), 'it did not say it could not read the file:\n' + r.out);
    assert.strictEqual(r.code, 2, 'it reported success over a file it never looked at:\n' + r.out);
  } finally {
    try { fs.chmodSync(path.join(dir, 'VERSION.md'), 0o644); } catch { /* ignore */ }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

check('run from a subdirectory it still classifies, or refuses — never silently nothing', () => {
  // `git diff --name-only` prints paths from the repo ROOT while `-r` and `git hash-object`
  // resolve against the cwd, so from a subdirectory every file came back UNREADABLE and the
  // tool exited 0 having classified nothing.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'whose-sub-'));
  try {
    git(dir, 'init', '-q');
    git(dir, 'config', 'user.email', 'test@example.invalid');
    git(dir, 'config', 'user.name', 'test');
    fs.mkdirSync(path.join(dir, 'sub'));
    fs.writeFileSync(path.join(dir, 'sub/f.md'), 'one\n');
    git(dir, 'add', 'sub/f.md'); git(dir, 'commit', '-qm', 'v1');
    fs.writeFileSync(path.join(dir, 'sub/f.md'), 'two\n');
    git(dir, 'add', 'sub/f.md'); git(dir, 'commit', '-qm', 'v2');
    fs.writeFileSync(path.join(dir, 'sub/f.md'), 'one\n');          // back to v1 = STALE
    const r = spawnSync('bash', [SCRIPT], { cwd: path.join(dir, 'sub'), encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.ok(/^STALE\s+sub\/f\.md/m.test(out), 'from a subdirectory it classified nothing:\n' + out);
    assert.strictEqual(r.status, 0, out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('when git itself cannot answer, it REFUSES instead of saying there is nothing', () => {
  // `done < <(git diff …)` throws away git's exit status, so a repository git could not
  // read produced an empty list, and the tool printed "no modified tracked files" and
  // exited 0 — "could not look" arriving at the caller on the success code.
  const { dir } = makeRepo();
  try {
    const r = spawnSync('bash', [SCRIPT], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_INDEX_FILE: '/dev/null' },
    });
    assert.strictEqual(r.status, 2,
      'a broken index was reported as "nothing modified":\n' + (r.stdout || '') + (r.stderr || ''));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('outside a repository it refuses rather than answering', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'norepo-'));
  try {
    const r = run(dir);
    assert.strictEqual(r.code, 2, 'it answered where it could not look:\n' + r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('the rule is written where a session will read it, not only in this script', () => {
  const claude = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
  assert.ok(claude.includes('whose-change.sh'),
    'CLAUDE.md does not point at the check, so the next session will guess again');
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
