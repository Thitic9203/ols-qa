'use strict';

/**
 * The retest run manifest — the data a retest produces, from which its Jira
 * comment is rendered.
 *
 * Why a manifest at all: coverage, scope, per-row evidence, the Role and Design
 * ref lines and the verdict wording were all things a person had to remember to
 * type correctly into free text. Here they are fields, so the comment is computed
 * and the arithmetic (`n/total`, "is this really a PASS") is done by code that a
 * test pins — not by the tired reader of a 900-line workflow.
 *
 * Scope is a first-class field. A retest of two named cases is a legitimate,
 * frequently-requested job; before this it could only be done by either breaking
 * the coverage gate or silently widening what the user asked for.
 *
 * Node >= 18, no dependencies.
 */

const RULES = require('./retest_rules');

const STATUSES = Object.freeze(['PASSED', 'FAILED', 'PWMI', 'BLOCKED']);
const PASSING = Object.freeze(['PASSED']);
const SCOPE_MODES = Object.freeze(['FULL', 'CASES']);

const REQUIRED_TOP = Object.freeze([
  'ticket', 'ticketType', 'bugType', 'format', 'env', 'role', 'date', 'build',
  'fixture', 'scope', 'contract', 'cases', 'results', 'verdict', 'lanes', 'testRunTime',
]);

/**
 * The only reasons a round with 2+ cases may run in ONE lane — references/parallel-test-lanes.md
 * §4 predicates a–e, in that order. Anything else ("faster to do it myself", "the guide does not
 * mention parallel") is the serial-by-habit the reference names as the main cost of long runs.
 */
const SERIAL_REASONS = Object.freeze([
  'one-account', // a. one account in total
  'shared-record', // b. every scenario shares one mutable record
  'env-forbids-concurrency', // c. documented rate limit, one OTP device, VPN seat limit
  'two-or-fewer-scenarios', // d. plan has ≤ 2 scenarios
  'user-asked-serial', // e. user asked for serial in chat
]);

function isNonEmptyString(v) { return typeof v === 'string' && v.trim() !== ''; }
function asArray(v) { return Array.isArray(v) ? v : []; }

/** Ids the round is answerable for, given its scope. */
function inScopeIds(m) {
  const all = asArray(m.contract).map((c) => c.id);
  if (!m.scope || m.scope.mode === 'FULL') return all;
  const named = new Set(asArray(m.scope.cases));
  const covered = new Set();
  asArray(m.cases).forEach((c) => {
    if (!named.has(c.id)) return;
    asArray(c.covers).forEach((id) => covered.add(id));
  });
  return all.filter((id) => covered.has(id));
}

/** Ids deliberately left out this round — they are shown, never dropped. */
function outOfScopeIds(m) {
  const inScope = new Set(inScopeIds(m));
  return asArray(m.contract).map((c) => c.id).filter((id) => !inScope.has(id));
}

/** Cases this round runs, given its scope. */
function inScopeCases(m) {
  if (!m.scope || m.scope.mode === 'FULL') return asArray(m.cases);
  const named = new Set(asArray(m.scope.cases));
  return asArray(m.cases).filter((c) => named.has(c.id));
}

/** `{n, total}` — n counts items that carry a status, not items that went well. */
function coverage(m) {
  const ids = inScopeIds(m);
  const byId = new Map(asArray(m.results).map((r) => [r.id, r]));
  const n = ids.filter((id) => byId.has(id) && STATUSES.includes(byId.get(id).status)).length;
  return { n, total: ids.length };
}

/**
 * Item counts for the footer. `met` is PASSED only — a PWMI or FAILED item carries a status but
 * did not meet its expected result (2026-10-13: a PWMI round printed "5 / 5 items met").
 */
function itemTally(m) {
  const ids = inScopeIds(m);
  const byId = new Map(asArray(m.results).map((r) => [r.id, r]));
  const st = ids.map((id) => (byId.get(id) || {}).status);
  const count = (s) => st.filter((x) => x === s).length;
  return { met: count('PASSED'), pwmi: count('PWMI'), failed: count('FAILED'), blocked: count('BLOCKED'), total: ids.length };
}

/** The verdict the results actually support — never the one that was hoped for. */
function computedVerdict(m) {
  const ids = inScopeIds(m);
  const byId = new Map(asArray(m.results).map((r) => [r.id, r]));
  // A scope that resolves to nothing verified nothing. `[].every(...)` is true, so
  // without this an unknown case id would render a confident PASSED over 0 / 0.
  if (ids.length === 0) return 'INCOMPLETE';
  const statuses = ids.map((id) => (byId.has(id) ? byId.get(id).status : null));
  if (statuses.some((s) => s === null)) return 'INCOMPLETE';
  // A status this module does not know is not a defect — it is an unanswerable question.
  // The ladder used to end in `return 'FAILED'`, so anything unrecognised was published as
  // a defect. `validate()` rejects such a row as well, but the two are called separately.
  if (statuses.some((s) => !STATUSES.includes(s))) return 'INCOMPLETE';

  if (statuses.every((s) => PASSING.includes(s))) return 'PASSED';

  // Report what the rows say, worst finding first. A BLOCKED row found no defect — it
  // reached nothing — so it can never turn a round into FAILED, and calling it that sends
  // a developer after a bug nobody observed.
  //
  // The BLOCKED branch used to read `every(...)`, which covered the all-blocked round and
  // left the PARTLY blocked one — two cases verified, a third unreachable — falling
  // through to the terminal FAILED. Measured 2026-09-06: ['PASSED','BLOCKED'] → 'FAILED'.
  // Ordering by severity instead of by shape removes the gap: a defect outranks an
  // unreached case, and an unreached case outranks nothing at all.
  if (statuses.some((s) => s === 'FAILED')) return 'FAILED';
  if (statuses.some((s) => s === 'PWMI')) return 'PWMI';
  if (statuses.some((s) => s === 'BLOCKED')) return 'BLOCKED';
  return 'INCOMPLETE';
}

/** The summary line's wording, including the scope marker when the round is partial. */
function verdictLine(m) {
  const v = computedVerdict(m);
  if (!m.scope || m.scope.mode === 'FULL') return v;
  return `${v} (scoped: ${asArray(m.scope.cases).join(', ')})`;
}

function err(field, message, fix) { return { field, message, fix, severity: 'error' }; }

/**
 * The lane plan the round actually ran (references/parallel-test-lanes.md §1, §3, §4).
 * Prose said "parallel by default, one leased account per lane"; rounds still ran serial in one
 * agent on a shared login. Here the plan is data: every in-scope case sits in exactly one lane,
 * every lane held a session lease, no account is in two lanes, and a one-lane round with 2+
 * cases names its §4 predicate.
 */
function validateLanes(m, caseIds) {
  const out = [];
  const lanes = m.lanes;
  if (!Array.isArray(lanes) || lanes.length === 0) {
    return [err('lanes', 'lanes must be a non-empty list [{id, account, cases, lease}]',
      'record the lane plan the round ran (parallel-test-lanes.md §2)')];
  }
  const where = new Map(); // case id -> lane ids
  const accountLanes = new Map(); // account -> lane ids
  lanes.forEach((l, i) => {
    const lane = l && typeof l === 'object' ? l : {};
    if (!isNonEmptyString(lane.id)) out.push(err(`lanes[${i}].id`, 'every lane needs an id', 'L1, L2, …'));
    const accounts = Array.isArray(lane.account) ? lane.account : [lane.account];
    if (accounts.length === 0 || !accounts.every(isNonEmptyString)) {
      out.push(err(`lanes[${i}].account`, 'every lane names its leased account (or a list for a multi-role lane)',
        'the account alias from the guide — never an email or a password'));
    }
    accounts.filter(isNonEmptyString).forEach((a) => {
      if (!accountLanes.has(a)) accountLanes.set(a, []);
      accountLanes.get(a).push(lane.id || `#${i}`);
    });
    if (lane.lease !== true) {
      out.push(err(`lanes[${i}].lease`, 'lease must be true — the lane held a session lease on its login file',
        'acquire the lease before loading the login file, release it in finally'));
    }
    if (!Array.isArray(lane.cases) || lane.cases.length === 0) {
      out.push(err(`lanes[${i}].cases`, 'a lane with no cases ran nothing', 'list the TC ids it ran, or drop the lane'));
    }
    asArray(lane.cases).forEach((cid) => {
      if (!caseIds.has(cid)) out.push(err(`lanes[${i}].cases`, `lane case "${cid}" is not in cases[]`, 'lanes name cases that exist'));
      if (!where.has(cid)) where.set(cid, []);
      where.get(cid).push(lane.id || `#${i}`);
    });
  });
  accountLanes.forEach((ls, a) => {
    if (ls.length > 1) {
      out.push(err('lanes', `account "${a}" is leased to ${ls.length} lanes (${ls.join(', ')})`,
        'one account, one lane, for the whole run (parallel-test-lanes.md §3)'));
    }
  });
  const run = inScopeCases(m).map((c) => c.id);
  run.forEach((cid) => {
    const ls = where.get(cid) || [];
    if (ls.length === 0) out.push(err('lanes', `case "${cid}" is in no lane`, 'every in-scope case is in exactly one lane'));
    else if (ls.length > 1) out.push(err('lanes', `case "${cid}" is in ${ls.length} lanes (${ls.join(', ')})`, 'every in-scope case is in exactly one lane'));
  });
  if (run.length >= 2 && lanes.length === 1) {
    if (!SERIAL_REASONS.includes(m.serialReason)) {
      out.push(err('serialReason', `${run.length} cases ran in 1 lane without a §4 predicate`
        + (m.serialReason === undefined ? '' : ` ("${m.serialReason}" is not one)`),
        `fan out to lanes, or set serialReason to one of ${SERIAL_REASONS.join(' | ')}`));
    } else if (m.serialReason === 'two-or-fewer-scenarios' && run.length > 2) {
      out.push(err('serialReason', `"two-or-fewer-scenarios" but the round ran ${run.length} cases`,
        'the predicate must be true of the round'));
    }
  }
  return out;
}

/**
 * Validate a manifest. Returns findings — empty means every mechanical check
 * passed. It says nothing about whether the testing itself was any good.
 */
function validate(m) {
  const out = [];
  if (!m || typeof m !== 'object') return [err('(root)', 'manifest is not an object', 'write run.json first')];

  REQUIRED_TOP.forEach((k) => {
    const v = m[k];
    const empty = v === undefined || v === null || v === ''
      || (Array.isArray(v) && v.length === 0);
    if (empty) out.push(err(k, `required field "${k}" is missing or empty`, 'fill it from the ticket, not from memory'));
  });
  if (out.length) return out;

  if (!['Bug', 'Task'].includes(m.ticketType)) out.push(err('ticketType', 'must be "Bug" or "Task"', 'a Task is retested against its AC'));
  if (!['FE', 'API'].includes(m.bugType)) out.push(err('bugType', 'must be "FE" or "API"', 'it decides the comment format and the evidence rules'));
  if (!['v2', 'v3'].includes(m.format)) out.push(err('format', 'must be "v2" (wiki) or "v3" (ADF)', 'locked at Step 3, never switched later'));
  if (!SCOPE_MODES.includes((m.scope || {}).mode)) out.push(err('scope.mode', `must be one of ${SCOPE_MODES.join(' | ')}`, 'FULL, or CASES with the ids the user named'));

  // The usage marker is optional; an absent key takes its default, a present one must be known.
  if (m.marker !== undefined) {
    if (!m.marker || typeof m.marker !== 'object' || Array.isArray(m.marker)) {
      out.push(err('marker', 'marker must be an object {src, via, agent}', 'omit it to take the defaults'));
    } else {
      [['src', RULES.MARKER_SRC], ['via', RULES.MARKER_VIA], ['agent', RULES.MARKER_AGENT]].forEach(([k, allowed]) => {
        if (m.marker[k] !== undefined && !allowed.includes(m.marker[k])) {
          out.push(err(`marker.${k}`, `"${m.marker[k]}" is not one of ${allowed.join(' | ')}`, 'name where the run came from, not a guess'));
        }
      });
    }
  }

  // The run time is measured by tools/run-time/measure.js, never estimated (owner, 2026-10-13).
  const rt = m.testRunTime;
  if (!rt || typeof rt !== 'object' || Array.isArray(rt)) {
    out.push(err('testRunTime', 'testRunTime must be an object {minutes, hasVideo, method}',
      'run tools/run-time/measure.js over every lane evidence dir and copy minutes/hasVideo/method'));
  } else if (rt.notMeasured === true) {
    // Owner, 2026-10-14: a round where every case is BLOCKED ran nothing — nothing to measure.
    const statuses = [...asArray(m.cases).map((c) => c && c.status), ...asArray(m.results).map((r) => r && r.status)];
    if (statuses.length === 0 || statuses.some((st) => st !== 'BLOCKED')) {
      out.push(err('testRunTime.notMeasured', 'notMeasured is allowed only when every case and result is BLOCKED',
        'a case ran — measure it with tools/run-time/measure.js and copy minutes/hasVideo/method'));
    }
    if (rt.reason !== 'no-case-ran') {
      out.push(err('testRunTime.reason', 'a not-measured run time needs reason "no-case-ran"', 'set reason to "no-case-ran"'));
    }
  } else {
    if (typeof rt.minutes !== 'number' || !Number.isFinite(rt.minutes) || rt.minutes <= 0) {
      out.push(err('testRunTime.minutes', 'minutes must be a positive measured number — 0 or a guess is not a measurement',
        'measure it; when the tool cannot measure (exit 2), fix the evidence dirs instead of typing a number'));
    }
    if (typeof rt.hasVideo !== 'boolean') {
      out.push(err('testRunTime.hasVideo', 'hasVideo must be true or false', 'copy it from the measure output'));
    }
    if (rt.method !== RULES.RUN_TIME_METHOD) {
      out.push(err('testRunTime.method', `method must be "${RULES.RUN_TIME_METHOD}"`, 'copy it from the measure output — an estimate has no method id'));
    }
  }

  if (m.bugType === 'FE' && !isNonEmptyString(m.designRef)) {
    out.push(err('designRef', 'a UI retest carries the design node, or the reason there is none',
      'record the node link, or "none, asked <who> <date>" and hold the visual points BLOCKED'));
  }

  // A duplicate id corrupts silently: the second entry overrides the first in every
  // lookup, the table renders two identical rows, and the coverage arithmetic counts
  // both — so 2 / 2 reads as complete for one real item.
  const dupes = (list, label) => {
    const seen = new Set();
    const dup = new Set();
    asArray(list).forEach((x) => { if (seen.has(x.id)) dup.add(x.id); else seen.add(x.id); });
    dup.forEach((id) => out.push(err(label, `duplicate id "${id}"`, 'ids are unique — merge the entries or renumber')));
  };
  dupes(m.contract, 'contract');
  dupes(m.cases, 'cases');
  dupes(m.results, 'results');

  const contractIds = new Set(asArray(m.contract).map((c) => c.id));
  asArray(m.contract).forEach((c, i) => {
    if (!isNonEmptyString(c.id)) out.push(err(`contract[${i}].id`, 'every contract item needs a stable id', 'ER1… for a Bug, AC1… for a Task'));
    if (!isNonEmptyString(c.text)) out.push(err(`contract[${i}].text`, 'the item is quoted char-exact from the ticket', 'paraphrase is how the wrong expected gets tested'));
  });

  const caseIds = new Set(asArray(m.cases).map((c) => c.id));
  asArray(m.cases).forEach((c, i) => {
    if (!isNonEmptyString(c.id)) out.push(err(`cases[${i}].id`, 'every case needs a stable id', 'TC_01…'));
    if (!isNonEmptyString(c.role)) out.push(err(`cases[${i}].role`, 'every case names the role it was run as', 'a role named in the ticket is a role recorded'));
    if (!STATUSES.includes(c.status)) out.push(err(`cases[${i}].status`, `status must be one of ${STATUSES.join(' | ')}`, 'a planned-but-unrun case is BLOCKED with its reason'));
    asArray(c.covers).forEach((id) => {
      if (!contractIds.has(id)) out.push(err(`cases[${i}].covers`, `covers unknown contract id "${id}"`, 'every covered id exists in contract[]'));
    });
    if (asArray(c.covers).length === 0) out.push(err(`cases[${i}].covers`, 'a case that covers nothing is not scoped', 'name the ER/AC ids it verifies'));
  });

  if ((m.scope || {}).mode === 'CASES') {
    asArray(m.scope.cases).forEach((id) => {
      if (!caseIds.has(id)) out.push(err('scope.cases', `scoped case "${id}" is not in cases[]`, 'scope names cases that exist'));
    });
    if (asArray(m.scope.cases).length === 0) out.push(err('scope.cases', 'CASES scope with no case ids', 'name them, or use FULL'));
    if (inScopeIds(m).length === 0) {
      out.push(err('scope.cases', 'the scoped cases cover no contract item — this round would verify nothing',
        'name cases that cover the ids you mean to retest'));
    }
  }

  validateLanes(m, caseIds).forEach((f) => out.push(f));

  const ids = inScopeIds(m);
  const byId = new Map(asArray(m.results).map((r) => [r.id, r]));
  asArray(m.results).forEach((r, i) => {
    if (!contractIds.has(r.id)) out.push(err(`results[${i}].id`, `result for unknown contract id "${r.id}"`, 'results map 1:1 onto contract items'));
    if (!STATUSES.includes(r.status)) out.push(err(`results[${i}].status`, `status must be one of ${STATUSES.join(' | ')}`, 'no row is status-less'));
    if (!isNonEmptyString(r.actual)) out.push(err(`results[${i}].actual`, 'the observed result is missing', 'what did the screen or the response actually do'));
    const passing = PASSING.includes(r.status);
    if (passing && m.bugType === 'FE' && asArray(r.evidence).length === 0) {
      out.push(err(`results[${i}].evidence`, 'a passing row carries no evidence', 'passed rows carry evidence too — that is how a layout defect survived a green round'));
    }
  });

  ids.forEach((id) => {
    if (!byId.has(id)) out.push(err('results', `in-scope item "${id}" has no result row`, 'run it, or record it BLOCKED with the reason — never drop it'));
  });

  const computed = computedVerdict(m);
  if (computed === 'INCOMPLETE') {
    out.push(err('verdict', 'an in-scope item has no result — the retest is not complete', 'close the gap before drafting'));
  } else if (m.verdict !== computed) {
    out.push(err('verdict', `manifest says ${m.verdict}, the results say ${computed}`,
      'the verdict follows the rows; partial coverage is never a PASS'));
  }

  if (computed !== 'PASSED') {
    if (!isNonEmptyString((m.rootCause || {}).text)) out.push(err('rootCause.text', 'a non-PASSED round carries its root cause', 'Step 4g investigation, condensed'));
    if (!['Confirmed', 'Suspected', 'Unknown — not investigated'].includes((m.rootCause || {}).label)) {
      out.push(err('rootCause.label', 'label must be Confirmed / Suspected / Unknown — not investigated', 'a Suspected cause read as Confirmed sends a dev to the wrong layer'));
    }
    if (asArray(m.resolutionOptions).length < 2) out.push(err('resolutionOptions', 'two mutually exclusive options, each with a role owner', 'code change, or spec change'));
    if (!isNonEmptyString(m.decidedBy)) out.push(err('decidedBy', 'name the role that decides', 'role only, never a person'));
    if (typeof m.symptomGone !== 'boolean' && m.symptomGone !== SYMPTOM_NOT_VERIFIED) {
      out.push(err('symptomGone', `state whether the originally reported symptom is gone: true, false, or "${SYMPTOM_NOT_VERIFIED}"`,
        '"FAILED" alone reads as "the fix did not work"; use "' + SYMPTOM_NOT_VERIFIED + '" for a Task or a round that never reached the symptom'));
    }
  }

  return out;
}

/**
 * The question to put to the owner when a destination cannot hold the real status.
 *
 * A results sheet's dropdown is a fixed vocabulary. When the status a case actually
 * has is not in it, the wrong move is to pick the nearest word — that silently
 * rewrites the result. Show both lists and let the owner decide what goes in the cell.
 *
 * @param {string[]} caseStatuses  the statuses this round actually produced
 * @param {string[]} destinationStatuses  what the destination offers (read from it, never assumed)
 * @returns {{missing: string[], question: string}|null}  null when everything fits
 */
function destinationMismatch(caseStatuses, destinationStatuses) {
  const have = new Set((destinationStatuses || []).map((s) => String(s).trim().toUpperCase()));
  const missing = [...new Set(caseStatuses || [])].filter((s) => !have.has(String(s).trim().toUpperCase()));
  if (!missing.length) return null;
  return {
    missing,
    question: `สถานะจริงของเคสคือ ${missing.join(', ')} `
      + `แต่ในชีทตอนนี้มีสถานะให้เลือกเป็น ${(destinationStatuses || []).join(' / ')} `
      + 'ซึ่งไม่ตรงกับสถานะจริง จะให้ระบุในชีทเป็นอะไรครับ',
  };
}

/**
 * The third value of `symptomGone`, beside true ("gone") and false ("still present").
 * A Task has no originally reported symptom, and a round in which nothing ran observed
 * nothing; either of the two boolean values there states a check that never happened.
 */
const SYMPTOM_NOT_VERIFIED = 'not verified';

module.exports = {
  SYMPTOM_NOT_VERIFIED,
  STATUSES,
  PASSING,
  SCOPE_MODES,
  REQUIRED_TOP,
  SERIAL_REASONS,
  validateLanes,
  inScopeIds,
  outOfScopeIds,
  inScopeCases,
  coverage,
  itemTally,
  computedVerdict,
  verdictLine,
  validate,
  destinationMismatch,
};
