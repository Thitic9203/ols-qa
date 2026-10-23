#!/usr/bin/env node
'use strict';

/**
 * Tests for the login-window rule lint (docs/sdd/single-login-window R2/R10/R11, login-by-command R11).
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
const GOOD = 'On 401 return SESSION-DEAD <tag> to the parent. The main thread gives ready-to-run commands as one combined `bash` block per step and never opens a login window.';

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

t('login-by-command: "opens one login window" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('The main thread opens a single login window for that account.', 'x.md', { required: false })), ['OPENS_LOGIN_WINDOW']);
});
t('login-by-command: "open the sign-in page" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('Then open the sign-in page and wait.', 'x.md', { required: false })), ['OPENS_LOGIN_WINDOW']);
});
t('login-by-command: negated "never opens a login window" is not flagged (must not find)', () => {
  assert.deepStrictEqual(checkText('Claude never opens a login window. A lane does not open a sign-in page.', 'x.md', { required: false }), []);
});
t('login-by-command: old one-window rule, prefilled window, drive login are found (must find)', () => {
  const txt = 'opens nothing\nKeep one login window at a time.\nA prefilled-email window.\nDrive the real login when missing.';
  assert.deepStrictEqual(ids(checkText(txt, 'x.md', { required: false })), ['DRIVE_LOGIN', 'OLD_ONE_WINDOW_RULE', 'PREFILLED_WINDOW']);
});
t('login-by-command: missing ready-to-run command marker is reported (must find)', () => {
  assert.deepStrictEqual(ids(checkText('SESSION-DEAD only, one combined `bash` block', 'x.md')), ['NO_LOGIN_BY_COMMAND']);
});

t('combined block R15: "one `bash` block per command" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('gives ready-to-run commands in chat, **one `bash` block per command**, built from intake', 'x.md', { required: false })), ['PER_ACCOUNT_BLOCK']);
});
t('combined block R15: "one `bash` block each" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('give the user ready-to-run commands, one `bash` block each: relink every needed account', 'x.md', { required: false })), ['PER_ACCOUNT_BLOCK']);
});
t('combined block R15: "One block per needed account" / "one block for that account alone" are found (must find)', () => {
  const txt = '1. **Relink.** One block per needed account whose session is not live.\n2. **Mint.** one block for that account alone.';
  assert.deepStrictEqual(ids(checkText(txt, 'x.md', { required: false })), ['PER_ACCOUNT_BLOCK', 'PER_ACCOUNT_BLOCK']);
});
t('combined block R15: "one setup/mint command for that account" is found (must find)', () => {
  assert.deepStrictEqual(ids(checkText('the skill must give one setup/mint command for that account alone.', 'x.md', { required: false })), ['PER_ACCOUNT_BLOCK']);
});
t('combined block R15: per-command block on a line that starts with an unrelated "never" is still found (must find)', () => {
  const txt = 'Claude never opens a browser or login window. Instead the main thread gives the user ready-to-run commands in chat, **one `bash` block per command**, built from intake.\n' +
    '| NEVER open a browser or login window — the main thread gives ready-to-run commands, one `bash` block each (relink) |';
  assert.deepStrictEqual(ids(checkText(txt, 'x.md', { required: false })), ['PER_ACCOUNT_BLOCK', 'PER_ACCOUNT_BLOCK']);
});
t('combined block R15: combined wording and negated per-account wording are not flagged (must not find)', () => {
  const ok = 'Give **one combined `bash` block** per step that loops over every account.\nNever split it into one block per account.';
  assert.deepStrictEqual(checkText(ok, 'x.md', { required: false }), []);
});
t('combined block R15: missing combined-block marker is reported (must find)', () => {
  assert.deepStrictEqual(ids(checkText('SESSION-DEAD and a ready-to-run command', 'x.md')), ['NO_COMBINED_BLOCK']);
});

t('compliant text has no finding (must not find)', () => {
  assert.deepStrictEqual(checkText(GOOD, 'x.md'), []);
});

t('missing SESSION-DEAD and one-window rule are both reported', () => {
  assert.deepStrictEqual(ids(checkText('nothing here', 'x.md')), ['NO_COMBINED_BLOCK', 'NO_LOGIN_BY_COMMAND', 'NO_SESSION_DEAD']);
});

t('unreadable root is reported as unreadable, not a pass', () => {
  const r = checkRepo('/nonexistent-root-for-test');
  assert.ok(r.unreadable, 'expected unreadable');
});

t('repo skill files follow the login-by-command rule', () => {
  const r = checkRepo(path.resolve(__dirname, '..', '..'));
  assert.ok(!r.unreadable, r.unreadable);
  assert.deepStrictEqual(r.findings.map((f) => `${f.file}:${f.line} ${f.id}`), []);
});

console.log(`\nchecks run: ${ran}, failed: ${failed}`);
if (!ran) { console.log('REFUSED — zero checks ran'); process.exit(2); }
process.exit(failed ? 1 : 0);
