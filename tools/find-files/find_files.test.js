#!/usr/bin/env node
'use strict';

/* Pins `scripts/find-files.sh` — a file search that can tell "searched and found nothing"
 * apart from "the search never ran".
 *
 * Written after report #0116: a `find` was rewritten by a shell hook into a filter that
 * rejected the predicates, printed nothing and exited 1, and that empty output was told to
 * the owner as "0 files on disk" while both files were there. An empty result proves nothing
 * unless something known to exist was found by the very same search, so the script demands
 * a control path and refuses (exit 2, UNVERIFIABLE) when the control did not come back.
 *
 *   node tools/find-files/find_files.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'find-files.sh');

let failed = 0;
let ran = 0;
function check(name, fn) {
  ran += 1;
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

function run(args, env) {
  const r = spawnSync('bash', [SCRIPT, ...args], { encoding: 'utf8', env: env || process.env });
  return { code: r.status, stdout: r.stdout || '', out: (r.stdout || '') + (r.stderr || '') };
}

/** A tree with one target file, one control file, and one file inside node_modules. */
function makeTree() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'findfiles-')));
  fs.mkdirSync(path.join(dir, 'a', 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'a', 'target.txt'), 'x\n');
  fs.writeFileSync(path.join(dir, 'a', 'node_modules', 'target.txt'), 'x\n');
  fs.writeFileSync(path.join(dir, 'control.txt'), 'x\n');
  return dir;
}

function matchLines(stdout) {
  return stdout.split('\n').filter((l) => l.startsWith('/'));
}

check('must find 1: a compound predicate (-not, the #0116 shape) finds the one target', () => {
  const dir = makeTree();
  try {
    const r = run(['--control', path.join(dir, 'control.txt'), dir, '--',
      '-name', 'target.txt', '-not', '-path', '*/node_modules/*']);
    assert.strictEqual(r.code, 0, r.out);
    assert.deepStrictEqual(matchLines(r.stdout), [path.join(dir, 'a', 'target.txt')], r.out);
    assert.match(r.stdout, /^COUNT 1 /m, r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('must not find 1: an absent name exits 1 with COUNT 0, and says the control was found', () => {
  const dir = makeTree();
  try {
    const r = run(['--control', path.join(dir, 'control.txt'), dir, '--', '-name', 'absent.txt']);
    assert.strictEqual(r.code, 1, r.out);
    assert.deepStrictEqual(matchLines(r.stdout), [], r.out);
    assert.match(r.stdout, /^COUNT 0 .*control found/m, r.out);
    assert.doesNotMatch(r.out, /UNVERIFIABLE/, r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('control not reached by the same search (outside the root) is UNVERIFIABLE, exit 2', () => {
  const dir = makeTree();
  const other = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'findfiles-ctl-')));
  fs.writeFileSync(path.join(other, 'elsewhere.txt'), 'x\n');
  try {
    const r = run(['--control', path.join(other, 'elsewhere.txt'), path.join(dir, 'a'), '--', '-name', 'absent.txt']);
    assert.strictEqual(r.code, 2, r.out);
    assert.match(r.out, /UNVERIFIABLE/, r.out);
    assert.doesNotMatch(r.stdout, /^COUNT /m, 'an unverifiable search must not print a count');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(other, { recursive: true, force: true });
  }
});

check('control path that does not exist is UNVERIFIABLE, exit 2', () => {
  const dir = makeTree();
  try {
    const r = run(['--control', path.join(dir, 'no-such-control.txt'), dir, '--', '-name', 'target.txt']);
    assert.strictEqual(r.code, 2, r.out);
    assert.match(r.out, /UNVERIFIABLE/, r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('missing --control is refused with exit 2 (no search without a control)', () => {
  const dir = makeTree();
  try {
    const r = run([dir, '--', '-name', 'target.txt']);
    assert.strictEqual(r.code, 2, r.out);
    assert.doesNotMatch(r.stdout, /^COUNT /m, r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('a predicate find rejects is UNVERIFIABLE, exit 2 — never COUNT 0', () => {
  const dir = makeTree();
  try {
    const r = run(['--control', path.join(dir, 'control.txt'), dir, '--', '-no-such-predicate']);
    assert.strictEqual(r.code, 2, r.out);
    assert.match(r.out, /UNVERIFIABLE/, r.out);
    assert.doesNotMatch(r.stdout, /^COUNT /m, r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('the control file itself counts as a match when it matches the predicates', () => {
  const dir = makeTree();
  try {
    const r = run(['--control', path.join(dir, 'control.txt'), dir, '--', '-name', 'control.txt']);
    assert.strictEqual(r.code, 0, r.out);
    assert.deepStrictEqual(matchLines(r.stdout), [path.join(dir, 'control.txt')], r.out);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

check('a `find` earlier on PATH (a rewriting shim) is not used — the system find is called directly', () => {
  const dir = makeTree();
  const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'findfiles-shim-'));
  fs.writeFileSync(path.join(shimDir, 'find'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  try {
    const env = Object.assign({}, process.env, { PATH: shimDir + path.delimiter + process.env.PATH });
    const r = run(['--control', path.join(dir, 'control.txt'), dir, '--', '-name', 'target.txt'], env);
    assert.strictEqual(r.code, 0, r.out);
    assert.strictEqual(matchLines(r.stdout).length, 2, r.out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
});

check('real disk: finds scripts/run-test-suites.sh in this repo, control scripts/list-test-suites.sh', () => {
  const scripts = fs.realpathSync(path.join(ROOT, 'scripts'));
  const r = run(['--control', path.join(scripts, 'list-test-suites.sh'), scripts, '--',
    '-name', 'run-test-suites.sh', '-not', '-path', '*/node_modules/*']);
  assert.strictEqual(r.code, 0, r.out);
  assert.deepStrictEqual(matchLines(r.stdout), [path.join(scripts, 'run-test-suites.sh')], r.out);
});

if (ran === 0) { console.log('FAIL  no checks ran'); process.exit(1); }
if (failed) { console.log(`\n${failed}/${ran} find-files check(s) failed`); process.exit(1); }
console.log(`\nfind-files: ${ran}/${ran} checks passed`);
