#!/usr/bin/env node
'use strict';

/**
 * Tests for the result quality gate checker (references/result-quality-gate.md).
 *
 * Synthetic fixtures only (DEMO-n, Tester roles) — this repo is public. Every rule has
 * a known-answer pair: one input it must flag, one it must not. The last cases write
 * real files and run the CLI, because a suite fed only in-memory objects never touches
 * the code that reads files (post-mortem #0002). Counts what it ran and refuses on zero.
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const G = require('./check.js');
const CLI = path.join(__dirname, 'check.js');

const tests = [];
function t(name, fn) {
  tests.push([name, fn]);
}

/** A PASSED line that satisfies every rule; tests override one field at a time. */
function line(over = {}) {
  return {
    key: 'DEMO-1',
    tc: 'TC_01',
    verdict: 'PASSED',
    actual: 'The list shows 3 items in the order the AC names.',
    evidence: ['DEMO-1_TC_01.mp4'],
    clip_verified: true,
    root_cause: '',
    er_issue: '',
    role: 'learner',
    env: 'dev',
    skill: 'testing-ticket-workflow',
    ts: '2026-10-11T09:00:00+07:00',
    ...over,
  };
}

/** Sources a BLOCKED/FAILED line must quote (layer 15). */
const REFS = { code_refs: ['src/pages/detail.tsx:42'], ticket_refs: ['DEMO-1#c1001'] };

/** What a FAILED line must carry to become a defect candidate (layer 17). */
const DEFECT = {
  requirement_source: 'DEMO-1 AC_3',
  requirement_quote: 'The list shows the newest item first.',
  evidence: ['DEMO-1_TC_01.mp4', 'DEMO-1_TC_01-ER_1.png'],
  clip_verified: true,
};

function rules(lines, opts) {
  return G.checkResults(lines, opts).violations.map((v) => v.rule);
}

/* ------------------------------------------------------------- baseline */

t('a fully-formed PASSED line has no violations', () => {
  assert.deepStrictEqual(rules([line()]), []);
});

t('zero result lines is refused, never reported as green', () => {
  const r = G.checkResults([], {});
  assert.strictEqual(r.checked, 0);
  assert.ok(r.violations.some((v) => v.rule === 'NO_RESULTS'));
});

/* ---------------------------------------------------------------- schema */

t('missing key/tc/verdict/ts is a SCHEMA violation', () => {
  for (const f of ['key', 'tc', 'verdict', 'ts']) {
    const l = line();
    delete l[f];
    assert.ok(rules([l]).includes('SCHEMA'), 'expected SCHEMA when ' + f + ' is missing');
  }
});

t('an unknown verdict word is a SCHEMA violation', () => {
  assert.ok(rules([line({ verdict: 'PASS' })]).includes('SCHEMA'));
  assert.ok(rules([line({ verdict: 'SKIPPED' })]).includes('SCHEMA'));
});

t('an unparseable ts is a SCHEMA violation', () => {
  assert.ok(rules([line({ ts: 'yesterday' })]).includes('SCHEMA'));
});

t('missing role or env is flagged (a result nobody can place is not checkable)', () => {
  assert.ok(rules([line({ role: '' })]).includes('ROLE_MISSING'));
  assert.ok(rules([line({ env: undefined })]).includes('ENV_MISSING'));
});

/* -------------------------------------------------------------- PASSED */

t('PASSED without evidence is flagged', () => {
  assert.ok(rules([line({ evidence: [] })]).includes('PASS_NO_EVIDENCE'));
  assert.ok(rules([line({ evidence: undefined })]).includes('PASS_NO_EVIDENCE'));
});

t('PASSED with screenshots only and no verified clip is flagged', () => {
  const r = rules([line({ evidence: ['TC_01-ER_1.png'], clip_verified: false })]);
  assert.ok(r.includes('PASS_CLIP_UNVERIFIED'));
});

t('PASSED whose clip failed the verifier (marker absent) is flagged', () => {
  const l = line();
  delete l.clip_verified;
  assert.ok(rules([l]).includes('PASS_CLIP_UNVERIFIED'));
});

t('an API-mode PASSED needs api_verified instead of a clip', () => {
  const ok = line({ evidence_mode: 'api', clip_verified: undefined, api_verified: true, evidence: ['curl+response.txt'] });
  assert.deepStrictEqual(rules([ok]), []);
  const bad = line({ evidence_mode: 'api', clip_verified: undefined, evidence: ['curl+response.txt'] });
  assert.ok(rules([bad]).includes('PASS_CLIP_UNVERIFIED'));
});

t('PASSED whose actual result hedges is flagged', () => {
  for (const w of ['caveat: footer not checked', 'not verifiable on this env', 'assumed correct', 'ยืนยันไม่ได้', 'ตรวจไม่ได้']) {
    assert.ok(rules([line({ actual: w })]).includes('PASS_HEDGED'), 'expected PASS_HEDGED for: ' + w);
  }
  assert.ok(!rules([line()]).includes('PASS_HEDGED'));
});

/* ----------------------------------------------------------- non-PASSED */

t('non-PASSED without root_cause is flagged', () => {
  const l = line({ verdict: 'PWMI', er_issue: 'ER_2 label typo (Low)', root_cause: '' });
  assert.ok(rules([l]).includes('NONPASS_NO_ROOT_CAUSE'));
  assert.ok(!rules([line({ verdict: 'PWMI', er_issue: 'ER_2', root_cause: 'copy string differs in FE source' })]).includes('NONPASS_NO_ROOT_CAUSE'));
});

t('non-PASSED without an actual result is flagged', () => {
  assert.ok(rules([line({ verdict: 'PWMI', er_issue: 'x', root_cause: 'y', actual: '' })]).includes('NONPASS_NO_ACTUAL'));
});

t('PWMI/FAILED without er_issue (which ER the defect breaks) is flagged', () => {
  assert.ok(rules([line({ verdict: 'PWMI', root_cause: 'y', er_issue: '' })]).includes('DEFECT_NO_ER_ISSUE'));
});

t('BLOCKED without remark or contact is flagged', () => {
  const base = { verdict: 'BLOCKED', root_cause: 'role cannot open the page (403)', clip_verified: undefined, ...REFS };
  assert.ok(rules([line({ ...base, remark: '', contact: 'PO' })]).includes('BLOCKED_NO_REMARK'));
  assert.ok(rules([line({ ...base, remark: 'needs a second admin account', contact: '' })]).includes('BLOCKED_NO_CONTACT'));
  assert.deepStrictEqual(rules([line({ ...base, remark: 'needs a second admin account', contact: 'PO' })]), []);
});

/* ----------------------------------------------------- FAILED repeatability */

function failed(over = {}) {
  return line({ verdict: 'FAILED', root_cause: 'API returns 500', er_issue: 'ER_1', ...REFS, ...DEFECT, ...over });
}

t('FAILED seen 1 of 4 times and not labelled intermittent is flagged', () => {
  assert.ok(rules([failed({ attempts: 4, failed_attempts: 1 })]).includes('FAILED_NOT_REPRODUCED'));
});

t('FAILED with fewer than 3 observations is flagged', () => {
  assert.ok(rules([failed({ attempts: 1, failed_attempts: 1 })]).includes('FAILED_NOT_REPRODUCED'));
  assert.ok(rules([failed()]).includes('FAILED_NOT_REPRODUCED'));
});

t('FAILED reproduced 3 of 3 passes', () => {
  assert.deepStrictEqual(rules([failed({ attempts: 3, failed_attempts: 3 })]), []);
});

t('FAILED labelled intermittent with counts passes; intermittent without counts does not', () => {
  assert.deepStrictEqual(rules([failed({ intermittent: true, attempts: 4, failed_attempts: 1 })]), []);
  assert.ok(rules([failed({ intermittent: true })]).includes('FAILED_NOT_REPRODUCED'));
});

/* ------------------------------------------------------- duplicates */

t('two final lines for one case with different verdicts are CONFLICT', () => {
  const r = rules([line(), line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', ts: '2026-10-11T10:00:00+07:00' })]);
  assert.ok(r.includes('CONFLICT'));
});

t('two identical final lines for one case are DUPLICATE', () => {
  assert.ok(rules([line(), line({ ts: '2026-10-11T10:00:00+07:00' })]).includes('DUPLICATE'));
});

t('a line marked superseded does not count as a final line', () => {
  const old = line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', superseded: true, ...REFS });
  assert.deepStrictEqual(rules([old, line()]), []);
});

t('the same tc under two different keys is not a duplicate', () => {
  assert.deepStrictEqual(rules([line(), line({ key: 'DEMO-2' })]), []);
});

/* ------------------------------------------------------- scope */

t('an in-scope case with no result line is MISSING_CASE', () => {
  const r = rules([line()], { cases: [{ key: 'DEMO-1', tc: 'TC_01' }, { key: 'DEMO-1', tc: 'TC_02' }] });
  assert.ok(r.includes('MISSING_CASE'));
});

t('a result for a case outside the provided list is OUT_OF_SCOPE', () => {
  assert.ok(rules([line({ tc: 'TC_99' })], { cases: [{ key: 'DEMO-1', tc: 'TC_01' }] }).includes('OUT_OF_SCOPE'));
});

t('a superseded line does not satisfy an in-scope case', () => {
  const r = rules([line({ superseded: true })], { cases: [{ key: 'DEMO-1', tc: 'TC_01' }] });
  assert.ok(r.includes('MISSING_CASE'));
});

/* ------------------------------------------------------- env */

t('a result on an env other than the ticket map says is ENV_MISMATCH', () => {
  assert.ok(rules([line({ env: 'training' })], { envMap: { 'DEMO-1': 'dev' } }).includes('ENV_MISMATCH'));
  assert.deepStrictEqual(rules([line()], { envMap: { 'DEMO-1': 'dev' } }), []);
});

t('env comparison ignores case and surrounding space', () => {
  assert.deepStrictEqual(rules([line({ env: ' DEV ' })], { envMap: { 'DEMO-1': 'dev' } }), []);
});

t('a ticket missing from a provided env map is ENV_UNMAPPED', () => {
  assert.ok(rules([line({ key: 'DEMO-7' })], { envMap: { 'DEMO-1': 'dev' } }).includes('ENV_UNMAPPED'));
});

/* ------------------------------------------------------- skill */

t('a Story tested without testing-ticket-workflow is SKILL_MISMATCH', () => {
  assert.ok(rules([line({ skill: 'retest-bug-workflow' })], { types: { 'DEMO-1': 'Story' } }).includes('SKILL_MISMATCH'));
});

t('a Bug must carry retest-bug-workflow', () => {
  assert.deepStrictEqual(rules([line({ skill: 'retest-bug-workflow' })], { types: { 'DEMO-1': 'Bug' } }), []);
  assert.ok(rules([line()], { types: { 'DEMO-1': 'Bug' } }).includes('SKILL_MISMATCH'));
});

t('a type with no confirmed mapping only needs a recorded skill', () => {
  assert.deepStrictEqual(rules([line({ skill: 'retest-bug-workflow' })], { types: { 'DEMO-1': 'Task' } }), []);
  assert.ok(rules([line({ skill: '' })], { types: { 'DEMO-1': 'Task' } }).includes('SKILL_MISSING'));
});

/* ------------------------------------------------- source sweep (layer 15) */

t('BLOCKED or FAILED without any code ref is NO_SOURCE_SWEEP', () => {
  const b = line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', ticket_refs: ['DEMO-1#c1'] });
  assert.ok(rules([b]).includes('NO_SOURCE_SWEEP'));
  const f = failed({ attempts: 3, failed_attempts: 3, code_refs: [] });
  assert.ok(rules([f]).includes('NO_SOURCE_SWEEP'));
});

t('BLOCKED or FAILED without any ticket ref is NO_SOURCE_SWEEP', () => {
  const b = line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', code_refs: ['src/a.ts:1'] });
  assert.ok(rules([b]).includes('NO_SOURCE_SWEEP'));
});

t('a code ref without a line number does not count', () => {
  const f = failed({ attempts: 3, failed_attempts: 3, code_refs: ['src/pages/detail.tsx'] });
  assert.ok(rules([f]).includes('NO_SOURCE_SWEEP'));
});

t('a ticket ref must look like a ticket key', () => {
  const f = failed({ attempts: 3, failed_attempts: 3, ticket_refs: ['the story'] });
  assert.ok(rules([f]).includes('NO_SOURCE_SWEEP'));
});

t('BLOCKED and FAILED with a code ref and a ticket ref pass the sweep rule', () => {
  assert.ok(!rules([failed({ attempts: 3, failed_attempts: 3 })]).includes('NO_SOURCE_SWEEP'));
  assert.ok(!rules([line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', ...REFS })]).includes('NO_SOURCE_SWEEP'));
});

t('PASSED and PWMI lines are not held to the sweep rule', () => {
  assert.ok(!rules([line()]).includes('NO_SOURCE_SWEEP'));
  assert.ok(!rules([line({ verdict: 'PWMI', root_cause: 'y', er_issue: 'ER_2' })]).includes('NO_SOURCE_SWEEP'));
});

/* ------------------------------------------- defect candidate (layer 17) */

t('FAILED without a requirement quote or its source is FAILED_NO_REQUIREMENT', () => {
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, requirement_quote: '' })]).includes('FAILED_NO_REQUIREMENT'));
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, requirement_source: '' })]).includes('FAILED_NO_REQUIREMENT'));
});

t('FAILED without a verified clip is FAILED_NO_VERIFIED_CLIP', () => {
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, clip_verified: false })]).includes('FAILED_NO_VERIFIED_CLIP'));
});

t('FAILED without a screenshot is FAILED_NO_SCREENSHOT', () => {
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, evidence: ['DEMO-1_TC_01.mp4'] })]).includes('FAILED_NO_SCREENSHOT'));
});

t('a fully-evidenced FAILED carries none of the defect-candidate rules', () => {
  const r = rules([failed({ attempts: 3, failed_attempts: 3 })]);
  for (const rule of ['FAILED_NO_REQUIREMENT', 'FAILED_NO_VERIFIED_CLIP', 'FAILED_NO_SCREENSHOT']) assert.ok(!r.includes(rule), rule);
});

t('BLOCKED is not held to the defect-candidate rules', () => {
  const r = rules([line({ verdict: 'BLOCKED', root_cause: 'x', remark: 'y', contact: 'PO', clip_verified: undefined, ...REFS })]);
  assert.ok(!r.some((x) => x.startsWith('FAILED_NO_')), r.join(','));
});

/* --------------------- motion/freeze-only verifier failure (owner rule 25/Sep) */

/** A clip whose only verifier failures are motion/freeze, with a reviewer record. */
const SOFT_OK = {
  clip_verified: false,
  verifier_failures: ['motion', 'freeze'],
  er_frames_confirmed: true,
  er_frames_reviewer: 'review-result round R1 TC_01',
};

t('PASSED: motion/freeze-only verifier failure + reviewer ER-frames confirmation is accepted', () => {
  assert.deepStrictEqual(rules([line(SOFT_OK)]), []);
  assert.deepStrictEqual(rules([line({ ...SOFT_OK, verifier_failures: ['low_motion', 'frozen_repeats', 'still_hold'] })]), []);
});

t('PASSED: motion-only failure without the reviewer confirmation is a violation', () => {
  assert.ok(rules([line({ ...SOFT_OK, er_frames_confirmed: false })]).includes('PASS_CLIP_UNVERIFIED'));
  assert.ok(rules([line({ ...SOFT_OK, er_frames_reviewer: '' })]).includes('PASS_CLIP_UNVERIFIED'));
});

t('PASSED: a manifest mismatch is a hard failure even with a reviewer confirmation', () => {
  const r = rules([line({ ...SOFT_OK, verifier_failures: ['motion', 'manifest_mismatch'] })]);
  assert.ok(r.includes('CLIP_HARD_FAILURE'));
  assert.ok(r.includes('PASS_CLIP_UNVERIFIED'));
});

t('missing manifest, resolution, env and account failures are hard; unknown names fail closed', () => {
  for (const f of ['manifest_missing', 'resolution', 'env', 'account', 'something_new']) {
    assert.ok(rules([line({ ...SOFT_OK, verifier_failures: [f] })]).includes('CLIP_HARD_FAILURE'), f);
  }
});

t('a hard failure listed beside clip_verified:true is still a violation', () => {
  assert.ok(rules([line({ verifier_failures: ['manifest_mismatch'] })]).includes('CLIP_HARD_FAILURE'));
});

t('FAILED: motion-only failure + reviewer confirmation is accepted; without it, a violation', () => {
  assert.ok(!rules([failed({ attempts: 3, failed_attempts: 3, ...SOFT_OK })]).includes('FAILED_NO_VERIFIED_CLIP'));
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, ...SOFT_OK, er_frames_confirmed: undefined })]).includes('FAILED_NO_VERIFIED_CLIP'));
  assert.ok(rules([failed({ attempts: 3, failed_attempts: 3, ...SOFT_OK, verifier_failures: ['manifest_mismatch'] })]).includes('CLIP_HARD_FAILURE'));
});

t('a soft failure carrying a measured suffix (still_hold_28pct, frozen_repeats_47pct) stays soft', () => {
  for (const f of ['still_hold_28pct', 'frozen_repeats_47pct', 'low_motion_3pct', 'still_hold_12.5pct', 'freeze_4']) {
    assert.deepStrictEqual(rules([line({ ...SOFT_OK, verifier_failures: [f] })]), [], f);
  }
});

t('a numeric suffix never softens a hard or unknown failure', () => {
  for (const f of ['manifest_mismatch', 'manifest_mismatch_2', 'resolution_720', 'something_new_10pct', 'still_hold_28pct_extra', 'pct']) {
    assert.ok(rules([line({ ...SOFT_OK, verifier_failures: [f] })]).includes('CLIP_HARD_FAILURE'), f);
  }
});

/* ------------------------------------- interim verdict + PWMI long form */

/** A line whose clip exists but whose review has not finished yet. */
function pending(over = {}) {
  return line({ verdict: 'EVIDENCE_PENDING', clip_verified: false, ...over });
}

/** A PWMI line that satisfies every rule. */
const PWMI = { root_cause: 'Label copy differs from the AC', er_issue: 'ER_2 label', actual: 'The label reads Save instead of Submit.' };

t('EVIDENCE_PENDING with a clip is accepted as an interim verdict', () => {
  assert.deepStrictEqual(rules([pending()]), []);
});

t('EVIDENCE_PENDING without any evidence is a violation (the clip must exist)', () => {
  assert.deepStrictEqual(rules([pending({ evidence: [] })]), ['PENDING_NO_EVIDENCE']);
  assert.deepStrictEqual(rules([pending({ evidence: [''] })]), ['PENDING_NO_EVIDENCE']);
});

t('EVIDENCE_PENDING is never counted as a pass', () => {
  const p = G.checkResults([pending()], {});
  assert.strictEqual(p.passed, 0);
  assert.strictEqual(p.pending, 1);
  const ok = G.checkResults([line()], {});
  assert.strictEqual(ok.passed, 1);
  assert.strictEqual(ok.pending, 0);
});

t('EVIDENCE_PENDING does not close an in-scope case; PASSED does', () => {
  const cases = [{ key: 'DEMO-1', tc: 'TC_01' }];
  assert.deepStrictEqual(rules([pending()], { cases }), ['CASE_PENDING']);
  assert.deepStrictEqual(rules([line()], { cases }), []);
});

t('an unknown verdict is still a SCHEMA violation', () => {
  for (const v of ['PASS', 'PENDING', 'evidence pending', 'PASSED WITH MINOR ISSUES', 'SKIPPED']) {
    assert.ok(rules([line({ verdict: v })]).includes('SCHEMA'), 'expected SCHEMA for ' + v);
  }
});

t('"PASSED WITH MINOR ISSUE" is the long form of PWMI and gets the PWMI rules', () => {
  assert.deepStrictEqual(rules([line({ verdict: 'PASSED WITH MINOR ISSUE', ...PWMI })]), []);
  assert.deepStrictEqual(rules([line({ verdict: 'PASSED WITH MINOR ISSUE', ...PWMI, er_issue: '' })]), ['DEFECT_NO_ER_ISSUE']);
  assert.strictEqual(G.checkResults([line({ verdict: 'PASSED WITH MINOR ISSUE', ...PWMI })], {}).passed, 0);
});

t('a pending line kept for history is marked superseded:true; unmarked it is a CONFLICT', () => {
  const old = pending({ ts: '2026-10-11T08:00:00+07:00' });
  assert.deepStrictEqual(rules([{ ...old, superseded: true }, line()]), []);
  assert.deepStrictEqual(rules([old, line()]), ['CONFLICT']);
  assert.deepStrictEqual(rules([{ ...old, superseded: 'true' }, line()]), ['CONFLICT']);
});

t('CLI: the summary line counts passes and pending lines separately', () => {
  const d = tmpdir();
  const f = path.join(d, 'r.jsonl');
  fs.writeFileSync(f, [line(), pending({ tc: 'TC_02' })].map((l) => JSON.stringify(l)).join('\n') + '\n');
  const r = run(['--results', f]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 passed, 1 evidence-pending \(not a pass\)/);
});

/* ------------------------------------------------------- parsing + CLI */

t('parseJsonl reports the line number of a broken line instead of dropping it', () => {
  const p = G.parseJsonl('{"key":"DEMO-1"}\nnot json\n\n');
  assert.strictEqual(p.lines.length, 1);
  assert.strictEqual(p.errors.length, 1);
  assert.strictEqual(p.errors[0].lineNo, 2);
});

t('loadCases accepts both [{key,tc}] and {key:[tc]}', () => {
  assert.deepStrictEqual(G.normalizeCases({ 'DEMO-1': ['TC_01'] }), [{ key: 'DEMO-1', tc: 'TC_01' }]);
  assert.deepStrictEqual(G.normalizeCases([{ key: 'DEMO-1', tc: 'TC_01' }]), [{ key: 'DEMO-1', tc: 'TC_01' }]);
});

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'result-gate-'));
}

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}

t('CLI: a clean results file on disk exits 0 and prints how many lines it checked', () => {
  const d = tmpdir();
  const f = path.join(d, 'r.jsonl');
  fs.writeFileSync(f, JSON.stringify(line()) + '\n' + JSON.stringify(line({ tc: 'TC_02', evidence: ['DEMO-1_TC_02.mp4'] })) + '\n');
  const r = run(['--results', f]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /2 result line\(s\) checked/);
});

t('CLI: violations on disk exit 1 and name rule, key and tc', () => {
  const d = tmpdir();
  const f = path.join(d, 'r.jsonl');
  const c = path.join(d, 'cases.json');
  const e = path.join(d, 'env.json');
  const ty = path.join(d, 'types.json');
  fs.writeFileSync(f, JSON.stringify(line({ evidence: [], env: 'training' })) + '\n');
  fs.writeFileSync(c, JSON.stringify({ 'DEMO-1': ['TC_01', 'TC_02'] }));
  fs.writeFileSync(e, JSON.stringify({ 'DEMO-1': 'dev' }));
  fs.writeFileSync(ty, JSON.stringify({ 'DEMO-1': 'Bug' }));
  const r = run(['--results', f, '--cases', c, '--env-map', e, '--types', ty]);
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  for (const rule of ['PASS_NO_EVIDENCE', 'ENV_MISMATCH', 'MISSING_CASE', 'SKILL_MISMATCH']) {
    assert.match(r.stdout, new RegExp(rule + ' DEMO-1'), 'missing ' + rule + ' in:\n' + r.stdout);
  }
});

t('CLI: an empty results file exits 2 (nothing measured is not green)', () => {
  const d = tmpdir();
  const f = path.join(d, 'r.jsonl');
  fs.writeFileSync(f, '\n');
  assert.strictEqual(run(['--results', f]).status, 2);
});

t('CLI: a missing results file or missing flag exits 2', () => {
  assert.strictEqual(run(['--results', path.join(tmpdir(), 'nope.jsonl')]).status, 2);
  assert.strictEqual(run([]).status, 2);
});

t('CLI: an unparseable line exits 1 with its line number', () => {
  const d = tmpdir();
  const f = path.join(d, 'r.jsonl');
  fs.writeFileSync(f, JSON.stringify(line()) + '\n{broken\n');
  const r = run(['--results', f]);
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /PARSE line 2/);
});

/* ------------------------------------------------------------------ run */

let failedCount = 0;
let ran = 0;
for (const [name, fn] of tests) {
  ran += 1;
  try {
    fn();
    console.log('PASS ' + name);
  } catch (err) {
    failedCount += 1;
    console.log('FAIL ' + name);
    console.log('       ' + (err && err.message ? err.message : String(err)));
  }
}

if (ran === 0) {
  console.error('check.test.js: ran 0 tests — refusing');
  process.exit(2);
}
console.log('\n' + (failedCount ? failedCount + ' failed' : 'all green') + ' — ' + ran + ' test(s) ran');
process.exit(failedCount ? 1 : 0);
