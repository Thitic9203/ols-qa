#!/usr/bin/env node
'use strict';

/**
 * Login-window rule lint (Spec: docs/sdd/single-login-window R2, R10, R11;
 *                         docs/sdd/login-by-command R1–R8, R11 — supersedes the window rules).
 *
 * Owner 2026-10-21 (later order): Claude NEVER opens a browser or login window for a test account.
 * It gives ready-to-run relink / mint commands in chat, the user presses Run, then Claude probes.
 *
 * Owner 2026-10-21: the Story (testing-ticket) and Bug (retest-bug) skills must pop ONE login
 * window at a time, opened by the main thread, email prefilled — never a loop of windows from
 * lanes. The text that caused it told each lane to "log in fresh … and overwrite the file".
 *
 * Checks the skill files that carry the login step:
 *   - none may tell a lane / the reader to "log in fresh" and overwrite the login file;
 *   - each must name the lane hand-back token SESSION-DEAD and the main-thread one-window rule.
 *
 *   node tools/login-window-rule/check.js [repo root]   → exit 0 clean · 1 findings · 2 unreadable
 */

const fs = require('fs');
const path = require('path');

// Files that must carry the one-window rule (REQUIRED) — and are scanned for FORBIDDEN shapes.
const FILES = [
  'references/parallel-test-lanes.md',
  'skills/procedures/testing-ticket-workflow/WORKFLOW.md',
  'skills/procedures/retest-bug-workflow/execute-and-evidence.md',
];
// R11: further skill files and templates scanned for FORBIDDEN shapes only.
const SCAN_ONLY = [
  'skills/procedures/testing-ticket-workflow/references/session-intake.md',
  'skills/procedures/testing-ticket-workflow/references/playwright-discipline.md',
  'skills/procedures/retest-bug-workflow/WORKFLOW.md',
  'skills/procedures/retest-bug-workflow/references/project-config-template.md',
  'commands/testing-ticket.md',
  'commands/retest-bug.md',
  'skills/testing-ticket-workflow/SKILL.md',
  'skills/retest-bug-workflow/SKILL.md',
];

// login-by-command R1/R11: an affirmative "open … login window / sign-in page" fails; a negated one
// ("never opens a login window") passes — negation looked for earlier on the same line.
const NEGATION = /\b(never|not|no|nor|without)\b|n't\b/i;
const OPEN_WINDOW_RE = /\bopen(?:s|ing)?\s+(?:a|one|the|any|single|separate)\s+(?:single\s+|separate\s+|new\s+)?(?:login|sign-in|signin)\s+(?:window|page|drawer)/gi;

const FORBIDDEN = [
  // [^.] spans line breaks: the lane prompt wraps "log in fresh and\noverwrite the file".
  { id: 'LANE_LOGS_IN', re: /log\s+in\s+fresh[^.]{0,40}?\boverwrite\b/gi,
    why: 'a lane logging in by itself pops one window per lane — hand back SESSION-DEAD instead' },
  // R10/R11: no step asks for, stores or fills a password — the person types it in the one window.
  { id: 'PASSWORD_INTAKE', re: /^\|\s*\*{0,2}Password\*{0,2}\s*\|/gim,
    why: 'intake/config table collects a password — collect the account only (R10)' },
  { id: 'PASSWORD_COLUMN', re: /^\|[^\n]*\|\s*Password\s*\|\s*$/gim,
    why: 'template has a Password column — accounts and login method only (R10)' },
  { id: 'FILL_LOGIN', re: /\bfill\s+(login|credentials|the\s+password)\b/gi,
    why: 'tells the run to fill a password — fresh login is the one prefilled-email window (R10)' },
  { id: 'USER_PASSWORD_HEADING', re: /^#+\s*User\s*\/\s*Password\b/gim,
    why: 'intake section asks for a password (R10)' },
  { id: 'COLLECT_CREDENTIALS', re: /\bcollect\b[^.\n]{0,40}\bcredentials\b/gi,
    why: 'collects credentials — collect the test account only (R10)' },
  { id: 'OLD_ONE_WINDOW_RULE', re: /one login window at a time/gi,
    why: 'the superseded one-window rule — login is by command now (login-by-command R1)' },
  { id: 'PREFILLED_WINDOW', re: /prefilled[- ]email\s+window|window[^.\n]{0,40}email\s+(?:already\s+)?(?:pre)?filled/gi,
    why: 'describes a prefilled login window — Claude never opens one (login-by-command R1)' },
  { id: 'DRIVE_LOGIN', re: /\bdrive\s+the\s+real\s+login\b/gi,
    why: 'tells the run to drive the login form — give relink/mint commands instead (login-by-command R1–R2)' },
];

const REQUIRED = [
  { id: 'NO_SESSION_DEAD', re: /SESSION-DEAD/,
    why: 'the lane hand-back for a dead session is not named' },
  { id: 'NO_LOGIN_BY_COMMAND', re: /ready-to-run command/i,
    why: 'the login-by-command rule (ready-to-run relink/mint commands, then probe) is not stated' },
];

function checkText(text, file, { required = true } = {}) {
  const findings = [];
  for (const f of FORBIDDEN) {
    for (const m of text.matchAll(f.re)) {
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ file, line, id: f.id, why: f.why });
    }
  }
  for (const m of text.matchAll(OPEN_WINDOW_RE)) {
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    if (NEGATION.test(text.slice(lineStart, m.index))) continue;
    const line = text.slice(0, m.index).split('\n').length;
    findings.push({ file, line, id: 'OPENS_LOGIN_WINDOW',
      why: 'tells Claude to open a login window/page — give ready-to-run commands instead (login-by-command R1–R2)' });
  }
  for (const r of required ? REQUIRED : []) {
    if (!r.re.test(text)) findings.push({ file, line: 0, id: r.id, why: r.why });
  }
  return findings;
}

function checkRepo(root) {
  const findings = [];
  for (const rel of [...FILES, ...SCAN_ONLY]) {
    let text;
    try { text = fs.readFileSync(path.join(root, rel), 'utf8'); }
    catch (e) { return { unreadable: `${rel}: ${e.code || e.message}`, findings }; }
    findings.push(...checkText(text, rel, { required: FILES.includes(rel) }));
  }
  return { findings };
}

module.exports = { checkText, checkRepo, FILES, SCAN_ONLY };

if (require.main === module) {
  const root = process.argv[2] || path.resolve(__dirname, '..', '..');
  const { unreadable, findings } = checkRepo(root);
  if (unreadable) { console.log(`[login-window-rule] cannot read ${unreadable} — not checked, not a pass`); process.exit(2); }
  for (const f of findings) console.log(`${f.file}:${f.line} ${f.id} — ${f.why}`);
  console.log(`[login-window-rule] ${FILES.length + SCAN_ONLY.length} files, ${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}
