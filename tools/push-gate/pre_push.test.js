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

/** Run the hook with exactly this on stdin — including nothing at all. */
function runHookRaw(input) {
  const r = spawnSync('bash', [HOOK, 'origin', 'https://example.invalid/x.git'], {
    cwd: ROOT, input, encoding: 'utf8',
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

/** Run the hook the way git does: refs on stdin, verdict as the exit code. */
function runHook(localSha) {
  return runHookRaw(`refs/heads/main ${localSha} refs/heads/main ${ZERO}\n`);
}

/**
 * A commit with no suite in its tree, MADE HERE rather than looked up in history.
 *
 * The case below used to key off a historical sha and skip itself when the clone did not
 * carry it. CI checks out with `actions/checkout@v4` and no `fetch-depth`, i.e. depth 1 —
 * so the one behavioural case pinning report #0006 printed "(skipped — shallow clone)" and
 * the suite went green in the exact environment it was meant to protect. Measured
 * 2026-09-06: reverting the zero-suite refusal left CI green and only a full clone red.
 * A test that opts itself out where it matters is not coverage.
 */
function commitWithNoSuites() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const tree = execFileSync('git', ['mktree'], { cwd: ROOT, encoding: 'utf8', input: '' }).trim();
  // `commit-tree` needs a committer identity, and this call must not depend on one being
  // set globally — a fresh CI runner has no `~/.gitconfig` at all, while every developer
  // machine does, so this passed everywhere it was written and failed on GitHub Actions
  // the moment it actually ran there. `-c` scopes the identity to this one invocation:
  // nothing is written to the real repo's config, local or global.
  return execFileSync('git', [
    '-c', 'user.email=postmortem-guard-tests@example.invalid',
    '-c', 'user.name=postmortem-guard-tests',
    'commit-tree', tree, '-p', sha, '-m', 'fixture: a tree with no test suite',
  ], { cwd: ROOT, encoding: 'utf8' }).trim();
}

check('the hook refuses a commit whose tree contains no test file at all', () => {
  const r = runHook(commitWithNoSuites());
  assert.notStrictEqual(r.code, 0,
    'the push gate allowed a commit it never measured:\n' + r.out);
  assert.ok(/ไม่พบไฟล์เทสต์|no test file/i.test(r.out),
    'it refused, but not for the stated reason:\n' + r.out);
  assert.ok(!/✅/.test(r.out),
    'it printed a success mark while refusing:\n' + r.out);
});

check('nothing on stdin is a refusal, not a silent pass', () => {
  // Measured 2026-09-06: empty stdin and unparseable stdin both exited 0 with zero bytes of
  // output — indistinguishable, in the operator's terminal, from a push that passed.
  const empty = runHookRaw('');
  assert.notStrictEqual(empty.code, 0, 'empty stdin passed silently:\n' + empty.out);
  assert.ok(empty.out.trim().length > 0, 'it refused without saying anything');

  const junk = runHookRaw('garbage\n');
  assert.notStrictEqual(junk.code, 0, 'unreadable stdin passed:\n' + junk.out);
  assert.ok(!/เป็นการลบทั้งหมด/.test(junk.out),
    'a garbled line was counted as a ref deletion — passing for a reason that is not true:\n' + junk.out);
});

check('a lister that returns success with an empty list is refused by the hook itself', () => {
  // The zero-suite refusal moved wholly into scripts/list-test-suites.sh when the list was
  // shared, so it existed in exactly one place. `<<< "$SUITES"` on an empty variable yields
  // ONE empty line, not zero, so the counter is the only thing standing between a lister
  // regression and a green tick over nothing. This case pins the hook's own counter.
  const stub = path.join(ROOT, 'scripts', '.list-test-suites-stub.sh');
  const real = path.join(ROOT, 'scripts', 'list-test-suites.sh');
  const backup = fs.readFileSync(real, 'utf8');
  try {
    fs.writeFileSync(stub, '#!/bin/bash\nexit 0\n');           // succeeds, prints nothing
    fs.copyFileSync(stub, real);
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const r = runHook(sha);
    assert.notStrictEqual(r.code, 0, 'a green tick was printed over zero suites:\n' + r.out);
    assert.ok(/0 ชุด|วัดไปได้ 0/.test(r.out), 'it refused, but not for the zero count:\n' + r.out);
  } finally {
    fs.writeFileSync(real, backup);
    fs.chmodSync(real, 0o755);
    fs.rmSync(stub, { force: true });
  }
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

check('a nested git worktree does not double-count or leak an odd path into the listing', () => {
  // Report #0055/#0056: a worktree abandoned at `.claude/worktrees/serene-mendel-f2977e`
  // (this repo's own multi-session convention, CLAUDE.md rule 6) sat inside the tree for 4
  // days holding a second full copy of every tools/ suite. `find` cannot tell that copy from
  // the real one, so it inflated the count and broke the very check above (each duplicate
  // path is prefixed with the worktree's own path, so it can never match
  // `tools/<dir>/<file>.test.js`). Reproduced here with a throwaway worktree instead of
  // trusting that no worktree happens to exist on the machine running this test.
  const wtName = `.pre_push_test_wt_${process.pid}`;
  const wtPath = path.join(ROOT, wtName);
  const before = lister(ROOT);
  assert.strictEqual(before.code, 0, before.err);
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', wtPath, 'HEAD'], { cwd: ROOT });
  try {
    const after = lister(ROOT);
    assert.strictEqual(after.code, 0, after.err);
    assert.deepStrictEqual(after.out, before.out,
      'a nested worktree changed what the lister sees — it should be invisible to it');
    assert.ok(!after.out.includes(wtName), 'a worktree path leaked into the listing');
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wtPath], { cwd: ROOT });
  }
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

check('the documented runner refuses every way of measuring nothing', () => {
  // The wrapper's own header claims "could not run" and "nothing to run" are never a pass.
  // #0001, #0005 and #0006 were all a comment asserting a safety property with nothing checking
  // it, so the property is executed here — including the case the hook had to learn separately:
  // a lister that exits 0 and prints nothing still leaves zero suites measured.
  const RUNNER = path.join(ROOT, 'scripts', 'run-test-suites.sh');
  assert.ok(fs.existsSync(RUNNER), 'the command CLAUDE.md documents does not exist');

  const os = require('os');
  function sandbox(listerBody) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-'));
    fs.mkdirSync(path.join(dir, 'scripts'));
    fs.copyFileSync(RUNNER, path.join(dir, 'scripts', 'run-test-suites.sh'));
    fs.writeFileSync(path.join(dir, 'scripts', 'list-test-suites.sh'), listerBody);
    return dir;
  }
  function run(dir) {
    const r = spawnSync('bash', [path.join(dir, 'scripts', 'run-test-suites.sh')],
      { cwd: dir, encoding: 'utf8' });
    return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
  }

  for (const [label, lister, expect] of [
    ['no suites in the tree', '#!/bin/bash\nexit 1\n', /ไม่พบไฟล์เทสต์/],
    ['the list could not be read', '#!/bin/bash\nexit 2\n', /อ่านรายชื่อชุดเทสต์ไม่ได้/],
    ['success with an empty list', '#!/bin/bash\nexit 0\n', /วัดไปได้ 0 ชุด/],
  ]) {
    const dir = sandbox(lister);
    try {
      const r = run(dir);
      assert.notStrictEqual(r.code, 0, `passed on "${label}": ${r.out}`);
      assert.ok(expect.test(r.out), `"${label}" refused without saying why: ${JSON.stringify(r.out)}`);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }

  // And the other direction — it must still pass, and say how many it measured. A tick with no
  // number is what hides a gate that is measuring less and less (#0006).
  const good = sandbox('#!/bin/bash\necho ok.test.js\n');
  try {
    fs.writeFileSync(path.join(good, 'ok.test.js'), 'process.exit(0);\n');
    const r = run(good);
    assert.strictEqual(r.code, 0, 'a green tree was refused: ' + r.out);
    assert.ok(/1 ชุด/.test(r.out), 'the success line carries no count: ' + r.out);

    fs.writeFileSync(path.join(good, 'ok.test.js'), 'process.exit(1);\n');
    const bad = run(good);
    assert.strictEqual(bad.code, 1, 'a failing suite was reported as a pass: ' + bad.out);
  } finally { fs.rmSync(good, { recursive: true, force: true }); }
});

check('the command CLAUDE.md tells a person to run is the same one the gates run', () => {
  // CLAUDE.md is the third runtime for this decision: a person or an agent reads it and types
  // that line before committing. It carried the raw glob with no zero-suite refusal, so the
  // documented command exits 0 on a tree with no suites — #0006 exactly, in the copy most
  // likely to be run by hand. Two things doing one job need something binding them together.
  const doc = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
  const fence = /```bash\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = fence.exec(doc)) !== null) {
    if (/\.test\.js|test-suites\.sh/.test(m[1])) blocks.push(m[1]);
  }
  assert.ok(blocks.length > 0, 'CLAUDE.md no longer documents how to run the suites at all');
  for (const b of blocks) {
    assert.ok(!b.includes(RAW_GLOB),
      'CLAUDE.md still tells people to glob the suites themselves:\n' + b);
    // Following the reference, not the spelling: the documented command must run a script that
    // is in this repo and that consults the lister. Asserting the literal string
    // "list-test-suites.sh" appears in the doc would pass for a block that merely names it in
    // prose, and fail for a wrapper that genuinely calls it — spelling, not behaviour.
    const named = b.match(/scripts\/[a-z0-9-]+\.sh/g) || [];
    assert.ok(named.length > 0, 'the documented command runs no script from this repo:\n' + b);
    for (const rel of named) {
      const f = path.join(ROOT, rel);
      assert.ok(fs.existsSync(f), `CLAUDE.md documents ${rel}, which does not exist`);
      const src = fs.readFileSync(f, 'utf8');
      assert.ok(src.includes('list-test-suites.sh') || rel.endsWith('list-test-suites.sh'),
        `${rel} does not get its suite list from the lister — that is a second source of truth`);
      assert.ok(/found.*-eq 0|-eq 0.*found/.test(src),
        `${rel} has no zero-suite refusal — "none ran" would report as "all passed"`);
    }
  }
});

check('the CI step says WHY it refused, under the shell Actions really uses', () => {
  // Actions runs every `run:` block as `bash --noprofile --norc -eo pipefail`. Under `-e`,
  // `V="$(cmd)"` aborts the step the instant cmd exits non-zero, so a `case $?` written after
  // it can never be reached — the step fails correctly and prints NOTHING about why. That is
  // #0010's lesson from the other side: fail-closed is necessary but a refusal with no reason
  // is the alert that says `rc=3`. So the branch is executed here, not read.
  const yml = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const start = yml.findIndex((l) => /^\s*- name: Run every test in tools\//.test(l));
  assert.ok(start >= 0, 'the test-running step was renamed — this case is now pinning nothing');
  const runAt = yml.findIndex((l, i) => i > start && /^\s*run: \|/.test(l));
  assert.ok(runAt > start, 'the step no longer carries a run block');
  const indent = yml[runAt + 1].match(/^\s*/)[0];
  const body = [];
  for (let i = runAt + 1; i < yml.length; i += 1) {
    if (yml[i].trim() !== '' && !yml[i].startsWith(indent)) break;
    body.push(yml[i].slice(indent.length));
  }

  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ci-step-'));
  try {
    fs.mkdirSync(path.join(dir, 'scripts'));
    fs.copyFileSync(LISTER, path.join(dir, 'scripts', 'list-test-suites.sh'));
    const script = path.join(dir, 'step.sh');
    fs.writeFileSync(script, body.join('\n'));
    // No *.test.js anywhere in this tree, so the lister exits 1 — "none ran".
    const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', script],
      { cwd: dir, encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    assert.notStrictEqual(r.status, 0, 'the CI step passed on a tree with no suites: ' + out);
    assert.ok(/no test suite found/.test(out),
      'the step refused without saying why — its diagnostic is unreachable under `bash -e`:\n' +
      JSON.stringify(out));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

check('the lister is the only place that decides where the suites live', () => {
  // Pinned as a PROPERTY, not as a spelling. The previous version asserted the literal
  // glob was present in the file, which is a statement about how the answer is computed,
  // not about the answer — and it went red the moment the lister was widened to find
  // suites at any depth, even though the property it exists to protect was untouched.
  const src = fs.readFileSync(LISTER, 'utf8');
  assert.ok(/\*\.test\.js/.test(src), 'the lister no longer names the suite files at all');
  assert.ok(/exit 1/.test(src) && /exit 2/.test(src),
    'the lister lost the difference between "none" and "could not look"');

  // And it must actually agree with the tree: every suite present is listed, none invented —
  // EXCEPT a suite sitting inside a nested git worktree, which is a full second checkout of
  // this same repo, not a suite belonging to this one. Computed independently from the
  // lister's own exclusion (a plain `git worktree list`, filtered in test code, not production
  // code) so this stays a check on the PROPERTY, not a check that the two implementations
  // happen to be spelled the same way.
  const here = fs.realpathSync(ROOT);
  const worktreePruneArgs = [];
  try {
    const wtOut = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    for (const line of wtOut.split('\n')) {
      const m = /^worktree (.+)$/.exec(line);
      if (!m) continue;
      let real;
      try { real = fs.realpathSync(m[1]); } catch { continue; }
      if (real === here) continue;
      if (real.startsWith(here + path.sep)) {
        worktreePruneArgs.push('-not', '-path', `./${path.relative(here, real)}/*`);
      }
    }
  } catch { /* no git, or not a worktree-aware checkout — nothing extra to prune */ }

  const onDisk = execFileSync('find',
    ['.', '-type', 'f', '-name', '*.test.js', '-not', '-path', './.git/*', ...worktreePruneArgs],
    { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).map((p) => p.replace(/^\.\//, '')).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const listed = lister(ROOT).out.split('\n').filter(Boolean);
  assert.deepStrictEqual(listed, onDisk,
    'the lister and the tree disagree — a suite is dropped or invented');
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

check('the suites run without the git environment git handed the hook', () => {
  // Measured 2026-09-06: pushing the SAME commit passed from the main worktree and failed from a
  // linked one. git exports GIT_DIR to its hooks; the suites inherit it, and any suite that builds
  // a scratch repo then has its `git` calls aimed at the outer repository instead. Two cases of
  // tools/worktree-attribution/whose_change.test.js failed that way and nothing else explained it.
  // A gate whose answer depends on where it was invoked from is not a gate.
  // Since report #0063 the list comes from git itself (scripts/git-env-clean.sh), shared with the
  // post-commit sync, so the two paths cannot drift apart again.
  const hook = fs.readFileSync(HOOK, 'utf8');
  assert.ok(/cd "\$TMP\/wt" && git_env_clean && node "\$t"/.test(hook),
    'the suite runner no longer strips the git environment before running a suite');
  assert.ok(/\. "\$ROOT\/scripts\/git-env-clean\.sh"/.test(hook), 'pre-push no longer loads scripts/git-env-clean.sh');
  // and the construct must actually neutralise it, not merely look like it does
  const suite = path.join(ROOT, 'tools', 'worktree-attribution', 'whose_change.test.js');
  const helper = path.join(ROOT, 'scripts', 'git-env-clean.sh');
  const dirty = { ...process.env, GIT_DIR: path.join(ROOT, '.git'), GIT_INDEX_FILE: path.join(ROOT, '.git', 'index'), GIT_WORK_TREE: ROOT };
  const r = spawnSync('bash', ['-c', `. "${helper}" && git_env_clean && node "${suite}"`],
    { cwd: ROOT, env: dirty, encoding: 'utf8' });
  assert.strictEqual(r.status, 0,
    'a suite still fails when the hook runs it with a git environment present:\n' + (r.stdout || '') + (r.stderr || ''));
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
