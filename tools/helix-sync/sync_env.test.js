#!/usr/bin/env node
'use strict';
/* Pins the ols-qa → helix sync run by scripts/hooks/post-commit (report #0063).
 * git hands a hook its own repository in GIT_DIR / GIT_INDEX_FILE — absolute paths when the
 * commit comes from a linked worktree — and a script that `cd`s into helix without clearing
 * them reads ols-qa's index against helix's files.
 *
 *   node tools/helix-sync/sync_env.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SYNC = path.join(ROOT, 'scripts', 'sync-skills-to-helix.sh');
const HOOK = path.join(ROOT, 'scripts', 'hooks', 'post-commit');
const PRE_PUSH = path.join(ROOT, 'scripts', 'hooks', 'pre-push');
const HELPER = path.join(ROOT, 'scripts', 'git-env-clean.sh');
const SHARED = 'references/qa-closing-shared.md';

// This suite may itself run under a hook; its fixtures must never inherit that repository.
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
function identity(repo) {
  git(repo, 'config', 'user.name', 'sync-test');
  git(repo, 'config', 'user.email', 'sync-test@example.invalid');
}

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-sync-'));
  tmpDirs.push(base);
  const noHooks = path.join(base, 'no-hooks');
  fs.mkdirSync(noHooks);

  const helixOrigin = path.join(base, 'helix-origin.git');
  const helix = path.join(base, 'helix');
  git(base, 'init', '-q', '--bare', '-b', 'main', helixOrigin);
  git(base, 'init', '-q', '-b', 'main', helix);
  identity(helix);
  git(helix, 'config', 'core.hooksPath', noHooks);
  fs.mkdirSync(path.join(helix, 'references'));
  fs.mkdirSync(path.join(helix, 'scripts'));
  fs.writeFileSync(path.join(helix, SHARED), 'old\n');
  fs.writeFileSync(path.join(helix, 'scripts', 'check-no-secrets.sh'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  git(helix, 'add', '-A');
  git(helix, 'commit', '-qm', 'init');
  git(helix, 'remote', 'add', 'origin', helixOrigin);
  git(helix, 'push', '-q', 'origin', 'main');

  const olsqa = path.join(base, 'olsqa');
  git(base, 'init', '-q', '-b', 'main', olsqa);
  identity(olsqa);
  fs.mkdirSync(path.join(olsqa, 'references'));
  fs.mkdirSync(path.join(olsqa, 'scripts', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(olsqa, SHARED), 'old\n');
  fs.writeFileSync(path.join(olsqa, '.gitignore'), '.worktrees/\n');
  fs.copyFileSync(SYNC, path.join(olsqa, 'scripts', 'sync-skills-to-helix.sh'));
  if (fs.existsSync(HELPER)) fs.copyFileSync(HELPER, path.join(olsqa, 'scripts', 'git-env-clean.sh'));
  fs.copyFileSync(HOOK, path.join(olsqa, 'scripts', 'hooks', 'post-commit'));
  fs.chmodSync(path.join(olsqa, 'scripts', 'hooks', 'post-commit'), 0o755);
  git(olsqa, 'add', '-A');
  git(olsqa, 'commit', '-qm', 'init');
  // Same shape as the real .git/config: one absolute hooksPath shared by every worktree.
  git(olsqa, 'config', 'core.hooksPath', path.join(olsqa, 'scripts', 'hooks'));
  return { helix, helixOrigin, olsqa };
}

function commitShared(fx, cwd, content) {
  fs.writeFileSync(path.join(cwd, SHARED), content);
  git(cwd, 'add', SHARED);
  const r = run('git', ['commit', '-qm', `change ${content.trim()}`], { cwd, env: { ...CLEAN_ENV, HELIX_REPO: fx.helix } });
  assert.strictEqual(r.status, 0, `the ols-qa commit itself failed: ${r.stderr}`);
  return `${r.stdout}${r.stderr}`;
}

function assertDeployed(fx, content, out) {
  assert.ok(!/helix has uncommitted changes/.test(out), `sync reported uncommitted changes in a clean helix:\n${out}`);
  assert.ok(/pushed helix/.test(out), `sync did not deploy:\n${out}`);
  assert.strictEqual(git(fx.helix, 'show', `HEAD:${SHARED}`), content.trim(), 'helix HEAD does not carry the change');
  assert.strictEqual(git(fx.helixOrigin, 'show', `main:${SHARED}`), content.trim(), 'helix origin does not carry the change');
  assert.strictEqual(git(fx.helix, 'status', '--porcelain'), '', 'helix was left dirty');
}

check('a commit from the main checkout reaches helix', () => {
  const fx = fixture();
  assertDeployed(fx, 'from-main\n', commitShared(fx, fx.olsqa, 'from-main\n'));
});

check('a commit from a linked worktree reaches helix and leaves ols-qa as the commit left it', () => {
  const fx = fixture();
  git(fx.olsqa, 'worktree', 'add', '-q', '-b', 'wt', '.worktrees/wt', 'main');
  const wt = path.join(fx.olsqa, '.worktrees', 'wt');
  const refsBefore = git(fx.olsqa, 'for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads/main');
  const out = commitShared(fx, wt, 'from-worktree\n');
  assertDeployed(fx, 'from-worktree\n', out);
  assert.strictEqual(git(fx.olsqa, 'for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads/main'), refsBefore, 'ols-qa main moved');
  assert.strictEqual(git(wt, 'log', '--format=%s', '-1'), 'change from-worktree', 'the worktree branch gained or lost commits');
  assert.strictEqual(git(wt, 'status', '--porcelain'), '', 'the ols-qa worktree was left dirty');
  assert.strictEqual(git(fx.helix, 'log', '--format=%s', '-1').split('\n')[0], 'chore(sync): pull shared skill updates from ols-qa');
});

check('a helix that cannot be read is reported as unreadable, never as uncommitted changes', () => {
  const fx = fixture();
  fs.writeFileSync(path.join(fx.helix, '.git', 'index'), 'not an index');
  const out = commitShared(fx, fx.olsqa, 'unreadable\n');
  assert.ok(!/helix has uncommitted changes/.test(out), `an unreadable helix was reported as dirty:\n${out}`);
  assert.ok(/cannot check helix/.test(out), `the refusal does not say helix could not be checked:\n${out}`);
  assert.ok(!/pushed helix/.test(out), 'sync deployed without being able to check helix');
  assert.strictEqual(git(fx.helixOrigin, 'show', `main:${SHARED}`), 'old', 'helix origin changed');
});

check('the cleaner removes git\'s local variables and refuses when git is unavailable', () => {
  assert.ok(fs.existsSync(HELPER), 'scripts/git-env-clean.sh is missing');
  const dirty = { ...CLEAN_ENV, GIT_DIR: '/nowhere/.git', GIT_INDEX_FILE: '/nowhere/index', GIT_WORK_TREE: '/nowhere' };
  const ok = run('/bin/bash', ['-c', `. "${HELPER}" && git_env_clean && env | grep -cE '^GIT_(DIR|INDEX_FILE|WORK_TREE)='`], { env: dirty });
  assert.strictEqual(ok.stdout.trim(), '0', `a git variable survived the cleaner: ${ok.stderr}`);
  // PATH is emptied inside the shell, after bash itself has been found
  const noGit = run('/bin/bash', ['-c', `PATH=/nonexistent; . "${HELPER}"; git_env_clean; echo "rc=$?"`], { env: dirty });
  assert.ok(/rc=\d+/.test(noGit.stdout), `the no-git probe did not run: ${noGit.stderr}`);
  assert.ok(!/rc=0/.test(noGit.stdout), 'the cleaner reported success without git to ask');
});

check('the post-commit sync and the pre-push suite runner clear git through the same helper', () => {
  const sync = fs.readFileSync(SYNC, 'utf8').split('\n');
  const source = sync.findIndex((l) => /\bgit-env-clean\.sh\b/.test(l));
  const call = sync.findIndex((l) => /\bgit_env_clean\b/.test(l) && !/\bgit-env-clean\.sh\b/.test(l));
  const firstGit = sync.findIndex((l) => /(^|[\s(;&|$])git\s/.test(l) && !/^\s*#/.test(l));
  assert.ok(source >= 0 && call > source, 'the sync script does not source and call git_env_clean');
  assert.ok(firstGit < 0 || call < firstGit, `the sync script runs git (line ${firstGit + 1}) before clearing the environment (line ${call + 1})`);
  assert.ok(/\bgit-env-clean\.sh\b/.test(fs.readFileSync(PRE_PUSH, 'utf8')), 'pre-push does not use the shared helper');
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
