#!/usr/bin/env node
'use strict';

/**
 * aggregate.js — turn exported retest comments (plus an optional backfill
 * snapshot, plus optional notifications from the team Discord thread) into a
 * markdown usage report: who used the retest skill, on which project / issuetype,
 * through which entry point and agent, and with what verdict.
 *
 * This repo is PUBLIC. The tool only reads files the caller passes in; it never
 * talks to Jira, and its inputs/outputs belong outside the repository.
 *
 * Exit codes — "could not run" is never a pass:
 *   0  report printed (or written to --out)
 *   2  bad arguments, or an input file is missing / unreadable / malformed
 *
 * Usage:
 *   node tools/retest-usage/aggregate.js --comments <comments.json>
 *        [--snapshot <backfill.csv>] [--discord <discord.json>] [--cutoff <ISO date>] [--out <file.md>]
 *
 * comments.json — array of {issue_key, project, issuetype, author, created, body}
 * backfill.csv  — header: issue_key,project,issuetype,comment_id,poster,created,verdict,skill
 * discord.json  — array of {ts, ticket, kind: "retest"|"tested", project?, issuetype?, runner?, owner?}
 *                 `owner` is the QA Owner shown in the post (a reviewer, not the runner) and is
 *                 never used as the poster. The cutoff does not apply to Discord entries.
 */

const fs = require('fs');

const MARKER_ANCHOR = 'retestskillmarker';
const SNAPSHOT_COLUMNS = ['issue_key', 'project', 'issuetype', 'comment_id', 'poster', 'created', 'verdict', 'skill'];
const VERDICTS = ['PASSED', 'FAILED', 'BLOCKED'];
const NONE = '—';
const DAY_MS = 86400000;
const DISCORD_KINDS = { retest: 'retest-bug-workflow', tested: 'testing-ticket' };
const DISCORD_UNKNOWN_POSTER = 'unknown (Discord)';

/* ------------------------------------------------------------------ parsing */

/**
 * A comment body may arrive as a plain string or as an ADF document. Flatten
 * ADF to text with one line per block so the marker / verdict lines survive.
 */
function bodyText(body) {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  const out = [];
  (function walk(node) {
    if (node == null) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node !== 'object') return;
    if (node.type === 'text' && typeof node.text === 'string') out.push(node.text);
    if (node.type === 'hardBreak') out.push('\n');
    if (Array.isArray(node.content)) walk(node.content);
    if (['paragraph', 'heading', 'listItem', 'tableRow', 'codeBlock'].includes(node.type)) out.push('\n');
  })(body);
  return out.join('');
}

/** Strip the italic/bold wrapper a value can pick up at the end of the marker line. */
function cleanValue(v) {
  return String(v).replace(/^[_*]+/, '').replace(/[_*]+$/, '');
}

/**
 * Returns the marker's key/value fields, or null when the body carries no marker.
 * `\w` includes `_`, so the closing `_` of a wiki-italic marker would otherwise
 * stick to the last value (`agent=claude-code_`).
 */
function parseMarker(body) {
  const text = bodyText(body);
  const line = text.split(/\r?\n/).find((l) => l.includes(MARKER_ANCHOR));
  if (line === undefined) return null;
  const fields = {};
  const re = /(\w+)=([\w.-]+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const key = cleanValue(m[1]);
    const val = cleanValue(m[2]);
    if (key && val) fields[key] = val;
  }
  return fields;
}

/**
 * Verdict from the first line that contains `Retest Result:` (not literally line 1 —
 * a converted body often starts with a blank line). Bold markup is removed first.
 */
function parseVerdict(body) {
  const text = bodyText(body);
  const line = text.split(/\r?\n/).find((l) => /Retest Result:/i.test(l));
  if (line === undefined) return 'other';
  const m = line.replace(/\*/g, '').match(/Retest Result:\s*_?\s*([A-Za-z]+)/i);
  if (!m) return 'other';
  const v = m[1].toUpperCase();
  return VERDICTS.includes(v) ? v : 'other';
}

/** Jira writes `+0700`; Date.parse wants `+07:00`. Returns ms or NaN. */
function parseDate(s) {
  if (s == null || s === '') return NaN;
  const norm = String(s).trim().replace(/([+-]\d\d)(\d\d)$/, '$1:$2');
  return Date.parse(norm);
}

/**
 * A date as a time span in ms: a timestamp is a point, a bare `YYYY-MM-DD` covers its whole UTC
 * day (a date-only value says nothing about the hour, so it must not be read as midnight only).
 * Returns null when unparseable.
 */
function timeSpan(s) {
  const ms = parseDate(s);
  if (Number.isNaN(ms)) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(s).trim())) return { lo: ms, hi: ms + DAY_MS - 1 };
  return { lo: ms, hi: ms };
}

/** Gap between two spans in ms (0 when they overlap). */
function spanGap(a, b) {
  if (a.hi < b.lo) return b.lo - a.hi;
  if (b.hi < a.lo) return a.lo - b.hi;
  return 0;
}

/** Minimal RFC 4180 CSV parser: quoted fields, doubled quotes, CRLF, leading BOM. */
function parseCsv(text) {
  const src = String(text).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('unterminated quoted field');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

/** Snapshot CSV text → array of row objects. Throws on a missing column. */
function parseSnapshot(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('snapshot is empty (no header)');
  const header = rows[0].map((h) => h.trim());
  const missing = SNAPSHOT_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new Error('snapshot is missing column(s): ' + missing.join(', '));
  return rows.slice(1).map((r, n) => {
    if (r.length !== header.length) {
      throw new Error(`snapshot row ${n + 2} has ${r.length} field(s), header has ${header.length}`);
    }
    const o = {};
    header.forEach((h, i) => { o[h] = r[i].trim(); });
    return o;
  });
}

/**
 * Validate parsed discord.json. Throws on anything that would make the count wrong:
 * a non-array, a missing ticket, an unknown kind or an unparseable timestamp.
 */
function validateDiscord(entries) {
  if (!Array.isArray(entries)) throw new Error('discord file must hold a JSON array');
  entries.forEach((e, i) => {
    if (e == null || typeof e !== 'object') throw new Error(`discord entry ${i} is not an object`);
    if (typeof e.ticket !== 'string' || e.ticket.trim() === '') throw new Error(`discord entry ${i} has no ticket`);
    if (!Object.prototype.hasOwnProperty.call(DISCORD_KINDS, e.kind)) {
      throw new Error(`discord entry ${i} has kind ${JSON.stringify(e.kind)} (expected "retest" or "tested")`);
    }
    if (timeSpan(e.ts) === null) throw new Error(`discord entry ${i} has an unparseable ts: ${JSON.stringify(e.ts)}`);
  });
  return entries;
}

/* -------------------------------------------------------------- aggregation */

function authorName(a) {
  if (a == null || a === '') return 'unknown';
  if (typeof a === 'string') return a;
  return a.displayName || a.name || a.emailAddress || 'unknown';
}

function isManual(skill) {
  return /^manual/i.test(String(skill || '').trim());
}

/** Snapshot labels a Discord announcement can upgrade to AI use. */
function isUpgradable(skill) {
  return /^(manual|unknown)/i.test(String(skill || '').trim());
}

function normKey(k) {
  return String(k == null ? '' : k).trim().toUpperCase();
}

/**
 * One-to-one match of Discord entries to counted records: same ticket, gap ≤ 1 day. Greedy over
 * every candidate pair, nearest first; ties broken by record index then entry index, so a rerun
 * on the same input always pairs the same way. Records with no parseable date never match.
 * Returns Map(recordIndex → entryIndex). Reads its inputs only.
 */
function matchDiscord(records, entries) {
  const pairs = [];
  entries.forEach((e, di) => {
    const es = timeSpan(e.ts);
    const ticket = normKey(e.ticket);
    records.forEach((r, ri) => {
      if (r.span === null || normKey(r.issue_key) !== ticket) return;
      const gap = spanGap(r.span, es);
      if (gap <= DAY_MS) pairs.push([gap, ri, di]);
    });
  });
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const byRecord = new Map();
  const usedEntries = new Set();
  for (const [, ri, di] of pairs) {
    if (byRecord.has(ri) || usedEntries.has(di)) continue;
    byRecord.set(ri, di);
    usedEntries.add(di);
  }
  return byRecord;
}

function normVerdict(v) {
  const u = String(v || '').trim().toUpperCase();
  return VERDICTS.includes(u) ? u : 'other';
}

function inc(map, key, n = 1) {
  map.set(key, (map.get(key) || 0) + n);
}

function range(times) {
  const ok = times.filter((t) => !Number.isNaN(t));
  if (!ok.length) return null;
  return { from: new Date(Math.min(...ok)).toISOString(), to: new Date(Math.max(...ok)).toISOString() };
}

/**
 * Pure aggregation. `comments` is the parsed comments.json array, `snapshotRows`
 * the parsed snapshot rows (or []), `cutoff` an ISO string or null.
 */
function aggregate({ comments = [], snapshotRows = [], discord = null, cutoff = null } = {}) {
  if (discord !== null) validateDiscord(discord);
  const cutoffMs = cutoff == null || cutoff === '' ? null : parseDate(cutoff);
  if (cutoffMs !== null && Number.isNaN(cutoffMs)) throw new Error('--cutoff is not a valid date: ' + cutoff);

  const stats = {
    commentsRead: comments.length,
    marked: 0,
    unmarked: 0,
    beforeCutoff: 0,
    undatedKept: 0,
    snapshotRows: snapshotRows.length,
    snapshotSkill: 0,
    snapshotManual: 0,
    cutoff: cutoffMs === null ? null : new Date(cutoffMs).toISOString(),
    overlapWarning: snapshotRows.length > 0 && cutoffMs === null,
    commentRange: null,
    snapshotRange: null,
    discord: discord === null ? null : { read: discord.length, matched: 0, upgraded: 0, added: 0, range: null },
  };

  // Every record that could be counted: marked comments after the cutoff, and every snapshot row
  // (manual ones too — a Discord announcement can upgrade them). Split into used / manual last.
  const candidates = [];
  const commentTimes = [];
  const snapshotTimes = [];

  for (const c of comments) {
    const fields = parseMarker(c && c.body);
    if (fields === null) { stats.unmarked += 1; continue; }
    const t = parseDate(c.created);
    if (cutoffMs !== null) {
      if (Number.isNaN(t)) stats.undatedKept += 1;
      else if (t < cutoffMs) { stats.beforeCutoff += 1; continue; }
    }
    stats.marked += 1;
    commentTimes.push(t);
    candidates.push({
      issue_key: c.issue_key || 'unknown',
      project: c.project || 'unknown',
      issuetype: c.issuetype || 'unknown',
      poster: authorName(c.author),
      verdict: parseVerdict(c.body),
      skillVia: `${fields.skill || 'unknown'} / ${fields.via || 'unknown'}`,
      src: fields.src || 'unknown',
      agent: fields.agent || 'unknown',
      span: timeSpan(c.created),
      upgradable: false,
    });
  }

  for (const r of snapshotRows) {
    snapshotTimes.push(parseDate(r.created));
    candidates.push({
      issue_key: r.issue_key || 'unknown',
      project: r.project || 'unknown',
      issuetype: r.issuetype || 'unknown',
      poster: r.poster || 'unknown',
      verdict: normVerdict(r.verdict),
      skillVia: r.skill || 'unknown',
      src: 'snapshot',
      agent: NONE,
      span: timeSpan(r.created),
      upgradable: isUpgradable(r.skill),
    });
  }

  const entries = discord || [];
  const matches = matchDiscord(candidates, entries);
  const records = [];
  const manual = [];
  candidates.forEach((c, ri) => {
    const { span, upgradable, ...rec } = c;
    rec.inDiscord = matches.has(ri);
    if (rec.inDiscord) {
      stats.discord.matched += 1;
      if (upgradable) {
        rec.skillVia = `${DISCORD_KINDS[entries[matches.get(ri)].kind]} (AI confirmed by Discord)`;
        stats.discord.upgraded += 1;
      }
    }
    const isManualRow = rec.src === 'snapshot' && isManual(rec.skillVia);
    if (rec.src === 'snapshot') { if (isManualRow) stats.snapshotManual += 1; else stats.snapshotSkill += 1; }
    if (isManualRow) manual.push(rec); else records.push(rec);
  });

  const matchedEntries = new Set(matches.values());
  entries.forEach((e, di) => {
    if (matchedEntries.has(di)) return;
    stats.discord.added += 1;
    records.push({
      issue_key: e.ticket.trim(),
      project: e.project || 'unknown',
      issuetype: e.issuetype || 'unknown',
      poster: e.runner || DISCORD_UNKNOWN_POSTER, // never e.owner: that is the reviewer, not the runner
      verdict: 'other',
      skillVia: DISCORD_KINDS[e.kind],
      src: 'discord',
      agent: NONE,
      inDiscord: true,
    });
  });
  if (stats.discord) stats.discord.range = range(entries.map((e) => parseDate(e.ts)));

  stats.commentRange = range(commentTimes);
  stats.snapshotRange = range(snapshotTimes);

  const group = (list, keyFields) => {
    const m = new Map();
    for (const r of list) {
      const k = JSON.stringify(keyFields.map((f) => r[f]));
      if (!m.has(k)) m.set(k, { ...Object.fromEntries(keyFields.map((f) => [f, r[f]])), count: 0, discord: 0, issues: new Set() });
      const g = m.get(k);
      g.count += 1;
      if (r.inDiscord) g.discord += 1;
      g.issues.add(r.issue_key);
    }
    return [...m.values()]
      .map((g) => ({ ...g, issues: [...g.issues].sort(compareKeys) }))
      .sort((a, b) => b.count - a.count || keyFields.reduce((acc, f) => acc || String(a[f]).localeCompare(String(b[f])), 0));
  };

  const totals = { poster: new Map(), issuetype: new Map(), project: new Map(), verdict: new Map() };
  for (const r of records) for (const k of Object.keys(totals)) inc(totals[k], r[k]);
  const sortedTotals = {};
  for (const [k, m] of Object.entries(totals)) {
    sortedTotals[k] = [...m.entries()].map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
  }

  return {
    rows: group(records, ['poster', 'project', 'issuetype', 'skillVia', 'src', 'agent']),
    manualRows: group(manual, ['poster', 'project', 'issuetype', 'skillVia']),
    totals: sortedTotals,
    total: records.length,
    stats,
  };
}

/** `DEMO-2` before `DEMO-10`. */
function compareKeys(a, b) {
  const ma = /^(.*?)-(\d+)$/.exec(a);
  const mb = /^(.*?)-(\d+)$/.exec(b);
  if (ma && mb && ma[1] === mb[1]) return Number(ma[2]) - Number(mb[2]);
  return String(a).localeCompare(String(b));
}

/* ---------------------------------------------------------------- rendering */

function cell(v) {
  return String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function table(headers, rows) {
  const lines = ['| ' + headers.join(' | ') + ' |', '|' + headers.map(() => '---').join('|') + '|'];
  if (!rows.length) lines.push('| ' + headers.map((_, i) => (i === 0 ? '(none)' : '')).join(' | ') + ' |');
  for (const r of rows) lines.push('| ' + r.map(cell).join(' | ') + ' |');
  return lines.join('\n');
}

function fmtRange(r) {
  return r ? `${r.from} → ${r.to}` : 'n/a';
}

function renderMarkdown(result) {
  const { rows, manualRows, totals, total, stats } = result;
  const out = [];
  out.push('# Retest skill usage');
  out.push('');
  out.push(`Skill uses counted: **${total}**`);
  out.push('');
  out.push('## Usage');
  out.push('');
  out.push(table(['Poster', 'Project', 'Issuetype', 'Skill/via', 'Src', 'Agent', 'Count', 'Discord', 'Issues'],
    rows.map((r) => [r.poster, r.project, r.issuetype, r.skillVia, r.src, r.agent, r.count, r.discord, r.issues.join(', ')])));
  const totalSections = [['poster', 'Poster'], ['issuetype', 'Issuetype'], ['project', 'Project'], ['verdict', 'Verdict']];
  for (const [key, label] of totalSections) {
    out.push('');
    out.push(`## Totals by ${key}`);
    out.push('');
    out.push(table([label, 'Count'], totals[key].map((t) => [t.name, t.count])));
  }
  out.push('');
  out.push('## Not via skill (snapshot)');
  out.push('');
  out.push(table(['Poster', 'Project', 'Issuetype', 'Skill', 'Count', 'Issues'],
    manualRows.map((r) => [r.poster, r.project, r.issuetype, r.skillVia, r.count, r.issues.join(', ')])));
  out.push('');
  out.push('---');
  out.push('');
  const foot = [];
  foot.push(`Comments read: ${stats.commentsRead} · marked, counted: ${stats.marked} · unmarked, skipped: ${stats.unmarked}` +
    (stats.cutoff ? ` · before cutoff (${stats.cutoff}), skipped: ${stats.beforeCutoff}` : ''));
  if (stats.undatedKept) foot.push(`Marked comments with no parseable date, kept despite the cutoff: ${stats.undatedKept}`);
  foot.push(`Snapshot rows: ${stats.snapshotRows} · via skill: ${stats.snapshotSkill} · not via skill: ${stats.snapshotManual}`);
  foot.push(`Comment date range: ${fmtRange(stats.commentRange)} · snapshot date range: ${fmtRange(stats.snapshotRange)}`);
  if (stats.discord) {
    const d = stats.discord;
    foot.push(`Discord entries read: ${d.read} · matched: ${d.matched} · upgraded: ${d.upgraded} · added as new: ${d.added}`);
    foot.push(`Discord date range: ${fmtRange(d.range)}`);
  }
  if (stats.overlapWarning) foot.push('Warning: --snapshot given without --cutoff — comments the snapshot already covers may be counted twice.');
  out.push(foot.join('  \n'));
  out.push('');
  return out.join('\n');
}

/* ---------------------------------------------------------------------- CLI */

function parseArgs(argv) {
  const known = { '--comments': 'comments', '--snapshot': 'snapshot', '--discord': 'discord', '--cutoff': 'cutoff', '--out': 'out' };
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { args.help = true; continue; }
    const name = known[a];
    if (!name) throw new Error('unknown argument: ' + a);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(a + ' needs a value');
    args[name] = v;
    i += 1;
  }
  return args;
}

const USAGE = 'usage: node tools/retest-usage/aggregate.js --comments <comments.json> ' +
  '[--snapshot <backfill.csv>] [--discord <discord.json>] [--cutoff <ISO date>] [--out <file.md>]';

function main(argv) {
  let args;
  try { args = parseArgs(argv); } catch (e) { console.error(e.message + '\n' + USAGE); return 2; }
  if (args.help) { console.log(USAGE); return 0; }
  if (!args.comments) { console.error('--comments is required\n' + USAGE); return 2; }

  let comments;
  try {
    comments = JSON.parse(fs.readFileSync(args.comments, 'utf8'));
  } catch (e) {
    console.error('could not read comments file: ' + e.message);
    return 2;
  }
  if (!Array.isArray(comments)) { console.error('comments file must hold a JSON array'); return 2; }

  let snapshotRows = [];
  if (args.snapshot) {
    try {
      snapshotRows = parseSnapshot(fs.readFileSync(args.snapshot, 'utf8'));
    } catch (e) {
      console.error('could not read snapshot file: ' + e.message);
      return 2;
    }
  }

  let discord = null;
  if (args.discord) {
    try {
      discord = validateDiscord(JSON.parse(fs.readFileSync(args.discord, 'utf8')));
    } catch (e) {
      console.error('could not read discord file: ' + e.message);
      return 2;
    }
  }

  let md;
  try {
    md = renderMarkdown(aggregate({ comments, snapshotRows, discord, cutoff: args.cutoff || null }));
  } catch (e) {
    console.error(e.message);
    return 2;
  }

  if (args.out) {
    try { fs.writeFileSync(args.out, md); } catch (e) { console.error('could not write --out: ' + e.message); return 2; }
    console.log('wrote ' + args.out);
  } else {
    process.stdout.write(md);
  }
  return 0;
}

module.exports = {
  parseMarker, parseVerdict, parseSnapshot, parseCsv, parseDate, bodyText, validateDiscord, matchDiscord,
  aggregate, renderMarkdown, main,
};

// exitCode, not exit(): a hard exit can cut off a large report still draining to a pipe.
if (require.main === module) process.exitCode = main(process.argv.slice(2));
