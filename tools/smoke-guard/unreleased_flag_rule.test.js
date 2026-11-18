#!/usr/bin/env node
'use strict';
/* Smoke on production / training must prove unreleased work stays hidden
 * (docs/sdd/smoke-unreleased-flag-gate R1–R11).
 *
 * Owner 2026-11-18: work whose Jira fix version releases after the test day must be flagged off on
 * the web; every one that shows is listed as "ticket · fix version · env". This test keeps that
 * stage in the workflow and the command.
 *
 *   node tools/smoke-guard/unreleased_flag_rule.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const skill = fs.readFileSync(path.join(ROOT, 'skills', 'smoke-test-workflow', 'SKILL.md'), 'utf8');
const cmd = fs.readFileSync(path.join(ROOT, 'commands', 'smoke-test.md'), 'utf8');

const HEADING = '## Stage 3.5 — Unreleased-work check (production / training only)';

function section(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return '';
  const next = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, next === -1 ? undefined : next);
}

const stage = section(skill, HEADING);
const mustNever = section(skill, '## MUST / NEVER');
const stage8 = section(skill, '## Stage 8 — Notify');

const checks = [
  ['stage heading present', stage.length > 0],
  ['stage listed in Contents', skill.includes('- [Stage 3.5 — Unreleased-work check (production / training only)](#')],
  ['stage in progress checklist', skill.includes('- [ ] Stage 3.5 — Unreleased-work check (production / training only)')],
  ['R1 production / training only, skipped on dev and pre-prod', /production or a training environment/i.test(stage) && /dev and pre-prod/i.test(stage)],
  ['R2 test date measured with date', /`date`/.test(stage) && /test date/i.test(stage)],
  ['R3 future = releaseDate after the test date', /`releaseDate` is after the test date/.test(stage)],
  ['R3 same-day release counts as released', /on the test day counts as released/i.test(stage)],
  ['R3 no-date versions named, not counted', /no release date — not checked/.test(stage)],
  ['R4 every ticket via search/jql, paged by nextPageToken to isLast', /every ticket/i.test(stage) && stage.includes('/rest/api/3/search/jql') && /nextPageToken/.test(stage) && /isLast/.test(stage)],
  ['R4 count cross-checked with approximate-count', stage.includes('/rest/api/3/search/approximate-count')],
  ['R4 removed v2 search never used as the call', !/`GET \/rest\/api\/2\/search/.test(stage)],
  ['R5 surface from ticket + monorepo commits + flag', /git log --all --grep/.test(stage) && /flag/i.test(stage)],
  ['R5 unverifiable never counted as hidden', /never counted as `hidden`/i.test(stage)],
  ['R6 real UI, read-only, every role', /real UI/i.test(stage) && /read-only/i.test(stage) && /every role/i.test(stage)],
  ['R7 four outcomes', ['`hidden`', '`visible`', '`no UI surface`', '`unverifiable`'].every((o) => stage.includes(o))],
  ['R8 bullet format', stage.includes('พบงานของ ticket <KEY> (<summary>) · fix version <version> · แสดงบน <env> (<role>, <page>)')],
  ['R9 no bug opened without owner order', /never open a ticket or issue/i.test(stage)],
  ['R9 round not clean while a visible finding is open', /not reported clean/i.test(stage)],
  ['R9 notify carries the findings', /Unreleased work visible/.test(stage8)],
  ['MUST line for the check', /\*\*MUST\*\* run Stage 3\.5/.test(mustNever)],
  ['R10 training NEVER narrowed to owner order', /\*\*NEVER\*\* run this against training unless the owner named it for this round/.test(mustNever)],
  ['R10 old blanket training ban gone', !/\*\*NEVER\*\* run this against training — real people work there\./.test(mustNever)],
  ['command points at Stage 3.5', /Stage 3\.5/.test(cmd) && /fix version/i.test(cmd)],
];

let fail = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) fail += 1;
}
console.log(`\n${checks.length - fail}/${checks.length} passed`);
process.exit(fail ? 1 : 0);
