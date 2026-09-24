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
const RULES = require('./retest_rules');

/** The summary line states the verdict the rows support, so it needs every mark. */
const VERDICT_MARK = Object.freeze({ PASSED: '✅', FAILED: '❌', BLOCKED: '⛔', PWMI: '⚠️' });

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

/**
 * One header field. A value holding several points (split on ` · ` or ` — `)
 * becomes the label on its own line, one bullet per point, then ONE blank line —
 * without it the list continues into the next label. Owner, 2026-09-24.
 */
function fieldLines(label, value, bold, bullet) {
  const text = String(value == null ? '' : value).trim();
  const parts = text.split(RULES.MULTIPOINT_SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return [bold(label + ':'), ...parts.map((p) => `${bullet} ${p}`), ''];
  return [`${bold(label + ':')} ${text}`];
}

/** Push lines, never leaving two blank lines in a row. */
function pushAll(L, lines) {
  lines.forEach((l) => {
    if (l === '' && L.length && L[L.length - 1] === '') return;
    L.push(l);
  });
}

function headerLines(m, bold, bullet) {
  const f = (k, v) => fieldLines(k, v, bold, bullet);
  const out = [...f('Env', m.env)];
  if (m.bugType === 'API') {
    out.push(...f('API', m.api || ''), ...f('Swagger', m.swagger || ''));
  } else {
    out.push(...f('Design ref', m.designRef));
  }
  out.push(
    ...f('Role', Array.isArray(m.role) ? m.role.join(', ') : m.role),
    ...f('Date', m.date),
    ...f('Build', m.build),
    ...f('Fixture', m.fixture),
  );
  // A full round prints no Scope line (owner, 2026-09-24: "*Scope:* FULL ตัดทิ้ง").
  if (m.scope && m.scope.mode === 'CASES') out.push(...f('Scope', `CASES: ${m.scope.cases.join(', ')}`));
  return out;
}

/** Several ` · `-separated points in one cell become `• point` lines. */
function cellPoints(text, sep) {
  const s = String(text == null ? '' : text);
  const parts = s.split(RULES.CELL_POINT_SEPARATOR).map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts.map((p) => `• ${p}`).join(sep) : s;
}

/** Every in-scope case covering one contract item, as `• TC_nn title (role)` lines. */
function caseCell(cases, id, sep, text = (x) => x) {
  return cases
    .filter((c) => (c.covers || []).includes(id))
    .map((c) => `• ${c.id} ${text(c.title)} (${c.role})`)
    .join(sep);
}

function tableHeaders(m) {
  const h = (m.bugType === 'API' ? RULES.VERDICT_TABLE_HEADERS_API : RULES.VERDICT_TABLE_HEADERS).slice();
  h[1] = m.ticketType === 'Task' ? 'AC' : 'ER';
  return h;
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

/**
 * The body both endpoints share. `fmt` carries the only things that differ: bold,
 * bullet, the cell line break, the table syntax, and how text is escaped.
 */
function renderWith(m, fmt) {
  const { bold, bullet, br, text } = fmt;
  const cases = M.inScopeCases(m);
  const ids = M.inScopeIds(m);
  const byId = new Map((m.results || []).map((r) => [r.id, r]));
  const contractById = new Map((m.contract || []).map((c) => [c.id, c]));
  const cov = M.coverage(m);
  const t = tallies(cases);
  const isApi = m.bugType === 'API';
  const txt = (l) => (l === '' ? l : text(l));

  const L = [];
  L.push(`${bold('Retest Result: ' + M.verdictLine(m))} ${VERDICT_MARK[M.computedVerdict(m)] || '❌'}`);
  L.push('');
  pushAll(L, headerLines(m, bold, bullet).map(txt));
  pushAll(L, ['', ...fmt.rule]);
  if (m.testStep) pushAll(L, fieldLines('Test Step (from ticket)', m.testStep, bold, bullet).map(txt));
  pushAll(L, fieldLines(contractLabel(m), m.expectedVerbatim || (m.contract || []).map((c) => c.text).join(' / '), bold, bullet)
    .map(txt));
  pushAll(L, ['']);

  // ONE table: a row per contract item, its covering cases inside the row (owner, 2026-09-24).
  const headers = tableHeaders(m);
  L.push(...fmt.headerRow(headers));
  ids.forEach((id, i) => {
    const r = byId.get(id);
    const row = [
      String(i + 1),
      cell(id, `contract id ${id}`),
      cell(caseCell(cases, id, br, text), `cases for ${id}`),
      cell(text((contractById.get(id) || {}).text), `contract ${id}`),
      cell(cellPoints(text(r.actual), br), `result ${id}`),
    ];
    if (!isApi) row.push(cell(evidenceCell(r.evidence, fmt.evidence), `evidence ${id}`));
    row.push(STATUS_MARK[r.status]);
    L.push(fmt.dataRow(row));
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
    L.push(`${bold('Root cause:')} ${text(m.rootCause.text)} — ${m.rootCause.label}`);
    L.push('');
    L.push(bold('Resolution options:'));
    m.resolutionOptions.forEach((o, i) => L.push(`${i + 1}. ${text(o.text)} — owner: ${o.owner}`));
    L.push(`Decided by: ${m.decidedBy}`);
  }
  return L.join('\n');
}

const WIKI = Object.freeze({
  bold: (s) => `*${s}*`,
  bullet: '*',
  br: RULES.WIKI_CELL_BREAK,
  text: wikiText,
  rule: ['----', ''],
  evidence: 'v2',
  headerRow: (h) => ['||' + h.map((x) => `*${x}*`).join('||') + '||'],
  dataRow: (cells) => `|${cells.join('|')}|`,
});

/**
 * Markdown (converted to ADF on post). No line break inside a markdown table cell
 * has been verified against a live Jira comment, so points inside a cell are
 * separated by a space — each still starts with its own `•`.
 */
const ADF = Object.freeze({
  bold: (s) => `**${s}**`,
  bullet: '-',
  br: ' ',
  text: (s) => String(s == null ? '' : s),
  rule: [],
  evidence: 'v3',
  headerRow: (h) => ['| ' + h.map((x) => `**${x}**`).join(' | ') + ' |', '|' + h.map(() => '---').join('|') + '|'],
  dataRow: (cells) => `| ${cells.join(' | ')} |`,
});

function renderWiki(m) { return renderWith(m, WIKI); }
function renderAdf(m) { return renderWith(m, ADF); }

/** Render for the manifest's own locked format. */
function render(m) {
  return m.format === 'v3' ? renderAdf(m) : renderWiki(m);
}

module.exports = {
  VERDICT_MARK, render, renderWiki, renderAdf, cell, hasBareDelimiter, wikiText, evidenceCell, coverageLabel, STATUS_MARK,
  fieldLines, cellPoints, caseCell, tableHeaders,
};
