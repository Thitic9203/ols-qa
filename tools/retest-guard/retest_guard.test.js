#!/usr/bin/env node
'use strict';
/* The gate's own contract: what each exit code means, and that it fails closed.
 *
 * Exit 2 exists because "the check could not run" must never read as "the check
 * passed" — the same reason tools/name-guard/scan.js exits 2 rather than 0 when it
 * cannot scan.
 *
 *   node tools/retest-guard/retest_guard.test.js
 */
const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GUARD = path.join(__dirname, 'retest_guard.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retest-guard-'));

function run(args) {
  const r = spawnSync(process.execPath, [GUARD, ...args], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function write(name, content) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  return p;
}

const GOOD_MANIFEST = {
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
  expectedVerbatim: 'button reads "Review Failed"',
  contract: [{ id: 'ER1', text: 'button reads "Review Failed"' }],
  cases: [{ id: 'TC_01', title: 'modal button labels', covers: ['ER1'], role: 'CONTENT_ADMIN', status: 'PASSED' }],
  results: [{ id: 'ER1', actual: 'reads "Review Failed"', evidence: ['PROJ-88_TC_01_CONTENT_ADMIN.mp4'], status: 'PASSED' }],
  verdict: 'PASSED',
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('a valid manifest exits 0 and says what it did not check', () => {
  const p = write('good.json', GOOD_MANIFEST);
  const r = run(['--manifest', p]);
  assert.strictEqual(r.code, 0, r.out);
  assert.ok(/judgement gates/.test(r.out), 'the clean message must not imply the judgement gates passed');
});

check('--out writes the rendered body', () => {
  const p = write('good2.json', GOOD_MANIFEST);
  const out = path.join(tmp, 'body.txt');
  const r = run(['--manifest', p, '--out', out]);
  assert.strictEqual(r.code, 0, r.out);
  const body = fs.readFileSync(out, 'utf8');
  assert.ok(body.startsWith('*Retest Result: PASSED*'));
  assert.ok(body.includes('*Scope:* FULL'));
});

check('a manifest whose verdict the rows do not support exits 1', () => {
  const bad = JSON.parse(JSON.stringify(GOOD_MANIFEST));
  bad.results[0].status = 'FAILED';
  const r = run(['--manifest', write('bad.json', bad)]);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(/results say FAILED/.test(r.out));
});

check('a hand-written body carrying the width parameter exits 1', () => {
  const body = fs.readFileSync(path.join(tmp, 'body.txt'), 'utf8')
    .replace('[▶ PROJ-88_TC_01_CONTENT_ADMIN.mp4|^PROJ-88_TC_01_CONTENT_ADMIN.mp4]', '!shot.png|width=450!');
  const r = run(['--body', write('bad-body.txt', body), '--format', 'v2', '--bug-type', 'FE']);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(/img-width-param/.test(r.out));
});

check('an evidence file named in the manifest but absent on disk exits 1', () => {
  const p = write('good3.json', GOOD_MANIFEST);
  const r = run(['--manifest', p, '--evidence-dir', tmp]);
  assert.strictEqual(r.code, 1, r.out);
  assert.ok(/evidence-file-missing/.test(r.out));
});

check('the same manifest passes once the evidence file is there', () => {
  fs.writeFileSync(path.join(tmp, 'PROJ-88_TC_01_CONTENT_ADMIN.mp4'), 'not a real clip, but present');
  const r = run(['--manifest', write('good4.json', GOOD_MANIFEST), '--evidence-dir', tmp]);
  assert.strictEqual(r.code, 0, r.out);
});

check('a missing file exits 2 — could not run is not a pass', () => {
  const r = run(['--manifest', path.join(tmp, 'nope.json')]);
  assert.strictEqual(r.code, 2, r.out);
});

check('malformed JSON exits 2', () => {
  const r = run(['--manifest', write('broken.json', '{ not json')]);
  assert.strictEqual(r.code, 2, r.out);
});

check('no arguments exits 2 with usage', () => {
  const r = run([]);
  assert.strictEqual(r.code, 2, r.out);
  assert.ok(/nothing to check/.test(r.out));
});

check('an unknown argument exits 2 rather than being ignored', () => {
  const r = run(['--manifest', write('good5.json', GOOD_MANIFEST), '--yolo']);
  assert.strictEqual(r.code, 2, r.out);
});

check('--json produces machine-readable findings', () => {
  const bad = JSON.parse(JSON.stringify(GOOD_MANIFEST));
  delete bad.designRef;
  const r = run(['--manifest', write('bad2.json', bad), '--json']);
  assert.strictEqual(r.code, 1, r.out);
  const parsed = JSON.parse(r.out);
  assert.ok(parsed.findings.some((f) => f.field === 'designRef'));
});

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* best effort */ }
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
