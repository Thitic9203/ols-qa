#!/usr/bin/env node
'use strict';

/* Pins `scripts/check-push-access.sh` against a stub `gh` on PATH, so every verdict is a
 * known answer: one account that can push (must say PUSH-OK), one that can only read (must say
 * NO-PUSH-ACCESS), and the cases where nothing can be measured (must say UNCHECKABLE, never OK).
 *
 *   node tools/push-gate/push_access.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'check-push-access.sh');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** A throwaway repo with `origin` set to `url`, and a stub gh answering with `login` / `push`. */
function run({ url = 'https://github.com/demo-owner/demo-repo.git', login = 'demo-user', push = 'true', withGh = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'push-access-'));
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k];
  execFileSync('git', ['init', '-q', dir], { env });
  if (url) execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', url], { env });
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  if (withGh) {
    fs.writeFileSync(path.join(bin, 'gh'), [
      '#!/bin/bash',
      'if [ "$2" = "user" ]; then ' + (login ? `echo ${login}` : 'exit 1') + '; exit $?; fi',
      'if [ "$2" = "repos/demo-owner/demo-repo" ]; then ' + (push ? `echo ${push}` : 'exit 1') + '; exit $?; fi',
      'exit 1',
    ].join('\n'), { mode: 0o755 });
  }
  // PATH keeps git/bash/sed but drops any real gh, so the stub (or its absence) decides.
  const sysPath = ['/usr/bin', '/bin'].join(':');
  const r = spawnSync('bash', [SCRIPT], { cwd: dir, env: { ...env, PATH: `${bin}:${sysPath}` }, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

check('an account with push access → PUSH-OK, exit 0', () => {
  const r = run({ push: 'true' });
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^PUSH-OK  demo-user can push to demo-owner\/demo-repo/);
});

check('2026-11-02 incident: a pull-only account → NO-PUSH-ACCESS naming the account, exit 1', () => {
  const r = run({ push: 'false' });
  assert.strictEqual(r.code, 1, r.out);
  assert.match(r.out, /^NO-PUSH-ACCESS  demo-user can only read demo-owner\/demo-repo/);
});

check('ssh remote is resolved to the same owner/repo', () => {
  const r = run({ url: 'git@github.com:demo-owner/demo-repo.git' });
  assert.strictEqual(r.code, 0, r.out);
});

check('gh not signed in → UNCHECKABLE, exit 2 (not OK)', () => {
  const r = run({ login: '' });
  assert.strictEqual(r.code, 2, r.out);
  assert.match(r.out, /^UNCHECKABLE/);
});

check('permission API fails → UNCHECKABLE, exit 2 (not OK)', () => {
  const r = run({ push: '' });
  assert.strictEqual(r.code, 2, r.out);
  assert.match(r.out, /^UNCHECKABLE/);
});

check('remote is not on github.com → UNCHECKABLE, exit 2', () => {
  const r = run({ url: 'https://example.invalid/demo-owner/demo-repo.git' });
  assert.strictEqual(r.code, 2, r.out);
});

check('no gh on PATH → UNCHECKABLE, exit 2', () => {
  const r = run({ withGh: false });
  assert.strictEqual(r.code, 2, r.out);
  assert.match(r.out, /gh is not installed/);
});

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
