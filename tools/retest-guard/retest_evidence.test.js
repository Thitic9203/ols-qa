#!/usr/bin/env node
'use strict';
/* Pre-review evidence checks (spec docs/sdd/test-time-cut-guard/spec.md R1–R6).
 *
 * Each class the step-6c reviewer used to catch by eye gets a known-answer pair:
 * one input that must be flagged, one that must pass. A check that has not been
 * shown to find a known case is not trusted to clear one.
 *
 *   node tools/retest-guard/retest_evidence.test.js
 */
const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const R = require('./retest_rules');
const E = require('./retest_evidence');

const GUARD = path.join(__dirname, 'retest_guard.js');
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
function mkdir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'retest-evidence-')); }
function put(dir, name, content) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2));
  return p;
}
/** Signature + IHDR chunk — all a width read needs. */
function png(width, height = 100) {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}
const rules = (fs_) => fs_.map((f) => f.rule);

function manifest(over = {}) {
  return Object.assign({
    role: ['Learner', 'Content Admin'],
    cases: [
      { id: 'TC_01', role: 'Learner', covers: ['ER1'] },
      { id: 'TC_02', role: 'Content Admin', covers: ['ER1'] },
      { id: 'TC_03', role: 'Learner, Content Admin', covers: ['ER1'] },
    ],
    results: [{ id: 'ER1', actual: 'heading shown', evidence: ['TC_01.mp4'], status: 'PASSED' }],
  }, over);
}

/* ---------------- R5 inline image width ---------------- */

check('R5 pngWidth reads the IHDR width, and refuses a non-PNG', () => {
  assert.strictEqual(R.pngWidth(png(1280)), 1280);
  assert.strictEqual(R.pngWidth(Buffer.from('not a png at all, really not')), null);
});

check('R5 must flag: a 1280 px PNG embedded inline', () => {
  const d = mkdir();
  put(d, 'TC_01-ER_02.png', png(1280));
  const f = E.checkInlineImages('|1|ER1|x|y|z|!TC_01-ER_02.png!|PASSED|', d);
  assert.deepStrictEqual(rules(f), ['inline-image-too-wide']);
});

check('R5 must pass: a 640 px PNG embedded inline', () => {
  const d = mkdir();
  put(d, 'TC_01-ER_02-640.png', png(640));
  assert.deepStrictEqual(E.checkInlineImages('|1|!TC_01-ER_02-640.png!|', d), []);
});

check('R5 unchecked: inline image not found in the evidence dir', () => {
  const f = E.checkInlineImages('!missing.png!', mkdir());
  assert.deepStrictEqual(rules(f), ['inline-image-unchecked']);
  assert.strictEqual(f[0].severity, 'unchecked');
});

/* ---------------- R1 width claims ---------------- */

check('R1 widthClaims reads every width in a px list', () => {
  assert.deepStrictEqual(R.widthClaims('at 1440 / 820 / 390 px the bar wraps; at 1920px too'), [1440, 820, 390, 1920]);
  assert.deepStrictEqual(R.widthClaims('screen 1920 shows it'), []);
});

check('R1 widthsBackedByName: separator-delimited and w-prefixed, not the resize suffix', () => {
  assert.deepStrictEqual(R.widthsBackedByName('TC_03-390-learner.png'), [390]);
  assert.deepStrictEqual(R.widthsBackedByName('TC_03-ER_01_w375.png'), [375]);
  assert.deepStrictEqual(R.widthsBackedByName('TC_01-ER_02-640.png'), []);
});

check('R1 must flag: claims 1440 / 390 px with only a 390 file', () => {
  const d = mkdir();
  const m = manifest({ results: [{ id: 'ER1', actual: 'bar below progress at 1440 / 390 px', evidence: ['TC_03-390-learner.png'], status: 'PASSED' }] });
  const f = E.checkWidthClaims(m, d);
  assert.deepStrictEqual(rules(f), ['width-claim-without-evidence']);
  assert.ok(/1440/.test(f[0].message));
});

check('R1 must pass: a sibling capture.json carries the 1440 viewport', () => {
  const d = mkdir();
  put(d, 'TC_03.capture.json', { viewport: { width: 1440, height: 900 } });
  const m = manifest({ results: [{ id: 'ER1', actual: 'bar below progress at 1440 / 390 px', evidence: ['TC_03.mp4', 'TC_03-390-learner.png'], status: 'PASSED' }] });
  assert.deepStrictEqual(E.checkWidthClaims(m, d), []);
});

check('R1 unchecked: an unbacked claim with no evidence dir to read', () => {
  const m = manifest({ results: [{ id: 'ER1', actual: 'at 1440 px', evidence: ['TC_03.mp4'], status: 'PASSED' }] });
  assert.deepStrictEqual(rules(E.checkWidthClaims(m, null)), ['width-claim-unchecked']);
});

/* ---------------- R2 role claims ---------------- */

check('R2 roleClaims: a shorter role inside a longer match is not a separate claim', () => {
  assert.deepStrictEqual(R.roleClaims('seen by Content Admin only', ['Admin', 'Content Admin', 'Learner']), ['Content Admin']);
  assert.deepStrictEqual(R.roleClaims('both Learner and CONTENT_ADMIN', ['Learner', 'Content Admin']), ['Learner', 'Content Admin']);
});

check('R2 must flag: claims Learner and Content Admin, cites only a Learner case', () => {
  const m = manifest({ results: [{ id: 'ER1', actual: 'shown for both Learner and Content Admin', evidence: ['TC_01.mp4', 'TC_01-ER_02-640.png'], status: 'PASSED' }] });
  const f = E.checkRoleClaims(m);
  assert.deepStrictEqual(rules(f), ['role-claim-without-evidence']);
  assert.ok(/Content Admin/.test(f[0].message));
});

check('R2 must flag: a multi-role case file that names no role backs neither', () => {
  const m = manifest({ results: [{ id: 'ER1', actual: 'Learner and Content Admin', evidence: ['TC_03.mp4'], status: 'PASSED' }] });
  assert.strictEqual(E.checkRoleClaims(m).length, 2);
});

check('R2 must pass: a joined case file (TC_01_02) plus a file naming the role', () => {
  const m = manifest({ results: [{ id: 'ER1', actual: 'Learner and Content Admin', evidence: ['TC_01_02.mp4', 'TC_03-390-contentadmin.png'], status: 'PASSED' }] });
  assert.deepStrictEqual(E.checkRoleClaims(m), []);
});

/* ---------------- R3 clip verifier / owner decision ---------------- */

const FAIL_OUT = 'FAIL  TC_04.mp4\n        x the capture manifest declares 33% still-holds\n\nRESULT: 0/1 passed\n';
const PASS_OUT = 'PASS  TC_01.mp4\n\nRESULT: 1/1 passed\n';

check('R3 parseVerifierOutput reads PASS and FAIL lines', () => {
  assert.deepStrictEqual(R.parseVerifierOutput(PASS_OUT + FAIL_OUT), [{ clip: 'TC_01.mp4', pass: true }, { clip: 'TC_04.mp4', pass: false }]);
});

check('R3 must flag: a FAIL clip with no decision row naming it', () => {
  const d = mkdir();
  put(d, 'verify-video-TC_04.txt', FAIL_OUT);
  const dec = put(d, 'ROUND_DECISIONS.md', '# decisions\n\n| # | Decision |\n|---|---|\n| 1 | accept TC_040 take |\n');
  const m = manifest({ results: [{ id: 'ER1', actual: 'x', evidence: ['TC_04.mp4'], status: 'PASSED' }] });
  assert.deepStrictEqual(rules(E.checkClips(m, '', d, null, dec)), ['clip-unverified-no-decision']);
});

check('R3 must pass: a decision row names the clip stem', () => {
  const d = mkdir();
  put(d, 'verify-video-TC_04.txt', FAIL_OUT);
  const dec = put(d, 'ROUND_DECISIONS.md', '| # | Decision |\n|---|---|\n| 3 | Accept TC_04 although verify-video fails |\n');
  const m = manifest({ results: [{ id: 'ER1', actual: 'x', evidence: ['TC_04.mp4'], status: 'PASSED' }] });
  assert.deepStrictEqual(E.checkClips(m, '', d, null, dec), []);
});

check('R3 must pass: a clip with a PASS line and no FAIL line needs no decision', () => {
  const d = mkdir();
  put(d, 'verify-video-TC_01.txt', PASS_OUT);
  assert.deepStrictEqual(E.checkClips(manifest(), '', d, null, null), []);
});

check('R3: the capture.json verified.passed flag alone is not a pass (#0113)', () => {
  const d = mkdir();
  put(d, 'TC_01.capture.json', { verified: { passed: true } });
  const dec = put(d, 'ROUND_DECISIONS.md', '| 1 | nothing about clips |\n');
  assert.deepStrictEqual(rules(E.checkClips(manifest(), '', d, null, dec)), ['clip-unverified-no-decision']);
});

check('R3 unchecked: a non-passing clip with no decisions file', () => {
  const d = mkdir();
  put(d, 'v.txt', FAIL_OUT);
  const m = manifest({ results: [{ id: 'ER1', actual: 'x', evidence: ['TC_04.mp4'], status: 'PASSED' }] });
  const f = E.checkClips(m, '', d, null, null);
  assert.deepStrictEqual(rules(f), ['clip-decision-unchecked']);
  assert.strictEqual(f[0].severity, 'unchecked');
});

check('R3: a clip cited only in the body is checked too', () => {
  const d = mkdir();
  const dec = put(d, 'ROUND_DECISIONS.md', '| 1 | x |\n');
  const f = E.checkClips(null, '|1|[▶ TC_09.mp4|^TC_09.mp4]|', d, null, dec);
  assert.deepStrictEqual(rules(f), ['clip-unverified-no-decision']);
});

/* ---------------- R4 decision times ---------------- */

check('R4 must flag: a bare clock time on a decisions row', () => {
  const f = R.checkDecisionTimes('# round\n\n| 3 | re-take started 10:57 |\n');
  assert.deepStrictEqual(rules(f), ['decision-time-unsourced']);
  assert.strictEqual(f[0].line, 3);
});

check('R4 must pass: the time cites its source on the same row', () => {
  assert.deepStrictEqual(R.checkDecisionTimes('| 3 | re-take started 10:57 (`date`) |\n| 4 | 11:02 from clips/TC_04.run.log |\n'), []);
});

check('R4 must pass: decimals and +07:00 offsets are not clock times', () => {
  assert.deepStrictEqual(R.checkDecisionTimes('# Round (+07:00)\n| 2 | 8.85 unique fps < 9.6 floor |\n'), []);
});

check('R4 must flag: heading names ICT, a row reports UTC', () => {
  const f = R.checkDecisionTimes('# Round decisions (ICT)\n| 1 | 03:57 UTC from `date -u` |\n');
  assert.deepStrictEqual(rules(f), ['decision-timezone-mismatch']);
});

check('R4 unchecked: no decisions file', () => {
  const f = E.checkDecisionsFile(null);
  assert.deepStrictEqual(rules(f), ['decision-times-unchecked']);
  assert.strictEqual(f[0].severity, 'unchecked');
});

/* ---------------- CLI wiring (R6 exit codes) ---------------- */

const CLI_MANIFEST = {
  ticket: '{ISSUE_KEY}', ticketType: 'Bug', bugType: 'FE', format: 'v2',
  env: 'Staging', designRef: 'https://design.example.com/file?node-id=1-2',
  role: ['CONTENT_ADMIN'], date: '2026-07-23', build: '9c3ab77', fixture: 'existing item — restored',
  scope: { mode: 'FULL' }, testStep: 'open the review action', expectedVerbatim: 'button reads "Review Failed"',
  contract: [{ id: 'ER1', text: 'button reads "Review Failed"' }],
  cases: [{ id: 'TC_01', title: 'modal button labels', covers: ['ER1'], role: 'CONTENT_ADMIN', status: 'PASSED' }],
  results: [{ id: 'ER1', actual: 'reads "Review Failed"', evidence: ['TC_01_CONTENT_ADMIN.mp4'], status: 'PASSED' }],
  verdict: 'PASSED',
  lanes: [{ id: 'L1', account: 'admin01', cases: ['TC_01'], lease: true }],
  testRunTime: { minutes: 9.8, hasVideo: true, method: 'evidence-burst-v1' },
};
function run(args) {
  const r = spawnSync(process.execPath, [GUARD, ...args], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

check('CLI: --evidence-dir without --decisions exits 2 — unchecked is not a pass', () => {
  const d = mkdir();
  put(d, 'TC_01_CONTENT_ADMIN.mp4', 'clip');
  put(d, 'verify.txt', 'PASS  TC_01_CONTENT_ADMIN.mp4\n');
  const r = run(['--manifest', put(d, 'run.json', CLI_MANIFEST), '--evidence-dir', d]);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(/decision-times-unchecked/.test(r.out), r.out);
});

check('CLI: everything decidable and clean exits 0', () => {
  const d = mkdir();
  put(d, 'TC_01_CONTENT_ADMIN.mp4', 'clip');
  put(d, 'verify.txt', 'PASS  TC_01_CONTENT_ADMIN.mp4\n');
  const dec = put(d, 'ROUND_DECISIONS.md', '# decisions\n| 1 | none |\n');
  const r = run(['--manifest', put(d, 'run.json', CLI_MANIFEST), '--evidence-dir', d, '--decisions', dec]);
  assert.strictEqual(r.code, 0, r.out);
});

check('CLI: a FAIL clip with no decision row exits 1', () => {
  const d = mkdir();
  const vd = mkdir();
  put(d, 'TC_01_CONTENT_ADMIN.mp4', 'clip');
  put(vd, 'verify.txt', 'FAIL  TC_01_CONTENT_ADMIN.mp4\n');
  const dec = put(d, 'ROUND_DECISIONS.md', '| 1 | none |\n');
  const r = run(['--manifest', put(d, 'run.json', CLI_MANIFEST), '--evidence-dir', d, '--verify-dir', vd, '--decisions', dec]);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(/clip-unverified-no-decision/.test(r.out), r.out);
});

check('CLI: an unreadable --decisions path exits 2', () => {
  const d = mkdir();
  put(d, 'TC_01_CONTENT_ADMIN.mp4', 'clip');
  const r = run(['--manifest', put(d, 'run.json', CLI_MANIFEST), '--evidence-dir', d, '--decisions', path.join(d, 'nope.md')]);
  assert.strictEqual(r.code, 2, r.out);
});

check('CLI: without --evidence-dir or --decisions nothing new runs (old callers unchanged)', () => {
  const d = mkdir();
  const r = run(['--manifest', put(d, 'run.json', CLI_MANIFEST)]);
  assert.strictEqual(r.code, 0, r.out);
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
