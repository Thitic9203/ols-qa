#!/usr/bin/env node
'use strict';
/* Shared skill files come from Helix only: fail a human PR that changes a file the Helix sync owns.
 * Spec: docs/sdd/helix-sync-pull R7 (source: SkillLane/team-pluton-skills docs/sdd/skill-sync-simplify R8).
 *
 *   node tools/helix-sync-pull/guard.js --base <ref>     (CI: --base origin/<base branch>)
 *
 * Owned paths are the ones listed in .helix-sync.lock on the BASE ref, so a PR cannot release a file by editing the
 * lock. The sync's own branch (GITHUB_HEAD_REF = bot/helix-sync) is exempt.
 * exit 0 = no owned path changed (or no lock on base yet), 1 = refused, 2 = git could not be read.
 */
const { execFileSync } = require('child_process');

const SYNC_BRANCH = 'bot/helix-sync';
const LOCK = '.helix-sync.lock';

function git(args, cwd) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env });
}

function main(argv, cwd = process.cwd(), headRef = process.env.GITHUB_HEAD_REF || '') {
  const i = argv.indexOf('--base');
  const base = i >= 0 ? argv[i + 1] : '';
  if (!base) {
    console.error('usage: guard.js --base <ref>');
    return 2;
  }
  if (headRef === SYNC_BRANCH) {
    console.log(`helix-sync guard: ${SYNC_BRANCH} is the sync itself; skipped`);
    return 0;
  }
  let lockText;
  let changed;
  try {
    git(['rev-parse', '--verify', `${base}^{commit}`], cwd);
    changed = git(['diff', '--name-only', `${base}...HEAD`], cwd).split('\n').filter(Boolean);
  } catch (e) {
    console.error(`helix-sync guard: cannot read git (${String(e.message).split('\n')[0]})`);
    return 2;
  }
  try {
    lockText = git(['show', `${base}:${LOCK}`], cwd);
  } catch {
    console.log(`helix-sync guard: no ${LOCK} on ${base} yet; nothing is owned`);
    return 0;
  }
  const owned = new Set(
    lockText.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('  ').slice(1).join('  ')),
  );
  owned.add(LOCK);
  const hits = changed.filter((p) => owned.has(p));
  if (hits.length) {
    console.error('helix-sync guard: these files come from Helix and are edited in Helix only:');
    for (const p of hits) console.error(`  ${p}`);
    console.error('Make the change in Thitic9203/helix; the daily helix-sync brings it here. (docs/sdd/helix-sync-pull R7)');
    return 1;
  }
  console.log(`helix-sync guard: ${changed.length} changed file(s), none owned by the Helix sync`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main };
