#!/usr/bin/env node
'use strict';
/* Step 9 notify is the agent's job, and a SKIP is not a send (docs/sdd/retest-notify-always R1–R5).
 *
 * OLS-279, 2026-10-30: the helper was run without its webhook, printed SKIP, the agent guessed a
 * cause and handed the send command to the owner. This test keeps the rule in the workflow and the
 * concrete transport in the OLS guide.
 *
 *   node tools/retest-guard/notify_send_rule.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const step9File = path.join(ROOT, 'skills', 'procedures', 'retest-bug-workflow', 'closeout-and-notify.md');
const guideFile = path.join(ROOT, 'references', 'ols-project-guide.md');

function section(text, heading) {
  const start = text.indexOf(heading);
  assert.ok(start > -1, `heading not found: ${heading}`);
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next === -1 ? undefined : next);
}

const step9 = section(fs.readFileSync(step9File, 'utf8'), '## Step 9 — QA result notify');
// R6: testing-ticket carries the same rule as its own mandatory close-out step.
const ttFile = path.join(ROOT, 'skills', 'procedures', 'testing-ticket-workflow', 'results-update.md');
const ttText = fs.readFileSync(ttFile, 'utf8');
const ttStart = ttText.indexOf('### G8 — QA result notify');
const tt = ttStart === -1 ? '' : ttText.slice(ttStart, (ttText.indexOf('\n## ', ttStart) + 1 || ttText.length + 1) - 1);
const guide = section(fs.readFileSync(guideFile, 'utf8'), '## Retest-bug QA notify');

const checks = [
  ['R1 agent sends it itself', /send(s)? the notify (it)?self|agent sends the notify/i.test(step9)],
  ['R1 never hand the send to the user', /never hand the send/i.test(step9)],
  ['R2 a skip is not a send', /skip[^.\n]*is not a send/i.test(step9)],
  ['R2 no unchecked cause', /never state a cause you have not checked/i.test(step9)],
  ['R3 not closed until success line', /not closed until the helper prints its success line/i.test(step9)],
  ['R4 guide names the webhook file', guide.includes('~/ols-qa-testing-bot/.discord_webhook')],
  ['R4 guide names --jira-key and --registry', guide.includes('--jira-key') && guide.includes('--registry notify_registry.json')],
  ['R4 guide names the success line', guide.includes('OK: posted')],
  ['R4 guide: every OLS ticket tested by AI', /every OLS ticket tested by AI/i.test(guide)],
  ['R4 no webhook URL in the guide', !/discord(app)?\.com\/api\/webhooks\//i.test(guide)],
  ['R6 testing-ticket has a G8 notify step', tt.length > 0],
  ['R6 testing-ticket: mandatory when a channel is configured', /mandatory/i.test(tt) && /channel/i.test(tt)],
  ['R6 testing-ticket: agent sends it itself', /agent sends the notify/i.test(tt)],
  ['R6 testing-ticket: never hand the send', /never hand the send/i.test(tt)],
  ['R6 testing-ticket: a skip is not a send', /skip[^.\n]*is not a send/i.test(tt)],
  ['R6 testing-ticket: no unchecked cause', /never state a cause you have not checked/i.test(tt)],
  ['R6 testing-ticket: not closed until success line', /not closed until the helper prints its success line/i.test(tt)],
  ['R6 testing-ticket: recipient from the QA Owner field', /QA Owner/.test(tt)],
  ['R6 G7 close lists the notify result', /Notify:/.test(ttText.slice(ttText.indexOf('### G7 — Close'), ttStart === -1 ? undefined : ttStart))],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) {
  console.error(`notify_send_rule: ${failed} check(s) failed`);
  process.exit(1);
}
console.log('notify_send_rule: all checks pass');
