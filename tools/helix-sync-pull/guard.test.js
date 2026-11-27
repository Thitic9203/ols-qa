#!/usr/bin/env node
'use strict';
/* tools/helix-sync-pull/guard.js — Spec: docs/sdd/helix-sync-pull R7.
 *
 *   node tools/helix-sync-pull/guard.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('./guard.js');

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
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', env: ENV, stdio: ['ignore', 'pipe', 'pipe'] });
}
function w(root, rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}
// a repo whose base commit has (or lacks) a lock owning references/shared.md, then a branch with one change
function repo({ withLock = true, change }) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-guard-'));
  tmpDirs.push(d);
  git(d, 'init', '-q', '-b', 'main');
  git(d, 'config', 'user.email', 't@t');
  git(d, 'config', 'user.name', 't');
  git(d, 'config', 'commit.gpgsign', 'false');
  w(d, 'references/shared.md', 'v1');
  w(d, 'references/ols-project-guide.md', 'ols');
  if (withLock) w(d, '.helix-sync.lock', `# lock tag=v1\n${'a'.repeat(64)}  references/shared.md\n`);
  git(d, 'add', '-A');
  git(d, 'commit', '-q', '-m', 'base');
  git(d, 'checkout', '-q', '-b', 'pr');
  w(d, change, 'changed');
  git(d, 'add', '-A');
  git(d, 'commit', '-q', '-m', 'change');
  return d;
}
function quiet(fn) {
  const [log, err] = [console.log, console.error];
  console.log = console.error = () => {};
  try { return fn(); } finally { [console.log, console.error] = [log, err]; }
}

check('a human PR changing an owned file is refused', () => {
  const d = repo({ change: 'references/shared.md' });
  assert.strictEqual(quiet(() => main(['--base', 'main'], d, 'feature-x')), 1);
});
check('a human PR changing the lock itself is refused', () => {
  const d = repo({ change: '.helix-sync.lock' });
  assert.strictEqual(quiet(() => main(['--base', 'main'], d, 'feature-x')), 1);
});
check('a PR changing an OLS-only file passes', () => {
  const d = repo({ change: 'references/ols-project-guide.md' });
  assert.strictEqual(quiet(() => main(['--base', 'main'], d, 'feature-x')), 0);
});
check('the sync branch itself is exempt', () => {
  const d = repo({ change: 'references/shared.md' });
  assert.strictEqual(quiet(() => main(['--base', 'main'], d, 'bot/helix-sync')), 0);
});
check('no lock on base yet: nothing owned, passes', () => {
  const d = repo({ withLock: false, change: 'references/shared.md' });
  assert.strictEqual(quiet(() => main(['--base', 'main'], d, 'feature-x')), 0);
});
check('missing --base or unknown base ref: exit 2, never a pass', () => {
  const d = repo({ change: 'references/shared.md' });
  assert.strictEqual(quiet(() => main([], d, 'feature-x')), 2);
  assert.strictEqual(quiet(() => main(['--base', 'nope'], d, 'feature-x')), 2);
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
console.log(`${ran - failed}/${ran} passed`);
process.exit(failed ? 1 : 0);
