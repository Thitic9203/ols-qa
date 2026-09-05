'use strict';

/**
 * The post-mortem rules — the single source of truth for every mechanically decidable
 * rule about the debt ledger and the reports it points at.
 *
 * A rule that lives only in prose is a rule that erodes. Everything here is consumed by
 * `check.js` (the gate), by `postmortem_rules.test.js` (which pins it), and indirectly by
 * the git pre-commit hook and CI. The prose in `docs/post-mortem/README.md` links here
 * rather than restating it.
 *
 * Pure functions only: no filesystem, no network. The caller supplies the text.
 */

/**
 * `20260905-post-mortem-report-0001-deleted-working-links-on-unverified-claim.md`
 *
 * skl-merit's shape with two changes the owner asked for:
 *
 *   - the running number is **zero-padded to 4 digits**, so the folder sorts correctly by
 *     name for as long as this repo lives, instead of putting 10 between 1 and 2;
 *   - a **mandatory English slug**, so the file list alone says what each report is about
 *     without opening anything. Required, not encouraged — a naming convention that is
 *     merely encouraged decays into `report-7.md` inside a month.
 *
 * ASCII only: the filename gets read in a browser, a terminal and a git log.
 */
const REPORT_FILE_RE = /^(\d{4})(\d{2})(\d{2})-post-mortem-report-(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** A slug of one or two words says nothing. Three is the point where it reads as a topic. */
const SLUG_MIN_WORDS = 3;
const SLUG_MAX_WORDS = 12;
const SLUG_MAX_LENGTH = 80;

/**
 * The only entries in docs/post-mortem/ that are not reports. Everything else in that
 * folder must be a report with a valid name — see `classifyFolder`.
 */
const NON_REPORT_FILES = ['README.md', 'TEMPLATE.md', 'PENDING.md'];

/**
 * Sort every entry of the folder into reports / known non-reports / strays.
 *
 * This exists because the first version of the gate listed the folder and kept only the
 * names that already matched REPORT_FILE_RE. A misnamed report was therefore filtered out
 * before any rule could look at it, and the gate printed "structure clean" over a file it
 * had never opened — the exact failure this repo keeps re-learning: a check that silently
 * ignores what it cannot parse reports success for the wrong reason. Anything unrecognised
 * is now a finding, not a skip.
 *
 * @returns {{reports: string[], strays: string[]}}
 */
function classifyFolder(entryNames) {
  const known = new Set(NON_REPORT_FILES);
  const reports = [];
  const strays = [];
  for (const name of entryNames) {
    if (known.has(name)) continue;
    if (REPORT_FILE_RE.test(name)) reports.push(name);
    else strays.push(name);
  }
  return { reports: reports.sort(), strays: strays.sort() };
}

/** `PM-2026-09-05-01` — date, then that day's sequence. */
const LEDGER_ID_RE = /^PM-(\d{4})-(\d{2})-(\d{2})-(\d{2})$/;

/**
 * Three, and only three. A status nobody can parse is a status nobody follows up on, so
 * an unknown value is refused rather than ignored.
 */
const STATUSES = ['OPEN', 'DONE', 'WONTFIX'];

/** The metadata block, taken verbatim from the skl-merit reports. */
const REQUIRED_META = [
  'ระบบ',
  'สภาพแวดล้อมที่ได้รับผลกระทบ',
  'วันที่เกิดเหตุ',
  'วันที่ค้นพบ',
  'วันที่จัดทำรายงาน',
  'ผู้จัดทำ',
  'ระดับความรุนแรง',
  'ประเภท',
];

/** The ten numbered sections plus the summary — skl-merit report-2's shape. */
const REQUIRED_HEADINGS = [
  '## สรุปสั้น (Executive Summary)',
  '## 1. ปัญหา (Problem Statement)',
  '## 2. ไทม์ไลน์ (Timeline)',
  '## 3. สาเหตุโดยละเอียด (Root Cause Analysis)',
  '## 4. ผลกระทบ (Impact)',
  '## 5. แนวทางการแก้ไข (Fix)',
  '## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)',
  '## 7. การตรวจจับปัญหา (Detection)',
  '## 8. บทเรียนที่ได้ (Lessons Learned)',
  '## 9. Action Items',
  '## 10. Technical Appendix',
];

/** 5 Whys is what separates a cause from a symptom, so it is required, not encouraged. */
const REQUIRED_FIVE_WHYS = '### 5 Whys';

/**
 * The line that ties a report to the rule it produced. Without it a post-mortem is a
 * story; with it, it is a change. This is the whole mechanism behind "never twice".
 */
const RULE_MARKER = '**กฎที่เพิ่มจากเหตุนี้:**';

/** Optional. When present it must name a report that exists. */
const REPEAT_MARKER = '**ผิดซ้ำจาก:**';

/**
 * Strings that only survive in a template nobody filled in. A half-written report filed
 * as done is worse than an open debt row: the debt row still says work is owed.
 */
const UNFILLED_SENTINELS = ['YYYY-MM-DD', 'Post-Mortem Report #NNNN', '[ข้อเท็จจริงที่ 1'];

const EMPTY_CELL = new Set(['', '—', '-', '–', 'n/a', 'N/A']);

/** Turn a running number into the padded form used everywhere: 3 → "0003". */
function pad4(n) {
  return String(n).padStart(4, '0');
}

/** @returns {{date: string, n: number, padded: string, slug: string}|null} */
function parseReportName(name) {
  const m = REPORT_FILE_RE.exec(name);
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}`,
    n: Number(m[4]),
    padded: m[4],
    slug: m[5],
  };
}

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Structural check of one report.
 * @returns {string[]} problems — empty means it passes.
 */
function validateReport(name, text) {
  const problems = [];
  const parsed = parseReportName(name);
  if (!parsed) {
    problems.push(
      `${name}: filename must look like <วันที่ 8 หลัก>-post-mortem-report-0001-english-topic-slug.md ` +
      '(running number padded to 4 digits, then a lowercase English slug of the problem)',
    );
    return problems;
  }

  // The slug is the whole reason the number is not enough: it has to read as a topic.
  const words = parsed.slug.split('-');
  if (words.length < SLUG_MIN_WORDS) {
    problems.push(`${name}: the topic slug needs at least ${SLUG_MIN_WORDS} words — "${parsed.slug}" does not say what went wrong`);
  }
  if (words.length > SLUG_MAX_WORDS) {
    problems.push(`${name}: the topic slug has ${words.length} words, max ${SLUG_MAX_WORDS} — it is a label, not a summary`);
  }
  if (parsed.slug.length > SLUG_MAX_LENGTH) {
    problems.push(`${name}: the topic slug is ${parsed.slug.length} characters, max ${SLUG_MAX_LENGTH}`);
  }
  if (words.some((w) => w.length < 2)) {
    problems.push(`${name}: the topic slug has a single-character word — spell it out`);
  }

  const titleLine = (text.split('\n').find((l) => l.startsWith('# ')) || '').trim();
  const titleMatch = /^# Post-Mortem Report #(\d+) — .+/.exec(titleLine);
  if (!titleMatch) {
    problems.push(`${name}: first heading must read "# Post-Mortem Report #0001 — <หัวข้อ>" (got: ${titleLine || '<none>'})`);
  } else if (titleMatch[1] !== parsed.padded) {
    // Compared as text, not as a number: "#1" and "#0001" are the same report but the
    // padding has to match everywhere, or the folder stops sorting by name.
    problems.push(`${name}: title says #${titleMatch[1]} but the filename says #${parsed.padded} — use the padded form in both`);
  }

  for (const key of REQUIRED_META) {
    if (!text.includes(`**${key}:**`)) problems.push(`${name}: missing metadata line **${key}:**`);
  }
  for (const heading of REQUIRED_HEADINGS) {
    if (!text.includes(heading)) problems.push(`${name}: missing section "${heading}"`);
  }
  if (!text.includes(REQUIRED_FIVE_WHYS)) {
    problems.push(`${name}: missing "${REQUIRED_FIVE_WHYS}" — a cause without it is usually a symptom`);
  }
  if (!text.includes(RULE_MARKER)) {
    problems.push(`${name}: missing "${RULE_MARKER}" — a report that changes no rule cannot stop a repeat`);
  }
  for (const sentinel of UNFILLED_SENTINELS) {
    if (text.includes(sentinel)) {
      problems.push(`${name}: still carries the unfilled template text "${sentinel}"`);
    }
  }
  return problems;
}

/** @returns {number[]} the report numbers a report claims to repeat. */
function repeatsOf(text) {
  const out = [];
  const line = text.split('\n').find((l) => l.includes(REPEAT_MARKER));
  if (!line) return out;
  for (const m of line.matchAll(/#(\d+)/g)) out.push(Number(m[1]));
  return out;
}

/**
 * Parse the ledger table out of PENDING.md. The table is found by its header, never by
 * line number — a paragraph added above it must not silently shift what is read
 * (the PM-010 lesson: identity, not position).
 * @returns {{rows: object[], problems: string[]}}
 */
function parseLedger(text) {
  const lines = text.split('\n');
  const problems = [];
  const rows = [];

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim().startsWith('|') && l.includes('ID') && l.includes('สถานะ') && l.includes('รายงาน')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    problems.push('PENDING.md: no ledger table found (need a header row with ID … สถานะ … รายงาน)');
    return { rows, problems };
  }

  const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const headers = cells(lines[headerIdx]);
  if (headers.length !== 6) {
    problems.push(`PENDING.md: ledger must have 6 columns, found ${headers.length} — hooks and the gate read it by position after this header`);
    return { rows, problems };
  }

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim().startsWith('|')) break;
    const c = cells(raw);
    if (c.every((x) => /^:?-{2,}:?$/.test(x))) continue; // separator
    if (c.length !== 6) {
      problems.push(`PENDING.md line ${i + 1}: expected 6 columns, found ${c.length}`);
      continue;
    }
    rows.push({
      id: c[0], occurred: c[1], symptom: c[2], origin: c[3], status: c[4], report: c[5], line: i + 1,
    });
  }
  return { rows, problems };
}

/** @returns {string[]} problems with the rows themselves (not with the reports they name). */
function validateLedger(rows) {
  const problems = [];
  const seen = new Map();

  for (const r of rows) {
    const at = `PENDING.md line ${r.line}`;
    if (!LEDGER_ID_RE.test(r.id)) problems.push(`${at}: id "${r.id}" must look like PM-YYYY-MM-DD-NN`);
    if (seen.has(r.id)) problems.push(`${at}: duplicate id "${r.id}" (also line ${seen.get(r.id)})`);
    else seen.set(r.id, r.line);

    if (!isIsoDate(r.occurred)) problems.push(`${at}: เกิดเมื่อ "${r.occurred}" must be YYYY-MM-DD`);
    if (EMPTY_CELL.has(r.symptom)) problems.push(`${at}: อาการ is empty — a row nobody can trace back is not a record`);

    if (!STATUSES.includes(r.status)) {
      problems.push(`${at}: status "${r.status}" is not one of ${STATUSES.join(' / ')}`);
      continue;
    }
    if (r.status === 'OPEN' && !EMPTY_CELL.has(r.report)) {
      problems.push(`${at}: status OPEN but a report is named — set it to DONE, or clear the report cell`);
    }
    if (r.status === 'DONE' && !REPORT_FILE_RE.test(r.report)) {
      problems.push(`${at}: status DONE must name a report file, got "${r.report}"`);
    }
    if (r.status === 'WONTFIX') {
      if (EMPTY_CELL.has(r.report)) {
        problems.push(`${at}: WONTFIX must carry the owner's reason in the รายงาน cell`);
      } else if (!/\d{4}-\d{2}-\d{2}/.test(r.report)) {
        problems.push(`${at}: WONTFIX reason must carry the date the owner decided it`);
      }
    }
  }
  return problems;
}

/** Rows still owing a report — what every hook shouts about. */
function openRows(rows) {
  return rows.filter((r) => r.status === 'OPEN');
}

/**
 * The checks that only make sense across the whole folder: ledger ↔ files ↔ index.
 * @param {{reportNames: string[], reportTexts: Object<string,string>, rows: object[], indexText: string}} input
 */
function crossCheck({ reportNames, reportTexts = {}, rows, indexText }) {
  const problems = [];
  const onDisk = new Set(reportNames);

  const claimed = new Map();
  for (const r of rows) {
    if (r.status !== 'DONE') continue;
    if (!onDisk.has(r.report)) {
      problems.push(`PENDING.md line ${r.line}: names "${r.report}", which does not exist in docs/post-mortem/`);
    }
    if (claimed.has(r.report)) {
      problems.push(`PENDING.md line ${r.line}: "${r.report}" is already claimed by line ${claimed.get(r.report)}`);
    } else {
      claimed.set(r.report, r.line);
    }
  }

  // A report with no ledger row means the ledger under-reports the debt that existed.
  for (const name of reportNames) {
    if (!claimed.has(name)) problems.push(`${name}: exists but no DONE row in PENDING.md points at it`);
    if (indexText && !indexText.includes(name)) {
      problems.push(`${name}: missing from the index in docs/post-mortem/README.md`);
    }
  }

  // Numbering runs 0001, 0002, 0003 … with no gaps and no duplicates. A gap means a report
  // was deleted, which is the one thing this folder must never lose quietly.
  const numbers = reportNames.map((n) => parseReportName(n)).filter(Boolean).map((p) => p.n).sort((a, b) => a - b);
  const expected = numbers.map((_, i) => i + 1);
  if (numbers.join(',') !== expected.join(',')) {
    problems.push(
      `report numbering must run ${pad4(1)}..${pad4(numbers.length)} with no gaps or duplicates, ` +
      `got [${numbers.map(pad4).join(', ')}]`,
    );
  }

  const existing = new Set(numbers);
  for (const [name, text] of Object.entries(reportTexts)) {
    for (const n of repeatsOf(text)) {
      if (!existing.has(n)) problems.push(`${name}: "${REPEAT_MARKER}" points at #${n}, which does not exist`);
    }
  }

  // Index entries that name a file nobody wrote.
  if (indexText) {
    for (const m of indexText.matchAll(/\d{8}-post-mortem-report-\d{4}-[a-z0-9-]+\.md/g)) {
      if (!onDisk.has(m[0])) problems.push(`README.md indexes "${m[0]}", which does not exist`);
    }
  }
  return problems;
}

module.exports = {
  REPORT_FILE_RE,
  NON_REPORT_FILES,
  classifyFolder,
  SLUG_MIN_WORDS,
  SLUG_MAX_WORDS,
  SLUG_MAX_LENGTH,
  pad4,
  LEDGER_ID_RE,
  STATUSES,
  REQUIRED_META,
  REQUIRED_HEADINGS,
  REQUIRED_FIVE_WHYS,
  RULE_MARKER,
  REPEAT_MARKER,
  UNFILLED_SENTINELS,
  parseReportName,
  validateReport,
  repeatsOf,
  parseLedger,
  validateLedger,
  openRows,
  crossCheck,
};
