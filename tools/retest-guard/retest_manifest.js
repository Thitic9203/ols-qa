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

const STATUSES = Object.freeze(['PASSED', 'FAILED', 'PWMI', 'BLOCKED']);
const PASSING = Object.freeze(['PASSED']);
const SCOPE_MODES = Object.freeze(['FULL', 'CASES']);

const REQUIRED_TOP = Object.freeze([
  'ticket', 'ticketType', 'bugType', 'format', 'env', 'role', 'date', 'build',
  'fixture', 'scope', 'contract', 'cases', 'results', 'verdict',
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

/** The verdict the results actually support — never the one that was hoped for. */
function computedVerdict(m) {
  const ids = inScopeIds(m);
  const byId = new Map(asArray(m.results).map((r) => [r.id, r]));
  const statuses = ids.map((id) => (byId.has(id) ? byId.get(id).status : null));
  if (statuses.some((s) => s === null)) return 'INCOMPLETE';
  if (statuses.every((s) => PASSING.includes(s))) return 'PASSED';
  return 'FAILED';
}

/** The summary line's wording, including the scope marker when the round is partial. */
function verdictLine(m) {
  const v = computedVerdict(m);
  if (!m.scope || m.scope.mode === 'FULL') return v;
  return `${v} (scoped: ${asArray(m.scope.cases).join(', ')})`;
}

function err(field, message, fix) { return { field, message, fix, severity: 'error' }; }

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

  if (m.bugType === 'FE' && !isNonEmptyString(m.designRef)) {
    out.push(err('designRef', 'a UI retest carries the design node, or the reason there is none',
      'record the node link, or "none — asked <who> <date>" and hold the visual points BLOCKED'));
  }

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
  }

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
    if (typeof m.symptomGone !== 'boolean') out.push(err('symptomGone', 'state whether the originally reported symptom is gone', '"FAILED" alone reads as "the fix did not work"'));
  }

  return out;
}

module.exports = {
  STATUSES,
  PASSING,
  SCOPE_MODES,
  REQUIRED_TOP,
  inScopeIds,
  outOfScopeIds,
  inScopeCases,
  coverage,
  computedVerdict,
  verdictLine,
  validate,
};
