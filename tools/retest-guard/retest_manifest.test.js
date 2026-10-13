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
    lanes: [{ id: 'L1', account: 'admin01', cases: ['TC_01', 'TC_02'], lease: true }],
    serialReason: 'two-or-fewer-scenarios',
    testRunTime: { minutes: 25.3, hasVideo: true, method: 'evidence-burst-v1' },
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
  // The property this case exists for is the one in its title: an item nobody could reach
  // must never be counted as verified. It used to assert the specific value FAILED, which
  // was the behaviour of the day rather than the property — and that value was itself the
  // defect (announcing a defect in a case the round never touched). BLOCKED keeps the
  // property and states the truth; the assertion is written both ways so a future change
  // back to "PASSED" fails on the property, not merely on the string.
  const m = base();
  m.results[2].status = 'BLOCKED';
  const v = M.computedVerdict(m);
  assert.notStrictEqual(v, 'PASSED', 'an unreachable item was counted as verified');
  assert.strictEqual(v, 'BLOCKED');
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


check('a fully BLOCKED round reports BLOCKED — not a defect that was never observed', () => {
  const m = base();
  m.results.forEach((r) => { r.status = 'BLOCKED'; });
  m.cases.forEach((c) => { c.status = 'BLOCKED'; });
  m.verdict = 'BLOCKED';
  m.symptomGone = false;
  m.rootCause = { text: 'the fixture could not be created in this environment', label: 'Unknown — not investigated' };
  m.resolutionOptions = [{ text: 'provide the fixture', owner: 'dev' }, { text: 'descope the round', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  assert.strictEqual(M.computedVerdict(m), 'BLOCKED');
  assert.deepStrictEqual(M.validate(m), []);
});

check('a PARTLY blocked round reports BLOCKED — the unreached cases are not a defect either', () => {
  // The ladder had a branch for "every row BLOCKED" and none for "some rows BLOCKED", so a
  // round that verified two cases and could not reach a third fell through to the terminal
  // `return 'FAILED'`. That announces a defect in cases the round never touched, which is
  // the exact thing the comment above the ladder says must not happen — and, per the OLS
  // rules, routes the ticket to In Progress for a dev fix that has nothing to fix.
  const m = base();
  m.results[0].status = 'BLOCKED';
  m.cases[0].status = 'BLOCKED';
  assert.strictEqual(M.computedVerdict(m), 'BLOCKED');
});

check('a defect still outranks an unreached case', () => {
  // BLOCKED must not swallow a real finding: if something failed, the round failed.
  const m1 = base();
  m1.results[0].status = 'BLOCKED';
  m1.results[1].status = 'FAILED';
  assert.strictEqual(M.computedVerdict(m1), 'FAILED');

  const m2 = base();
  m2.results[0].status = 'BLOCKED';
  m2.results[1].status = 'PWMI';
  assert.strictEqual(M.computedVerdict(m2), 'PWMI');
});

check('a status the module does not know is INCOMPLETE, never FAILED', () => {
  // "I cannot judge this" and "a defect was found" are different answers. The terminal
  // fallback returned FAILED, so a typo in a status would have been published as a defect.
  const m = base();
  m.results[0].status = 'SKIPPED';        // not in STATUSES — validate() rejects it too
  assert.strictEqual(M.computedVerdict(m), 'INCOMPLETE');
  assert.ok(M.validate(m).some((f) => /status must be one of/.test(f.message)),
    'an unknown status was accepted by validate()');
});

check('a round whose worst row is PWMI reports PWMI, not FAILED', () => {
  const m = base();
  m.results[0].status = 'PWMI';
  m.cases[0].status = 'PWMI';
  m.verdict = 'PWMI';
  m.symptomGone = true;
  m.rootCause = { text: 'the label wraps at 320 px', label: 'Confirmed' };
  m.resolutionOptions = [{ text: 'fix the wrap', owner: 'dev' }, { text: 'accept it', owner: 'spec owner' }];
  m.decidedBy = 'spec owner';
  assert.strictEqual(M.computedVerdict(m), 'PWMI');
  assert.deepStrictEqual(M.validate(m), []);
});

check('one FAILED row outranks a PWMI row', () => {
  const m = base();
  m.results[0].status = 'PWMI';
  m.results[1].status = 'FAILED';
  assert.strictEqual(M.computedVerdict(m), 'FAILED');
});

check('a destination that cannot hold the real status produces a question, never a mapping', () => {
  const q = M.destinationMismatch(['BLOCKED', 'PASSED'], ['PASSED', 'FAILED', 'SKIPPED']);
  assert.deepStrictEqual(q.missing, ['BLOCKED']);
  assert.ok(/BLOCKED/.test(q.question) && /PASSED \/ FAILED \/ SKIPPED/.test(q.question),
    'the question must show both the real status and what the destination offers');
  assert.strictEqual(M.destinationMismatch(['PASSED'], ['PASSED', 'FAILED']), null);
});

check('the usage marker is optional — a manifest without it still validates', () => {
  const m = base();
  assert.strictEqual(m.marker, undefined);
  assert.deepStrictEqual(M.validate(m), []);
});

check('a known marker validates; a partial one takes the defaults for the rest', () => {
  const m = base();
  m.marker = { src: 'helix', via: 'helix-menu', agent: 'claude-code' };
  assert.deepStrictEqual(M.validate(m), []);
  m.marker = { agent: 'unknown' };
  assert.deepStrictEqual(M.validate(m), []);
});

check('an unknown marker value is refused, field by field', () => {
  const m = base();
  m.marker = { src: 'somewhere', via: 'chat', agent: 'gpt' };
  const fields = M.validate(m).map((f) => f.field).sort();
  assert.deepStrictEqual(fields, ['marker.agent', 'marker.src', 'marker.via']);
  m.marker = 'helix';
  assert.deepStrictEqual(M.validate(m).map((f) => f.field), ['marker']);
});

// ---- lanes (references/parallel-test-lanes.md §1, §3, §4) — owner-approved 2026-10-13 ----

function threeCases() {
  const m = base();
  m.cases.push({ id: 'TC_03', title: 'refresh after close', covers: ['ER3'], role: 'CONTENT_ADMIN', status: 'PASSED' });
  m.lanes = [
    { id: 'L1', account: 'admin01', cases: ['TC_01', 'TC_03'], lease: true },
    { id: 'L2', account: 'admin02', cases: ['TC_02'], lease: true },
  ];
  delete m.serialReason;
  return m;
}
const laneFields = (m) => M.validate(m).map((f) => f.field);

check('lanes: a missing lanes field is a validation error', () => {
  const m = base();
  delete m.lanes;
  assert.ok(laneFields(m).includes('lanes'), JSON.stringify(M.validate(m)));
});

check('lanes: two lanes covering every case once, each leased, validate', () => {
  assert.deepStrictEqual(M.validate(threeCases()), []);
});

check('lanes: a case in no lane is refused', () => {
  const m = threeCases();
  m.lanes[0].cases = ['TC_01'];
  assert.ok(M.validate(m).some((f) => f.field === 'lanes' && /TC_03/.test(f.message)));
});

check('lanes: a case in two lanes is refused', () => {
  const m = threeCases();
  m.lanes[1].cases = ['TC_02', 'TC_03'];
  assert.ok(M.validate(m).some((f) => f.field === 'lanes' && /TC_03/.test(f.message) && /2 lanes/.test(f.message)));
});

check('lanes: a lane naming a case that does not exist is refused', () => {
  const m = threeCases();
  m.lanes[1].cases = ['TC_02', 'TC_99'];
  assert.ok(M.validate(m).some((f) => /lanes\[1\]\.cases/.test(f.field) && /TC_99/.test(f.message)));
});

check('lanes: lease must be literally true', () => {
  const m = threeCases();
  m.lanes[1].lease = 'yes';
  assert.ok(laneFields(m).includes('lanes[1].lease'));
  delete m.lanes[1].lease;
  assert.ok(laneFields(m).includes('lanes[1].lease'));
});

check('lanes: one account leased to two lanes is refused (§3)', () => {
  const m = threeCases();
  m.lanes[1].account = 'admin01';
  assert.ok(M.validate(m).some((f) => f.field === 'lanes' && /admin01/.test(f.message)));
});

check('lanes: a multi-role lane may hold an account list', () => {
  const m = threeCases();
  m.lanes[0].account = ['admin01', 'learner03'];
  assert.deepStrictEqual(M.validate(m), []);
});

check('lanes: 3 cases in 1 lane without serialReason is refused', () => {
  const m = threeCases();
  m.lanes = [{ id: 'L1', account: 'admin01', cases: ['TC_01', 'TC_02', 'TC_03'], lease: true }];
  assert.ok(laneFields(m).includes('serialReason'));
});

check('lanes: serialReason must be a §4 predicate', () => {
  const m = threeCases();
  m.lanes = [{ id: 'L1', account: 'admin01', cases: ['TC_01', 'TC_02', 'TC_03'], lease: true }];
  m.serialReason = 'faster to do it myself';
  assert.ok(laneFields(m).includes('serialReason'));
  M.SERIAL_REASONS.filter((r) => r !== 'two-or-fewer-scenarios').forEach((r) => {
    m.serialReason = r;
    assert.deepStrictEqual(M.validate(m), [], r);
  });
});

check('lanes: the §4 list is exactly predicates a–e', () => {
  assert.deepStrictEqual(M.SERIAL_REASONS, [
    'one-account', 'shared-record', 'env-forbids-concurrency', 'two-or-fewer-scenarios', 'user-asked-serial',
  ]);
});

check('lanes: "two-or-fewer-scenarios" is refused when the round has 3 cases', () => {
  const m = threeCases();
  m.lanes = [{ id: 'L1', account: 'admin01', cases: ['TC_01', 'TC_02', 'TC_03'], lease: true }];
  m.serialReason = 'two-or-fewer-scenarios';
  assert.ok(M.validate(m).some((f) => f.field === 'serialReason' && /3/.test(f.message)));
});

check('lanes: a 1-case round needs no serialReason', () => {
  const m = base();
  m.cases = [m.cases[0]];
  m.cases[0].covers = ['ER1', 'ER2', 'ER3'];
  m.lanes = [{ id: 'L1', account: 'admin01', cases: ['TC_01'], lease: true }];
  delete m.serialReason;
  assert.deepStrictEqual(M.validate(m), []);
});

check('lanes: a scoped round needs only its in-scope cases laned', () => {
  const m = threeCases();
  m.scope = { mode: 'CASES', cases: ['TC_01'] };
  m.lanes = [{ id: 'L1', account: 'admin01', cases: ['TC_01'], lease: true }];
  assert.deepStrictEqual(M.validate(m), []);
});

check('testRunTime: missing is a validation error', () => {
  const m = base(); delete m.testRunTime;
  assert.ok(M.validate(m).some((f) => f.field === 'testRunTime'));
});

check('testRunTime: minutes must be a positive number (0 is not a measurement)', () => {
  [0, -1, '25', null, NaN].forEach((v) => {
    const m = base(); m.testRunTime.minutes = v;
    assert.ok(M.validate(m).some((f) => f.field === 'testRunTime.minutes'), 'accepted ' + String(v));
  });
});

check('testRunTime: hasVideo must be a boolean', () => {
  const m = base(); m.testRunTime.hasVideo = 'yes';
  assert.ok(M.validate(m).some((f) => f.field === 'testRunTime.hasVideo'));
});

check('testRunTime: method must equal the measure tool id', () => {
  const m = base(); m.testRunTime.method = 'estimate';
  assert.ok(M.validate(m).some((f) => f.field === 'testRunTime.method'));
  assert.strictEqual(require('../run-time/measure').METHOD, 'evidence-burst-v1');
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
