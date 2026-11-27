#!/usr/bin/env node
'use strict';
/* Helix → ols-qa one-way sync: scripts/helix-sync/apply.py.
 * Spec: docs/sdd/helix-sync-pull R3-R5.
 *
 * Each check builds a throwaway Helix tree and ols-qa tree and runs apply.py on them.
 *
 *   node tools/helix-sync-pull/apply.test.js
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const APPLY = path.join(ROOT, 'scripts', 'helix-sync', 'apply.py');

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
function tmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-sync-pull-'));
  tmpDirs.push(d);
  return d;
}
function w(root, rel, text) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
}
function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function apply(ols, helix, tag = 'v1.0.0') {
  const r = spawnSync('python3', [APPLY, ols, helix, tag], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
// sha + mtime of every file: proves "nothing written" (a same-bytes rewrite still changes mtime)
function snap(root) {
  const out = [];
  (function walk(d) {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n);
      const st = fs.lstatSync(p);
      if (st.isDirectory()) walk(p);
      else out.push(`${path.relative(root, p)} ${st.mtimeMs} ${crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`);
    }
  })(root);
  return out.join('\n');
}

function world() {
  const helix = tmp();
  const ols = tmp();
  // Helix release: shared skill, reference, two commands (one is on the keep-list), plus a file outside the folders
  w(helix, 'skills/a-workflow/SKILL.md', 'A v1');
  w(helix, 'references/shared.md', 'shared v1');
  w(helix, 'commands/a.md', 'cmd a');
  w(helix, 'commands/test-data-prep.md', 'generic helix copy');
  w(helix, 'README.md', 'helix readme');
  // ols-qa today: identical shared files, its own copy of test-data-prep, OLS-only files, keep-list
  w(ols, 'skills/a-workflow/SKILL.md', 'A v1');
  w(ols, 'references/shared.md', 'shared v1');
  w(ols, 'commands/test-data-prep.md', 'OLS copy with the OLS data link');
  w(ols, 'references/ols-project-guide.md', 'OLS only');
  w(ols, 'skills/smoke-test-workflow/SKILL.md', 'OLS only skill');
  w(ols, 'scripts/check-no-secrets.sh', 'ols secret guard');
  w(ols, 'README.md', 'ols readme');
  w(ols, 'helix-keep.txt', '# keep\ncommands/test-data-prep.md\n');
  return { helix, ols };
}

check('first run: adopts identical files, adds Helix-new files, writes the lock', () => {
  const { helix, ols } = world();
  const r = apply(ols, helix);
  assert.strictEqual(r.code, 0, r.err);
  assert.strictEqual(read(ols, 'commands/a.md'), 'cmd a');
  const lock = read(ols, '.helix-sync.lock');
  assert.match(lock.split('\n')[0], /tag=v1\.0\.0$/);
  for (const p of ['skills/a-workflow/SKILL.md', 'references/shared.md', 'commands/a.md']) assert.ok(lock.includes(`  ${p}\n`), p);
});

check('OLS-only files, files outside the three folders and the keep-list are never touched', () => {
  const { helix, ols } = world();
  apply(ols, helix);
  assert.strictEqual(read(ols, 'references/ols-project-guide.md'), 'OLS only');
  assert.strictEqual(read(ols, 'skills/smoke-test-workflow/SKILL.md'), 'OLS only skill');
  assert.strictEqual(read(ols, 'commands/test-data-prep.md'), 'OLS copy with the OLS data link');
  assert.strictEqual(read(ols, 'README.md'), 'ols readme');
  assert.strictEqual(read(ols, 'scripts/check-no-secrets.sh'), 'ols secret guard');
  const lock = read(ols, '.helix-sync.lock');
  assert.ok(!lock.includes('test-data-prep') && !lock.includes('ols-project-guide') && !lock.includes('smoke-test'));
});

check('Helix update and removal: changed file written, removed owned file deleted with its empty folder', () => {
  const { helix, ols } = world();
  w(helix, 'skills/b-workflow/SKILL.md', 'B');
  apply(ols, helix);
  w(helix, 'skills/a-workflow/SKILL.md', 'A v2');
  fs.rmSync(path.join(helix, 'skills/b-workflow'), { recursive: true });
  const r = apply(ols, helix, 'v1.1.0');
  assert.strictEqual(r.code, 0, r.err);
  assert.strictEqual(read(ols, 'skills/a-workflow/SKILL.md'), 'A v2');
  assert.ok(!fs.existsSync(path.join(ols, 'skills/b-workflow')));
  assert.match(read(ols, '.helix-sync.lock'), /tag=v1\.1\.0/);
});

check('no-change run writes nothing (sha and mtime of every file)', () => {
  const { helix, ols } = world();
  apply(ols, helix);
  const before = snap(ols);
  const r = apply(ols, helix);
  assert.strictEqual(r.code, 0, r.err);
  assert.match(r.out, /nothing to do/);
  assert.strictEqual(snap(ols), before);
});

function refuses(ols, helix, want) {
  const before = snap(ols);
  const r = apply(ols, helix, 'v1.2.0');
  assert.strictEqual(r.code, 1, `exit ${r.code}: ${r.err}`);
  assert.ok(r.err.includes(want), r.err);
  assert.ok(r.err.includes('nothing written') && !r.err.includes('Traceback'), r.err);
  assert.strictEqual(snap(ols), before, 'tree changed after a refusal');
}

check('R5: an owned file edited here is refused, named, never overwritten', () => {
  const { helix, ols } = world();
  apply(ols, helix);
  w(ols, 'references/shared.md', 'edited in ols-qa');
  w(helix, 'references/shared.md', 'shared v2');
  refuses(ols, helix, 'references/shared.md: synced file was edited here');
});

check('R5: an owned file deleted here is refused', () => {
  const { helix, ols } = world();
  apply(ols, helix);
  fs.rmSync(path.join(ols, 'commands/a.md'));
  refuses(ols, helix, 'commands/a.md: synced file was deleted here');
});

check('first run: a shared file that differs and is not owned is refused (no silent overwrite)', () => {
  const { helix, ols } = world();
  w(ols, 'references/shared.md', 'ols-qa got ahead');
  refuses(ols, helix, 'references/shared.md: exists here with different content');
});

check('a malformed or unsafe lock line is refused', () => {
  for (const line of ['no-two-spaces', `${'0'.repeat(64)}  ../README.md`, `${'0'.repeat(64)}  scripts/check-no-secrets.sh`]) {
    const { helix, ols } = world();
    apply(ols, helix);
    fs.appendFileSync(path.join(ols, '.helix-sync.lock'), `${line}\n`);
    refuses(ols, helix, 'not a valid lock line');
  }
});

check('a symlink in the Helix tree is refused', () => {
  const { helix, ols } = world();
  fs.symlinkSync('/etc/hosts', path.join(helix, 'references/leak.md'));
  refuses(ols, helix, 'Helix tree has a symlink');
});

check('usage: missing arguments exit 2', () => {
  const r = spawnSync('python3', [APPLY], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
});

for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
console.log(`${ran - failed}/${ran} passed`);
process.exit(failed ? 1 : 0);
