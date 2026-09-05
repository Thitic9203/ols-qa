#!/usr/bin/env node
'use strict';
/* The template printed in the workflow must agree with the rules that judge it.
 *
 * This is the exact failure the whole change set is about, one level up: when the
 * enforced rules gained a Role column and a Scope line, the template a reader copies
 * still showed the old shape — so following the documentation produced a body the
 * guard rejects. Reading both and noticing is not a plan; this test is.
 *
 *   node tools/retest-guard/workflow_template.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');

const ROOT = path.join(__dirname, '..', '..');
const WF = path.join(ROOT, 'skills', 'deprecated', 'retest-bug-workflow', 'WORKFLOW.md');
const STUB = path.join(ROOT, 'skills', 'retest-bug-workflow', 'SKILL.md');

const wf = fs.readFileSync(WF, 'utf8');

/** The v2 wiki template block the workflow prints. */
function templateBlock() {
  const start = wf.indexOf('**Template core — v2 wiki markup**');
  assert.ok(start > -1, 'the workflow no longer prints a v2 template');
  const fenceStart = wf.indexOf('```text', start);
  const fenceEnd = wf.indexOf('```', fenceStart + 7);
  assert.ok(fenceStart > -1 && fenceEnd > -1, 'the template fence is malformed');
  return wf.slice(fenceStart + 7, fenceEnd);
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const tpl = templateBlock();

check('the template shows every header line the rules require of a UI retest', () => {
  const missing = R.HEADER_LINES
    .filter((h) => h.when === 'always' || h.when === 'ui')
    .map((h) => h.key)
    .filter((key) => !new RegExp('^\\*' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\*', 'm').test(tpl));
  assert.deepStrictEqual(missing, [], 'template omits header line(s): ' + missing.join(', '));
});

check('the template also shows the API-only header lines', () => {
  ['API', 'Swagger'].forEach((k) => assert.ok(tpl.includes('*' + k + ':*'), 'template omits ' + k));
});

check('the template case table matches CASE_TABLE_HEADERS exactly', () => {
  const line = tpl.split('\n').find((l) => l.startsWith('||') && l.includes('Case'));
  assert.ok(line, 'no case-table header row in the template');
  const headers = R.splitWikiCells(line).cells.map(R.bareHeader);
  assert.deepStrictEqual(headers, R.CASE_TABLE_HEADERS.slice(),
    'template case table is [' + headers.join(', ') + ']');
});

check('the template verdict table matches VERDICT_TABLE_HEADERS exactly', () => {
  const line = tpl.split('\n').find((l) => l.startsWith('||') && l.includes('Expected Result'));
  assert.ok(line, 'no verdict-table header row in the template');
  const headers = R.splitWikiCells(line).cells.map(R.bareHeader);
  assert.deepStrictEqual(headers, R.VERDICT_TABLE_HEADERS.slice(),
    'template verdict table is [' + headers.join(', ') + ']');
});

check('the template carries no image width parameter', () => {
  assert.ok(!R.IMG_WIDTH_PARAM.test(tpl));
});

check('the template shows the coverage line the gate reconciles', () => {
  assert.ok(R.ITEM_COVERAGE_LINE.test(tpl.replace(/\{[^}]*\}/g, '1')),
    'no expected-result / acceptance-criteria coverage line in the template');
});

check('the prose that names the case columns names all of them, in the workflow and the stub', () => {
  const stub = fs.readFileSync(STUB, 'utf8');
  const expected = R.CASE_TABLE_HEADERS.join(' · ');          // "Case · Title · Covers · Role · Status"
  [['WORKFLOW.md', wf], ['SKILL.md', stub]].forEach(([name, text]) => {
    const mentions = text.match(/Test cases run` table: ([^—)]+)/);
    assert.ok(mentions, name + ' no longer describes the case table');
    assert.strictEqual(mentions[1].trim(), expected, name + ' describes it as "' + mentions[1].trim() + '"');
  });
});

check('the workflow tells the reader the body is rendered, not typed', () => {
  assert.ok(/not something to hand-type/i.test(wf), 'the template is presented as something to copy by hand');
  assert.ok(/retest_guard\.js/.test(wf), 'the workflow never runs the guard');
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
