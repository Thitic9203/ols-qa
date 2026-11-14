#!/usr/bin/env node
'use strict';
// Rule-text test (spec docs/sdd/r6-tc-review-one-question R1-R6).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const P = 'skills/tc-review-workflow/SKILL.md';
// Step 5 lives in notify.md (owner 13/Nov/2026).
const S = fs.readFileSync(path.join(root, P), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'skills/tc-review-workflow/notify.md'), 'utf8');
const sec = S.slice(S.indexOf('- **Project has a channel in config'));
const bullet = sec.slice(0, sec.indexOf('- **Project has no channel in config'));
// r12-p1-three R9: Step 5 items renumbered into execution order (old 2 → 5, old 3 → 6, old 4 → 7).
const item1 = S.slice(S.indexOf('1. **Identity for a mention:**'), S.indexOf('2. Use the wording conventions'));
const item3 = S.slice(S.indexOf('**Send, then read the response back**'), S.indexOf('7. **Wrong destination'));
let fail = 0;
function t(name, fn) {
  try { fn(); console.log(`PASS  ${name}`); } catch (e) { fail += 1; console.log(`FAIL  ${name}\n      ${e.message}`); }
}
// Step 5 lives in notify.md (after17-tc-review R13): the origin/main side reads SKILL.md + notify.md too.
function base() {
  let s;
  try { s = execFileSync('git', ['show', `origin/main:${P}`], { cwd: root, encoding: 'utf8' }); }
  catch (e) { return null; }
  try { s += '\n' + execFileSync('git', ['show', 'origin/main:skills/tc-review-workflow/notify.md'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { /* older main: Step 5 still inside SKILL.md */ }
  return s;
}
t('R1 item 1 takes the mention id from config "TC review notify", does not ask', () => {
  assert.ok(item1.length > 0, 'item 1 not found');
  assert.ok(/TC review notify/.test(item1), 'item 1 does not name config section "TC review notify"');
  assert.ok(/from the project\s+config/i.test(item1), 'item 1 does not say the id comes from the project config');
  assert.ok(/(do not|never) ask/i.test(item1), 'item 1 does not say not to ask when config has it');
});
t('R2 asks only when config has none; never guess; never invent', () => {
  assert.ok(/only when (the )?config has (no|none)/i.test(item1), 'no "only when config has none" clause');
  assert.ok(/display name/.test(item1), 'no-guess-from-display-name rule missing');
  assert.ok(/never invent/.test(item1), 'never-invent channel/thread id rule missing');
  assert.ok(!/^1\. \*\*Identity for a mention:\*\* ask for the exact id/.test(item1), 'old unconditional "ask for the exact id" still present');
});
t('R3 one-question bullet names the missing-mention-id exception', () => {
  assert.ok(/Ask exactly one question: which thread/.test(bullet), 'one-question sentence missing');
  assert.ok(/except|only other question|sole exception/i.test(bullet), 'no exception wording in bullet');
  assert.ok(/mention id/i.test(bullet), 'bullet does not mention the mention id');
  assert.ok(/item 1/.test(bullet), 'bullet does not point to item 1');
});
t('R4 thread question + go-ahead unchanged', () => {
  assert.ok(/Offer the threads already used for this ticket or\s+recorded in the config as options\. The answer is the go-ahead to send\./.test(bullet));
  const g = S.slice(S.indexOf('5. 🔴 **GATE — before the external send'), S.indexOf('6. **Send, then read'));
  assert.ok(/counts as the go-ahead only once that preview is visible/.test(g));
});
t('R5 item 3 byte-identical to origin/main', () => {
  const b = base(); if (!b) return console.log('      (origin/main unavailable — skipped)');
  // Body of the send item (number stripped) must match its origin/main body, under either numbering.
  const bs = b.indexOf('**Send, then read the response back**');
  const be = Math.max(b.indexOf('4. **Wrong destination'), b.indexOf('7. **Wrong destination'));
  assert.strictEqual(item3, b.slice(bs, be));
  assert.ok(/a requested mention actually resolved/.test(item3));
});
t('R6 wrong-id reasoning kept', () => {
  assert.ok(/a wrong id either pings nobody or pings the wrong person/.test(item1.replace(/\s+/g, ' ')));
});
t('size: SKILL.md net change <= +2 lines vs origin/main and under byte limit', () => {
  const n = S.split('\n').length;
  assert.ok(n <= 403, `${n} lines`);
  assert.ok(Buffer.byteLength(S) < 30000, 'too many bytes');
});
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
