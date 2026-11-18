#!/usr/bin/env node
'use strict';
/* Files Helix owns are never overwritten by the ols-qa → helix sync.
 * Spec: docs/sdd/helix-owned-files O1–O7 (Helix docs/sdd/project-agnostic R8 R10).
 *
 * Each check builds a throwaway helix + ols-qa pair, commits a change in ols-qa, and runs
 * scripts/sync-skills-to-helix.sh on it with HELIX_SYNC_PUSH=0.
 *
 *   node tools/helix-sync/owned_files.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SYNC = path.join(ROOT, 'scripts', 'sync-skills-to-helix.sh');
const HELPER = path.join(ROOT, 'scripts', 'git-env-clean.sh');
const OWNED = 'commands/test-data-prep.md';
const SHARED = 'references/qa-closing-shared.md';
const LIST = 'helix-owned-files.txt';

// Never inherit the caller's repository or sync switches (same reason as sync_env.test.js).
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(GIT_|HELIX_)/.test(k)));

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
function write(root, rel, content, mode) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), content, mode ? { mode } : undefined);
}

/** list: string = contents of helix-owned-files.txt, null = no list file. */
function fixture(list) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-owned-'));
  tmpDirs.push(base);
  const noHooks = path.join(base, 'no-hooks');
  fs.mkdirSync(noHooks);

  const helixOrigin = path.join(base, 'helix-origin.git');
  const helix = path.join(base, 'helix');
  git(base, 'init', '-q', '--bare', '-b', 'main', helixOrigin);
  git(base, 'init', '-q', '-b', 'main', helix);
  for (const repo of [helix]) {
    git(repo, 'config', 'user.name', 'sync-test');
    git(repo, 'config', 'user.email', 'sync-test@example.invalid');
  }
  git(helix, 'config', 'core.hooksPath', noHooks);
  write(helix, OWNED, 'helix-owned\n');
  write(helix, SHARED, 'old\n');
  write(helix, 'scripts/check-no-secrets.sh', '#!/bin/sh\nexit 0\n', 0o755);
  for (const g of ['sync-version.sh', 'ci-check-portable-skills.sh', 'ci-check-skill-structure.sh']) {
    write(helix, `scripts/${g}`, '#!/bin/sh\nexit 0\n', 0o755);
  }
  write(helix, '.claude-plugin/plugin.json', JSON.stringify({ name: 'helix', skills: [] }, null, 2) + '\n');
  if (list !== null) write(helix, LIST, list);
  git(helix, 'add', '-A');
  git(helix, 'commit', '-qm', 'init');
  git(helix, 'remote', 'add', 'origin', helixOrigin);
  git(helix, 'push', '-q', 'origin', 'main');

  const olsqa = path.join(base, 'olsqa');
  git(base, 'init', '-q', '-b', 'main', olsqa);
  git(olsqa, 'config', 'user.name', 'sync-test');
  git(olsqa, 'config', 'user.email', 'sync-test@example.invalid');
  git(olsqa, 'config', 'core.hooksPath', noHooks);
  write(olsqa, OWNED, 'ols-old\n');
  write(olsqa, SHARED, 'old\n');
  fs.mkdirSync(path.join(olsqa, 'scripts'));
  fs.copyFileSync(SYNC, path.join(olsqa, 'scripts', 'sync-skills-to-helix.sh'));
  fs.copyFileSync(HELPER, path.join(olsqa, 'scripts', 'git-env-clean.sh'));
  git(olsqa, 'add', '-A');
  git(olsqa, 'commit', '-qm', 'init');
  return { helix, helixOrigin, olsqa };
}

/** Commit `changes` ({path: content}) in ols-qa, then run the sync on that commit. */
function syncChange(fx, changes) {
  for (const [rel, content] of Object.entries(changes)) write(fx.olsqa, rel, content);
  git(fx.olsqa, 'add', '-A');
  git(fx.olsqa, 'commit', '-qm', 'change');
  const r = run('bash', [path.join(fx.olsqa, 'scripts', 'sync-skills-to-helix.sh')], {
    cwd: fx.olsqa,
    env: { ...CLEAN_ENV, HELIX_REPO: fx.helix, HELIX_SYNC_PUSH: '0' },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const show = (repo, ref, rel) => git(repo, 'show', `${ref}:${rel}`);
const LISTED = `# Files Helix owns.\n# ${SHARED} (a path inside a comment is not listed)\n\n  ${OWNED}  # trailing comment\n`;

check('O2/O3/O4: an owned file is skipped and reported; a shared file in the same change still syncs', () => {
  const fx = fixture(LISTED);
  const { status, out } = syncChange(fx, { [OWNED]: 'ols-new\n', [SHARED]: 'new\n' });
  assert.strictEqual(status, 0, `sync exited ${status}:\n${out}`);
  assert.ok(out.includes('sync: skipped 1 Helix-owned file(s):'), `no skip report:\n${out}`);
  assert.ok(out.includes(`  · ${OWNED}`), `skip report does not name ${OWNED}:\n${out}`);
  assert.strictEqual(fs.readFileSync(path.join(fx.helix, OWNED), 'utf8'), 'helix-owned\n', 'helix working copy of the owned file changed');
  assert.strictEqual(show(fx.helix, 'HEAD', OWNED), 'helix-owned', 'helix HEAD of the owned file changed');
  assert.strictEqual(show(fx.helix, 'HEAD', SHARED), 'new', 'the non-owned shared file did not sync (O4)');
  assert.ok(/HELIX_SYNC_PUSH=0 — committed but not pushed/.test(out), `unexpected push path:\n${out}`);
  assert.strictEqual(show(fx.helixOrigin, 'main', OWNED), 'helix-owned', 'helix origin changed');
});

check('O2: only an owned file changed → helix gets no commit at all', () => {
  const fx = fixture(LISTED);
  const before = git(fx.helix, 'rev-parse', 'HEAD');
  const { status, out } = syncChange(fx, { [OWNED]: 'ols-new\n' });
  assert.strictEqual(status, 0, `sync exited ${status}:\n${out}`);
  assert.ok(out.includes('sync: skipped 1 Helix-owned file(s):'), `no skip report:\n${out}`);
  assert.strictEqual(git(fx.helix, 'rev-parse', 'HEAD'), before, 'helix got a commit');
  assert.strictEqual(git(fx.helix, 'status', '--porcelain'), '', 'helix was left dirty');
});

check('O2: HELIX_SYNC_NEW=1 does not override the list', () => {
  const fx = fixture(`skills/new-owned/SKILL.md\n`);
  write(fx.olsqa, 'skills/new-owned/SKILL.md', 'x\n');
  git(fx.olsqa, 'add', '-A');
  git(fx.olsqa, 'commit', '-qm', 'new');
  const r = run('bash', [path.join(fx.olsqa, 'scripts', 'sync-skills-to-helix.sh')], {
    cwd: fx.olsqa,
    env: { ...CLEAN_ENV, HELIX_REPO: fx.helix, HELIX_SYNC_PUSH: '0', HELIX_SYNC_NEW: '1' },
  });
  const out = `${r.stdout}${r.stderr}`;
  assert.strictEqual(r.status, 0, `sync exited ${r.status}:\n${out}`);
  assert.ok(out.includes('  · skills/new-owned/SKILL.md'), `owned new file not reported:\n${out}`);
  assert.ok(!fs.existsSync(path.join(fx.helix, 'skills/new-owned/SKILL.md')), 'owned new file was created in helix');
});

check('O1: a path that appears only inside a comment is not owned', () => {
  const fx = fixture(LISTED);
  const { out } = syncChange(fx, { [SHARED]: 'new\n' });
  assert.ok(!out.includes('Helix-owned file(s)'), `comment line was read as a path:\n${out}`);
  assert.strictEqual(show(fx.helix, 'HEAD', SHARED), 'new', 'shared file did not sync');
});

check('O5: no list file → syncs as before and prints one warning', () => {
  const fx = fixture(null);
  const { status, out } = syncChange(fx, { [OWNED]: 'ols-new\n' });
  assert.strictEqual(status, 0, `sync exited ${status}:\n${out}`);
  const warns = out.split('\n').filter((l) => l.startsWith('sync: ⚠️') && l.includes(LIST));
  assert.strictEqual(warns.length, 1, `expected one warning naming ${LIST}:\n${out}`);
  assert.strictEqual(show(fx.helix, 'HEAD', OWNED), 'ols-new', 'file did not sync without a list');
});

check('O6: an unreadable list stops the sync, nothing deployed', () => {
  if (process.getuid && process.getuid() === 0) return; // root reads mode 000 files; the check means nothing there
  const fx = fixture(LISTED);
  fs.chmodSync(path.join(fx.helix, LIST), 0o000);
  const before = git(fx.helix, 'rev-parse', 'HEAD');
  const { status, out } = syncChange(fx, { [SHARED]: 'new\n' });
  fs.chmodSync(path.join(fx.helix, LIST), 0o644);
  assert.strictEqual(status, 1, `sync exited ${status}, expected 1:\n${out}`);
  assert.ok(/NOTHING deployed/.test(out), `no NOTHING deployed line:\n${out}`);
  assert.strictEqual(git(fx.helix, 'rev-parse', 'HEAD'), before, 'helix got a commit');
  assert.strictEqual(fs.readFileSync(path.join(fx.helix, SHARED), 'utf8'), 'old\n', 'helix file was copied');
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
