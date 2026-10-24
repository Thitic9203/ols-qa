#!/usr/bin/env node
'use strict';
/* Skill structure check — the same rules helix CI applies to every shipped SKILL.md
 * (helix scripts/ci-check-skill-structure.sh), run here so a PR in ols-qa fails before the sync
 * does. Spec: docs/sdd/helix-skill-quality R12.
 *   1. frontmatter lists proactive_triggers under metadata: (with at least one item)
 *   2. has a "## QA closing" section
 *   3. mentions "Refusal-first" (the precondition-gate section)
 *   4. the first 20 lines contain "do not use" (negative trigger case)
 * Skills marked "(ols-qa workspace only)" in references/skill-routing.md are not shipped to helix
 * and are skipped — that table is the single source for what ships.
 *   node tools/skill-structure/check.js [--root <dir>]   exit 0 clean · 1 violations · 2 no skills/
 */
const fs = require('fs');
const path = require('path');

function checkText(name, text) {
  const out = [];
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const meta = fm && /^metadata:\s*\n((?:[ \t]+.*\n?)*)/m.exec(fm[1] + '\n');
  if (!meta || !/^\s+proactive_triggers:\s*\n\s+- \S/m.test(meta[1])) out.push(`${name}: proactive_triggers must be listed under metadata:`);
  if (!text.includes('## QA closing')) out.push(`${name}: missing ## QA closing section`);
  if (!text.includes('Refusal-first')) out.push(`${name}: missing Refusal-first section`);
  if (!/do not use/i.test(text.split('\n').slice(0, 20).join('\n'))) out.push(`${name}: description must include Do NOT use (negative case) in the first 20 lines`);
  return out;
}

function localOnly(root) {
  const f = path.join(root, 'references', 'skill-routing.md');
  const t = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  return new Set([...t.matchAll(/`([a-z0-9-]+)` \(ols-qa workspace only\)/g)].map((m) => m[1]));
}

function run(root) {
  const dir = path.join(root, 'skills');
  const skip = localOnly(root);
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'procedures' || e.name === 'in-progress' || skip.has(e.name)) continue;
    const f = path.join(dir, e.name, 'SKILL.md');
    if (fs.existsSync(f)) out.push(...checkText(e.name, fs.readFileSync(f, 'utf8')));
  }
  return out;
}

module.exports = { checkText, run, localOnly };

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  const root = i > -1 ? process.argv[i + 1] : path.resolve(__dirname, '..', '..');
  if (!fs.existsSync(path.join(root, 'skills'))) { console.error('skill-structure: no skills/'); process.exit(2); }
  const v = run(root);
  v.forEach((x) => console.log(x));
  console.log(v.length ? `skill-structure: ${v.length} violation(s)` : 'skill-structure: clean');
  process.exit(v.length ? 1 : 0);
}
