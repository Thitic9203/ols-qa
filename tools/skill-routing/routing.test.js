#!/usr/bin/env node
'use strict';
/* Skill routing consistency (plan: docs/plans/done/skill-authoring-2026-alignment.md, D3).
 *
 * Changing a skill's frontmatter description, or the routing map, changes which skill gets
 * picked. This suite keeps four things in step and fails the pre-push gate when they drift:
 *
 *   A1  every skills/<name>/SKILL.md (skills/procedures/ excluded) is named in
 *       references/skill-routing.md
 *   A2  every skill named in references/skill-routing.md exists as skills/<name>/SKILL.md
 *   A3  every SKILL.md description says when to use it ("Use when" or "Use for") and when not
 *       to ("Do NOT use for" or "Do NOT use when"). Both wordings are accepted because both are
 *       in use today and the plan's D3 audit did not count either as a failure.
 *   A4  single routing source (spec docs/sdd/helix-skill-quality R8): skills/helix/SKILL.md and
 *       commands/helix.md both link references/skill-routing.md and references/menu-text.md,
 *       and neither keeps a numbered routing table of its own (a row starting "| 1," / "| `1`," /
 *       "| 1 |"). Two copies drifted before: the command routed reply 8 to Other while the skill
 *       routed it to Content Takedown.
 *   A5  the numbered menu covers every skill: each skills/<name>/SKILL.md (helix excluded) is
 *       linked from a numbered row of the "## Primary menu" table in references/skill-routing.md,
 *       or — for an ols-qa-only skill that is not shipped to helix (owner decision 14/Oct/2026) —
 *       named there as plain text `<name>` on a row that says "(ols-qa workspace only)", so the
 *       shared file has no link that would break in helix,
 *       and references/menu-text.md lists one numbered option per row, each with the same bold
 *       name as that row's Option column, with the "Reply with 1–N" line matching the last number.
 *
 * The Jira issue type → skill table is guarded separately by
 * tools/skill-routing-guard/skill_routing_map.test.js.
 *
 *   node tools/skill-routing/routing.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const SKILL_TOKEN = /^(?:helix|[a-z0-9-]+-workflow)$/;

/* Names of skills/<name>/SKILL.md, excluding skills/procedures/. */
function listSkills(root) {
  const dir = path.join(root, 'skills');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'procedures')
    .filter((d) => fs.existsSync(path.join(dir, d.name, 'SKILL.md')))
    .map((d) => d.name)
    .sort();
}

/* Backticked skill tokens in references/skill-routing.md. Short forms such as
 * "(→ create-bug)" are prose, not skill names, and are ignored. */
function routedSkills(root) {
  const md = fs.readFileSync(path.join(root, 'references', 'skill-routing.md'), 'utf8');
  const out = new Set();
  for (const m of md.matchAll(/`([^`\n]+)`/g)) {
    if (SKILL_TOKEN.test(m[1])) out.add(m[1]);
  }
  return [...out].sort();
}

/* Frontmatter { name, description } of a SKILL.md; handles `description: |` blocks and
 * single-line scalars. */
function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { name: null, description: '' };
  const lines = m[1].split('\n');
  let name = null;
  let description = '';
  for (let i = 0; i < lines.length; i++) {
    const nm = lines[i].match(/^name:\s*(.+?)\s*$/);
    if (nm) name = nm[1];
    const dm = lines[i].match(/^description:\s*(.*)$/);
    if (!dm) continue;
    if (/^[|>][-+]?\s*$/.test(dm[1])) {
      const body = [];
      for (let j = i + 1; j < lines.length && /^(\s+|$)/.test(lines[j]) && lines[j] !== ''; j++) {
        body.push(lines[j].trim());
      }
      description = body.join('\n');
    } else {
      description = dm[1];
    }
  }
  return { name, description };
}

/* A1: skills on disk missing from skill-routing.md. */
function unroutedSkills(root) {
  const routed = new Set(routedSkills(root));
  return listSkills(root).filter((s) => !routed.has(s));
}

/* A2: skills named in skill-routing.md with no skills/<name>/SKILL.md. */
function missingRoutedSkills(root) {
  const onDisk = new Set(listSkills(root));
  return routedSkills(root).filter((s) => !onDisk.has(s));
}

/* A3: SKILL.md files whose description lacks a use / do-not-use clause, or whose name
 * does not match its directory. Returns ["<skill>: <reason>"]. */
function descriptionProblems(root) {
  const problems = [];
  for (const s of listSkills(root)) {
    const { name, description } = frontmatter(path.join(root, 'skills', s, 'SKILL.md'));
    if (name !== s) problems.push(`${s}: frontmatter name is ${JSON.stringify(name)}`);
    if (!/\bUse (?:when|for)\b/.test(description)) problems.push(`${s}: description has no "Use when"/"Use for"`);
    if (!/\bDo NOT use (?:for|when)\b/.test(description)) problems.push(`${s}: description has no "Do NOT use for"/"Do NOT use when"`);
  }
  return problems;
}

/* A4: router entry points that keep their own numbered table or do not link the single
 * sources. Returns ["<file>: <reason>"]. */
const ENTRY_POINTS = [path.join('skills', 'helix', 'SKILL.md'), path.join('commands', 'helix.md')];
const OWN_TABLE_ROW = /^\|\s*`?\d+`?\s*[,|]/m;
function helixUnlisted(root) {
  const problems = [];
  for (const rel of ENTRY_POINTS) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const name = rel.split(path.sep).join('/');
    if (OWN_TABLE_ROW.test(text)) problems.push(`${name}: keeps its own numbered routing table`);
    if (!/\]\([^)]*references\/skill-routing\.md[)#]/.test(text)) problems.push(`${name}: does not link references/skill-routing.md`);
    if (!/\]\([^)]*references\/menu-text\.md[)#]/.test(text)) problems.push(`${name}: does not link references/menu-text.md`);
  }
  return problems;
}

/* A5: problems with the helix numbered menu. Returns ["<reason>"]. */
function helixMenuProblems(root) {
  const problems = [];
  const routing = fs.readFileSync(path.join(root, 'references', 'skill-routing.md'), 'utf8');
  const sec = routing.split(/^## Primary menu\s*$/m)[1];
  if (sec == null) return ['references/skill-routing.md: no "## Primary menu" section'];
  const table = sec.split(/^## /m)[0];
  // | # | Option | Route to | ...
  const rows = [...table.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]*?)\s*\|([^\n]*)$/gm)];
  const linked = new Set();
  for (const r of rows) {
    for (const m of r[3].matchAll(/\]\(\.\.\/skills\/([a-z0-9-]+)\/SKILL\.md\)/g)) linked.add(m[1]);
    // ols-qa-only skill: plain-text `name` (no link) accepted only on a row labelled as such.
    if (/\(ols-qa workspace only\)/.test(r[3])) for (const m of r[3].matchAll(/`([a-z0-9-]+)`/g)) linked.add(m[1]);
  }
  for (const s of listSkills(root)) {
    if (s !== 'helix' && !linked.has(s)) problems.push(`Primary menu: no numbered row links ${s}`);
  }
  const nums = rows.map((r) => Number(r[1]));
  const menuFile = path.join(root, 'references', 'menu-text.md');
  if (!fs.existsSync(menuFile)) return problems;
  const menu = fs.readFileSync(menuFile, 'utf8');
  const entries = [...menu.matchAll(/^(\d+)\. \*\*([^*]+)\*\*/gm)];
  const items = entries.map((m) => Number(m[1]));
  const want = nums.length ? Math.max(...nums) : 0;
  if (items.length !== want || items.some((n, i) => n !== i + 1)) {
    problems.push(`menu-text.md: options ${JSON.stringify(items)} do not match the ${want} Primary menu rows`);
  }
  const label = new Map(entries.map((m) => [Number(m[1]), m[2].trim()]));
  for (const r of rows) {
    const n = Number(r[1]);
    if (label.has(n) && label.get(n) !== r[2]) problems.push(`option ${n}: menu-text.md says "${label.get(n)}", skill-routing.md says "${r[2]}"`);
  }
  const reply = menu.match(/Reply with \*\*1\*\*–\*\*(\d+)\*\*/);
  if (!reply || Number(reply[1]) !== want) problems.push(`menu-text.md: "Reply with" range is not 1–${want}`);
  return problems;
}

/* ---------- fixtures ---------- */

function skillMd(name, description) {
  return `---\nname: ${name}\ndescription: |\n  ${description.split('\n').join('\n  ')}\n---\n\n# ${name}\n`;
}

const GOOD_DESC = 'Does a thing.\nUse when the user asks for the thing.\nDo NOT use for other things.';

const TEMP_ROOTS = [];

/* Builds a temp repo: skills = {name: description}, routing = markdown, helix = router body. */
function fixture({ skills, routing, helix }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-routing-'));
  TEMP_ROOTS.push(root);
  fs.mkdirSync(path.join(root, 'references'));
  fs.writeFileSync(path.join(root, 'references', 'skill-routing.md'), routing);
  const all = { helix: GOOD_DESC, ...skills };
  for (const [name, desc] of Object.entries(all)) {
    fs.mkdirSync(path.join(root, 'skills', name), { recursive: true });
    const body = name === 'helix' ? skillMd(name, desc) + '\n' + (helix || '') : skillMd(name, desc);
    fs.writeFileSync(path.join(root, 'skills', name, 'SKILL.md'), body);
  }
  fs.mkdirSync(path.join(root, 'skills', 'procedures', 'a-workflow'), { recursive: true });
  fs.writeFileSync(path.join(root, 'skills', 'procedures', 'a-workflow', 'SKILL.md'), '---\nname: x\n---\n');
  return root;
}

const ROUTING_OK = '| x | `a-workflow` | `/a` |\n| y | `b-workflow` | `/b` |\n| z | `helix` skill | `/helix` |\n| Do not | Open bugs (→ create-bug) |\n';
const HELIX_OK = 'Route to [a-workflow](../a-workflow/SKILL.md) or /b.';

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message.split('\n').join('\n       ')}`); }
}

console.log('skill routing consistency');

const clean = fixture({ skills: { 'a-workflow': GOOD_DESC, 'b-workflow': GOOD_DESC }, routing: ROUTING_OK, helix: HELIX_OK });

// A1
test('A1 must-not-find: every skill on disk is routed', () => assert.deepStrictEqual(unroutedSkills(clean), []));
test('A1 must-find: a skill missing from skill-routing.md is reported', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC, 'b-workflow': GOOD_DESC, 'c-workflow': GOOD_DESC }, routing: ROUTING_OK, helix: HELIX_OK });
  assert.deepStrictEqual(unroutedSkills(r), ['c-workflow']);
});

// A2
test('A2 must-not-find: short prose forms (→ create-bug) are not skill names', () => assert.deepStrictEqual(missingRoutedSkills(clean), []));
test('A2 must-find: a routed skill with no SKILL.md is reported', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC, 'b-workflow': GOOD_DESC }, routing: ROUTING_OK + '| w | `ghost-workflow` |\n', helix: HELIX_OK });
  assert.deepStrictEqual(missingRoutedSkills(r), ['ghost-workflow']);
});

// A3
test('A3 must-not-find: block and single-line descriptions with both clauses pass', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC, 'b-workflow': 'Does b. Use for /b. Do NOT use when unsure.' }, routing: ROUTING_OK, helix: HELIX_OK });
  fs.writeFileSync(path.join(r, 'skills', 'b-workflow', 'SKILL.md'), '---\nname: b-workflow\ndescription: Does b. Use for /b. Do NOT use when unsure.\n---\n');
  assert.deepStrictEqual(descriptionProblems(r), []);
});
test('A3 must-find: missing Use-when, missing Do-NOT, and wrong name are reported', () => {
  const r = fixture({ skills: { 'a-workflow': 'Does a.\nDo NOT use for b.', 'b-workflow': 'Does b.\nUse when asked.' }, routing: ROUTING_OK, helix: HELIX_OK });
  fs.writeFileSync(path.join(r, 'skills', 'helix', 'SKILL.md'), skillMd('router', GOOD_DESC));
  assert.deepStrictEqual(descriptionProblems(r), [
    'a-workflow: description has no "Use when"/"Use for"',
    'b-workflow: description has no "Do NOT use for"/"Do NOT use when"',
    'helix: frontmatter name is "router"',
  ]);
});

// A4
const LINKS = 'Route by [skill-routing.md](../../references/skill-routing.md#primary-menu); menu from [menu-text.md](../../references/menu-text.md).\n';
const writeCommand = (r, body) => { fs.mkdirSync(path.join(r, 'commands'), { recursive: true }); fs.writeFileSync(path.join(r, 'commands', 'helix.md'), body); };
test('A4 must-not-find: router and command link the single sources and keep no table', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC }, routing: ROUTING_OK, helix: LINKS });
  writeCommand(r, '---\ndescription: x\n---\nFollow [the skill](../skills/helix/SKILL.md). Table: [x](../references/skill-routing.md#primary-menu), [m](../references/menu-text.md).\n| Rule | Because |\n');
  assert.deepStrictEqual(helixUnlisted(r), []);
});
test('A4 must-find: a command with its own numbered table (reply 8 → Other) and no links is reported', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC }, routing: ROUTING_OK, helix: LINKS });
  writeCommand(r, '| User choice | Action |\n|---|---|\n| `1`, a | x |\n| `8`, other | Ask |\n');
  assert.deepStrictEqual(helixUnlisted(r), [
    'commands/helix.md: keeps its own numbered routing table',
    'commands/helix.md: does not link references/skill-routing.md',
    'commands/helix.md: does not link references/menu-text.md',
  ]);
});
test('A4 must-find: a router SKILL.md that keeps a "| 1, ..." table is reported', () => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC }, routing: ROUTING_OK, helix: LINKS + '| 1, a | Read [a](../a-workflow/SKILL.md) |\n' });
  assert.deepStrictEqual(helixUnlisted(r), ['skills/helix/SKILL.md: keeps its own numbered routing table']);
});

// A5
const primaryMenu = (rows) => '## Primary menu\n\n| # | Option | Route to | Command | Intent |\n|---|---|---|---|---|\n' + rows.join('\n') + '\n\n## Next\n| z | `helix` skill | `/helix` |\n';
const menuText = (n, names = []) => Array.from({ length: n }, (_, i) => `${i + 1}. **${names[i] || `Opt ${i + 1}`}** — x`).join('\n') + `\n\nReply with **1**–**${n}**, or the option name.\n`;
const ROW_A = '| 1 | Opt 1 | [`a-workflow`](../skills/a-workflow/SKILL.md) | `/a` | x |';
const ROW_B = '| 2 | Opt 2 | [`b-workflow`](../skills/b-workflow/SKILL.md) | `/b` | x |';
const ROW_OTHER = (n) => `| ${n} | Opt ${n} | — | — | Clarify |`;
const menuFixture = (rows, menu) => {
  const r = fixture({ skills: { 'a-workflow': GOOD_DESC, 'b-workflow': GOOD_DESC }, routing: primaryMenu(rows), helix: LINKS });
  fs.writeFileSync(path.join(r, 'references', 'menu-text.md'), menu);
  return r;
};
test('A5 must-not-find: every skill linked from a numbered row, menu-text numbers and names match', () => {
  assert.deepStrictEqual(helixMenuProblems(menuFixture([ROW_A, ROW_B, ROW_OTHER(3)], menuText(3))), []);
});
test('A5 must-find: a skill only named in prose (not a numbered row) and a stale menu-text range', () => {
  const r = menuFixture([ROW_A, ROW_OTHER(2)], menuText(3));
  fs.appendFileSync(path.join(r, 'references', 'skill-routing.md'), 'See [`b-workflow`](../skills/b-workflow/SKILL.md).\n');
  assert.deepStrictEqual(helixMenuProblems(r), [
    'Primary menu: no numbered row links b-workflow',
    'menu-text.md: options [1,2,3] do not match the 2 Primary menu rows',
    'menu-text.md: "Reply with" range is not 1–2',
  ]);
});
test('A5 must-find: option name differs between menu-text.md and skill-routing.md', () => {
  assert.deepStrictEqual(helixMenuProblems(menuFixture([ROW_A, ROW_B, ROW_OTHER(3)], menuText(3, ['Opt 1', 'Opt 2', 'Content Takedown']))),
    ['option 3: menu-text.md says "Content Takedown", skill-routing.md says "Opt 3"']);
});
test('A5 must-not-find: an ols-qa-only skill named as plain text on a labelled numbered row', () => {
  const rows = [ROW_A, '| 2 | Opt 2 | `b-workflow` (ols-qa workspace only) | `/b` | x |', ROW_OTHER(3)];
  assert.deepStrictEqual(helixMenuProblems(menuFixture(rows, menuText(3))), []);
});
test('A5 must-find: a plain-text skill name on a numbered row without the ols-qa-only label', () => {
  const rows = [ROW_A, '| 2 | Opt 2 | `b-workflow` | `/b` | x |', ROW_OTHER(3)];
  assert.deepStrictEqual(helixMenuProblems(menuFixture(rows, menuText(3))), ['Primary menu: no numbered row links b-workflow']);
});

// Real repo
const realSkills = listSkills(REPO);
test(`real repo: ${realSkills.length} skills found (sanity)`, () => assert.ok(realSkills.length >= 2 && realSkills.includes('helix')));
test('real repo A1: every skill is in references/skill-routing.md', () => assert.deepStrictEqual(unroutedSkills(REPO), []));
test('real repo A2: every routed skill exists', () => assert.deepStrictEqual(missingRoutedSkills(REPO), []));
test('real repo A3: every description has use / do-not-use clauses and a matching name', () => assert.deepStrictEqual(descriptionProblems(REPO), []));
test('real repo A4: router and /helix command link the single routing source and keep no table', () => assert.deepStrictEqual(helixUnlisted(REPO), []));
test('real repo A5: Primary menu covers every skill and menu-text numbers and names agree', () => assert.deepStrictEqual(helixMenuProblems(REPO), []));

for (const r of TEMP_ROOTS) fs.rmSync(r, { recursive: true, force: true });
console.log(`  ${passed} passed, ${failed} failed`);
process.exit(failed === 0 && passed > 0 ? 0 : 1);
