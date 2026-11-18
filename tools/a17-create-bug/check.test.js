#!/usr/bin/env node
'use strict';
// Rule-text test (spec docs/sdd/after17-create-bug R1–R10).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const flat = (s) => s.replace(/\s+/g, ' ');
let fail = 0;
function t(name, fn) {
  try { fn(); console.log(`PASS  ${name}`); } catch (e) { fail += 1; console.log(`FAIL  ${name}\n      ${e.message}`); }
}
const has = (p, re) => assert.ok(re.test(flat(rd(p))), `${p} missing ${re}`);
const lacks = (p, re) => assert.ok(!re.test(flat(rd(p))), `${p} still has ${re}`);
const S = 'skills/create-bug-workflow/SKILL.md';
const P = 'skills/procedures/create-bug-workflow/';

t('R1 a run that files nothing has a Verdict', () => {
  has(`${P}phase-f-close.md`, /A run that files nothing .* `Verdict: CREATED 0\/\{K\} — \{reason\}`/);
});
t('R2 confirm-block counts reconcile and D is not a count', () => {
  has(`${P}phase-c-confirm.md`, /\{a\} dropped in B2, \{b\} dropped in B3, \{c\} blocked or Needs Review, K to file/);
  lacks(`${P}phase-c-confirm.md`, /D dropped in B3/);
});
t('R3 Phase B3 pointer, B3 gate line, Likely status, cause label', () => {
  has(`${P}WORKFLOW.md`, /## 🔴 GATE: Phase B3/);
  has(`${P}phase-b3-falsification.md`, /## 🔴 GATE: Phase B3/);
  assert.ok(fs.existsSync(path.join(root, `${P}phase-b3-falsification.md`)) && !fs.existsSync(path.join(root, `${P}phase-e-falsification.md`)), 'B3 file name');
  has(`${P}phase-b3-falsification.md`, /\*\*Likely\*\* — a defined status here, not a cause hedge/);
  has(`${P}references/bug-draft-template.md`, /not the Confidence line/);
});
t('R4 resize names a tool and a width check', () => {
  has(`${P}phase-d-create.md`, /sips -Z 640 <file>.*sips -g pixelWidth <file>/);
});
t('R5 waiver and embed lines match the create-bug gates', () => {
  has('references/helix-session-constraints.md', /never a workflow's hard confirm gate, e\.g\. create-bug Phase C/);
  has('references/skill-invocation-discipline.md', /except create-bug Phase C confirm/);
  has('references/agent-rationalizations.md', /never create-bug Phase C/);
  has('references/agent-rationalizations.md', /embed only after attach \(new bug: create, attach, update\)/);
  lacks('references/agent-rationalizations.md', /attach before embed/);
});
t('R6 shared references say what create-bug uses', () => {
  has('references/defect-report-completeness.md', /and the create-bug draft \(§1 Create-bug draft format\)/);
  has('references/defect-report-completeness.md', /create-bug never reproduces/);
  has('references/non-pass-challenge-gate.md', /create-bug never re-runs/);
  has(`${P}phase-f-close.md`, /this cap replaces the 3 in jira-comment-post-review\.md/);
});
t('R7 portability', () => {
  lacks('references/bug-priority-matrix.md', /ยึดหลักนี้/);
  has('references/jira-wiki-vs-markdown.md', /!\[alt\]\(http:\/\/x\/a\.png\)/);
  has('references/skill-reference-index.md', /## Workspace-specific \*\(workspace-only\)\*/); // project-agnostic R7: names no product workspace
});
t('R8 intake and draft slots', () => {
  has('references/intake-one-pager.md', /entry points tried, expected \+ source link/);
  has(`${P}references/bug-draft-template.md`, /plain text `link pending from reporter` \(no braces\)/);
  has(`${P}WORKFLOW.md`, /\| 🔴 STOP — Ask, never decide: no Severity given/);
});
t('R9 example and entry text agree', () => {
  has(`${P}references/worked-example.md`, /gh repo view example-org\/checkout-ui --json name/);
  has('commands/create-bug.md', /check the board, falsify, confirm, then file/);
  has('commands/create-bug.md', /TC tables \(tc-fe-prep \/ tc-api-prep\) or result-sheet updates/);
  has(S, /even a test-run finding or without the word bug/);
});
t('R10 Refusal-first is one statement', () => {
  has(S, /MUST NOT create issues before the Phase C \*\*confirm\*\*; MUST re-check the board first \(Phase B2\)/);
});

if (fail) { console.log(`\n${fail} failed`); process.exit(1); }
console.log('\nall passed');
