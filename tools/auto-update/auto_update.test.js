#!/usr/bin/env node
'use strict';

/* Pins `scripts/ols-qa-auto-update.sh` and `scripts/install-auto-update.sh`.
 *
 * The session hook used to `git pull --ff-only origin main`, so whatever reached main reached
 * every session at once — including commits whose tests were still running or had failed. The
 * update now follows release tags only (auto-version.yml tags a commit after `tests` passed),
 * never moves a clone backwards, and never touches a dirty, diverged or non-main checkout.
 *
 * Offline: origin is a throwaway local bare repo, HOME and the state dir are throwaway too,
 * and the global/system git config is shut out so the machine's own settings cannot leak in.
 *
 *   node tools/auto-update/auto_update.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const AU = path.join(ROOT, 'scripts', 'ols-qa-auto-update.sh');
const INSTALL = path.join(ROOT, 'scripts', 'install-auto-update.sh');

let failed = 0;
let ran = 0;
function check(name, fn) {
  ran += 1;
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** An environment with no inherited GIT_* (a pre-push hook sets GIT_DIR) and no user git config. */
function baseEnv(home) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith('GIT_') && !k.startsWith('OLS_QA_')) env[k] = v;
  }
  env.HOME = home;
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = path.join(home, '.gitconfig-test');
  return env;
}

function git(env, cwd, args) {
  const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', 'init.defaultBranch=main', ...args],
  { cwd, encoding: 'utf8', env });
  if (r.status !== 0) throw new Error('git ' + args.join(' ') + ' failed: ' + r.stderr);
  return (r.stdout || '').trim();
}

function readme(version) {
  return '# OLS QA Workspace\n\nline 3\n\nline 5\n\n**OLS Workspace version: v' + version +
    '** (1 Jan 2026) - test fixture\n';
}

/**
 * A world: bare origin with one commit per version in `versions`; versions in `tagged` get a
 * release tag. Returns helpers bound to that world.
 */
function makeWorld(versions, tagged) {
  const W = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'olsqa-au-')));
  const home = path.join(W, 'home');
  fs.mkdirSync(home);
  const env = baseEnv(home);
  const origin = path.join(W, 'origin.git');
  const seed = path.join(W, 'seed');
  git(env, W, ['init', '-q', '--bare', origin]);
  git(env, W, ['init', '-q', seed]);
  for (const v of versions) {
    fs.writeFileSync(path.join(seed, 'README.md'), readme(v));
    git(env, seed, ['add', 'README.md']);
    git(env, seed, ['commit', '-qm', 'v' + v]);
    if (tagged.includes(v)) git(env, seed, ['tag', 'v' + v]);
  }
  git(env, seed, ['remote', 'add', 'origin', origin]);
  git(env, seed, ['push', '-q', 'origin', 'main', '--tags']);

  const clone = path.join(W, 'clone');
  const state = path.join(W, 'state');
  const w = {
    W, env, seed, clone, state,
    freshClone(ref) {
      fs.rmSync(clone, { recursive: true, force: true });
      git(env, W, ['clone', '-q', origin, clone]);
      git(env, clone, ['reset', '-q', '--hard', ref]);
    },
    run(extra) {
      const r = spawnSync('bash', [AU], {
        encoding: 'utf8',
        env: Object.assign({}, env, { OLS_QA_REPO_DIR: clone, OLS_QA_STATE_DIR: state }, extra || {}),
      });
      return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
    },
    version() {
      const m = fs.readFileSync(path.join(clone, 'README.md'), 'utf8').match(/version: v(\d+\.\d+\.\d+)/);
      return m ? m[1] : '';
    },
    head() { return git(env, clone, ['rev-parse', 'HEAD']); },
    publish(v, tag) {
      fs.writeFileSync(path.join(seed, 'README.md'), readme(v));
      git(env, seed, ['commit', '-qam', 'v' + v]);
      if (tag) git(env, seed, ['tag', 'v' + v]);
      git(env, seed, ['push', '-q', 'origin', 'main', '--tags']);
    },
    errors() {
      const f = path.join(state, 'last-update-error');
      return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
    },
    cleanup() { fs.rmSync(W, { recursive: true, force: true }); },
  };
  return w;
}

const FORCE = { OLS_QA_FORCE_UPDATE: '1' };

check('updates to the newest release, not to unreleased main', () => {
  const w = makeWorld(['1.0.0', '1.0.1', '1.0.2'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0, r.stderr);
    assert.strictEqual(w.version(), '1.0.1');
    assert.strictEqual(r.stdout.trim(), '=== ols-qa skills updated to v1.0.1 ===');
    assert.strictEqual(w.errors(), '', 'a clean update leaves no error notice');
  } finally { w.cleanup(); }
});

check('already at the newest release: nothing moves and nothing is printed', () => {
  const w = makeWorld(['1.0.0', '1.0.1', '1.0.2'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.1');
    const before = w.head();
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.head(), before);
    assert.strictEqual(r.stdout, '');
  } finally { w.cleanup(); }
});

check('a diverged clone is not moved and the failure is recorded', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    git(w.env, w.clone, ['commit', '-q', '--allow-empty', '-m', 'local work']);
    const before = w.head();
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.head(), before);
    assert.strictEqual(r.stdout, '');
    assert.match(w.errors(), /fast-forward to v1\.0\.1 failed/);
  } finally { w.cleanup(); }
});

check('a dirty clone is not moved and the failure is recorded', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    fs.appendFileSync(path.join(w.clone, 'README.md'), 'local edit\n');
    const before = w.head();
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.head(), before);
    assert.match(w.errors(), /tracked files are modified/);
    assert.match(fs.readFileSync(path.join(w.clone, 'README.md'), 'utf8'), /local edit/);
  } finally { w.cleanup(); }
});

check('a clone ahead of the release (unreleased main) is never moved back', () => {
  const w = makeWorld(['1.0.0', '1.0.1', '1.0.2'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('origin/main');
    const before = w.head();
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.head(), before);
    assert.strictEqual(w.version(), '1.0.2');
    assert.strictEqual(r.stdout, '');
  } finally { w.cleanup(); }
});

check('a clone on a feature branch is left alone, without an error', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    git(w.env, w.clone, ['checkout', '-q', '-b', 'feat/x']);
    const before = w.head();
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.head(), before);
    assert.strictEqual(w.errors(), '');
  } finally { w.cleanup(); }
});

check('release order is numeric: v1.49.0 is newer than v1.9.2', () => {
  const w = makeWorld(['1.9.1', '1.9.2', '1.49.0'], ['1.9.1', '1.9.2', '1.49.0']);
  try {
    w.freshClone('v1.9.1');
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.version(), '1.49.0');
  } finally { w.cleanup(); }
});

check('no new release inside the interval: the session skips the full fetch', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    w.run(FORCE); // stamps the check
    assert.strictEqual(w.version(), '1.0.1');
    const originMain = git(w.env, w.clone, ['rev-parse', 'origin/main']);
    w.publish('1.0.2', false); // unreleased commit on origin main
    const r = w.run();
    assert.strictEqual(r.code, 0);
    assert.strictEqual(git(w.env, w.clone, ['rev-parse', 'origin/main']), originMain,
      'origin/main moved, so a full fetch ran');
    assert.strictEqual(w.version(), '1.0.1');
  } finally { w.cleanup(); }
});

check('a release published after the last check reaches the next session', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    w.run(FORCE);
    assert.strictEqual(w.version(), '1.0.1');
    w.publish('1.0.2', true);
    const r = w.run(); // no force, well inside the 4h interval
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.version(), '1.0.2');
    assert.strictEqual(r.stdout.trim(), '=== ols-qa skills updated to v1.0.2 ===');
  } finally { w.cleanup(); }
});

check('OLS_QA_AUTO_UPDATE=0 does nothing at all', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    const r = w.run(Object.assign({ OLS_QA_AUTO_UPDATE: '0' }, FORCE));
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.version(), '1.0.0');
    assert.strictEqual(r.stdout, '');
    assert.ok(!fs.existsSync(w.state), 'opt-out must not even create the state dir');
  } finally { w.cleanup(); }
});

check('an unreachable origin exits 0, moves nothing and records the failure', () => {
  const w = makeWorld(['1.0.0', '1.0.1'], ['1.0.0', '1.0.1']);
  try {
    w.freshClone('v1.0.0');
    git(w.env, w.clone, ['remote', 'set-url', 'origin', path.join(w.W, 'missing.git')]);
    const r = w.run(FORCE);
    assert.strictEqual(r.code, 0);
    assert.strictEqual(w.version(), '1.0.0');
    assert.match(w.errors(), /git fetch from origin failed/);
  } finally { w.cleanup(); }
});

// ── installer ─────────────────────────────────────────────────────────────────────────────

function installEnv() {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'olsqa-inst-')));
  return { home, env: baseEnv(home) };
}
function install(env, args) {
  const r = spawnSync('bash', [INSTALL, ...(args || [])], { encoding: 'utf8', env });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function settingsOf(home) {
  return JSON.parse(fs.readFileSync(path.join(home, '.claude', 'settings.json'), 'utf8'));
}
function ourEntries(settings) {
  const groups = (settings.hooks && settings.hooks.SessionStart) || [];
  const cmds = [];
  for (const g of groups) for (const h of (g.hooks || [])) cmds.push(h.command || '');
  return cmds.filter((c) => c.includes('ols-qa-auto-update.sh'));
}

const OTHER_HOOK = { hooks: [{ type: 'command', command: 'echo other-session-hook' }] };

check('installer: two installs leave exactly one entry, pointing at this clone', () => {
  const { home, env } = installEnv();
  try {
    fs.mkdirSync(path.join(home, '.claude'));
    fs.writeFileSync(path.join(home, '.claude', 'settings.json'),
      JSON.stringify({ model: 'x', hooks: { SessionStart: [OTHER_HOOK] } }, null, 2));
    const a = install(env);
    const b = install(env);
    assert.strictEqual(a.code, 0, a.out);
    assert.strictEqual(b.code, 0, b.out);
    const s = settingsOf(home);
    const ours = ourEntries(s);
    assert.strictEqual(ours.length, 1, JSON.stringify(s));
    assert.strictEqual(ours[0], 'bash "' + fs.realpathSync(AU) + '"');
    const backups = fs.readdirSync(path.join(home, '.claude')).filter((f) => f.startsWith('settings.json.bak.'));
    assert.ok(backups.length >= 1, 'no backup written before the change');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

check('installer: other hooks and settings survive install and uninstall', () => {
  const { home, env } = installEnv();
  try {
    fs.mkdirSync(path.join(home, '.claude'));
    fs.writeFileSync(path.join(home, '.claude', 'settings.json'), JSON.stringify({
      model: 'x',
      hooks: { SessionStart: [OTHER_HOOK], Stop: [{ hooks: [{ type: 'command', command: 'echo stop' }] }] },
    }));
    assert.strictEqual(install(env).code, 0);
    let s = settingsOf(home);
    assert.strictEqual(s.model, 'x');
    assert.deepStrictEqual(s.hooks.SessionStart[0], OTHER_HOOK);
    assert.strictEqual(s.hooks.Stop[0].hooks[0].command, 'echo stop');

    const u = install(env, ['--uninstall']);
    assert.strictEqual(u.code, 0, u.out);
    s = settingsOf(home);
    assert.strictEqual(ourEntries(s).length, 0, JSON.stringify(s));
    assert.deepStrictEqual(s.hooks.SessionStart, [OTHER_HOOK]);
    assert.strictEqual(s.hooks.Stop[0].hooks[0].command, 'echo stop');
    assert.strictEqual(s.model, 'x');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

check('installer: creates settings.json when none exists; refuses a broken one untouched', () => {
  const { home, env } = installEnv();
  try {
    assert.strictEqual(install(env).code, 0);
    assert.strictEqual(ourEntries(settingsOf(home)).length, 1);

    const f = path.join(home, '.claude', 'settings.json');
    fs.writeFileSync(f, '{ not json');
    const r = install(env);
    assert.notStrictEqual(r.code, 0);
    assert.strictEqual(fs.readFileSync(f, 'utf8'), '{ not json');
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

console.log(`\n${ran - failed}/${ran} passed`);
if (failed > 0) process.exit(1);
