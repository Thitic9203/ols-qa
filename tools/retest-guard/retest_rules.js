'use strict';

/**
 * Canonical, machine-checkable rules for a retest deliverable — the Jira comment
 * body and the run manifest it is rendered from.
 *
 * THIS FILE IS THE SINGLE SOURCE OF TRUTH for every rule below. Markdown docs
 * link here; they do not restate a rule in their own words, because that is how
 * one rule ended up written in six places and three of them drifted — `|width=450`
 * was taught as correct inside the very file whose job is to be copied.
 *
 * `rules_drift.test.js` fails when a rule literal reappears in markdown outside
 * the counter-example allowlist at the bottom of this file.
 *
 * Node >= 18, no dependencies — same shape as tools/name-guard.
 */

const FORMATS = Object.freeze({ WIKI: 'v2', ADF: 'v3' });

/**
 * Header lines a retest comment carries, and when each is required.
 *
 * `Scope` is required only on a scoped round (`when: 'scoped'` — the summary line
 * reads `(scoped: …)`). A full round carries NO Scope line: the task owner ordered
 * "*Scope:* FULL ตัดทิ้ง" on 2026-09-24, and `scope-full-line` refuses it.
 */
const HEADER_LINES = Object.freeze([
  Object.freeze({ key: 'Env', when: 'always' }),
  Object.freeze({ key: 'Role', when: 'always' }),
  Object.freeze({ key: 'Date', when: 'always' }),
  Object.freeze({ key: 'Build', when: 'always' }),
  Object.freeze({ key: 'Fixture', when: 'always' }),
  Object.freeze({ key: 'Scope', when: 'scoped' }),
  Object.freeze({ key: 'Design ref', when: 'ui' }),
  Object.freeze({ key: 'API', when: 'api' }),
  Object.freeze({ key: 'Swagger', when: 'api' }),
]);

/**
 * The ONE table of a retest comment — one row per Expected-Result (bug) or AC
 * (task) item, with the cases covering that item inside the `Case (Role)` cell.
 *
 * Owner, 2026-09-24: "ทำไมต้องแยกตาราง รวมให้เป็นตารางเดียว … อย่าผิดอีก". The
 * separate "Test cases run" table is gone; `separate-case-table` and
 * `more-than-one-table` refuse it.
 */
const VERDICT_TABLE_HEADERS = Object.freeze(['No.', 'ER', 'Case (Role)', 'Expected Result', 'Actual Result', 'Evidence', 'Status']);
/** A Task retest names its contract items AC, not ER. */
const VERDICT_TABLE_HEADERS_TASK = Object.freeze(['No.', 'AC', 'Case (Role)', 'Expected Result', 'Actual Result', 'Evidence', 'Status']);
/** API bugs carry no screenshots, so the Evidence column is dropped. */
const VERDICT_TABLE_HEADERS_API = Object.freeze(['No.', 'ER', 'Case (Role)', 'Expected Result', 'Actual Result', 'Status']);
/** Headers of the retired separate case table — kept only so the scan can recognise and refuse it. */
const RETIRED_CASE_TABLE_HEADERS = Object.freeze(['Case', 'Title', 'Covers', 'Role', 'Status']);
/** The design reference is one fact about the round, never a per-row column. */
const CASE_TABLE_FORBIDDEN_HEADERS = Object.freeze(['design', 'design ref', 'design node', 'figma', 'node']);

/**
 * Per-column width (ADF `colwidth`, px) of the single table, in header order:
 * No. · ER/AC · Case (Role) · Expected Result · Actual Result · Evidence · Status.
 * The v2 wiki endpoint cannot carry widths, so `adf_colwidth.js` applies these to
 * the posted comment's ADF afterwards. An API table (no Evidence) drops index 5.
 */
const TABLE_COLUMN_WIDTHS = Object.freeze([50, 75, 230, 200, 330, 230, 65]);
/** Columns whose content is centred — owner, 2026-09-24: "จัดกลางเสมอ อย่าให้ต้องบอกซ้ำ". */
const CENTERED_COLUMNS = Object.freeze(['No.', 'Evidence', 'Status']);

/**
 * What separates several points inside one value. A header value with more than
 * one point is a label on its own line plus one bullet per point; a table cell with
 * more than one point is `• point` lines joined by the wiki line break.
 * Owner, 2026-09-24: "ถ้ายาวๆ … ให้ทำเป็นบลูเลทๆ เสมอไม่ยาวพืดให้อ่านยาก".
 */
const MULTIPOINT_SEPARATOR = / · | — /;
/** Inside a table cell only ` · ` separates points (` — ` is ordinary prose there). */
const CELL_POINT_SEPARATOR = ' · ';
/** The wiki line break used between `•` points inside one table cell. */
const WIKI_CELL_BREAK = ' \\\\ ';

const PASSING_STATUS = /(^|[\s*])(✅|PASSED|PASS)([\s*]|$)/i;
const NON_PASSING_STATUS = /(❌|FAILED|⛔|BLOCKED|PWMI|MINOR ISSUE)/i;

/**
 * An image macro carrying a width parameter. The `|` is also the table-cell
 * delimiter, so the row splits and the comment renders wrong (PM-004, OLS-289).
 * Every image we embed lives in a table cell, so the parameter is never correct
 * here: resize the file before upload and embed it bare.
 */
const IMG_WIDTH_PARAM = /!\s*[^!|\n]+\|\s*width\s*=/i;

/** Markdown constructs that render as visible garbage on the v2 wiki endpoint. */
const WIKI_BANNED = Object.freeze([
  Object.freeze({ rule: 'md-bold-in-wiki', re: /\*\*[^*\n]+\*\*/, fix: 'wiki bold is a single asterisk: *bold*' }),
  Object.freeze({ rule: 'md-hr-in-wiki', re: /^---\s*$/, fix: 'wiki horizontal rule is four dashes: ----' }),
  Object.freeze({ rule: 'md-divider-row', re: /^\s*\|\s*:?-{3,}/, fix: 'a wiki header row is ||a||b|| with no divider row' }),
  Object.freeze({ rule: 'md-image', re: /!\[[^\]]*\]\(/, fix: 'wiki image macro is !file.png!' }),
  Object.freeze({ rule: 'md-code-span', re: /`[^`\n]+`/, fix: 'wiki code span is {{code}}' }),
  Object.freeze({ rule: 'md-link', re: /\[[^\]\n]+\]\(/, fix: 'wiki link is [text|url]' }),
]);

/** Wiki constructs that render as visible garbage in an ADF / markdown body. */
const ADF_BANNED = Object.freeze([
  Object.freeze({ rule: 'wiki-header-row-in-adf', re: /^\s*\|\|/, fix: 'markdown header row is | a | b | plus a |---| divider' }),
  Object.freeze({ rule: 'wiki-image-in-adf', re: /(^|[^![])!\s*[\w./-]+\.(png|jpe?g|gif|mp4)\s*!/i, fix: 'markdown image is ![alt](url)' }),
  Object.freeze({ rule: 'wiki-hr-in-adf', re: /^-{4,}\s*$/, fix: 'markdown horizontal rule is ---' }),
]);

/**
 * A {word} the Jira parser does not know is read as a macro that never closes,
 * swallowing every table and rule below it. The double-brace code span {{like this}}
 * is legitimate wiki, so it is not matched.
 */
const UNCLOSED_MACRO = /(?<!\{)\{[A-Za-z_][A-Za-z0-9_-]*\}(?!\})/;

/** Paths that mean nothing to a Jira reader and leak machine layout. */
const LOCAL_PATHS = Object.freeze([
  Object.freeze({ rule: 'local-path-home', re: /\/Users\/[A-Za-z0-9._-]+/ }),
  Object.freeze({ rule: 'local-path-win', re: /[Cc]:\\Users\\/ }),
  Object.freeze({ rule: 'local-path-tilde', re: /(^|\s)~\/[A-Za-z0-9._/-]+/ }),
  Object.freeze({ rule: 'local-path-repo', re: /(^|\s)docs\/result\// }),
]);

/** A row whose own text says it could not be verified is never a passing row. */
const CAVEAT_WORDS = Object.freeze([
  'caveat', 'not verifiable', 'cannot verify', 'assumed',
  'ยืนยันไม่ได้', 'ตรวจไม่ได้',
]);

/** A hedge is never a cause. */
const HEDGE_WORDS = Object.freeze([
  'probably', 'seems', 'likely', 'should be', 'flaky',
  'cache issue', 'environment issue', 'race condition',
  'น่าจะ', 'อาจจะ',
]);

/** Blocks a non-PASSED comment must carry (Step 6a). */
const NON_PASS_BLOCKS = Object.freeze(['Root cause', 'Resolution options']);

/** `*Scope:* CASES: TC_03, TC_07` — a full round carries no Scope line at all. */
const SCOPE_LINE = /^\**Scope:?\**\s*(CASES:\s*\S.*)$/i;
/** The line the owner ordered removed (2026-09-24). */
const SCOPE_FULL_LINE = /^\**Scope:?\**\s*FULL\s*$/i;
/**
 * `*Retest Result: PASSED* ✅`, optionally scoped.
 *
 * BLOCKED and PWMI are accepted because a round reports what its rows actually
 * say. Forcing a fully blocked round to read FAILED tells the reader a defect was
 * found when none was — a coverage gap is not a defect.
 */
const SUMMARY_VERDICTS = ['PASSED', 'FAILED', 'BLOCKED', 'PWMI'];
const SUMMARY_LINE = new RegExp(
  '^\\**Retest Result:\\s*(' + SUMMARY_VERDICTS.join('|') + ')' +
  '(\\s*\\(scoped:[^)]*\\))?\\**\\s*(✅|❌|⛔|⚠️)?\\s*$', 'i');
/**
 * `*Expected-result coverage:* 7 / 7 items met` — the line the gate reconciles.
 *
 * It must be the ITEM coverage line specifically: a body carrying only
 * `*Case coverage:* 1 / 1` used to satisfy a generic /coverage/ match, so a missing
 * item-coverage line read as a reconciled one.
 */
const ITEM_COVERAGE_LINE = /(expected-result|acceptance-criteria|item)[ -]*coverage:?\**\s*(\d+)\s*\/\s*(\d+)/i;

/* ------------------------------------------------------------------ *
 * Parsing helpers — pure, no I/O.
 * ------------------------------------------------------------------ */

/**
 * Split one wiki table row into cells.
 *
 * A `|` inside a `[...]` span is part of a link (`[▶ f.mp4|^f.mp4]`), not a cell
 * boundary, so link spans are treated as atomic. Jira agrees — measured on OLS-701's
 * retest comment, where such a cell renders with all five `<td>` intact (2026-09-05).
 */
function splitWikiCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const isHeader = trimmed.startsWith('||');
  const cells = [];
  let buf = '';
  let depth = 0;
  let i = trimmed.startsWith('||') ? 2 : 1;
  for (; i < trimmed.length; i += 1) {
    const c = trimmed[i];
    if (c === '[') depth += 1;
    else if (c === ']') depth = Math.max(0, depth - 1);
    if (c === '|' && depth === 0) {
      if (isHeader && trimmed[i + 1] === '|') i += 1;
      cells.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim() !== '') cells.push(buf);
  return { isHeader, cells: cells.map((c) => c.trim()) };
}

/** Strip wiki/markdown emphasis so a header cell can be compared by name. */
function bareHeader(cell) {
  return String(cell).replace(/[*`]/g, '').trim();
}

/** A markdown table's divider row — structure, not data. */
const MD_DIVIDER_ROW = /^\s*\|[\s:|-]*\|\s*$/;

/**
 * Locate the case table and the verdict table.
 *
 * Wiki marks its header row with `||`; markdown marks it by position (first row,
 * followed by a divider). Both are handled here so one scan covers both endpoints
 * — a body written for the wrong endpoint is caught by the banned-construct rules,
 * not by silently failing to find its tables.
 */
function findTables(body, format = FORMATS.WIKI) {
  const lines = String(body).split('\n');
  const tables = [];
  let current = null;
  const close = () => { if (current) tables.push(current); current = null; };
  lines.forEach((line, idx) => {
    const row = splitWikiCells(line);
    if (!row) { close(); return; }
    if (format === FORMATS.ADF) {
      if (MD_DIVIDER_ROW.test(line)) return;             // divider: structure only
      if (!current) {                                     // first row of the block is the header
        current = { headerLine: idx + 1, headers: row.cells.map(bareHeader), rows: [] };
        return;
      }
      current.rows.push({ line: idx + 1, cells: row.cells });
      return;
    }
    if (row.isHeader || !current) {
      close();
      current = { headerLine: idx + 1, headers: row.isHeader ? row.cells.map(bareHeader) : [], rows: [] };
      if (!row.isHeader) current.rows.push({ line: idx + 1, cells: row.cells });
      return;
    }
    current.rows.push({ line: idx + 1, cells: row.cells });
  });
  close();
  return tables;
}

function kindOfTable(table) {
  const h = table.headers.map((x) => x.toLowerCase());
  if (h.includes('expected result') && h.includes('actual result')) return 'verdict';
  if (h.includes('case') && h.includes('covers')) return 'cases';
  return 'other';
}

/**
 * The header row the single table must carry.
 * ticketType 'Task' → AC; 'Bug' (or any other known type) → ER; unknown → null,
 * meaning the second column may read either ER or AC.
 */
function expectedTableHeaders({ bugType, ticketType } = {}) {
  const isApi = String(bugType || '').toUpperCase() === 'API';
  const base = isApi ? VERDICT_TABLE_HEADERS_API : VERDICT_TABLE_HEADERS;
  if (!ticketType) return null;
  const out = base.slice();
  out[1] = ticketType === 'Task' ? 'AC' : 'ER';
  return out;
}

/** True when a header row matches the single-table shape (ER or AC in column 2). */
function headersMatch(headers, { bugType, ticketType } = {}) {
  const want = expectedTableHeaders({ bugType, ticketType });
  if (want) return headers.join('|') === want.join('|');
  const isApi = String(bugType || '').toUpperCase() === 'API';
  const base = (isApi ? VERDICT_TABLE_HEADERS_API : VERDICT_TABLE_HEADERS).slice();
  return ['ER', 'AC'].some((k) => { base[1] = k; return headers.join('|') === base.join('|'); });
}

/* ------------------------------------------------------------------ *
 * The scan.
 * ------------------------------------------------------------------ */

function finding(rule, line, message, fix, severity = 'error') {
  return { rule, line, message, fix, severity };
}

/**
 * Scan a comment body against every rule that can be decided mechanically.
 *
 * @param {string} body
 * @param {{format?: string, bugType?: string, verdict?: string}} [opts]
 *   format: FORMATS.WIKI | FORMATS.ADF   bugType: 'FE' | 'API'
 * @returns {Array} findings — empty means every mechanical rule passed. The
 *   judgement rules (did the clip reach the target, is the cause real) are not
 *   decidable here and are never implied to have passed.
 */
function scanBody(body, opts = {}) {
  const format = opts.format || FORMATS.WIKI;
  const bugType = (opts.bugType || 'FE').toUpperCase();
  const isApi = bugType === 'API';
  const text = String(body);
  const lines = text.split('\n');
  const out = [];

  const banned = format === FORMATS.WIKI ? WIKI_BANNED : ADF_BANNED;
  lines.forEach((line, i) => {
    banned.forEach((b) => {
      if (b.re.test(line)) out.push(finding(b.rule, i + 1, `${format} body contains ${b.rule}`, b.fix));
    });
    if (IMG_WIDTH_PARAM.test(line)) {
      out.push(finding('img-width-param', i + 1,
        'image macro carries a width parameter; the pipe splits the table row',
        'resize the file before upload and embed it bare'));
    }
    if (UNCLOSED_MACRO.test(line)) {
      out.push(finding('unclosed-macro', i + 1,
        'a {word} is read as a macro that never closes and swallows everything below it',
        'escape it or rephrase'));
    }
    LOCAL_PATHS.forEach((p) => {
      if (p.re.test(line)) out.push(finding(p.rule, i + 1, 'local path in a Jira body', 'remove it — it means nothing to a Jira reader'));
    });
  });

  const summaryIdx = lines.findIndex((l) => /Retest Result:/i.test(l));
  if (summaryIdx === -1) {
    out.push(finding('summary-line-missing', 0, 'no *Retest Result:* summary line', 'first line is the verdict'));
  } else if (!SUMMARY_LINE.test(lines[summaryIdx].trim())) {
    // The list comes from SUMMARY_VERDICTS, never retyped: this message told people to
    // write PASSED or FAILED for a year after the rule started accepting BLOCKED and
    // PWMI, so the refusal was teaching the mistake the rule exists to prevent.
    out.push(finding('summary-line-shape', summaryIdx + 1,
      'summary line is not exactly one of ' + SUMMARY_VERDICTS.join(' / ') + ' (optionally "(scoped: …)")',
      'e.g. *Retest Result: PASSED* ✅ — a round that nobody could reach says BLOCKED, not FAILED'));
  }

  const isScoped = summaryIdx >= 0 && /\(scoped:/i.test(lines[summaryIdx]);
  HEADER_LINES.forEach((h) => {
    if (h.when === 'api' && !isApi) return;
    if (h.when === 'ui' && isApi) return;
    if (h.when === 'scoped' && !isScoped) return;
    const re = new RegExp(`^\\**${h.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\**`, 'im');
    if (!lines.some((l) => re.test(l.trim()))) {
      out.push(finding('header-line-missing', 0, `header line "${h.key}:" is missing`, 'every retest comment carries it'));
    }
  });

  const scopeLine = lines.find((l) => /^\**Scope:?\**/i.test(l.trim()));
  if (scopeLine && SCOPE_FULL_LINE.test(scopeLine.trim())) {
    out.push(finding('scope-full-line', lines.indexOf(scopeLine) + 1,
      'a full round carries no Scope line (owner, 2026-09-24: "*Scope:* FULL ตัดทิ้ง")',
      'delete the line; only a scoped round prints *Scope:* CASES: <ids>'));
  } else if (scopeLine && !SCOPE_LINE.test(scopeLine.trim())) {
    out.push(finding('scope-line-shape', lines.indexOf(scopeLine) + 1,
      'Scope line must read "CASES: <ids>"',
      'e.g. *Scope:* CASES: TC_03, TC_07'));
  }

  const tables = findTables(text, format);
  const firstTableLine = tables.length ? tables[0].headerLine : lines.length + 1;

  // Header fields: several points are a label line plus one bullet per point,
  // never one long inline run (owner, 2026-09-24).
  const labelLine = format === FORMATS.WIKI ? /^\*([^*\n]+):\*\s+(\S.*)$/ : /^\*\*([^*\n]+):\*\*\s+(\S.*)$/;
  const bulletLine = format === FORMATS.WIKI ? /^\*+ \S/ : /^\s*[-*] \S/;
  lines.forEach((line, i) => {
    if (i + 1 >= firstTableLine) return;
    const m = labelLine.exec(line.trim());
    if (m && MULTIPOINT_SEPARATOR.test(m[2]) && !/Retest Result/i.test(m[1])) {
      out.push(finding('header-inline-list', i + 1,
        `"${m[1]}:" holds several points on one line`,
        'put the label on its own line, then one "* " bullet per point, then one blank line'));
    }
    // A wiki/markdown list continues into the next non-blank line, so a label placed
    // straight after a bullet list renders as part of that list's last item.
    if (bulletLine.test(line) && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (next.trim() !== '' && !bulletLine.test(next)) {
        out.push(finding('list-swallows-next-line', i + 2,
          'a bullet list is followed directly by another line, which renders inside the list',
          'leave exactly one blank line after the last bullet'));
      }
    }
  });

  const verdict = tables.find((t) => kindOfTable(t) === 'verdict');
  const cases = tables.find((t) => kindOfTable(t) === 'cases');

  if (tables.length > 1) {
    out.push(finding('more-than-one-table', tables[1].headerLine,
      `the body carries ${tables.length} tables`,
      'one table only — the cases go in the Case (Role) cell of the row they cover'));
  }

  if (!verdict) {
    out.push(finding('verdict-table-missing', 0, 'no verdict table', 'one row per expected-result item'));
  } else {
    const opts2 = { bugType, ticketType: opts.ticketType };
    if (!headersMatch(verdict.headers, opts2)) {
      const want = expectedTableHeaders(opts2)
        || (isApi ? VERDICT_TABLE_HEADERS_API : VERDICT_TABLE_HEADERS).map((h) => (h === 'ER' ? 'ER|AC' : h));
      out.push(finding('verdict-table-headers', verdict.headerLine,
        `verdict table headers are [${verdict.headers.join(', ')}]`,
        `must be exactly [${want.join(', ')}]`));
    }
    verdict.headers.forEach((h, i) => {
      if (CASE_TABLE_FORBIDDEN_HEADERS.includes(h.toLowerCase())) {
        out.push(finding('case-table-design-column', verdict.headerLine,
          `table carries a "${h}" column (position ${i + 1})`,
          'the design reference goes on the header Design ref: line, never a per-row column'));
      }
    });
    const evidenceCol = verdict.headers.indexOf('Evidence');
    const caseCol = verdict.headers.indexOf('Case (Role)');
    const actualCol = verdict.headers.indexOf('Actual Result');
    const statusCol = verdict.headers.length - 1;
    const lastRowLine = verdict.rows.length ? verdict.rows[verdict.rows.length - 1].line : verdict.headerLine;
    const covIdx = lines.findIndex((l) => ITEM_COVERAGE_LINE.test(l));
    if (covIdx >= 0 && covIdx + 1 < lastRowLine) {
      out.push(finding('coverage-before-table', covIdx + 1,
        'the coverage lines sit above the table', 'the coverage lines come after the table'));
    }
    verdict.rows.forEach((r) => {
      if (r.cells.length !== verdict.headers.length) {
        out.push(finding('row-column-count', r.line,
          `row has ${r.cells.length} cell(s), the header has ${verdict.headers.length}`,
          'a stray or missing delimiter shifts every later value into the wrong column'));
        return;                       // reading its status would read the wrong cell
      }
      const status = r.cells[statusCol] || '';
      const passing = PASSING_STATUS.test(status) && !NON_PASSING_STATUS.test(status);
      const rowText = r.cells.join(' ').toLowerCase();
      if (caseCol >= 0) {
        const caseCell = (r.cells[caseCol] || '').trim();
        if (!caseCell) {
          out.push(finding('row-without-case', r.line, 'row names no covering case',
            'list every case covering this item as "• TC_nn title (role)"'));
        } else if (caseCell.split(WIKI_CELL_BREAK).some((p) => !p.trim().startsWith('•'))) {
          out.push(finding('case-cell-shape', r.line, 'Case (Role) cell is not a list of "• TC_nn title (role)" lines',
            'one "• TC_nn title (role)" per case, joined by " \\\\ "'));
        }
      }
      if (actualCol >= 0 && (r.cells[actualCol] || '').includes(CELL_POINT_SEPARATOR)) {
        out.push(finding('cell-inline-list', r.line, 'Actual Result cell runs several points together with " · "',
          'one "• point" per point, joined by " \\\\ "'));
      }
      if (passing && !isApi && evidenceCol >= 0 && !(r.cells[evidenceCol] || '').trim()) {
        out.push(finding('passing-row-no-evidence', r.line, 'a passing row carries no evidence', 'passed rows carry evidence too'));
      }
      if (passing) {
        CAVEAT_WORDS.forEach((w) => {
          if (rowText.includes(w.toLowerCase())) {
            out.push(finding('caveat-on-passing-row', r.line,
              `row says "${w}" but carries a passing status`,
              'that row is BLOCKED, or PWMI with a bug raised'));
          }
        });
      }
      if (!status.trim()) out.push(finding('row-without-status', r.line, 'row has no status', 'every row carries its own verdict'));
    });
  }

  if (cases) {
    out.push(finding('separate-case-table', cases.headerLine,
      'a separate "Test cases run" table (owner, 2026-09-24: "รวมให้เป็นตารางเดียว")',
      'delete it — each case goes in the Case (Role) cell of every row it covers'));
    cases.headers.forEach((h, i) => {
      if (CASE_TABLE_FORBIDDEN_HEADERS.includes(h.toLowerCase())) {
        out.push(finding('case-table-design-column', cases.headerLine,
          `case table carries a "${h}" column (position ${i + 1})`,
          'the design reference goes on the header Design ref: line, never a per-row column'));
      }
    });
  }

  const cov = text.match(ITEM_COVERAGE_LINE);
  if (!cov) {
    out.push(finding('coverage-line-missing', 0,
      'no expected-result / acceptance-criteria coverage line',
      'e.g. *Expected-result coverage:* 7 / 7 items met — a Case coverage line is not a substitute'));
  } else if (cov[2] !== cov[3]) {
    out.push(finding('coverage-not-reconciled', 0,
      `coverage reads ${cov[2]}/${cov[3]}`,
      'every enumerated item is a row with a status — close the gap before posting'));
  }

  const isPass = summaryIdx >= 0 && /PASSED/i.test(lines[summaryIdx]);
  if (!isPass) {
    NON_PASS_BLOCKS.forEach((b) => {
      if (!new RegExp(b, 'i').test(text)) {
        out.push(finding('non-pass-block-missing', 0, `non-PASSED comment has no "${b}" block`, 'Step 6a requires both blocks'));
      }
    });
    HEDGE_WORDS.forEach((w) => {
      const idx = lines.findIndex((l) => l.toLowerCase().includes(w.toLowerCase()));
      if (idx >= 0) {
        out.push(finding('hedge-as-cause', idx + 1, `hedge word "${w}" in a non-PASSED comment`,
          'a cause cites a captured artifact and carries Confirmed / Suspected / Unknown', 'warn'));
      }
    });
  }

  return out;
}

/**
 * Counter-example allowlist for `rules_drift.test.js`.
 *
 * A rule literal may appear in markdown only at these exact spots, where it is
 * shown as the thing NOT to do. Anything new fails the drift test, which forces
 * a deliberate decision instead of a silent second copy of the rule.
 */
const DRIFT_ALLOWLIST = Object.freeze([
  // The workflow states the rule for a human reader, always negatively.
  Object.freeze({ file: 'skills/deprecated/retest-bug-workflow/WORKFLOW.md', needle: '|width=' }),
  // The syntax map has to name the wrong form to rule it out.
  Object.freeze({ file: 'references/jira-wiki-vs-markdown.md', needle: '|width=' }),
  // The worked example explains, in prose, why it no longer carries it.
  Object.freeze({ file: 'skills/deprecated/retest-bug-workflow/references/worked-example.md', needle: '|width=' }),
]);

/**
 * Open questions — recorded rather than guessed, per the repo's first rule.
 *
 * Q1. RESOLVED 2026-09-05. A `[label|url]` link inside a v2 table cell does NOT
 *     split the row: OLS-701 comment 87511 renders its Evidence cell's
 *     `[▶ file.mp4|^file.mp4]` with all five <td> intact and the MP4 as a working
 *     attachment link. Only the image width parameter breaks a row.
 *
 * Q2. RESOLVED 2026-09-05 by the owner: report the status each case actually has.
 *     Where the destination (a results sheet, a form) has no such value, do NOT map
 *     it to a nearby one — show the destination's own list beside the real status and
 *     let the owner choose. `destinationMismatch()` in retest_manifest.js builds that
 *     question.
 */
const OPEN_QUESTIONS = Object.freeze([
]);

module.exports = {
  FORMATS,
  HEADER_LINES,
  VERDICT_TABLE_HEADERS,
  VERDICT_TABLE_HEADERS_TASK,
  VERDICT_TABLE_HEADERS_API,
  RETIRED_CASE_TABLE_HEADERS,
  CASE_TABLE_FORBIDDEN_HEADERS,
  TABLE_COLUMN_WIDTHS,
  CENTERED_COLUMNS,
  MULTIPOINT_SEPARATOR,
  CELL_POINT_SEPARATOR,
  WIKI_CELL_BREAK,
  SCOPE_FULL_LINE,
  expectedTableHeaders,
  headersMatch,
  IMG_WIDTH_PARAM,
  WIKI_BANNED,
  ADF_BANNED,
  UNCLOSED_MACRO,
  LOCAL_PATHS,
  CAVEAT_WORDS,
  HEDGE_WORDS,
  NON_PASS_BLOCKS,
  SCOPE_LINE,
  SUMMARY_LINE,
  SUMMARY_VERDICTS,
  ITEM_COVERAGE_LINE,
  DRIFT_ALLOWLIST,
  OPEN_QUESTIONS,
  MD_DIVIDER_ROW,
  splitWikiCells,
  bareHeader,
  findTables,
  kindOfTable,
  scanBody,
};
