#!/usr/bin/env node
'use strict';
/* Skill text guard (spec docs/sdd/helix-skill-quality R4, R5, R11).
 *
 * Fails when shipped skill text under skills/ references/ commands/:
 *   credential-ask  asks the user to give a password, bearer token, API key or other
 *                   credential (e.g. "ask user for a bearer token", "Login (user/password ...").
 *                   A line that forbids it ("never ask for a password") is not a violation.
 *   ticket-key      contains a real customer ticket key (OLS-<digits>). Use {ISSUE_KEY}.
 *                   references/ols-*.md is the OLS-only project guide: never synced to helix
 *                   (scripts/sync-skills-to-helix.sh), so real keys are allowed there.
 *
 *   node tools/skill-text-guard/check.js [--root <dir>]
 * exit 0 = clean · 1 = violation(s) printed as path:line rule text · 2 = unreadable root
 */
const fs = require('fs');
const path = require('path');

const DIRS = ['skills', 'references', 'commands'];
const SECRET = '(password|passcode|bearer token|access token|api key|token|credential|secret)';
const ASK_PATTERNS = [
  new RegExp(`\\b(ask|request|prompt)s?\\b[^.|]{0,25}\\b(the )?user\\b[^.|]{0,30}\\b(for|to (paste|send|type|share|provide|give))\\b[^.|]{0,40}\\b${SECRET}\\b`, 'i'),
  new RegExp(`\\b(paste|send|share|give) (me|us)\\b[^.|]{0,30}\\b${SECRET}\\b`, 'i'),
  /\buser\s*\/\s*password\b/i,
];
const NEGATION = /\b(never|do not|don't|must not|not accept|no password|without (a )?password|refuse)\b|ห้าม/i;
const TICKET = /\bOLS-\d+\b/;
const OLS_ONLY = /^references\/ols-[^/]+\.md$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

function checkText(rel, text) {
  const hits = [];
  text.split('\n').forEach((line, i) => {
    if (ASK_PATTERNS.some((re) => re.test(line)) && !NEGATION.test(line)) {
      hits.push({ file: rel, line: i + 1, rule: 'credential-ask', text: line.trim() });
    }
    if (TICKET.test(line) && !OLS_ONLY.test(rel.split(path.sep).join('/'))) hits.push({ file: rel, line: i + 1, rule: 'ticket-key', text: line.trim() });
  });
  return hits;
}

function run(root) {
  const hits = [];
  for (const d of DIRS) {
    for (const f of walk(path.join(root, d))) {
      hits.push(...checkText(path.relative(root, f), fs.readFileSync(f, 'utf8')));
    }
  }
  return hits;
}

module.exports = { checkText, run };

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  const root = i > -1 ? process.argv[i + 1] : path.resolve(__dirname, '..', '..');
  if (!root || !fs.existsSync(path.join(root, 'skills'))) {
    console.error(`skill-text-guard: no skills/ under ${root}`);
    process.exit(2);
  }
  const hits = run(root);
  for (const h of hits) console.log(`${h.file}:${h.line} ${h.rule} ${h.text.slice(0, 160)}`);
  console.log(hits.length ? `skill-text-guard: ${hits.length} violation(s)` : 'skill-text-guard: clean');
  process.exit(hits.length ? 1 : 0);
}
