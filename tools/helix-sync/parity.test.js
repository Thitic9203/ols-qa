#!/usr/bin/env node
'use strict';
/* Known-answer tests for scripts/helix-parity.sh (report #0191, P4).
 * A fixture pair — an ols-qa clone and a helix clone, each with a bare origin — where exactly
 * one shared file differs on origin/main. It must be found; the shared file that matches must
 * not; files present on only one side, and unpushed or uncommitted edits, are not compared.
 *
 *   node tools/helix-sync/parity.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'helix-parity.sh');

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
function write(repo, rel, body) {
  fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
  fs.writeFileSync(path.join(repo, rel), body);
}

// files: { 'skills/x.md': 'body' } committed and pushed to origin/main
function repoWithOrigin(base, name, files, noHooks) {
  const origin = path.join(base, `${name}-origin.git`);
  const dir = path.join(base, name);
  git(base, 'init', '-q', '--bare', '-b', 'main', origin);
  git(base, 'init', '-q', '-b', 'main', dir);
  git(dir, 'config', 'user.name', 'parity-test');
  git(dir, 'config', 'user.email', 'parity-test@example.invalid');
  git(dir, 'config', 'core.hooksPath', noHooks);
  for (const [rel, body] of Object.entries(files)) write(dir, rel, body);
  git(dir, 'add', '--', ...Object.keys(files));
  git(dir, 'commit', '-q', '-m', 'seed');
  git(dir, 'remote', 'add', 'origin', origin);
  git(dir, 'push', '-q', 'origin', 'main');
  return dir;
}

function fixture({ olsFiles, helixFiles }) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-parity-'));
  tmpDirs.push(base);
  const noHooks = path.join(base, 'no-hooks');
  fs.mkdirSync(noHooks);
  return {
    base,
    ols: repoWithOrigin(base, 'ols-qa', olsFiles, noHooks),
    helix: repoWithOrigin(base, 'helix', helixFiles, noHooks),
  };
}

function parity(f) {
  const r = run('/bin/bash', [SCRIPT], { env: { ...CLEAN_ENV, OLS_REPO: f.ols, HELIX_REPO: f.helix } });
  return { status: r.status, out: r.stdout, lines: r.stdout.split('\n').filter((l) => l !== ''), err: r.stderr };
}

const BASE_OLS = {
  'skills/same/SKILL.md': 'same\n',
  'references/drifted.md': 'ols-qa main\n',
  'references/ols-only-guide.md': 'ols only\n',
  'commands/only-in-ols.md': 'x\n',
  'docs/not-shared-root.md': 'ols\n',
};
const BASE_HELIX = {
  'skills/same/SKILL.md': 'same\n',
  'references/drifted.md': 'unmerged branch text\n',
  'skills/only-in-helix/SKILL.md': 'y\n',
  'docs/not-shared-root.md': 'helix differs but is outside the shared roots\n',
};

check('must find 1 / must not find 1: only the drifted shared file is reported, exit 1', () => {
  const f = fixture({ olsFiles: BASE_OLS, helixFiles: BASE_HELIX });
  const r = parity(f);
  assert.strictEqual(r.status, 1, r.out + r.err);
  const differs = r.lines.filter((l) => l.startsWith('DIFFERS '));
  assert.deepStrictEqual(differs, ['DIFFERS references/drifted.md']);
  assert.ok(!r.out.includes('skills/same/SKILL.md'), 'the matching shared file was reported');
  assert.ok(!r.out.includes('only-in'), 'a one-sided file was compared');
  assert.ok(!r.out.includes('docs/'), 'a file outside skills/ references/ commands/ was compared');
  assert.strictEqual(r.lines[r.lines.length - 1], 'HELIX-PARITY DRIFT 1 of 2 shared files differ');
});

check('paths are repo-relative: no temp directory or absolute path in the output', () => {
  const f = fixture({ olsFiles: BASE_OLS, helixFiles: BASE_HELIX });
  const r = parity(f);
  assert.ok(!r.out.includes(f.base), 'output carries a machine path');
  assert.ok(r.lines.every((l) => !/\s\//.test(l) && !l.startsWith('/')), `absolute path in: ${r.out}`);
});

check('equal shared files are HELIX-PARITY OK, exit 0', () => {
  const helixFiles = { ...BASE_HELIX, 'references/drifted.md': 'ols-qa main\n' };
  const f = fixture({ olsFiles: BASE_OLS, helixFiles });
  const r = parity(f);
  assert.strictEqual(r.status, 0, r.out + r.err);
  assert.deepStrictEqual(r.lines, ['HELIX-PARITY OK 0 of 2 shared files differ']);
});

check('only origin/main counts: unpushed commits and working-tree edits are not compared', () => {
  const helixFiles = { ...BASE_HELIX, 'references/drifted.md': 'ols-qa main\n' };
  const f = fixture({ olsFiles: BASE_OLS, helixFiles });
  write(f.helix, 'skills/same/SKILL.md', 'local commit in helix\n');
  git(f.helix, 'commit', '-q', '-am', 'unpushed');
  write(f.ols, 'references/drifted.md', 'uncommitted edit\n');
  const r = parity(f);
  assert.strictEqual(r.status, 0, r.out + r.err);
});

check('a change merged to ols-qa main but never synced is found (the P5 gap)', () => {
  const helixFiles = { ...BASE_HELIX, 'references/drifted.md': 'ols-qa main\n' };
  const f = fixture({ olsFiles: BASE_OLS, helixFiles });
  write(f.ols, 'skills/same/SKILL.md', 'merged, not synced\n');
  git(f.ols, 'commit', '-q', '-am', 'merge');
  git(f.ols, 'push', '-q', 'origin', 'main');
  const r = parity(f);
  assert.strictEqual(r.status, 1, r.out + r.err);
  assert.deepStrictEqual(r.lines.filter((l) => l.startsWith('DIFFERS ')), ['DIFFERS skills/same/SKILL.md']);
});

check('no shared files, missing helix, or failed fetch is CANNOT-VERIFY exit 2', () => {
  const f = fixture({ olsFiles: { 'skills/a/SKILL.md': 'a\n' }, helixFiles: { 'skills/b/SKILL.md': 'b\n' } });
  let r = parity(f);
  assert.strictEqual(r.status, 2, r.out);
  assert.match(r.lines[0], /^CANNOT-VERIFY no shared files/);

  const g = fixture({ olsFiles: BASE_OLS, helixFiles: BASE_HELIX });
  r = run('/bin/bash', [SCRIPT], { env: { ...CLEAN_ENV, OLS_REPO: g.ols, HELIX_REPO: path.join(g.base, 'nope') } });
  assert.strictEqual(r.status, 2, r.stdout);
  assert.match(r.stdout, /^CANNOT-VERIFY helix repo not found/);

  git(g.helix, 'remote', 'set-url', 'origin', path.join(g.base, 'gone.git'));
  r = parity(g);
  assert.strictEqual(r.status, 2, r.out);
  assert.match(r.lines[0], /^CANNOT-VERIFY fetch of helix/);
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
