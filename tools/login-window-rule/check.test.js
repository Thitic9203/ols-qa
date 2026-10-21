#!/usr/bin/env node
'use strict';

/**
 * Tests for the login-window rule lint (docs/sdd/single-login-window R1–R4).
 * Known-answer pairs first (must find · must not find), then the real repo files.
 *
 *   node tools/login-window-rule/check.test.js
 */

const assert = require('assert');
const path = require('path');
const { checkText, checkRepo } = require('./check.js');

let ran = 0, failed = 0;
function t(name, fn) {
  ran++;
  try { fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name} — ${e.message}`); }
}
const ids = (fs) => fs.map((f) => f.id).sort();
const GOOD = 'On 401 return SESSION-DEAD <tag> to the parent. The main thread opens one login window at a time.';

t('old lane text "log in fresh and overwrite the file" is found (must find)', () => {
  const f = checkText(GOOD + '\non 401/403, a login redirect, or another user, log in fresh and\noverwrite the file.', 'x.md');
  assert.deepStrictEqual(f.map((x) => `${x.id}:${x.line}`), ['LANE_LOGS_IN:2']);
});

t('"log in fresh as above and overwrite the file" is found (must find)', () => {
  const f = checkText(GOOD + '\n→ log in fresh as above and overwrite the file.', 'x.md');
  assert.deepStrictEqual(ids(f), ['LANE_LOGS_IN']);
});

t('R10 password intake row is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('| **Password** | Yes* | (*`—` if no login) |', 'x.md', { required: false })), ['PASSWORD_INTAKE']);
});
t('R10 "Fill login from intake" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('- Fill login from Phase A intake only.', 'x.md', { required: false })), ['FILL_LOGIN']);
});
t('R10 Password column and User / Password heading are found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('## User / Password\n| Portal | Username | Password |', 'x.md', { required: false })),
    ['PASSWORD_COLUMN', 'USER_PASSWORD_HEADING']);
});
t('R10 "collect … credentials" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('collect Ticket, URL, credentials, VPN', 'x.md', { required: false })), ['COLLECT_CREDENTIALS']);
});
t('R10 compliant wording is not flagged (must not find)', () => {
  const ok = '| **Account** | Yes* | username/email only |\n- Never fill a password; the person types it in the one window.\n' +
    'the person types only the password';
  assert.deepStrictEqual(checkText(ok, 'x.md', { required: false }), []);
});

t('compliant text has no finding (must not find)', () => {
  assert.deepStrictEqual(checkText(GOOD, 'x.md'), []);
});

t('missing SESSION-DEAD and one-window rule are both reported', () => {
  assert.deepStrictEqual(ids(checkText('nothing here', 'x.md')), ['NO_ONE_WINDOW_RULE', 'NO_SESSION_DEAD']);
});

t('unreadable root is reported as unreadable, not a pass', () => {
  const r = checkRepo('/nonexistent-root-for-test');
  assert.ok(r.unreadable, 'expected unreadable');
});

t('repo skill files follow the one-login-window rule', () => {
  const r = checkRepo(path.resolve(__dirname, '..', '..'));
  assert.ok(!r.unreadable, r.unreadable);
  assert.deepStrictEqual(r.findings.map((f) => `${f.file}:${f.line} ${f.id}`), []);
});

console.log(`\nchecks run: ${ran}, failed: ${failed}`);
if (!ran) { console.log('REFUSED — zero checks ran'); process.exit(2); }
process.exit(failed ? 1 : 0);
