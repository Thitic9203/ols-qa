#!/usr/bin/env node
'use strict';
/* Both result-comment workflows end with the adoption-count check and its chat line,
 * and the project guide names the dashboard only by placeholder (this repo is public).
 *
 *   node tools/adoption-check/workflow_docs.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const C = require('./check');

const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const COUNTED = C.chatLine({ exit: 0 }, C.DASHBOARD_PLACEHOLDER);

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

['skills/procedures/retest-bug-workflow/WORKFLOW.md', 'skills/procedures/testing-ticket-workflow/WORKFLOW.md'].forEach((rel) => {
  const wf = read(rel);
  check(rel + ': runs the scoped search with the helper, with a manual fallback', () => {
    assert.ok(wf.includes('node tools/adoption-check/check.js --key {ISSUE_KEY}'), 'helper command missing');
    assert.ok(wf.includes(C.jqlFor('{ISSUE_KEY}')), 'scoped search text missing');
    assert.ok(/last line of the posted comment/i.test(wf), 'last-line check missing');
  });
  check(rel + ': the close-out carries the exact counted line, and NOT counted otherwise', () => {
    assert.ok(wf.includes(COUNTED), 'counted line missing or drifted from chatLine()');
    assert.ok(/NOT counted yet/.test(wf), 'the not-counted wording is missing');
    assert.ok(/never claim it without the search result/i.test(wf), 'no ban on claiming without the search');
  });
});

check('the project guide names the dashboard by placeholder only, with the tab and the counting rule', () => {
  const g = read('references/ols-project-guide.md');
  assert.ok(g.includes(C.DASHBOARD_PLACEHOLDER), 'placeholder missing');
  assert.ok(g.includes('AI Skill Adoption Overview'), 'tab name missing');
  assert.ok(g.includes('comment ~ "retestskillmarker"'), 'counting search missing');
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
