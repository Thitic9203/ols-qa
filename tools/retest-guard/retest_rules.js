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

/** Header lines a retest comment carries, and when each is required. */
const HEADER_LINES = Object.freeze([
  Object.freeze({ key: 'Env', when: 'always' }),
  Object.freeze({ key: 'Role', when: 'always' }),
  Object.freeze({ key: 'Date', when: 'always' }),
  Object.freeze({ key: 'Build', when: 'always' }),
  Object.freeze({ key: 'Fixture', when: 'always' }),
  Object.freeze({ key: 'Scope', when: 'always' }),
  Object.freeze({ key: 'Design ref', when: 'ui' }),
  Object.freeze({ key: 'API', when: 'api' }),
  Object.freeze({ key: 'Swagger', when: 'api' }),
]);

/** Verdict table — one row per Expected-Result / AC item. */
const VERDICT_TABLE_HEADERS = Object.freeze(['No.', 'Expected Result', 'Actual Result', 'Evidence', 'Status']);
/** API bugs carry no screenshots, so the Evidence column is dropped. */
const VERDICT_TABLE_HEADERS_API = Object.freeze(['No.', 'Expected Result', 'Actual Result', 'Status']);
/** Case list — the cases this retest actually ran. */
const CASE_TABLE_HEADERS = Object.freeze(['Case', 'Title', 'Covers', 'Role', 'Status']);
/** The design reference is one fact about the round, never a per-row column. */
const CASE_TABLE_FORBIDDEN_HEADERS = Object.freeze(['design', 'design ref', 'design node', 'figma', 'node']);

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

/** `*Scope:* FULL` or `*Scope:* CASES: TC_03, TC_07`. */
const SCOPE_LINE = /^\**Scope:?\**\s*(FULL|CASES:\s*\S.*)$/i;
/**
 * `*Retest Result: PASSED* ✅`, optionally scoped.
 *
 * BLOCKED and PWMI are accepted because a round reports what its rows actually
 * say. Forcing a fully blocked round to read FAILED tells the reader a defect was
 * found when none was — a coverage gap is not a defect.
 */
const SUMMARY_LINE = /^\**Retest Result:\s*(PASSED|FAILED|BLOCKED|PWMI)(\s*\(scoped:[^)]*\))?\**\s*(✅|❌|⛔|⚠️)?\s*$/i;
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
 * boundary, so link spans are treated as atomic. See OPEN_QUESTIONS below: whether
 * Jira itself agrees has not been verified against a live comment.
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
    out.push(finding('summary-line-shape', summaryIdx + 1,
      'summary line is not exactly PASSED/FAILED (optionally "(scoped: …)")',
      'e.g. *Retest Result: PASSED* ✅'));
  }

  HEADER_LINES.forEach((h) => {
    if (h.when === 'api' && !isApi) return;
    if (h.when === 'ui' && isApi) return;
    const re = new RegExp(`^\\**${h.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:?\\**`, 'im');
    if (!lines.some((l) => re.test(l.trim()))) {
      out.push(finding('header-line-missing', 0, `header line "${h.key}:" is missing`, 'every retest comment carries it'));
    }
  });

  const scopeLine = lines.find((l) => /^\**Scope:?\**/i.test(l.trim()));
  if (scopeLine && !SCOPE_LINE.test(scopeLine.trim())) {
    out.push(finding('scope-line-shape', lines.indexOf(scopeLine) + 1,
      'Scope line must read FULL or "CASES: <ids>"',
      'e.g. *Scope:* CASES: TC_03, TC_07'));
  }

  const tables = findTables(text, format);
  const verdict = tables.find((t) => kindOfTable(t) === 'verdict');
  const cases = tables.find((t) => kindOfTable(t) === 'cases');

  if (!verdict) {
    out.push(finding('verdict-table-missing', 0, 'no verdict table', 'one row per expected-result item'));
  } else {
    const want = isApi ? VERDICT_TABLE_HEADERS_API : VERDICT_TABLE_HEADERS;
    if (verdict.headers.join('|') !== want.join('|')) {
      out.push(finding('verdict-table-headers', verdict.headerLine,
        `verdict table headers are [${verdict.headers.join(', ')}]`,
        `must be exactly [${want.join(', ')}]`));
    }
    const evidenceCol = verdict.headers.indexOf('Evidence');
    const statusCol = verdict.headers.length - 1;
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

  if (!cases) {
    out.push(finding('case-table-missing', 0, 'no "Test cases run" table', 'bug and task retests both carry it'));
  } else {
    cases.headers.forEach((h, i) => {
      if (CASE_TABLE_FORBIDDEN_HEADERS.includes(h.toLowerCase())) {
        out.push(finding('case-table-design-column', cases.headerLine,
          `case table carries a "${h}" column (position ${i + 1})`,
          'the design reference goes on the header Design ref: line, never a per-row column'));
      }
    });
    cases.rows.forEach((r) => {
      if (r.cells.length !== cases.headers.length) {
        out.push(finding('row-column-count', r.line,
          `case row has ${r.cells.length} cell(s), the header has ${cases.headers.length}`,
          'a stray or missing delimiter shifts every later value into the wrong column'));
      }
    });
    const missing = CASE_TABLE_HEADERS.filter((h) => !cases.headers.includes(h));
    if (missing.length) {
      out.push(finding('case-table-headers', cases.headerLine,
        `case table is missing column(s): ${missing.join(', ')}`,
        `must be exactly [${CASE_TABLE_HEADERS.join(', ')}]`));
    }
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
  VERDICT_TABLE_HEADERS_API,
  CASE_TABLE_HEADERS,
  CASE_TABLE_FORBIDDEN_HEADERS,
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
