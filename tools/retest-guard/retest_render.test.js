#!/usr/bin/env node
'use strict';
/* The renderer's contract: what it produces passes the canonical rules.
 *
 * That round trip is the point of the whole design — the markup rules stop being
 * things a person must remember not to break, and become the only way the text can
 * be produced. If a rendered body ever fails the scanner, one of the two is wrong
 * and this test says so before a customer-facing comment does.
 *
 *   node tools/retest-guard/retest_render.test.js
 */
const assert = require('assert');
const R = require('./retest_rules');
const M = require('./retest_manifest');
const RENDER = require('./retest_render');

function feManifest() {
  return {
    ticket: 'PROJ-88',
    ticketType: 'Bug',
    bugType: 'FE',
    format: 'v2',
    env: 'Staging (app.staging.example.com)',
    designRef: 'https://figma.example.com/design/abc?node-id=1-2',
    role: ['CONTENT_ADMIN'],
    date: '2026-07-23',
    build: '9c3ab77',
    fixture: 'existing queue item — restored',
    scope: { mode: 'FULL' },
    testStep: 'open the review action on a flagged item',
    expectedVerbatim: 'button reads "Review Failed" and the badge stays',
    contract: [
      { id: 'ER1', text: 'button reads "Review Failed"' },
      { id: 'ER2', text: 'queue row keeps its flagged badge' },
    ],
    cases: [
      { id: 'TC_01', title: 'modal button labels', covers: ['ER1'], role: 'CONTENT_ADMIN', status: 'PASSED' },
      { id: 'TC_02', title: 'queue badge survives the modal', covers: ['ER2'], role: 'CONTENT_ADMIN', status: 'PASSED' },
    ],
    results: [
      { id: 'ER1', actual: 'reads "Review Failed"', evidence: ['PROJ-88_TC_01_CONTENT_ADMIN.mp4', 'TC_01_CONTENT_ADMIN-ER_1.png'], status: 'PASSED' },
      { id: 'ER2', actual: 'badge present after close', evidence: ['PROJ-88_TC_02_CONTENT_ADMIN.mp4'], status: 'PASSED' },
    ],
    verdict: 'PASSED',
  };
}

function apiFailed() {
  return {
    ticket: 'PROJ-204',
    ticketType: 'Bug',
    bugType: 'API',
    format: 'v3',
    env: 'Staging (https://api.staging.example.com)',
    api: 'PUT /api/v1/schedules/:id',
    swagger: 'https://api.staging.example.com/swagger',
    role: ['ADMIN'],
    date: '2026-05-20',
    build: '4f21c0e',
    fixture: 'schedule created via POST, deleted after the run',
    scope: { mode: 'FULL' },
    testStep: 'send an end date before the start date',
    expectedVerbatim: '400 with "end date must be after start date"',
    contract: [{ id: 'ER1', text: '400 with message "end date must be after start date"' }],
    cases: [{ id: 'TC_01', title: 'invalid range is rejected', covers: ['ER1'], role: 'ADMIN', status: 'FAILED' }],
    results: [{ id: 'ER1', actual: '500, unhandled exception', evidence: [], status: 'FAILED' }],
    verdict: 'FAILED',
    symptomGone: false,
    rootCause: { text: 'the range check runs after the persistence call', label: 'Confirmed' },
    resolutionOptions: [
      { text: 'move the range check ahead of persistence', owner: 'dev' },
      { text: 'accept 500 for this input and update the expected result', owner: 'spec owner' },
    ],
    decidedBy: 'spec owner',
  };
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
const errorsOnly = (fs) => fs.filter((f) => f.severity !== 'warn');

check('a rendered FE (v2 wiki) body passes the canonical rules', () => {
  const m = feManifest();
  assert.deepStrictEqual(M.validate(m), []);
  const body = RENDER.render(m);
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule + '@' + f.line)));
});

check('a rendered API (v3 markdown) body passes the canonical rules', () => {
  const m = apiFailed();
  assert.deepStrictEqual(M.validate(m), []);
  const body = RENDER.render(m);
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.ADF, bugType: 'API' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule + '@' + f.line)));
});

check('a scoped round says so in the verdict and lists what it did not verify', () => {
  const m = feManifest();
  m.scope = { mode: 'CASES', cases: ['TC_01'] };
  const body = RENDER.render(m);
  assert.ok(body.includes('*Retest Result: PASSED (scoped: TC_01)*'), 'verdict does not carry the scope');
  assert.ok(body.includes('*Scope:* CASES: TC_01'), 'no scope header line');
  assert.ok(/Out of scope this round:.*ER2/.test(body), 'the unverified item is not shown');
  assert.ok(body.includes('1 / 1 items met'), 'denominator did not follow the scope');
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule)));
});

check('the evidence cell carries the MP4 as an attachment link and the still bare', () => {
  const body = RENDER.render(feManifest());
  assert.ok(body.includes('[▶ PROJ-88_TC_01_CONTENT_ADMIN.mp4|^PROJ-88_TC_01_CONTENT_ADMIN.mp4]'));
  assert.ok(body.includes('!TC_01_CONTENT_ADMIN-ER_1.png!'));
  assert.ok(!R.IMG_WIDTH_PARAM.test(body), 'a width parameter cannot be rendered');
});

check('a FAILED round renders the symptom line, the labelled cause and both options', () => {
  const body = RENDER.render(apiFailed());
  assert.ok(body.includes('Originally reported symptom:** still present'));
  assert.ok(body.includes('— Confirmed'));
  assert.ok(body.includes('owner: dev'));
  assert.ok(body.includes('Decided by: spec owner'));
});

check('a value containing the cell delimiter is refused, not silently mangled', () => {
  const m = feManifest();
  m.contract[0].text = 'the filter reads A | B';
  assert.throws(() => RENDER.render(m), (e) => e.code === 'cell-contains-pipe');
});

check('a backtick in ticket text becomes a wiki code span, not a literal backtick', () => {
  const m = feManifest();
  m.results[0].actual = 'response carried `ok`';
  const body = RENDER.render(m);
  assert.ok(body.includes('{{ok}}'), 'backtick not converted');
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule)));
});

check('a Task retest is rendered against Acceptance Criteria, not Expected Result', () => {
  const m = feManifest();
  m.ticketType = 'Task';
  const body = RENDER.render(m);
  assert.ok(body.includes('*Acceptance Criteria (from ticket, verbatim):*'));
  assert.ok(!body.includes('*Expected Result (from ticket, verbatim):*'));
});


check('a Task round names its coverage line after the acceptance criteria', () => {
  const m = feManifest();
  m.ticketType = 'Task';
  const body = RENDER.render(m);
  assert.ok(body.includes('*Acceptance-criteria coverage:*'), 'coverage line still says Expected-result');
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule)));
});

check('a BLOCKED case is not counted as a case that ran', () => {
  const m = feManifest();
  m.cases[1].status = 'BLOCKED';
  m.results[1].status = 'BLOCKED';
  m.verdict = 'FAILED';
  m.symptomGone = true;
  m.rootCause = { text: 'the badge query needs a fixture we could not create', label: 'Unknown — not investigated' };
  m.resolutionOptions = [{ text: 'provide the fixture', owner: 'dev' }, { text: 'drop the item', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  assert.deepStrictEqual(M.validate(m), []);
  const body = RENDER.render(m);
  assert.ok(body.includes('1 / 2 cases run'), 'blocked case counted as run: ' + body.split('\n').find((l) => l.includes('Case coverage')));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
