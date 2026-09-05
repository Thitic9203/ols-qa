#!/usr/bin/env node
'use strict';

/**
 * The post-mortem gate — layer 7 of the ten.
 *
 *   node tools/postmortem-guard/check.js          # validate everything
 *   node tools/postmortem-guard/check.js --debt   # print open debt only (for humans/hooks)
 *
 * Exit codes follow this repo's convention, and the third one is the point:
 *   0  clean
 *   1  findings
 *   2  could not run — a gate that cannot run is NEVER a pass
 *
 * `--debt` is the one mode that exits 0 even with open rows: it reports, it does not judge.
 * The judging is done by the pre-commit hook and by CI, which call the default mode.
 */

const fs = require('fs');
const path = require('path');
const R = require('./postmortem_rules');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'docs', 'post-mortem');
const LEDGER = path.join(DIR, 'PENDING.md');
const INDEX = path.join(DIR, 'README.md');

function die(msg) {
  console.error(`[postmortem-guard] CANNOT RUN: ${msg}`);
  process.exit(2);
}

function main() {
  const debtOnly = process.argv.includes('--debt');

  if (!fs.existsSync(DIR)) die(`missing directory ${path.relative(ROOT, DIR)}`);
  if (!fs.existsSync(LEDGER)) die(`missing ledger ${path.relative(ROOT, LEDGER)}`);

  let ledgerText;
  let indexText = '';
  try {
    ledgerText = fs.readFileSync(LEDGER, 'utf8');
    if (fs.existsSync(INDEX)) indexText = fs.readFileSync(INDEX, 'utf8');
  } catch (e) {
    die(`unreadable: ${e.message}`);
  }

  const { rows, problems: parseProblems } = R.parseLedger(ledgerText);
  const open = R.openRows(rows);

  if (debtOnly) {
    if (open.length === 0) {
      console.log('[postmortem-guard] no open post-mortem debt.');
      return 0;
    }
    console.log(`[postmortem-guard] ${open.length} OPEN post-mortem debt row(s) — เขียนรายงานก่อนทำอย่างอื่น:`);
    for (const r of open) console.log(`  - ${r.id} (${r.occurred})  ${r.symptom}`);
    console.log(`  แม่แบบ: docs/post-mortem/TEMPLATE.md  ·  ปิดแถวใน docs/post-mortem/PENDING.md`);
    return 0;
  }

  let reportNames;
  try {
    reportNames = fs.readdirSync(DIR).filter((f) => R.REPORT_FILE_RE.test(f)).sort();
  } catch (e) {
    die(`cannot list ${path.relative(ROOT, DIR)}: ${e.message}`);
  }

  const reportTexts = {};
  const problems = [...parseProblems, ...R.validateLedger(rows)];

  for (const name of reportNames) {
    let text;
    try {
      text = fs.readFileSync(path.join(DIR, name), 'utf8');
    } catch (e) {
      die(`cannot read ${name}: ${e.message}`);
    }
    reportTexts[name] = text;
    problems.push(...R.validateReport(name, text));
  }

  problems.push(...R.crossCheck({ reportNames, reportTexts, rows, indexText }));

  // Open debt is REPORTED here, never counted as a finding.
  //
  // Each layer does one thing. Blocking on debt is the pre-commit gate's job (layer 8),
  // because the moment a mistake is noticed the right next action is to commit the OPEN
  // row — and a checker that failed on it would block exactly that commit, punishing the
  // behaviour the whole system is built to encourage. Letting it fail CI as well would
  // leave main red for as long as a report is legitimately being written, which is how a
  // real red build gets trained into background noise.
  if (open.length > 0) {
    console.log(`[postmortem-guard] NOTICE: ${open.length} open debt row(s) — report(s) still owed:`);
    for (const r of open) console.log(`  - ${r.id} (${r.occurred})  ${r.symptom}`);
  }

  if (problems.length === 0) {
    // "clean" is about structure only, and the open count must be the real one: a summary
    // line that hardcodes "0 open" while debt is outstanding is precisely the kind of
    // confident-but-false output this whole system exists to stop.
    console.log(`[postmortem-guard] structure clean — ${reportNames.length} report(s), ${rows.length} ledger row(s), ${open.length} open.`);
    return 0;
  }

  console.log(`[postmortem-guard] ${problems.length} finding(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  return 1;
}

process.exit(main());
