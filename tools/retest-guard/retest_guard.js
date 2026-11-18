#!/usr/bin/env node
'use strict';

/**
 * The gate a retest comment passes before it is posted, and before the ticket
 * moves. Read-only: it reports and never edits.
 *
 *   node tools/retest-guard/retest_guard.js --manifest run.json [--out body.txt]
 *   node tools/retest-guard/retest_guard.js --body body.txt --format v2 --bug-type FE
 *
 * Exit codes — a scan that cannot run is never a pass:
 *   0  clean (mechanical rules only; judgement is still yours)
 *   1  findings
 *   2  could not run (bad arguments, unreadable file, malformed manifest JSON)
 *
 * What it does NOT decide, and never implies: whether the clip reached the target,
 * whether the cause is real, whether the expected side was verified against the
 * design. Those are the judgement gates in the workflow and no exit code stands
 * in for them.
 */

const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');
const M = require('./retest_manifest');
const RENDER = require('./retest_render');
const EVIDENCE = require('./retest_evidence');

function parseArgs(argv) {
  const a = { format: null, bugType: null, ticketType: null };
  for (let i = 2; i < argv.length; i += 1) {
    const k = argv[i];
    const next = () => argv[(i += 1)];
    if (k === '--manifest') a.manifest = next();
    else if (k === '--body') a.body = next();
    else if (k === '--out') a.out = next();
    else if (k === '--format') a.format = next();
    else if (k === '--bug-type') a.bugType = next();
    else if (k === '--ticket-type') a.ticketType = next();
    else if (k === '--evidence-dir') a.evidenceDir = next();
    else if (k === '--decisions') a.decisions = next();
    else if (k === '--verify-dir') a.verifyDir = next();
    else if (k === '--json') a.json = true;
    else if (k === '--help' || k === '-h') a.help = true;
    else return { error: `unknown argument: ${k}` };
  }
  if (!a.manifest && !a.body) return { error: 'nothing to check — pass --manifest and/or --body' };
  return a;
}

const USAGE = `retest-guard — the mechanical gate for a retest comment

  --manifest <file>     run.json; validated, rendered, then scanned
  --body <file>         an already-written body to scan (skips the manifest checks)
  --out <file>          write the rendered body here (with --manifest)
  --format v2|v3        for --body; defaults to v2
  --bug-type FE|API     for --body; defaults to FE
  --ticket-type Bug|Task  for --body; column 2 must then read ER (Bug) or AC (Task)
  --evidence-dir <dir>  check that every evidence file named in the manifest exists
  --decisions <file>    the round's ROUND_DECISIONS.md (pre-review checks R3, R4)
  --verify-dir <dir>    where the verify_video outputs (*.txt) are; defaults to --evidence-dir
  --json                machine-readable output

Pre-review mode (--evidence-dir and/or --decisions): also checks width and role claims
against evidence, clip verifier results or owner decisions, times in the decisions file,
and inline image width (docs/sdd/test-time-cut-guard/spec.md). A check it cannot decide is
reported UNCHK and the run exits 2 — never 0.

exit 0 clean · 1 findings · 2 could not run (or something stayed unchecked)`;

function report(findings, asJson) {
  if (asJson) {
    process.stdout.write(JSON.stringify({ findings }, null, 2) + '\n');
    return;
  }
  if (!findings.length) {
    console.log('retest-guard: clean — mechanical rules pass.');
    console.log('             (judgement gates are not checked here and have not passed by implication)');
    return;
  }
  const errors = findings.filter((f) => f.severity === 'error' || !f.severity);
  const warns = findings.filter((f) => f.severity === 'warn');
  const unchk = findings.filter((f) => f.severity === 'unchecked');
  const label = { warn: 'WARN ', unchecked: 'UNCHK' };
  for (const f of findings) {
    const where = f.field ? `field ${f.field}` : `line ${f.line || '-'}`;
    console.log(`${label[f.severity] || 'ERROR'}  ${f.rule || f.field}  (${where})`);
    console.log(`        ${f.message}`);
    if (f.fix) console.log(`        fix: ${f.fix}`);
  }
  console.log(`\n${errors.length} error(s), ${warns.length} warning(s)${unchk.length ? `, ${unchk.length} unchecked — not a pass` : ''}`);
}

function main() {
  const a = parseArgs(process.argv);
  if (a.error) { console.error(a.error + '\n\n' + USAGE); return 2; }
  if (a.help) { console.log(USAGE); return 0; }

  const findings = [];
  let body = null;
  let format = a.format || R.FORMATS.WIKI;
  let bugType = a.bugType || 'FE';
  let ticketType = a.ticketType || null;

  if (a.manifest) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(a.manifest, 'utf8'));
    } catch (e) {
      console.error(`could not read manifest: ${e.message}`);
      return 2;
    }
    a.parsedManifest = manifest;
    const manifestFindings = M.validate(manifest);
    findings.push(...manifestFindings);
    format = manifest.format || format;
    bugType = manifest.bugType || bugType;
    ticketType = manifest.ticketType || ticketType;

    if (a.evidenceDir) {
      const named = [];
      (manifest.results || []).forEach((r) => (r.evidence || []).forEach((f) => named.push(f)));
      (manifest.cases || []).forEach((c) => (c.evidence || []).forEach((f) => named.push(f)));
      [...new Set(named)].forEach((f) => {
        if (!fs.existsSync(path.join(a.evidenceDir, f))) {
          findings.push({ rule: 'evidence-file-missing', field: f, severity: 'error',
            message: `evidence file named in the manifest is not in ${a.evidenceDir}`,
            fix: 'capture it, or make that row BLOCKED with the reason' });
        }
      });
    }

    if (!manifestFindings.some((f) => f.severity !== 'warn')) {
      try {
        body = RENDER.render(manifest);
      } catch (e) {
        findings.push({ rule: e.code || 'render-failed', field: '(render)', severity: 'error',
          message: e.message, fix: 'move that text into a section under the table and reference it' });
      }
      if (body && a.out) {
        fs.writeFileSync(a.out, body, 'utf8');
        a.wroteOut = true;
      }
    }
  }

  if (a.body) {
    try {
      body = fs.readFileSync(a.body, 'utf8');
    } catch (e) {
      console.error(`could not read body: ${e.message}`);
      return 2;
    }
  }

  if (body) findings.push(...R.scanBody(body, { format, bugType, ticketType }));

  if (a.evidenceDir || a.decisions) {
    if (a.decisions && !fs.existsSync(a.decisions)) {
      console.error(`could not read decisions file: ${a.decisions}`);
      return 2;
    }
    findings.push(...EVIDENCE.check({ manifest: a.parsedManifest || null, body, evidenceDir: a.evidenceDir,
      verifyDir: a.verifyDir, decisionsPath: a.decisions }));
  }

  report(findings, a.json);
  const hasErrors = findings.some((f) => f.severity === 'error' || !f.severity);
  const hasUnchecked = findings.some((f) => f.severity === 'unchecked');
  if (a.wroteOut && hasErrors && !a.json) {
    // The file exists so the findings can be read against it — but it is not postable,
    // and a rendered file sitting on disk looks finished.
    console.log(`\nNOTE: ${a.out} was written for inspection. It is NOT postable while findings stand.`);
  }
  if (hasErrors) return 1;
  return hasUnchecked ? 2 : 0;          // a check that could not be decided is not a pass
}

if (require.main === module) {
  let code;
  try {
    code = main();
  } catch (e) {
    console.error('retest-guard could not run: ' + (e && e.stack ? e.stack : e));
    code = 2;                        // a gate that cannot run is not a pass
  }
  process.exit(code);
}

module.exports = { parseArgs, main };
