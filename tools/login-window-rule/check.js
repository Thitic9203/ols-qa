#!/usr/bin/env node
'use strict';

/**
 * Login-window rule lint (Spec: docs/sdd/single-login-window R1–R4).
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

const FILES = [
  'references/parallel-test-lanes.md',
  'skills/procedures/testing-ticket-workflow/WORKFLOW.md',
  'skills/procedures/retest-bug-workflow/execute-and-evidence.md',
];

const FORBIDDEN = [
  // [^.] spans line breaks: the lane prompt wraps "log in fresh and\noverwrite the file".
  { id: 'LANE_LOGS_IN', re: /log\s+in\s+fresh[^.]{0,40}?\boverwrite\b/gi,
    why: 'a lane logging in by itself pops one window per lane — hand back SESSION-DEAD instead' },
];

const REQUIRED = [
  { id: 'NO_SESSION_DEAD', re: /SESSION-DEAD/,
    why: 'the lane hand-back for a dead session is not named' },
  { id: 'NO_ONE_WINDOW_RULE', re: /one login window at a time/i,
    why: 'the main-thread one-window-at-a-time rule is not stated' },
];

function checkText(text, file) {
  const findings = [];
  for (const f of FORBIDDEN) {
    for (const m of text.matchAll(f.re)) {
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ file, line, id: f.id, why: f.why });
    }
  }
  for (const r of REQUIRED) {
    if (!r.re.test(text)) findings.push({ file, line: 0, id: r.id, why: r.why });
  }
  return findings;
}

function checkRepo(root) {
  const findings = [];
  for (const rel of FILES) {
    let text;
    try { text = fs.readFileSync(path.join(root, rel), 'utf8'); }
    catch (e) { return { unreadable: `${rel}: ${e.code || e.message}`, findings }; }
    findings.push(...checkText(text, rel));
  }
  return { findings };
}

module.exports = { checkText, checkRepo, FILES };

if (require.main === module) {
  const root = process.argv[2] || path.resolve(__dirname, '..', '..');
  const { unreadable, findings } = checkRepo(root);
  if (unreadable) { console.log(`[login-window-rule] cannot read ${unreadable} — not checked, not a pass`); process.exit(2); }
  for (const f of findings) console.log(`${f.file}:${f.line} ${f.id} — ${f.why}`);
  console.log(`[login-window-rule] ${FILES.length} files, ${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}
