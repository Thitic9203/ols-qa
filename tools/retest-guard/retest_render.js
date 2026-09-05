'use strict';

/**
 * Render a retest run manifest into the comment body for its endpoint.
 *
 * The markup rules used to be a list of things a person had to remember not to
 * type. Here they are the only way the text is produced, so the whole class —
 * a width parameter in an image macro, a markdown divider row on the wiki
 * endpoint, a missing header line, a coverage line that does not reconcile —
 * cannot occur. `retest_guard.js` still scans the rendered body, because a
 * renderer with a bug should be caught by the same gate as a typist with one.
 *
 * Node >= 18, no dependencies.
 */

const M = require('./retest_manifest');

const STATUS_MARK = Object.freeze({
  PASSED: '✅',
  FAILED: '❌',
  BLOCKED: '⛔',
  PWMI: 'PWMI',
});

/**
 * A table cell cannot carry a raw pipe or a newline.
 *
 * Wiki markup has an escape for the pipe, but whether it survives inside a table
 * cell has not been verified against a live Jira comment — so this refuses instead
 * of emitting something unverified into a customer-facing artifact. Put that item's
 * text in a section under the table and reference it from the cell.
 */
function hasBareDelimiter(s) {
  let depth = 0;
  for (const c of s) {
    if (c === '[') depth += 1;
    else if (c === ']') depth = Math.max(0, depth - 1);
    else if (c === '|' && depth === 0) return true;
  }
  return false;
}

function cell(text, where) {
  const s = String(text == null ? '' : text).replace(/\r?\n+/g, ' ').trim();
  // A pipe inside a [...] span belongs to a link — `[▶ f.mp4|^f.mp4]` is the
  // sanctioned way to reach an attachment from inside a cell, and the scanner's
  // splitter treats it the same way. A bare pipe is the delimiter itself.
  if (hasBareDelimiter(s)) {
    const e = new Error(`cell-contains-pipe: ${where} contains "|", which is the table-cell delimiter`);
    e.code = 'cell-contains-pipe';
    throw e;
  }
  return s;
}

/** Wiki has no backtick code span; a literal backtick renders as a backtick. */
function wikiText(text) {
  return String(text == null ? '' : text).replace(/`([^`\n]+)`/g, '{{$1}}');
}

function evidenceCell(files, format) {
  const list = Array.isArray(files) ? files : [];
  return list.map((f) => {
    const name = String(f).trim();
    if (/\.mp4$/i.test(name)) {
      return format === 'v2' ? `[▶ ${name}|^${name}]` : `[${name}] (attachment)`;
    }
    return format === 'v2' ? `!${name}!` : `![${name}](attachment)`;
  }).join(' ');
}

function headerLines(m, bold) {
  const b = (k, v) => `${bold(k + ':')} ${v}`;
  const out = [b('Env', m.env)];
  if (m.bugType === 'API') {
    out.push(b('API', m.api || ''), b('Swagger', m.swagger || ''));
  } else {
    out.push(b('Design ref', m.designRef));
  }
  out.push(
    b('Role', Array.isArray(m.role) ? m.role.join(', ') : m.role),
    b('Date', m.date),
    b('Build', m.build),
    b('Fixture', m.fixture),
    b('Scope', m.scope.mode === 'FULL' ? 'FULL' : `CASES: ${m.scope.cases.join(', ')}`),
  );
  return out;
}

function contractLabel(m) {
  return m.ticketType === 'Task'
    ? 'Acceptance Criteria (from ticket, verbatim)'
    : 'Expected Result (from ticket, verbatim)';
}

function tallies(cases) {
  return {
    passed: cases.filter((c) => c.status === 'PASSED').length,
    failed: cases.filter((c) => c.status === 'FAILED' || c.status === 'PWMI').length,
    blocked: cases.filter((c) => c.status === 'BLOCKED').length,
    // "cases run" means run: a BLOCKED case was planned and never executed, and
    // counting it as run is the same footnote-instead-of-row habit the gates exist for.
    run: cases.filter((c) => c.status !== 'BLOCKED').length,
  };
}

/** The coverage line names the contract it reconciles against. */
function coverageLabel(m) {
  return m.ticketType === 'Task' ? 'Acceptance-criteria coverage:' : 'Expected-result coverage:';
}

function renderWiki(m) {
  const bold = (s) => `*${s}*`;
  const cases = M.inScopeCases(m);
  const ids = M.inScopeIds(m);
  const byId = new Map((m.results || []).map((r) => [r.id, r]));
  const contractById = new Map((m.contract || []).map((c) => [c.id, c]));
  const cov = M.coverage(m);
  const t = tallies(cases);
  const isApi = m.bugType === 'API';

  const L = [];
  L.push(`*Retest Result: ${M.verdictLine(m)}* ${M.computedVerdict(m) === 'PASSED' ? '✅' : '❌'}`);
  L.push('');
  headerLines(m, bold).forEach((l) => L.push(wikiText(l)));
  L.push('', '----', '');
  if (m.testStep) L.push(wikiText(`${bold('Test Step (from ticket):')} ${m.testStep}`));
  L.push(wikiText(`${bold(contractLabel(m) + ':')} ${m.expectedVerbatim || (m.contract || []).map((c) => c.text).join(' / ')}`));
  L.push('');
  L.push(`${bold('Test cases run:')} ${cases.length}`);
  L.push('');
  L.push('||*Case*||*Title*||*Covers*||*Role*||*Status*||');
  cases.forEach((c) => {
    L.push(`|${cell(c.id, 'case id')}|${cell(wikiText(c.title), 'case title')}|${cell(c.covers.join(', '), 'covers')}|${cell(c.role, 'role')}|${STATUS_MARK[c.status]}|`);
  });
  L.push('');
  L.push(isApi
    ? '||*No.*||*Expected Result*||*Actual Result*||*Status*||'
    : '||*No.*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||');
  ids.forEach((id, i) => {
    const r = byId.get(id);
    const expected = cell(wikiText((contractById.get(id) || {}).text), `contract ${id}`);
    const actual = cell(wikiText(r.actual), `result ${id}`);
    const ev = cell(evidenceCell(r.evidence, 'v2'), `evidence ${id}`);
    L.push(isApi
      ? `|${i + 1}|${expected}|${actual}|${STATUS_MARK[r.status]}|`
      : `|${i + 1}|${expected}|${actual}|${ev}|${STATUS_MARK[r.status]}|`);
  });
  L.push('');
  L.push(`${bold(coverageLabel(m))} ${cov.n} / ${cov.total} items met`);
  L.push(`${bold('Case coverage:')} ${t.run} / ${cases.length} cases run — ${t.passed} passed / ${t.failed} failed / ${t.blocked} blocked`);

  const out = M.outOfScopeIds(m);
  if (out.length) {
    L.push('');
    L.push(`${bold('Out of scope this round:')} ${out.join(', ')} — not covered by the scoped cases, not verified`);
  }

  if (M.computedVerdict(m) !== 'PASSED') {
    L.push('');
    L.push(`${bold('Originally reported symptom:')} ${m.symptomGone ? 'gone' : 'still present'}`);
    L.push('');
    L.push(`${bold('Root cause:')} ${wikiText(m.rootCause.text)} — ${m.rootCause.label}`);
    L.push('');
    L.push(bold('Resolution options:'));
    m.resolutionOptions.forEach((o, i) => L.push(`${i + 1}. ${wikiText(o.text)} — owner: ${o.owner}`));
    L.push(`Decided by: ${m.decidedBy}`);
  }
  return L.join('\n');
}

function renderAdf(m) {
  const bold = (s) => `**${s}**`;
  const cases = M.inScopeCases(m);
  const ids = M.inScopeIds(m);
  const byId = new Map((m.results || []).map((r) => [r.id, r]));
  const contractById = new Map((m.contract || []).map((c) => [c.id, c]));
  const cov = M.coverage(m);
  const t = tallies(cases);
  const isApi = m.bugType === 'API';

  const L = [];
  L.push(`**Retest Result: ${M.verdictLine(m)}** ${M.computedVerdict(m) === 'PASSED' ? '✅' : '❌'}`);
  L.push('');
  headerLines(m, bold).forEach((l) => L.push(l));
  L.push('');
  if (m.testStep) L.push(`${bold('Test Step (from ticket):')} ${m.testStep}`);
  L.push(`${bold(contractLabel(m) + ':')} ${m.expectedVerbatim || (m.contract || []).map((c) => c.text).join(' / ')}`);
  L.push('');
  L.push(`${bold('Test cases run:')} ${cases.length}`);
  L.push('');
  L.push('| **Case** | **Title** | **Covers** | **Role** | **Status** |');
  L.push('|---|---|---|---|---|');
  cases.forEach((c) => {
    L.push(`| ${cell(c.id, 'case id')} | ${cell(c.title, 'case title')} | ${cell(c.covers.join(', '), 'covers')} | ${cell(c.role, 'role')} | ${STATUS_MARK[c.status]} |`);
  });
  L.push('');
  if (isApi) {
    L.push('| **No.** | **Expected Result** | **Actual Result** | **Status** |');
    L.push('|---|---|---|---|');
  } else {
    L.push('| **No.** | **Expected Result** | **Actual Result** | **Evidence** | **Status** |');
    L.push('|---|---|---|---|---|');
  }
  ids.forEach((id, i) => {
    const r = byId.get(id);
    const expected = cell((contractById.get(id) || {}).text, `contract ${id}`);
    const actual = cell(r.actual, `result ${id}`);
    L.push(isApi
      ? `| ${i + 1} | ${expected} | ${actual} | ${STATUS_MARK[r.status]} |`
      : `| ${i + 1} | ${expected} | ${actual} | ${cell(evidenceCell(r.evidence, 'v3'), 'evidence')} | ${STATUS_MARK[r.status]} |`);
  });
  L.push('');
  L.push(`${bold(coverageLabel(m))} ${cov.n} / ${cov.total} items met`);
  L.push(`${bold('Case coverage:')} ${t.run} / ${cases.length} cases run — ${t.passed} passed / ${t.failed} failed / ${t.blocked} blocked`);

  const out = M.outOfScopeIds(m);
  if (out.length) {
    L.push('');
    L.push(`${bold('Out of scope this round:')} ${out.join(', ')} — not covered by the scoped cases, not verified`);
  }

  if (M.computedVerdict(m) !== 'PASSED') {
    L.push('');
    L.push(`${bold('Originally reported symptom:')} ${m.symptomGone ? 'gone' : 'still present'}`);
    L.push('');
    L.push(`${bold('Root cause:')} ${m.rootCause.text} — ${m.rootCause.label}`);
    L.push('');
    L.push(bold('Resolution options:'));
    m.resolutionOptions.forEach((o, i) => L.push(`${i + 1}. ${o.text} — owner: ${o.owner}`));
    L.push(`Decided by: ${m.decidedBy}`);
  }
  return L.join('\n');
}

/** Render for the manifest's own locked format. */
function render(m) {
  return m.format === 'v3' ? renderAdf(m) : renderWiki(m);
}

module.exports = { render, renderWiki, renderAdf, cell, hasBareDelimiter, wikiText, evidenceCell, coverageLabel, STATUS_MARK };
