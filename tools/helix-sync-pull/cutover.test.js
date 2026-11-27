#!/usr/bin/env node
'use strict';
/* Cutover of the skill sync to one way, Helix -> ols-qa.
 * Spec: docs/sdd/helix-sync-pull R9-R11 (source: SkillLane/team-pluton-skills docs/sdd/skill-sync-simplify R1, R3, R10).
 *
 *   node tools/helix-sync-pull/cutover.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'helix-sync.yml');
const REMOVED = [
  'scripts/sync-skills-to-helix.sh',
  'scripts/sync-skills-pr-mode.sh',
  'scripts/hooks/post-commit',
  'tools/helix-sync/owned_files.test.js',
  'tools/helix-sync/pr_mode.test.js',
  'tools/helix-sync/sync_env.test.js',
];
// Files that are history, the spec of this cutover, or Helix-owned (lock, R7: fixed in Helix, not here).
const HISTORY = /^(docs\/post-mortem\/|docs\/sdd\/|docs\/plans\/|docs\/CLAUDE-ARCHIVE\.md$|tools\/helix-sync-pull\/cutover\.test\.js$)/;

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

function lockOwned() {
  const lock = path.join(ROOT, '.helix-sync.lock');
  if (!fs.existsSync(lock)) return new Set();
  return new Set(
    fs.readFileSync(lock, 'utf8').split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.trim().split(/\s+/).slice(1).join(' ')),
  );
}

function trackedFiles() {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', env });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr}`);
  return r.stdout.split('\0').filter(Boolean);
}

check('the ols-qa -> Helix scripts, the post-commit hook and their suites are gone (R9)', () => {
  const left = REMOVED.filter((f) => fs.existsSync(path.join(ROOT, f)));
  assert.deepStrictEqual(left, [], `still present: ${left.join(', ')}`);
});

check('the shared git-env-clean helper and the read-only parity check stay (R9)', () => {
  for (const f of ['scripts/git-env-clean.sh', 'scripts/helix-parity.sh', 'tools/helix-sync/git_env_clean.test.js']) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} is missing`);
  }
});

check('no live file still reads the removed scripts or the old sync branch (R9, R11)', () => {
  const owned = lockOwned();
  const pattern = /sync-skills-to-helix|sync-skills-pr-mode|sync\/ols-qa-auto|HELIX_SYNC=0/;
  const hits = [];
  for (const f of trackedFiles()) {
    if (HISTORY.test(f) || owned.has(f)) continue;
    const abs = path.join(ROOT, f);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    text.split('\n').forEach((line, i) => { if (pattern.test(line)) hits.push(`${f}:${i + 1}`); });
  }
  assert.deepStrictEqual(hits, [], `still referenced at:\n${hits.join('\n')}`);
});

const wf = fs.existsSync(WORKFLOW) ? fs.readFileSync(WORKFLOW, 'utf8') : '';

check('helix-sync.yml runs daily at 02:17 UTC next to the manual dispatch (R10)', () => {
  assert.ok(wf, '.github/workflows/helix-sync.yml is missing');
  const on = wf.split('\n');
  const start = on.findIndex((l) => /^on:\s*$/.test(l));
  assert.ok(start >= 0, 'no top-level on: block');
  let end = on.findIndex((l, i) => i > start && /^\S/.test(l));
  if (end < 0) end = on.length;
  const block = on.slice(start, end).join('\n');
  assert.ok(/^ {2}workflow_dispatch:/m.test(block), 'workflow_dispatch was dropped');
  assert.ok(/^ {2}schedule:\s*\n\s+- cron: '17 2 \* \* \*'/m.test(block), `no schedule cron '17 2 * * *' under on:\n${block}`);
});

check('a run with no tag (a scheduled run has no inputs) resolves the latest Helix release (R10)', () => {
  // Pull the tag-resolution script out of the workflow and run it with a stub gh, once with an empty
  // tag (what `inputs.tag` is on a schedule) and once with an explicit tag.
  const m = wf.match(/- name: Resolve the Helix tag[\s\S]*?\n {8}run: \|\n([\s\S]*?)\n\n/);
  assert.ok(m, 'could not find the Resolve the Helix tag step');
  assert.ok(/INPUT_TAG: \$\{\{ inputs\.tag \}\}/.test(wf), 'the step no longer reads inputs.tag through INPUT_TAG');
  const script = m[1].replace(/^ {10}/gm, '');
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cutover-'));
  try {
    fs.writeFileSync(path.join(tmp, 'gh'), '#!/bin/sh\necho v9.9.9\n', { mode: 0o755 });
    const out = path.join(tmp, 'out');
    const runIt = (tag) => {
      fs.writeFileSync(out, '');
      const env = { PATH: `${tmp}:${process.env.PATH}`, HELIX_SLUG: 'x/helix', GITHUB_OUTPUT: out, INPUT_TAG: tag };
      const r = spawnSync('bash', ['-c', script], { encoding: 'utf8', env });
      return { r, text: fs.readFileSync(out, 'utf8') };
    };
    const empty = runIt('');
    assert.strictEqual(empty.r.status, 0, `empty tag failed: ${empty.r.stdout}${empty.r.stderr}`);
    assert.ok(/^tag=v9\.9\.9$/m.test(empty.text), `empty tag did not resolve the latest release: ${empty.text}`);
    const pinned = runIt('v1.2.3');
    assert.ok(/^tag=v1\.2\.3$/m.test(pinned.text), `an explicit tag was not used: ${pinned.text}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

if (ran === 0) {
  console.log('\nno checks ran — refusing');
  process.exit(2);
}
console.log(failed ? `\n${failed} of ${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
