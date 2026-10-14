#!/usr/bin/env node
'use strict';
/* Known-answer tests for scripts/verify-on-origin.sh (report #0190).
 * A temp clone with a bare origin: a pushed commit must be found, a commit whose push was
 * rejected (origin moved first) must not, and a failed fetch must be "cannot verify" — never
 * either answer. Every case must print exactly one line: the script has no quiet mode.
 *
 *   node tools/verify-on-origin/verify_on_origin.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'verify-on-origin.sh');

// This suite may run under a hook; fixtures must never inherit that repository.
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

let failed = 0;
let ran = 0;
const tmpDirs = [];
function check(name, fn) {
  ran++;
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').join('\n       ')}`);
  }
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: CLEAN_ENV, ...opts });
  if (r.error) throw r.error;
  return r;
}
function git(cwd, ...args) {
  const r = run('git', args, { cwd });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${r.stderr}`);
  return r.stdout.trim();
}
function commit(repo, file, body) {
  fs.writeFileSync(path.join(repo, file), body);
  git(repo, 'add', file);
  git(repo, 'commit', '-q', '-m', `edit ${file}`);
  return git(repo, 'rev-parse', 'HEAD');
}
function cloneOf(base, origin, name, noHooks) {
  const dir = path.join(base, name);
  git(base, 'clone', '-q', origin, dir);
  git(dir, 'config', 'user.name', 'verify-test');
  git(dir, 'config', 'user.email', 'verify-test@example.invalid');
  git(dir, 'config', 'core.hooksPath', noHooks);
  return dir;
}

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-origin-'));
  tmpDirs.push(base);
  const noHooks = path.join(base, 'no-hooks');
  fs.mkdirSync(noHooks);
  const origin = path.join(base, 'origin.git');
  git(base, 'init', '-q', '--bare', '-b', 'main', origin);
  const seed = path.join(base, 'seed');
  git(base, 'init', '-q', '-b', 'main', seed);
  git(seed, 'config', 'user.name', 'verify-test');
  git(seed, 'config', 'user.email', 'verify-test@example.invalid');
  git(seed, 'config', 'core.hooksPath', noHooks);
  commit(seed, 'a.txt', 'one\n');
  git(seed, 'remote', 'add', 'origin', origin);
  git(seed, 'push', '-q', 'origin', 'main');
  const local = cloneOf(base, origin, 'local', noHooks);
  const other = cloneOf(base, origin, 'other', noHooks);
  return { base, origin, local, other };
}

function verify(cwd, ...args) {
  const r = run('/bin/bash', [SCRIPT, ...args], { cwd });
  const lines = r.stdout.split('\n').filter((l) => l !== '');
  assert.strictEqual(lines.length, 1, `expected exactly one output line, got ${lines.length}: ${JSON.stringify(r.stdout)} stderr=${r.stderr}`);
  return { status: r.status, line: lines[0] };
}

check('must find: a pushed commit is ON-ORIGIN, exit 0', () => {
  const f = fixture();
  const sha = commit(f.local, 'b.txt', 'pushed\n');
  git(f.local, 'push', '-q', 'origin', 'main');
  const r = verify(f.local, sha);
  assert.strictEqual(r.status, 0, r.line);
  assert.strictEqual(r.line, `ON-ORIGIN ${sha} origin/main`);
});

check('must not find: a commit whose push was rejected (origin moved first) is NOT-ON-ORIGIN, exit 1', () => {
  const f = fixture();
  commit(f.other, 'release.txt', 'bump\n');
  git(f.other, 'push', '-q', 'origin', 'main');
  const sha = commit(f.local, 'plan.txt', 'plan\n');
  const push = run('git', ['push', '-q', 'origin', 'main'], { cwd: f.local });
  assert.notStrictEqual(push.status, 0, 'fixture error: the push was expected to be rejected');
  // The local log holds the commit — the exact measurement #0190 trusted.
  assert.strictEqual(git(f.local, 'log', '-1', '--format=%H'), sha);
  const r = verify(f.local, sha);
  assert.strictEqual(r.status, 1, r.line);
  assert.strictEqual(r.line, `NOT-ON-ORIGIN ${sha} origin/main`);
});

check('a branch name resolves to its commit (local main ahead of origin is NOT-ON-ORIGIN)', () => {
  const f = fixture();
  const sha = commit(f.local, 'c.txt', 'unpushed\n');
  const r = verify(f.local, 'main');
  assert.strictEqual(r.status, 1, r.line);
  assert.strictEqual(r.line, `NOT-ON-ORIGIN ${sha} origin/main`);
  git(f.local, 'push', '-q', 'origin', 'main');
  assert.strictEqual(verify(f.local, 'main').status, 0);
});

check('a stale origin/main is refreshed: pushed from another clone is still found', () => {
  const f = fixture();
  const sha = commit(f.other, 'd.txt', 'elsewhere\n');
  git(f.other, 'push', '-q', 'origin', 'main');
  git(f.local, 'fetch', '-q', 'origin');
  // local knows the object now, but the next check must fetch on its own: move origin again
  const later = commit(f.other, 'e.txt', 'later\n');
  git(f.other, 'push', '-q', 'origin', 'main');
  assert.strictEqual(verify(f.local, sha).status, 0);
  git(f.local, 'fetch', '-q', 'origin');
  assert.strictEqual(verify(f.local, later).line, `ON-ORIGIN ${later} origin/main`);
});

check('a named remote branch is honoured', () => {
  const f = fixture();
  git(f.local, 'checkout', '-q', '-b', 'feature');
  const sha = commit(f.local, 'f.txt', 'feature\n');
  git(f.local, 'push', '-q', 'origin', 'feature');
  assert.strictEqual(verify(f.local, sha, 'feature').line, `ON-ORIGIN ${sha} origin/feature`);
  assert.strictEqual(verify(f.local, sha).status, 1, 'the commit is not on main');
});

check('fetch failure is CANNOT-VERIFY exit 2, never ON or NOT-ON', () => {
  const f = fixture();
  const sha = commit(f.local, 'g.txt', 'x\n');
  git(f.local, 'push', '-q', 'origin', 'main');
  git(f.local, 'remote', 'set-url', 'origin', path.join(f.base, 'does-not-exist.git'));
  const r = verify(f.local, sha);
  assert.strictEqual(r.status, 2, r.line);
  assert.match(r.line, /^CANNOT-VERIFY /);
});

check('unknown commit, missing argument and non-repo are CANNOT-VERIFY exit 2', () => {
  const f = fixture();
  let r = verify(f.local, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
  assert.strictEqual(r.status, 2, r.line);
  assert.match(r.line, /^CANNOT-VERIFY unknown commit/);
  r = verify(f.local);
  assert.strictEqual(r.status, 2, r.line);
  assert.match(r.line, /^CANNOT-VERIFY usage/);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-origin-norepo-'));
  tmpDirs.push(outside);
  r = verify(outside, 'HEAD');
  assert.strictEqual(r.status, 2, r.line);
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
