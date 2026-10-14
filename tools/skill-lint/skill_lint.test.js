#!/usr/bin/env node
'use strict';
/* Tests for the skill-file lint gate (tools/skill-lint/lint.js).
 *
 * Every rule gets a must-find fixture and a must-not-find fixture, built in a temp dir, so a
 * rule that silently stops matching (or starts matching everything) fails here before it can
 * wave a regression through. The last check runs the gate on this repo against its baseline:
 * that is the gate itself — a new violation anywhere in skills/ or references/ fails the suite.
 *
 *   node tools/skill-lint/skill_lint.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { lint, compare, toBaseline, emptyBaseline } = require('./lint.js');

const LINT = path.join(__dirname, 'lint.js');
const ROOT = path.join(__dirname, '..', '..');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const tmpRoots = [];
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  tmpRoots.push(root);
  for (const [p, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(p)), { recursive: true });
    fs.writeFileSync(path.join(root, p), body);
  }
  return root;
}

const lines = (n, prefix = 'line') => Array.from({ length: n }, (_, i) => `${prefix} ${i + 1}`).join('\n') + '\n';
const keys = (found, rule) => found[rule].map((v) => v.key);
const stub = (desc, body = '') => `---\nname: x\ndescription: ${desc}\n---\n\n# X\n\n${body}`;

// ---------- max-lines

check('max-lines must-find: WORKFLOW.md with 501 lines', () => {
  const root = fixture({ 'skills/procedures/a/WORKFLOW.md': lines(501), 'skills/a/SKILL.md': stub('Runs a.') });
  assert.deepStrictEqual(keys(lint(root), 'max-lines'), ['skills/procedures/a/WORKFLOW.md']);
});

check('max-lines must-not-find: SKILL.md with exactly 500 lines, other .md with 900', () => {
  const root = fixture({ 'skills/a/SKILL.md': lines(500), 'skills/a/notes.md': '## Contents\n' + lines(900) });
  assert.deepStrictEqual(keys(lint(root), 'max-lines'), []);
});

// ---------- toc

check('toc must-find: reference of 101 lines whose "Contents" sits below line 25', () => {
  const body = lines(30) + '## Contents\n' + lines(80);
  const root = fixture({ 'skills/a/SKILL.md': stub('Runs a.'), 'references/long.md': body });
  assert.deepStrictEqual(keys(lint(root), 'toc'), ['references/long.md']);
});

check('toc must-find: "## Content types" is not a Contents heading', () => {
  const root = fixture({ 'skills/a/SKILL.md': stub('Runs a.'), 'skills/a/guide.md': '# G\n\n## Content types\n' + lines(120) });
  assert.deepStrictEqual(keys(lint(root), 'toc'), ['skills/a/guide.md']);
});

check('toc must-not-find: Contents after frontmatter, a 100-line file, a nested references/ file', () => {
  const root = fixture({
    'skills/a/SKILL.md': '---\nname: a\ndescription: Runs a.\n---\n\n# A\n\n## Contents\n\n' + lines(200),
    'references/short.md': lines(100),
    'references/sub/deep.md': lines(300),
  });
  assert.deepStrictEqual(keys(lint(root), 'toc'), []);
});

// ---------- must-read-depth

const graph = {
  'skills/a/SKILL.md': stub('Runs a.', 'Follow [the workflow](../procedures/a/WORKFLOW.md).\n'),
  'skills/procedures/a/WORKFLOW.md': '# W\n\nRead [gates](../../../references/gates.md) before step 1.\n\n## See also\n\n- [extra](../../../references/extra.md)\n\nThe [table](../../../references/info.md) lists names.\n',
  'references/gates.md': '# G\n',
  'references/extra.md': '# E\n',
  'references/info.md': '# I\n',
};

check('must-read-depth must-find: must-read reference reached only through WORKFLOW (2 hops)', () => {
  const found = lint(fixture(graph));
  assert.deepStrictEqual(keys(found, 'must-read-depth'), ['skills/a/SKILL.md -> references/gates.md']);
  assert.strictEqual(found['must-read-depth'][0].value, 2);
});

check('must-read-depth must-not-find: see-also and informational links, and a 1-hop must-read', () => {
  const flat = Object.assign({}, graph, {
    'skills/a/SKILL.md': stub('Runs a.', 'Follow [the workflow](../procedures/a/WORKFLOW.md).\nRead [gates](../../references/gates.md) first.\n'),
  });
  assert.deepStrictEqual(keys(lint(fixture(flat)), 'must-read-depth'), []);
});

check('must-read-depth must-not-find: links inside code fences and to missing files', () => {
  const root = fixture({
    'skills/a/SKILL.md': stub('Runs a.', 'Follow [w](../procedures/a/WORKFLOW.md).\n'),
    'skills/procedures/a/WORKFLOW.md': '# W\n\n```\nRead [g](../../../references/gates.md)\n```\n\nRead [gone](../../../references/missing.md).\n',
    'references/gates.md': '# G\n',
  });
  assert.deepStrictEqual(keys(lint(root), 'must-read-depth'), []);
});

// ---------- description-person

check('description-person must-find: "you", "your", "I" and a folded multi-line description', () => {
  const root = fixture({
    'skills/a/SKILL.md': stub('Use when you need a.'),
    'skills/b/SKILL.md': stub('Checks your own output.'),
    'skills/c/SKILL.md': stub('I review the sheet.'),
    'skills/d/SKILL.md': '---\nname: d\ndescription: >\n  Reviews a document.\n  Use when you want feedback.\n---\n',
  });
  assert.deepStrictEqual(keys(lint(root), 'description-person'),
    ['skills/a/SKILL.md', 'skills/b/SKILL.md', 'skills/c/SKILL.md', 'skills/d/SKILL.md']);
});

check('description-person must-not-find: third person, "Youtube"/"mystery"/"AI", person words outside the description', () => {
  const root = fixture({
    'skills/a/SKILL.md': stub('Use when the user asks for a Youtube mystery AI check.', 'You run this when you want.\n'),
    'skills/b/SKILL.md': '---\nname: b\ndescription: |\n  Reviews the TC sheet against AC/EC.\n---\n\nI and you appear only in the body.\n',
    'skills/c/SKILL.md': stub('Use when the user says "check yourself" or “find your own mistakes”.'),
  });
  assert.deepStrictEqual(keys(lint(root), 'description-person'), []);
});

// ---------- baseline ratchet

check('baseline: known violations pass, new ones fail, growth fails, fixed entries are stale', () => {
  const root = fixture({ 'skills/procedures/a/WORKFLOW.md': lines(600), 'skills/a/SKILL.md': stub('Runs a.') });
  const base = toBaseline(lint(root));
  assert.strictEqual(base['max-lines']['skills/procedures/a/WORKFLOW.md'], 600);
  let r = compare(lint(root), base);
  assert.strictEqual(r['max-lines'].fresh.length + r['max-lines'].stale.length, 0);

  fs.writeFileSync(path.join(root, 'skills/procedures/a/WORKFLOW.md'), lines(601));
  r = compare(lint(root), base);
  assert.strictEqual(r['max-lines'].fresh.length, 1, 'a baselined file that grows must fail');

  fs.writeFileSync(path.join(root, 'skills/a/SKILL.md'), stub('Use when you need a.'));
  r = compare(lint(root), base);
  assert.strictEqual(r['description-person'].fresh.length, 1, 'a new violation must fail');

  fs.writeFileSync(path.join(root, 'skills/procedures/a/WORKFLOW.md'), lines(10));
  r = compare(lint(root), base);
  assert.strictEqual(r['max-lines'].stale.length, 1, 'a fixed baseline entry must be reported stale');
});

check('cli: exit 1 with NEW lines on a violation, exit 0 when baselined, exit 2 without skills/', () => {
  const root = fixture({ 'skills/a/SKILL.md': stub('Use when you need a.') });
  let res = spawnSync(process.execPath, [LINT, '--root', root, '--no-baseline'], { encoding: 'utf8' });
  assert.strictEqual(res.status, 1, res.stdout + res.stderr);
  assert.match(res.stdout, /NEW +skills\/a\/SKILL\.md: description uses "you"/);

  const bl = path.join(root, 'baseline.json');
  res = spawnSync(process.execPath, [LINT, '--root', root, '--baseline', bl, '--write-baseline'], { encoding: 'utf8' });
  assert.strictEqual(res.status, 0, res.stdout + res.stderr);
  res = spawnSync(process.execPath, [LINT, '--root', root, '--baseline', bl], { encoding: 'utf8' });
  assert.strictEqual(res.status, 0, res.stdout + res.stderr);

  const empty = fixture({ 'README.md': '# r\n' });
  res = spawnSync(process.execPath, [LINT, '--root', empty, '--no-baseline'], { encoding: 'utf8' });
  assert.strictEqual(res.status, 2, res.stdout + res.stderr);
});

check('emptyBaseline has every rule', () => {
  assert.deepStrictEqual(Object.keys(emptyBaseline()).sort(), ['description-person', 'max-lines', 'must-read-depth', 'toc']);
});

// ---------- the gate on this repo

check('repo: no new or stale skill-lint violations against tools/skill-lint/baseline.json', () => {
  const res = spawnSync(process.execPath, [LINT, '--root', ROOT], { encoding: 'utf8' });
  assert.strictEqual(res.status, 0, '\n' + res.stdout.split('\n').filter((l) => /NEW|STALE|FAIL/.test(l)).slice(0, 20).join('\n') + res.stderr);
});

for (const r of tmpRoots) fs.rmSync(r, { recursive: true, force: true });

if (failed) { console.log(`skill-lint: ${failed} check(s) failed`); process.exit(1); }
console.log('skill-lint: all checks passed');
