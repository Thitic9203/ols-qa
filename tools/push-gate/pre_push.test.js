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
  assert.ok(/list-test-suites\.sh/.test(src), 'the hook no longer asks the shared lister');
});

/* ── one source for where the suites live ──────────────────────────────────────────────
 *
 * The pattern used to be written out twice — here and in the CI workflow — and they drifted:
 * CI refused an empty match, the hook did not. Both now call the same script, and these cases
 * fail if either grows its own copy again.
 */

const LISTER = path.join(ROOT, 'scripts', 'list-test-suites.sh');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'tests.yml');
// Assembled, so this file does not count as a copy of the pattern it forbids.
const RAW_GLOB = 'tools/' + '*' + '/' + '*' + '.test.js';

function lister(dir) {
  const r = spawnSync('bash', [LISTER, dir], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

check('the lister answers with a list and a status, and this tree has suites', () => {
  const r = lister(ROOT);
  assert.strictEqual(r.code, 0, r.err);
  const lines = r.out.split('\n').filter(Boolean);
  assert.ok(lines.length > 0, 'no suites listed for a tree that has them');
  for (const l of lines) assert.ok(/^tools\/[^/]+\/[^/]+\.test\.js$/.test(l), `odd path: ${l}`);
  assert.ok(lines.includes('tools/push-gate/pre_push.test.js'), 'this very file was not listed');
});

check('a tree with no suites is exit 1, and an unlookable one is exit 2 — never confused', () => {
  const empty = fs.mkdtempSync(path.join(require('os').tmpdir(), 'no-suites-'));
  try {
    const none = lister(empty);
    assert.strictEqual(none.code, 1, 'an empty tree did not report "none"');
    assert.strictEqual(none.out, '', 'it printed something for an empty tree');

    const missing = lister(path.join(empty, 'nope'));
    assert.strictEqual(missing.code, 2, 'a missing directory did not report "could not look"');

    const noArg = spawnSync('bash', [LISTER], { cwd: ROOT, encoding: 'utf8' });
    assert.strictEqual(noArg.status, 2, 'a missing argument did not report "could not look"');
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

check('both callers use the lister, and neither keeps a copy of the pattern', () => {
  for (const [label, file] of [['pre-push', HOOK], ['tests.yml', WORKFLOW]]) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(src.includes('list-test-suites.sh'), `${label} no longer calls the lister`);
    const code = src.split('\n').filter((l) => !/^\s*(#|\/\/)/.test(l)).join('\n');
    assert.ok(!code.includes(RAW_GLOB),
      `${label} grew its own copy of the suite pattern again — that is the #0006 drift`);
  }
});

check('the lister is the only place the pattern is written', () => {
  const src = fs.readFileSync(LISTER, 'utf8');
  assert.ok(src.includes(RAW_GLOB), 'the lister no longer holds the pattern');
  assert.ok(/exit 1/.test(src) && /exit 2/.test(src),
    'the lister lost the difference between "none" and "could not look"');
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
