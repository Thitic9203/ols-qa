#!/usr/bin/env node
'use strict';
/* Known-answer tests for scripts/check-evidence-durable.sh (report #0192).
 * Must pass: this repo's main git work tree (real path on disk, found via the git common dir).
 * Must fail: /tmp, /private/tmp, /var/folders, $TMPDIR, a git repo created under the temp root,
 * a symlink from a durable-looking spot into a temp root, and a folder with no git work tree.
 * Every case asserts the exact verdict word, not only the exit code (#0002).
 *
 *   node tools/evidence-durable/check_evidence_durable.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'check-evidence-durable.sh');
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
function runScript(args, env = CLEAN_ENV, cwd = ROOT) {
  const r = spawnSync('bash', [SCRIPT, ...args], { encoding: 'utf8', env, cwd });
  if (r.error) throw r.error;
  return { code: r.status, out: r.stdout, err: r.stderr };
}
function expect(args, code, word, env) {
  const r = runScript(args, env);
  assert.strictEqual(r.code, code, `exit ${r.code} for ${args.join(' ')}: ${r.out}${r.err}`);
  const lines = r.out.trim().split('\n').filter(Boolean);
  assert.strictEqual(lines.length, args.length, 'one line per path: ' + r.out);
  for (const l of lines) assert.ok(l.startsWith(word + ' '), `expected ${word}, got: ${l}`);
}

// The must-pass fixture is the repository's main work tree, found through the shared git dir. The
// pre-push hook runs this suite from a throwaway worktree under mktemp, where ROOT itself is (correctly)
// volatile; the main checkout and a CI checkout are on real disk.
const commonDir = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8', env: CLEAN_ENV });
if (commonDir.status !== 0) {
  console.error('check_evidence_durable.test.js: cannot locate the git common dir — cannot build the must-pass fixture');
  process.exit(2);
}
const DURABLE_ROOT = path.dirname(fs.realpathSync(commonDir.stdout.trim()));
const tmpRoot = fs.realpathSync(os.tmpdir());
const repoInTmp = fs.mkdtempSync(path.join(tmpRoot, 'evd-'));
tmpDirs.push(repoInTmp);
spawnSync('git', ['init', '-q', repoInTmp], { env: CLEAN_ENV });

check('must pass: the main work tree of this repo (real disk, git work tree)', () => {
  expect([DURABLE_ROOT], 0, 'DURABLE');
});
check('must pass: a not-yet-created child of the main work tree is judged by its parent', () => {
  expect([path.join(DURABLE_ROOT, 'no-such-dir-evd', 'evals')], 0, 'DURABLE');
});
check('must fail: /tmp spelling even when the folder does not exist', () => {
  expect(['/tmp/evd-never-created/evals'], 1, 'VOLATILE');
});
check('must fail: /private/tmp (macOS physical form)', () => {
  expect(['/private/tmp/claude-x/scratchpad/lanes'], 1, 'VOLATILE');
});
check('must fail: /var/folders', () => {
  expect(['/var/folders/ab/cd/T/evals'], 1, 'VOLATILE');
});
check('must fail: a git repo created under the temp root is still volatile', () => {
  expect([repoInTmp], 1, 'VOLATILE');
});
check('must fail: $TMPDIR is a temp root even outside the fixed list', () => {
  const env = { ...CLEAN_ENV, TMPDIR: path.join(ROOT, 'docs') + '/' };
  expect([path.join(ROOT, 'docs', 'x')], 1, 'VOLATILE', env);
});
check('must fail: a symlink into the temp root resolves to volatile', () => {
  const linkParent = fs.mkdtempSync(path.join(ROOT, '.evd-link-'));
  tmpDirs.push(linkParent);
  const link = path.join(linkParent, 'evals');
  fs.symlinkSync(repoInTmp, link);
  expect([path.join(link, 'grades')], 1, 'VOLATILE');
});
check('must fail: a folder with no git work tree above it', () => {
  expect(['/'], 1, 'NOT-VERSIONED');
});
check('cannot check: a ".." segment is refused, never judged', () => {
  expect([path.join(ROOT, 'docs') + '/../../x'], 2, 'CANNOT-CHECK');
});
check('mixed: one volatile path fails the whole call', () => {
  const r = runScript([DURABLE_ROOT, '/tmp/x']);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(/^DURABLE /m.test(r.out) && /^VOLATILE /m.test(r.out), r.out);
});
check('usage: no argument is exit 2, not a pass', () => {
  const r = runScript([]);
  assert.strictEqual(r.code, 2, r.out + r.err);
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });

if (ran === 0) {
  console.error('check_evidence_durable.test.js: ran 0 tests — refusing');
  process.exit(2);
}
console.log(`\n${failed ? failed + ' failed' : 'all green'} — ${ran} test(s) ran`);
process.exit(failed ? 1 : 0);
