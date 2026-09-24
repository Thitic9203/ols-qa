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
  // The declared verdict is setup here, not the property under test — the property is the
  // coverage line asserted at the bottom. It used to read FAILED because that is what
  // `computedVerdict` returned for a partly blocked round, which was itself the defect:
  // announcing a defect in a case the round never reached. The truthful verdict is BLOCKED.
  m.verdict = 'BLOCKED';
  m.symptomGone = true;
  m.rootCause = { text: 'the badge query needs a fixture we could not create', label: 'Unknown — not investigated' };
  m.resolutionOptions = [{ text: 'provide the fixture', owner: 'dev' }, { text: 'drop the item', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  assert.deepStrictEqual(M.validate(m), []);
  const body = RENDER.render(m);
  assert.ok(body.includes('1 / 2 cases run'), 'blocked case counted as run: ' + body.split('\n').find((l) => l.includes('Case coverage')));
});


check('a fully BLOCKED round renders as BLOCKED and still passes the rules', () => {
  const m = feManifest();
  m.results.forEach((r) => { r.status = 'BLOCKED'; });
  m.cases.forEach((c) => { c.status = 'BLOCKED'; });
  m.verdict = 'BLOCKED';
  m.symptomGone = false;
  m.rootCause = { text: 'the queue fixture could not be created here', label: 'Unknown — not investigated' };
  m.resolutionOptions = [{ text: 'provide the fixture', owner: 'dev' }, { text: 'descope', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  assert.deepStrictEqual(M.validate(m), []);
  const body = RENDER.render(m);
  assert.ok(body.startsWith('*Retest Result: BLOCKED* ⛔'), body.split('\n')[0]);
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule)));
});

/* ---- Owner format, 2026-09-24 ------------------------------------------------ */

function multiCaseManifest() {
  const m = feManifest();
  m.build = 'PR #12 in tag v1 · the env shows no build number';
  m.fixture = 'queue item created for the run · deleted after, count back to 0';
  m.cases.push({ id: 'TC_03', title: 'narrow width keeps the label', covers: ['ER1'], role: 'VIEWER', status: 'PASSED' });
  m.results[0].actual = 'reads "Review Failed" · stays on one line at 390 px';
  return m;
}

check('rule 1: a FULL round prints no Scope line; a CASES round still does', () => {
  const full = RENDER.render(feManifest());
  assert.ok(!/Scope:/.test(full), 'a full round printed a Scope line');
  const m = feManifest();
  m.scope = { mode: 'CASES', cases: ['TC_01'] };
  assert.ok(RENDER.render(m).includes('*Scope:* CASES: TC_01'));
});

check('rule 2: a multi-point header field is a label line, one bullet per point, then ONE blank line', () => {
  const lines = RENDER.render(multiCaseManifest()).split('\n');
  const b = lines.indexOf('*Build:*');
  assert.ok(b > -1, 'Build label is not on its own line');
  assert.deepStrictEqual(lines.slice(b, b + 4),
    ['*Build:*', '* PR #12 in tag v1', '* the env shows no build number', '']);
  const f = lines.indexOf('*Fixture:*');
  assert.strictEqual(f, b + 4, 'Fixture label must follow Build\'s blank line at the same level');
  assert.deepStrictEqual(lines.slice(f, f + 4),
    ['*Fixture:*', '* queue item created for the run', '* deleted after, count back to 0', '']);
  assert.notStrictEqual(lines[f + 4], '', 'more than one blank line after a list');
  // A single-point field stays inline.
  assert.ok(lines.includes('*Date:* 2026-07-23'));
});

check('rule 3: ONE table with the seven columns; no "Test cases run" table', () => {
  const body = RENDER.render(multiCaseManifest());
  const headerRows = body.split('\n').filter((l) => l.startsWith('||'));
  assert.deepStrictEqual(headerRows, ['||*No.*||*ER*||*Case (Role)*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||']);
  assert.ok(!/Test cases run/.test(body), 'the separate case table is still rendered');
  const task = multiCaseManifest();
  task.ticketType = 'Task';
  assert.ok(RENDER.render(task).includes('||*No.*||*AC*||*Case (Role)*||'), 'a Task table must head column 2 AC');
});

check('rule 3: the Case cell lists every covering case as "• id title (role)" joined by the wiki line break', () => {
  const body = RENDER.render(multiCaseManifest());
  const row = body.split('\n').find((l) => l.startsWith('|1|'));
  const cells = R.splitWikiCells(row).cells;
  assert.strictEqual(cells[1], 'ER1');
  assert.strictEqual(cells[2],
    '• TC_01 modal button labels (CONTENT_ADMIN) \\\\ • TC_03 narrow width keeps the label (VIEWER)');
  assert.strictEqual(cells[4], '• reads "Review Failed" \\\\ • stays on one line at 390 px', 'multi-point actual result not bulleted');
  const row2 = R.splitWikiCells(body.split('\n').find((l) => l.startsWith('|2|'))).cells;
  assert.strictEqual(row2[2], '• TC_02 queue badge survives the modal (CONTENT_ADMIN)');
  const found = errorsOnly(R.scanBody(body, { format: R.FORMATS.WIKI, bugType: 'FE', ticketType: 'Bug' }));
  assert.deepStrictEqual(found, [], JSON.stringify(found.map((f) => f.rule + '@' + f.line)));
});

check('rule 3: the API (v3) body is one six-column table without Evidence', () => {
  const body = RENDER.render(apiFailed());
  const header = body.split('\n').find((l) => l.startsWith('| **No.**'));
  assert.strictEqual(header, '| **No.** | **ER** | **Case (Role)** | **Expected Result** | **Actual Result** | **Status** |');
  assert.strictEqual(R.findTables(body, R.FORMATS.ADF).length, 1);
});

check('rule 4: the coverage lines stay after the table', () => {
  const lines = RENDER.render(multiCaseManifest()).split('\n');
  const lastRow = lines.map((l, i) => (l.startsWith('|') ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const cov = lines.findIndex((l) => l.startsWith('*Expected-result coverage:*'));
  const cc = lines.findIndex((l) => l.startsWith('*Case coverage:*'));
  assert.ok(cov > lastRow && cc > cov, `coverage at ${cov}/${cc}, last table row at ${lastRow}`);
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
