#!/usr/bin/env node
'use strict';
/* scripts/git-env-clean.sh: a script run from a git hook must drop the repository and identity variables git
 * hands the hook before it runs git anywhere else (report #0063). Used by scripts/hooks/pre-push,
 * scripts/helix-parity.sh, scripts/helix-link-check.sh and scripts/ols-qa-auto-update.sh.
 * These two checks moved here from sync_env.test.js when the ols-qa -> Helix sync was removed
 * (docs/sdd/helix-sync-pull R9); the helper itself stays.
 *
 *   node tools/helix-sync/git_env_clean.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const HELPER = path.join(ROOT, 'scripts', 'git-env-clean.sh');

// This suite may itself run under a hook; never inherit that repository.
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(GIT_|HELIX_)/.test(k)));

let failed = 0;
let ran = 0;
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

check('the cleaner also removes the author and committer identity a hook inherits', () => {
  // git exports GIT_AUTHOR_* to hooks; `git rev-parse --local-env-vars` does not list them.
  const dirty = { ...CLEAN_ENV };
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'GIT_AUTHOR_DATE', 'GIT_COMMITTER_NAME', 'GIT_COMMITTER_EMAIL', 'GIT_COMMITTER_DATE']) dirty[k] = 'leaked';
  const r = run('/bin/bash', ['-c', `. "${HELPER}" && git_env_clean && env | grep -cE '^GIT_(AUTHOR|COMMITTER)_'`], { env: dirty });
  assert.strictEqual(r.stdout.trim(), '0', `an identity variable survived the cleaner: ${r.stdout}${r.stderr}`);
});

if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
