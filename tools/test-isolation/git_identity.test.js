#!/usr/bin/env node
// Fixture suites must never write into the repository that runs them.
//
// Two suites built their temp repos with a plain `git config user.*` while passing the full
// process.env through. Run from a hook, that env carries GIT_DIR (an absolute path from a
// linked worktree), so `git init` / `git config` acted on ols-qa itself: its .git/config got
// user.name=test, and 184 ols-qa commits plus every hook-made helix sync commit since
// 2026-09-06 were authored `test <test@example.invalid>`.
//
// This suite reproduces that: it runs each fixture suite with GIT_DIR pointing at a sentinel
// repository and asserts the sentinel's config and history are untouched.
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SUITES = [
  'tools/postmortem-guard/pre_commit.test.js',
  'tools/worktree-attribution/whose_change.test.js',
];
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

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: CLEAN_ENV });
  return { status: r.status, out: (r.stdout || '').trim() };
}

function sentinel() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-identity-sentinel-'));
  tmpDirs.push(dir);
  git(dir, 'init', '-q');
  return dir;
}

for (const suite of SUITES) {
  check(`${suite} leaves the repository it runs under untouched`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, suite)), `${suite} is missing`);
    const s = sentinel();
    const before = fs.readFileSync(path.join(s, '.git', 'config'), 'utf8');
    spawnSync(process.execPath, [path.join(ROOT, suite)], {
      cwd: ROOT, encoding: 'utf8', env: { ...CLEAN_ENV, GIT_DIR: path.join(s, '.git') },
    });
    const after = fs.readFileSync(path.join(s, '.git', 'config'), 'utf8');
    assert.strictEqual(after, before, `the suite wrote into the caller's .git/config:\n${after}`);
    const head = git(s, 'rev-parse', '--verify', '-q', 'HEAD');
    assert.notStrictEqual(head.status, 0, `the suite committed into the caller's repository (HEAD ${head.out})`);
  });
}

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
