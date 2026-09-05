#!/usr/bin/env node
'use strict';

/* Pins the push gate — `scripts/hooks/pre-push`.
 *
 * That hook is the last thing standing between a broken commit and the shared branch, and its
 * own header says "fail closed: รันไม่ได้ = ไม่ให้ push". It had no tests at all.
 *
 * The defect this file was written for: the hook globs `tools/<dir>/<name>.test.js` under
 * `nullglob`. When the glob matched NOTHING the loop body never ran, `rc` stayed 0, and the
 * hook printed "✅ ชุดเทสต์เขียวบนทุก commit ที่จะ push" over a run that measured nothing.
 * Verified against a real commit from before this repo had any test file — exit 0, zero suites.
 *
 * The repo already knew this shape: `.github/workflows/tests.yml` carries the same guard in
 * words — "A suite that matched nothing must fail: 'no tests ran' is not 'tests passed'" — and
 * CLAUDE.md tells the story of the `|| break` that made the whole command exit 0 on a failing
 * suite. The push gate simply never got it.
 *
 *   node tools/push-gate/pre_push.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const HOOK = path.join(ROOT, 'scripts', 'hooks', 'pre-push');
const ZERO = '0'.repeat(40);

/** The last commit in this repo's history that carries no suite file under `tools/` at all. */
const COMMIT_WITHOUT_TESTS = 'f42885df594f5616c483d7a36610986355ac9e8e';

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** Does this clone actually have that commit? A shallow CI checkout will not. */
function haveCommit(sha) {
  const r = spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: ROOT });
  return r.status === 0;
}

/** Run the hook the way git does: refs on stdin, verdict as the exit code. */
function runHook(localSha) {
  const r = spawnSync('bash', [HOOK, 'origin', 'https://example.invalid/x.git'], {
    cwd: ROOT,
    input: `refs/heads/main ${localSha} refs/heads/main ${ZERO}\n`,
    encoding: 'utf8',
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

check('the hook refuses a commit whose tree contains no test file at all', () => {
  if (!haveCommit(COMMIT_WITHOUT_TESTS)) {
    console.log('      (skipped — shallow clone, that commit is not present here)');
    return;
  }
  const r = runHook(COMMIT_WITHOUT_TESTS);
  assert.notStrictEqual(r.code, 0,
    'the push gate allowed a commit it never measured:\n' + r.out);
  assert.ok(/ไม่พบไฟล์เทสต์|no test file/i.test(r.out),
    'it refused, but not for the stated reason:\n' + r.out);
  assert.ok(!/✅/.test(r.out),
    'it printed a success mark while refusing:\n' + r.out);
});

check('a push that deletes a ref is still a no-op, not a refusal', () => {
  // Nothing to test on a deletion, and blocking it would be a guard that costs more than it
  // protects. This is the one path that may legitimately exit 0 without measuring anything.
  const r = runHook(ZERO);
  assert.strictEqual(r.code, 0, 'deleting a ref was blocked:\n' + r.out);
});

check('the source counts what it matched — "none ran" cannot read as "all passed"', () => {
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.ok(/found=|FOUND=/.test(src), 'nothing counts the matched suites any more');
  assert.ok(/-eq 0|-lt 1/.test(src), 'the zero case is no longer tested');
  assert.ok(!/^\s*exit 0\s*$/m.test(src.split('shopt -s nullglob')[0] || ''),
    'an early unconditional exit 0 appeared before the suite loop');
});

check('the hook still declares itself fail-closed, and still blocks with no node', () => {
  const src = fs.readFileSync(HOOK, 'utf8');
  assert.ok(/fail closed/i.test(src), 'the fail-closed contract was removed from the header');
  assert.ok(/command -v node/.test(src) && /exit 1/.test(src),
    'the missing-node branch no longer blocks');
});

check('every suite the gate would run is discoverable from the repo root', () => {
  // If this ever finds zero, the gate's own glob would too — and that is precisely the state
  // the first case says must refuse. Keeping the count visible here makes the drift obvious.
  const dirs = fs.readdirSync(path.join(ROOT, 'tools'), { withFileTypes: true })
    .filter((d) => d.isDirectory());
  let n = 0;
  for (const d of dirs) {
    n += fs.readdirSync(path.join(ROOT, 'tools', d.name)).filter((f) => f.endsWith('.test.js')).length;
  }
  assert.ok(n > 0, 'no suites found under tools/ — the push gate must refuse in this state');
  console.log(`      (${n} suite file(s) under tools/)`);
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
