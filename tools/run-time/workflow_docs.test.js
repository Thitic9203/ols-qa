#!/usr/bin/env node
'use strict';
/* Both result-comment workflows carry the measured run-time step and line.
 *
 * The retest comment is rendered and guarded (tools/retest-guard); the testing-ticket
 * summary comment has no renderer or guard, so this pin is the only machine check that
 * its documented template still shows the line above the usage marker.
 *
 *   node tools/run-time/workflow_docs.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { METHOD } = require('./measure');

const ROOT = path.join(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/** The workflow = WORKFLOW.md plus the part files it links in its own folder (D2 split, 2026-10-14). */
function readWorkflow(abs) {
  const dir = path.dirname(abs);
  const main = fs.readFileSync(abs, 'utf8');
  const parts = [...new Set([...main.matchAll(/\]\(([a-z0-9-]+\.md)(?:#[^)]*)?\)/g)].map((m) => m[1]))]
    .filter((n) => n !== 'WORKFLOW.md' && fs.existsSync(path.join(dir, n)));
  return [main, ...parts.map((n) => fs.readFileSync(path.join(dir, n), 'utf8'))].join('\n');
}

const WORKFLOWS = [
  'skills/procedures/retest-bug-workflow/WORKFLOW.md',
  'skills/procedures/testing-ticket-workflow/WORKFLOW.md',
];
const LINE = /^\*Test run time:\* \{minutes\} min — includes evidence capture \(\{screenshots\|screenshots and video\}\); excludes re-checks, design lookup and comment drafting$/;

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

WORKFLOWS.forEach((rel) => {
  const wf = readWorkflow(path.join(ROOT, rel));
  check(rel + ': documents the measure command, the method id, and never estimating', () => {
    assert.ok(/node tools\/run-time\/measure\.js --dirs/.test(wf), 'measure command missing');
    assert.ok(wf.includes(METHOD), 'method id missing');
    assert.ok(/never estimate/i.test(wf), 'no "never estimate"');
    assert.ok(/by hand/i.test(wf), 'no fallback for a workspace without the tool');
  });
  check(rel + ': a template shows the run-time line, one blank line, then the usage marker', () => {
    const lines = wf.split('\n');
    const i = lines.findIndex((l) => LINE.test(l));
    assert.ok(i > -1, 'no run-time template line');
    assert.strictEqual(lines[i + 1], '', 'no blank line after the run-time line');
    assert.ok(lines[i + 2].startsWith('_retestskillmarker'), 'the usage marker does not follow the run-time line');
  });
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
