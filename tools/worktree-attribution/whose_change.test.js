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
