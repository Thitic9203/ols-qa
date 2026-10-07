#!/usr/bin/env node
'use strict';
/* Skill routing map guard (post-mortem #0174).
 *
 * An unattended test run read a SOP path that did not exist and tested Story tickets without the
 * repo skill; nothing noticed. The owner-confirmed rule is: Story -> testing-ticket-workflow,
 * Bug -> retest-bug-workflow. This suite reads the REAL files on disk, so moving or renaming
 * either skill, or editing the mapping table, fails the suite (and with it the pre-push gate).
 *
 *   node tools/skill-routing-guard/skill_routing_map.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'references', 'skill-routing.md');
const HEADING = '## Jira issue type → skill';
const EXPECTED = { Story: 'testing-ticket-workflow', Bug: 'retest-bug-workflow' };

/* Parse the issue-type table under HEADING. Returns {type: skill}; {} when the section is absent. */
function parseIssueTypeMap(md) {
  const start = md.indexOf(HEADING);
  if (start < 0) return {};
  const rest = md.slice(start + HEADING.length);
  const next = rest.search(/\n## /);
  const section = next < 0 ? rest : rest.slice(0, next);
  const map = {};
  for (const line of section.split('\n')) {
    const m = line.match(/^\|\s*([A-Za-z-]+)\s*\|\s*`([a-z0-9-]+)`\s*\|\s*$/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('PASS  ' + name); } catch (e) { failed++; console.log('FAIL  ' + name + ' — ' + e.message); }
}

// Known answers for the parser itself (must find / must not find).
check('parser finds the mapping in a known-good table', () => {
  const md = `x\n${HEADING} (bots)\n\n| Issue type | Skill |\n|---|---|\n| Story | \`testing-ticket-workflow\` |\n| Bug | \`retest-bug-workflow\` |\n\n## Next\n| Task | \`x\` |\n`;
  assert.deepStrictEqual(parseIssueTypeMap(md), EXPECTED);
});
check('parser reports a swapped table as different (must not pass)', () => {
  const md = `${HEADING}\n| Story | \`retest-bug-workflow\` |\n| Bug | \`testing-ticket-workflow\` |\n`;
  assert.notDeepStrictEqual(parseIssueTypeMap(md), EXPECTED);
});
check('parser returns nothing when the section is missing', () => {
  assert.deepStrictEqual(parseIssueTypeMap('# routing\n| Story | `testing-ticket-workflow` |\n'), {});
});

// The real files on disk.
const doc = fs.readFileSync(DOC, 'utf8');
const real = parseIssueTypeMap(doc);
check('references/skill-routing.md maps Story -> testing-ticket-workflow', () => assert.strictEqual(real.Story, EXPECTED.Story));
check('references/skill-routing.md maps Bug -> retest-bug-workflow', () => assert.strictEqual(real.Bug, EXPECTED.Bug));
check('mapping table names exactly the 2 owner-confirmed types', () => assert.deepStrictEqual(Object.keys(real).sort(), ['Bug', 'Story']));
for (const skill of Object.values(EXPECTED)) {
  const wf = path.join(ROOT, 'skills', 'procedures', skill, 'WORKFLOW.md');
  check(`skills/procedures/${skill}/WORKFLOW.md exists and is non-empty`, () => {
    assert.ok(fs.existsSync(wf), 'missing: ' + path.relative(ROOT, wf));
    assert.ok(fs.statSync(wf).size > 0, 'empty: ' + path.relative(ROOT, wf));
  });
  check(`primary menu still lists ${skill}`, () => assert.ok(doc.includes('`' + skill + '`')));
}

console.log(`skill_routing_map: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 && passed > 0 ? 0 : 1);
