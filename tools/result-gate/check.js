#!/usr/bin/env node
'use strict';

/**
 * Result quality gate — the mechanical layers of references/result-quality-gate.md.
 *
 * Reads a results JSONL (one final verdict line per case) and refuses the round when a
 * line breaks a rule a machine can decide. It does NOT judge whether the evidence shows
 * the expected result — that is the human/agent layers of the same reference. Green here
 * means "nothing mechanical is wrong", never "the results are right".
 *
 * Line fields: key, tc, verdict (PASSED|PWMI|FAILED|BLOCKED final; "PASSED WITH MINOR ISSUE" = PWMI;
 *   EVIDENCE_PENDING interim — clip exists, review pending, never a pass), actual, evidence[],
 *   clip_verified (true only after the video verifier passed that clip), verifier_failures[]
 *   (category names), er_frames_confirmed + er_frames_reviewer (motion/freeze-only waiver),
 *   evidence_mode ("api" → api_verified instead of clip_verified), root_cause, er_issue,
 *   remark, contact (BLOCKED), attempts, failed_attempts, intermittent (FAILED),
 *   requirement_source, requirement_quote (FAILED: confirmed spec, char-exact),
 *   code_refs[] (path:line read at origin/main), ticket_refs[] (KEY or KEY#comment) — BLOCKED/FAILED,
 *   role, env, skill, ts, superseded (true = an older line kept for history; not judged by
 *   per-line rules, but it needs a later live line for the same case — SUPERSEDED_ORPHAN).
 *
 * Usage:
 *   node tools/result-gate/check.js --results r.jsonl
 *        [--cases cases.json]   [{key,tc}] or {key:[tc,...]} — the in-scope case list
 *        [--env-map env.json]   {key: env} — the env each ticket must be tested on
 *        [--types types.json]   {key: issue type} — Story/Bug pick the required skill
 *
 * exit 0 = lines checked, no violation · 1 = violation(s) · 2 = nothing to check / bad input
 */

const fs = require('fs');

const VERDICTS = new Set(['PASSED', 'PWMI', 'FAILED', 'BLOCKED']);
// Interim verdicts: legal on a line, never final. EVIDENCE_PENDING = a clip exists and its review is
// not finished. It is never a pass, never takes the PASSED branch, and does not close an in-scope case.
const INTERIM_VERDICTS = new Set(['EVIDENCE_PENDING']);
// Long forms the references spell out (bug-priority-matrix.md "PWMI (PASSED WITH MINOR ISSUE)").
const VERDICT_ALIASES = { 'PASSED WITH MINOR ISSUE': 'PWMI' };
const MIN_FAILED_OBSERVATIONS = 3;

function canonicalVerdict(v) {
  if (blank(v)) return v;
  const s = String(v);
  return Object.prototype.hasOwnProperty.call(VERDICT_ALIASES, s) ? VERDICT_ALIASES[s] : s;
}

// Mirrors references/skill-routing.md § Jira issue type → skill. Other types: skill must
// be recorded, no mapping is invented.
const TYPE_SKILL = { story: 'testing-ticket-workflow', bug: 'retest-bug-workflow' };

// customer-escape-prevention.md §3: a passing row that hedges is not a pass.
const HEDGES = [/caveat/i, /not verifiable/i, /cannot verify/i, /\bassumed\b/i, /ยืนยันไม่ได้/, /ตรวจไม่ได้/];

// Layer 15: a BLOCKED/FAILED line quotes what was read — product code with a line number and a
// ticket (optionally with a comment id). Shape only; whether the sweep was thorough is judgement.
const SCREENSHOT = /\.(png|jpe?g|webp)$/i;
const CODE_REF = /\S+:\d+/;
const TICKET_REF = /\b[A-Z][A-Z0-9]+-\d+\b/;

// Owner rule (25/Sep): a clip that shows every ER point passes even when the video verifier fails
// ONLY on motion/freeze metrics — the metric is a signal to look at frames, not a verdict. It needs a
// reviewer record (er_frames_confirmed + er_frames_reviewer). Every other verifier failure — manifest
// missing or mismatched, resolution, wrong env/account, or any name not listed here — stays hard.
const SOFT_VERIFIER_FAILURES = new Set(['motion', 'low_motion', 'freeze', 'frozen_repeats', 'still_hold']);

function verifierFailures(l) {
  return (Array.isArray(l.verifier_failures) ? l.verifier_failures : []).map((x) => norm(x)).filter(Boolean);
}

// Lanes record the measured share beside the name (still_hold_28pct, frozen_repeats_47pct). The suffix
// is stripped only to look the name up; a name that is not soft without its suffix stays hard.
const MEASURE_SUFFIX = /_\d+(?:\.\d+)?(?:pct|%)?$/;

function isSoftFailure(name) {
  return SOFT_VERIFIER_FAILURES.has(name) || SOFT_VERIFIER_FAILURES.has(name.replace(MEASURE_SUFFIX, ''));
}

function hardFailures(l) {
  return verifierFailures(l).filter((x) => !isSoftFailure(x));
}

function clipAccepted(l) {
  if (hardFailures(l).length) return false;
  if (l.clip_verified === true) return true;
  return verifierFailures(l).length > 0 && l.er_frames_confirmed === true && !blank(l.er_frames_reviewer);
}

function blank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

function norm(v) {
  return String(v === undefined || v === null ? '' : v).trim().toLowerCase();
}

function parseJsonl(text) {
  const lines = [];
  const errors = [];
  String(text)
    .split(/\r?\n/)
    .forEach((raw, i) => {
      if (raw.trim() === '') return;
      try {
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('not an object');
        obj.__lineNo = i + 1;
        lines.push(obj);
      } catch (e) {
        errors.push({ lineNo: i + 1, message: e.message });
      }
    });
  return { lines, errors };
}

function normalizeCases(raw) {
  if (Array.isArray(raw)) return raw.map((c) => ({ key: c.key, tc: c.tc }));
  const out = [];
  for (const [key, tcs] of Object.entries(raw || {})) for (const tc of tcs) out.push({ key, tc });
  return out;
}

function checkResults(lines, opts = {}) {
  const violations = [];
  const add = (rule, l, msg) => violations.push({ rule, key: (l && l.key) || '-', tc: (l && l.tc) || '-', msg });

  if (!lines.length) {
    add('NO_RESULTS', null, 'no result lines — nothing measured is not green');
    return { checked: 0, passed: 0, pending: 0, violations };
  }

  const finals = new Map();
  let passed = 0;
  let pending = 0;
  // Superseded lines are history: no per-line rule judges them. The one check they keep is that a
  // later live line exists for the same case (checked after the loop).
  const history = [];
  const lastLive = new Map();
  lines.forEach((l, i) => {
    if (l.superseded === true) history.push([l, i]);
    else lastLive.set(l.key + '\u0000' + l.tc, i);
  });
  for (const l of lines) {
    if (l.superseded === true) continue;
    const verdict = canonicalVerdict(l.verdict);
    const missing = ['key', 'tc', 'verdict', 'ts'].filter((f) => blank(l[f]));
    if (missing.length) add('SCHEMA', l, 'missing ' + missing.join(', '));
    if (!blank(verdict) && !VERDICTS.has(verdict) && !INTERIM_VERDICTS.has(verdict)) add('SCHEMA', l, 'verdict "' + l.verdict + '" is not one of ' + [...VERDICTS, ...INTERIM_VERDICTS].join('/'));
    if (!blank(l.ts) && Number.isNaN(Date.parse(l.ts))) add('SCHEMA', l, 'ts "' + l.ts + '" is not a timestamp');
    if (blank(l.role)) add('ROLE_MISSING', l, 'no role recorded');
    if (blank(l.env)) add('ENV_MISSING', l, 'no env recorded');

    const hard = hardFailures(l);
    if (hard.length) add('CLIP_HARD_FAILURE', l, 'video verifier hard failure(s): ' + hard.join(', ') + ' — re-capture or fix the clip; a reviewer cannot waive these');

    const ev = Array.isArray(l.evidence) ? l.evidence.filter((e) => !blank(e)) : [];

    if (INTERIM_VERDICTS.has(verdict)) {
      if (!ev.length) add('PENDING_NO_EVIDENCE', l, verdict + ' without evidence — the clip under review must be listed');
    } else if (verdict === 'PASSED') {
      if (!ev.length) add('PASS_NO_EVIDENCE', l, 'PASSED with no evidence');
      const verified = l.evidence_mode === 'api' ? l.api_verified === true : clipAccepted(l);
      if (!verified) add('PASS_CLIP_UNVERIFIED', l, l.evidence_mode === 'api' ? 'PASSED without api_verified' : 'PASSED without an accepted clip (clip_verified, or motion/freeze-only verifier_failures + er_frames_confirmed + er_frames_reviewer)');
      if (HEDGES.some((re) => re.test(String(l.actual || '')))) add('PASS_HEDGED', l, 'PASSED but the actual result hedges: "' + l.actual + '"');
    } else if (VERDICTS.has(verdict)) {
      if (blank(l.root_cause)) add('NONPASS_NO_ROOT_CAUSE', l, verdict + ' without root_cause');
      if (blank(l.actual)) add('NONPASS_NO_ACTUAL', l, verdict + ' without an actual result');
      if ((verdict === 'PWMI' || verdict === 'FAILED') && blank(l.er_issue)) add('DEFECT_NO_ER_ISSUE', l, verdict + ' without er_issue (which ER the defect breaks)');
      if (verdict === 'BLOCKED') {
        if (blank(l.remark)) add('BLOCKED_NO_REMARK', l, 'BLOCKED without remark (what is missing)');
        if (blank(l.contact)) add('BLOCKED_NO_CONTACT', l, 'BLOCKED without contact (who can unblock it)');
      }
      if (verdict === 'BLOCKED' || verdict === 'FAILED') {
        const refs = (v) => (Array.isArray(v) ? v : []).map(String);
        const code = refs(l.code_refs).some((r) => CODE_REF.test(r));
        const ticket = refs(l.ticket_refs).some((r) => TICKET_REF.test(r));
        if (!code || !ticket) add('NO_SOURCE_SWEEP', l, verdict + ' must quote the sources read — ' + (code ? '' : 'no code_refs path:line') + (code || ticket ? '' : ' and ') + (ticket ? '' : 'no ticket_refs key'));
      }
      if (verdict === 'FAILED') {
        // Layer 17: a FAILED is a defect candidate — it needs the confirmed requirement quoted
        // char-exact, a clip that passed the video verifier, and a still of the failing point.
        if (blank(l.requirement_source) || blank(l.requirement_quote)) add('FAILED_NO_REQUIREMENT', l, 'FAILED without requirement_source + char-exact requirement_quote');
        if (!clipAccepted(l)) add('FAILED_NO_VERIFIED_CLIP', l, 'FAILED without an accepted clip (clip_verified, or motion/freeze-only verifier_failures + er_frames_confirmed + er_frames_reviewer)');
        if (!ev.some((e) => SCREENSHOT.test(String(e)))) add('FAILED_NO_SCREENSHOT', l, 'FAILED without a screenshot in evidence');
      }
      if (verdict === 'FAILED') {
        const att = Number(l.attempts);
        const fail = Number(l.failed_attempts);
        const counted = Number.isInteger(att) && Number.isInteger(fail) && att >= 1 && fail >= 1 && fail <= att;
        const reproduced = counted && att >= MIN_FAILED_OBSERVATIONS && fail === att;
        const labelled = l.intermittent === true && counted;
        if (!reproduced && !labelled) {
          add('FAILED_NOT_REPRODUCED', l, 'FAILED needs ' + MIN_FAILED_OBSERVATIONS + '/' + MIN_FAILED_OBSERVATIONS + '+ failing observations, or intermittent:true with attempts/failed_attempts (got ' + (counted ? fail + '/' + att : 'no counts') + ')');
        }
      }
    }

    if (verdict === 'PASSED') passed += 1;
    else if (INTERIM_VERDICTS.has(verdict)) pending += 1;
    const id = l.key + '\u0000' + l.tc;
    if (!finals.has(id)) finals.set(id, []);
    finals.get(id).push(l);
  }

  for (const [l, i] of history) {
    const live = lastLive.get(l.key + '\u0000' + l.tc);
    if (live === undefined || live < i) add('SUPERSEDED_ORPHAN', l, 'superseded line ' + (l.__lineNo || i + 1) + ' has no later live line for this case — history needs the line that replaced it');
  }

  for (const group of finals.values()) {
    if (group.length < 2) continue;
    const verdicts = new Set(group.map((l) => l.verdict));
    const lineNos = group.map((l) => l.__lineNo || '?').join(', ');
    if (verdicts.size > 1) add('CONFLICT', group[0], 'final lines disagree (' + [...verdicts].join(' vs ') + ') at lines ' + lineNos + ' — keep one, mark the rest superseded');
    else add('DUPLICATE', group[0], group.length + ' final lines at lines ' + lineNos + ' — keep one, mark the rest superseded');
  }

  if (opts.cases) {
    const scope = new Set(opts.cases.map((c) => c.key + '\u0000' + c.tc));
    for (const c of opts.cases) {
      const group = finals.get(c.key + '\u0000' + c.tc);
      if (!group) add('MISSING_CASE', c, 'in-scope case has no final result line');
      else if (group.every((l) => INTERIM_VERDICTS.has(canonicalVerdict(l.verdict)))) add('CASE_PENDING', group[0], 'in-scope case has only an interim verdict (' + group[0].verdict + ') — finish the review before the round closes');
    }
    for (const group of finals.values()) if (!scope.has(group[0].key + '\u0000' + group[0].tc)) add('OUT_OF_SCOPE', group[0], 'result for a case not in the case list');
  }

  if (opts.envMap) {
    for (const group of finals.values()) {
      for (const l of group) {
        if (!(l.key in opts.envMap)) add('ENV_UNMAPPED', l, 'ticket not in the env map — cannot confirm the env');
        else if (!blank(l.env) && norm(l.env) !== norm(opts.envMap[l.key])) add('ENV_MISMATCH', l, 'tested on "' + l.env + '", ticket env is "' + opts.envMap[l.key] + '"');
      }
    }
  }

  if (opts.types) {
    for (const group of finals.values()) {
      for (const l of group) {
        const type = opts.types[l.key];
        if (type === undefined) continue;
        const want = TYPE_SKILL[norm(type)];
        if (blank(l.skill)) add('SKILL_MISSING', l, 'no skill recorded for a ' + type);
        else if (want && norm(l.skill) !== want) add('SKILL_MISMATCH', l, type + ' must be tested with ' + want + ', line says ' + l.skill);
      }
    }
  }

  return { checked: lines.length, passed, pending, violations };
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error('cannot read ' + label + ' ' + file + ': ' + e.message);
  }
}

function main(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) {
      console.error('usage: check.js --results r.jsonl [--cases f] [--env-map f] [--types f]');
      return 2;
    }
    args[argv[i].slice(2)] = argv[i + 1];
  }
  if (!args.results) {
    console.error('result-gate: --results is required');
    return 2;
  }
  let text;
  const opts = {};
  try {
    text = fs.readFileSync(args.results, 'utf8');
    if (args.cases) opts.cases = normalizeCases(readJson(args.cases, 'case list'));
    if (args['env-map']) opts.envMap = readJson(args['env-map'], 'env map');
    if (args.types) opts.types = readJson(args.types, 'type map');
  } catch (e) {
    console.error('result-gate: ' + e.message + ' — could not check, which is not a pass');
    return 2;
  }
  const { lines, errors } = parseJsonl(text);
  if (!lines.length && !errors.length) {
    console.error('result-gate: ' + args.results + ' has 0 result lines — nothing measured is not green');
    return 2;
  }
  const { checked, passed, pending, violations } = checkResults(lines, opts);
  for (const e of errors) console.log('PARSE line ' + e.lineNo + ': ' + e.message);
  for (const v of violations) console.log(v.rule + ' ' + v.key + ' ' + v.tc + ': ' + v.msg);
  const bad = violations.length + errors.length;
  console.log('result-gate: ' + checked + ' result line(s) checked, ' + passed + ' passed, ' + pending + ' evidence-pending (not a pass), ' + errors.length + ' unparseable, ' + violations.length + ' violation(s)');
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { SOFT_VERIFIER_FAILURES, checkResults, parseJsonl, normalizeCases, main, VERDICTS, INTERIM_VERDICTS, VERDICT_ALIASES, canonicalVerdict, TYPE_SKILL };
