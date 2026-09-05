#!/usr/bin/env node
'use strict';
/* Pins the manifest: scope arithmetic, coverage, and the verdict the rows support.
 *
 * The case that has no home in prose is the scoped one — "retest only TC_03". Under
 * the old rules the coverage gate compared against the whole contract, so a
 * legitimate partial retest could only be done by breaking the gate or by quietly
 * widening what the user asked for. Here scope is a field and the denominator
 * follows it, so a partial round is honest instead of impossible.
 *
 *   node tools/retest-guard/retest_manifest.test.js
 */
const assert = require('assert');
const M = require('./retest_manifest');

function base() {
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
    testStep: 'open the review action',
    expectedVerbatim: 'button reads "Review Failed" and the badge stays',
    contract: [
      { id: 'ER1', text: 'button reads "Review Failed"' },
      { id: 'ER2', text: 'queue row keeps its flagged badge' },
      { id: 'ER3', text: 'the list refreshes after the modal closes' },
    ],
    cases: [
      { id: 'TC_01', title: 'modal button labels', covers: ['ER1'], role: 'CONTENT_ADMIN', status: 'PASSED' },
      { id: 'TC_02', title: 'queue badge and refresh', covers: ['ER2', 'ER3'], role: 'CONTENT_ADMIN', status: 'PASSED' },
    ],
    results: [
      { id: 'ER1', actual: 'reads "Review Failed"', evidence: ['PROJ-88_TC_01_CONTENT_ADMIN.mp4', 'TC_01_CONTENT_ADMIN-ER_1.png'], status: 'PASSED' },
      { id: 'ER2', actual: 'badge present', evidence: ['PROJ-88_TC_02_CONTENT_ADMIN.mp4'], status: 'PASSED' },
      { id: 'ER3', actual: 'list refreshed', evidence: ['PROJ-88_TC_02_CONTENT_ADMIN.mp4'], status: 'PASSED' },
    ],
    verdict: 'PASSED',
  };
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('a complete FULL-scope manifest validates', () => {
  assert.deepStrictEqual(M.validate(base()), []);
});

check('FULL scope covers every contract id', () => {
  assert.deepStrictEqual(M.inScopeIds(base()), ['ER1', 'ER2', 'ER3']);
  assert.deepStrictEqual(M.outOfScopeIds(base()), []);
});

check('CASES scope narrows the denominator to what those cases cover', () => {
  const m = base();
  m.scope = { mode: 'CASES', cases: ['TC_01'] };
  assert.deepStrictEqual(M.inScopeIds(m), ['ER1']);
  assert.deepStrictEqual(M.outOfScopeIds(m), ['ER2', 'ER3']);
  assert.deepStrictEqual(M.coverage(m), { n: 1, total: 1 });
  assert.strictEqual(M.verdictLine(m), 'PASSED (scoped: TC_01)');
  assert.deepStrictEqual(M.validate(m), []);
});

check('a scoped round still refuses to drop an item it does cover', () => {
  const m = base();
  m.scope = { mode: 'CASES', cases: ['TC_02'] };
  m.results = m.results.filter((r) => r.id !== 'ER3');   // covered by TC_02, not recorded
  const f = M.validate(m);
  assert.ok(f.some((x) => /ER3/.test(x.message)), JSON.stringify(f));
});

check('an unrecorded in-scope item makes the round INCOMPLETE, not PASSED', () => {
  const m = base();
  m.results = m.results.slice(0, 2);
  assert.strictEqual(M.computedVerdict(m), 'INCOMPLETE');
  assert.ok(M.validate(m).some((f) => f.field === 'verdict'));
});

check('one differing item makes the round FAILED however the manifest labels it', () => {
  const m = base();
  m.results[1].status = 'FAILED';
  assert.strictEqual(M.computedVerdict(m), 'FAILED');
  const f = M.validate(m);
  assert.ok(f.some((x) => x.field === 'verdict' && /results say FAILED/.test(x.message)), JSON.stringify(f));
});

check('a BLOCKED item is a coverage gap, and never a PASS', () => {
  const m = base();
  m.results[2].status = 'BLOCKED';
  m.verdict = 'FAILED';
  assert.strictEqual(M.computedVerdict(m), 'FAILED');
});

check('a passing FE row with no evidence is refused', () => {
  const m = base();
  m.results[0].evidence = [];
  assert.ok(M.validate(m).some((f) => /evidence/.test(f.field)));
});

check('a case covering an id that is not in the contract is refused', () => {
  const m = base();
  m.cases[0].covers = ['ER9'];
  assert.ok(M.validate(m).some((f) => /covers unknown contract id/.test(f.message)));
});

check('a scope naming a case that does not exist is refused', () => {
  const m = base();
  m.scope = { mode: 'CASES', cases: ['TC_99'] };
  assert.ok(M.validate(m).some((f) => f.field === 'scope.cases'));
});

check('a case with no role is refused (a role named is a role recorded)', () => {
  const m = base();
  delete m.cases[0].role;
  assert.ok(M.validate(m).some((f) => /cases\[0\]\.role/.test(f.field)));
});

check('a UI retest with no design reference is refused', () => {
  const m = base();
  delete m.designRef;
  assert.ok(M.validate(m).some((f) => f.field === 'designRef'));
});

check('a non-PASSED round must carry a labelled cause, two options, an owner and the symptom line', () => {
  const m = base();
  m.results[0].status = 'FAILED';
  m.verdict = 'FAILED';
  const fields = M.validate(m).map((f) => f.field);
  ['rootCause.text', 'rootCause.label', 'resolutionOptions', 'decidedBy', 'symptomGone']
    .forEach((k) => assert.ok(fields.includes(k), 'missing check for ' + k));
});

check('a hedge cannot be used as the cause label', () => {
  const m = base();
  m.results[0].status = 'FAILED';
  m.verdict = 'FAILED';
  m.rootCause = { text: 'the list refreshes late', label: 'probably' };
  m.resolutionOptions = [{ text: 'a', owner: 'dev' }, { text: 'b', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  m.symptomGone = false;
  assert.ok(M.validate(m).some((f) => f.field === 'rootCause.label'));
});


check('a scope whose cases cover nothing verifies nothing — never a PASS', () => {
  const m = base();
  m.cases.push({ id: 'TC_09', title: 'placeholder', covers: [], role: 'CONTENT_ADMIN', status: 'BLOCKED' });
  m.scope = { mode: 'CASES', cases: ['TC_09'] };
  assert.deepStrictEqual(M.inScopeIds(m), []);
  assert.strictEqual(M.computedVerdict(m), 'INCOMPLETE');
  assert.ok(M.validate(m).some((f) => /verify nothing/.test(f.message)), 'no explicit finding for an empty scope');
});

check('a scope naming an unknown case cannot render a confident PASSED over 0 / 0', () => {
  const m = base();
  m.scope = { mode: 'CASES', cases: ['TC_99'] };
  assert.strictEqual(M.computedVerdict(m), 'INCOMPLETE');
});


check('a duplicate id is refused everywhere it can appear', () => {
  ['contract', 'cases', 'results'].forEach((key) => {
    const m = base();
    m[key] = m[key].concat([JSON.parse(JSON.stringify(m[key][0]))]);   // same id, same status
    const f = M.validate(m);
    assert.ok(f.some((x) => x.field === key && /duplicate id/.test(x.message)),
      key + ': a duplicate id passed validation — ' + JSON.stringify(f.map((y) => y.field)));
  });
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
