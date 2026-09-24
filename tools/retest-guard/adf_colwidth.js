#!/usr/bin/env node
'use strict';

/**
 * Post-publish layout step for a retest comment's single table (FORMAT rules 5–6).
 *
 * The v2 wiki endpoint — the one that resolves `!file.png!` and `[▶ f.mp4|^f.mp4]`
 * to attachments — cannot express column widths or alignment. So the comment is
 * posted as wiki first, then its ADF is read back, laid out here, and written back
 * with a v3 PUT. This file only transforms and checks JSON; it never talks to the
 * tracker, so it needs no token and cannot edit anything by itself.
 *
 *   node tools/retest-guard/adf_colwidth.js --in get.json --out put.json
 *       get.json = the v3 GET response of the posted comment (or its `body` doc)
 *       put.json = { "body": <laid-out doc> }, ready for the v3 PUT
 *   node tools/retest-guard/adf_colwidth.js --check readback.json
 *       readback.json = the v3 GET response after the PUT; exit 0 only when
 *       every rule below holds on what the tracker actually stored
 *
 * What it applies (and what --check requires of the readback):
 *   rule 5  exactly one table; every cell carries `colwidth` from
 *           TABLE_COLUMN_WIDTHS in retest_rules.js (an API table without an
 *           Evidence column drops that column's width)
 *   rule 6  in the No., Evidence and Status columns (CENTERED_COLUMNS): each
 *           `mediaGroup` (the MP4 file card) becomes one `mediaSingle` per media
 *           with layout "center"; every `mediaSingle` there is layout "center";
 *           every paragraph there carries the mark {type:"alignment",attrs:{align:"center"}}.
 *           Owner, 2026-09-24: "จัดกลางเสมอ อย่าให้ต้องบอกซ้ำ".
 *
 * Exit codes: 0 done / clean · 1 the readback breaks a rule · 2 could not run.
 * Node >= 18, no dependencies.
 */

const fs = require('fs');
const R = require('./retest_rules');

const CENTER_MARK = Object.freeze({ type: 'alignment', attrs: Object.freeze({ align: 'center' }) });

function docOf(json) {
  if (json && json.type === 'doc') return json;
  if (json && json.body && json.body.type === 'doc') return json.body;
  const e = new Error('input is neither an ADF doc nor a comment response carrying one in "body"');
  e.code = 'not-adf';
  throw e;
}

function tablesOf(doc) {
  return (doc.content || []).filter((n) => n.type === 'table');
}

/** Plain text of one node, for reading header names. */
function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(textOf).join('');
}

function headerNames(table) {
  const first = (table.content || [])[0];
  return ((first && first.content) || []).map((c) => R.bareHeader(textOf(c)));
}

/** The width list for this table's actual columns, or an Error explaining why none fits. */
function widthsFor(headers) {
  const full = R.VERDICT_TABLE_HEADERS;
  const w = R.TABLE_COLUMN_WIDTHS;
  if (headers.length === w.length) return w.slice();
  if (headers.length === w.length - 1 && !headers.includes('Evidence')) {
    const i = full.indexOf('Evidence');
    return w.filter((_, k) => k !== i);
  }
  return new Error(`table has ${headers.length} column(s) [${headers.join(', ')}]; widths exist for ${w.length} (or ${w.length - 1} without Evidence)`);
}

function centreIndexes(headers) {
  return headers.map((h, i) => (R.CENTERED_COLUMNS.includes(h) ? i : -1)).filter((i) => i >= 0);
}

function centreParagraph(n) {
  n.marks = (n.marks || []).filter((m) => m.type !== 'alignment').concat([JSON.parse(JSON.stringify(CENTER_MARK))]);
}

/**
 * Lay out the single table in place. Returns counts of what changed.
 * Throws (code 'table-count' / 'column-count') rather than guessing on a doc that
 * is not the shape the renderer produces.
 */
function applyLayout(doc) {
  const tables = tablesOf(doc);
  if (tables.length !== 1) {
    const e = new Error(`expected exactly one table, found ${tables.length}`);
    e.code = 'table-count';
    throw e;
  }
  const t = tables[0];
  const headers = headerNames(t);
  const widths = widthsFor(headers);
  if (widths instanceof Error) { widths.code = 'column-count'; throw widths; }
  const centre = new Set(centreIndexes(headers));
  t.attrs = Object.assign({}, t.attrs, { isNumberColumnEnabled: false, layout: 'default' });
  let converted = 0;
  (t.content || []).forEach((row, ri) => {
    const cells = row.content || [];
    if (cells.length !== widths.length) {
      const e = new Error(`row ${ri} has ${cells.length} cell(s), the header has ${widths.length}`);
      e.code = 'column-count';
      throw e;
    }
    cells.forEach((c, ci) => {
      c.attrs = Object.assign({}, c.attrs, { colwidth: [widths[ci]] });
      if (!centre.has(ci)) return;
      const next = [];
      (c.content || []).forEach((n) => {
        if (n.type === 'mediaGroup') {
          (n.content || []).forEach((media) => {
            next.push({ type: 'mediaSingle', attrs: { layout: 'center' }, content: [media] });
            converted += 1;
          });
          return;
        }
        if (n.type === 'mediaSingle') n.attrs = Object.assign({}, n.attrs, { layout: 'center' });
        if (n.type === 'paragraph') centreParagraph(n);
        next.push(n);
      });
      c.content = next;
    });
  });
  return { widths, centredColumns: [...centre].map((i) => headers[i]), convertedMediaGroups: converted };
}

/** Check a doc (normally the tracker's readback) against rules 5–6. */
function verify(doc) {
  const problems = [];
  const tables = tablesOf(doc);
  const report = { tables: tables.length, widths: null, mediaGroup: 0, mediaSingle: 0, nonCenterSingle: 0, uncenteredParagraphs: 0, mediaNodes: 0 };
  JSON.stringify(doc, (k, v) => { if (v && v.type === 'media') report.mediaNodes += 1; return v; });
  if (tables.length !== 1) {
    problems.push(`expected exactly one table, found ${tables.length}`);
    return Object.assign(report, { ok: false, problems });
  }
  const t = tables[0];
  const headers = headerNames(t);
  const want = widthsFor(headers);
  if (want instanceof Error) problems.push(want.message);
  const centre = new Set(centreIndexes(headers));
  report.widths = ((t.content || [])[0].content || []).map((c) => (c.attrs && c.attrs.colwidth) || null);
  (t.content || []).forEach((row, ri) => {
    (row.content || []).forEach((c, ci) => {
      const cw = c.attrs && c.attrs.colwidth;
      if (!(want instanceof Error) && !(Array.isArray(cw) && cw.length === 1 && cw[0] === want[ci])) {
        problems.push(`row ${ri} col ${ci + 1} colwidth ${JSON.stringify(cw)} ≠ [${want[ci]}]`);
      }
      (c.content || []).forEach((n) => {
        if (n.type === 'mediaGroup') report.mediaGroup += 1;
        if (n.type === 'mediaSingle') {
          report.mediaSingle += 1;
          if (!n.attrs || n.attrs.layout !== 'center') report.nonCenterSingle += 1;
        }
        if (centre.has(ci) && n.type === 'paragraph'
          && !(n.marks || []).some((m) => m.type === 'alignment' && m.attrs && m.attrs.align === 'center')) {
          report.uncenteredParagraphs += 1;
        }
      });
    });
  });
  if (report.mediaGroup) problems.push(`${report.mediaGroup} mediaGroup node(s) left — clips must be centred mediaSingle`);
  if (report.nonCenterSingle) problems.push(`${report.nonCenterSingle} mediaSingle node(s) not layout "center"`);
  if (report.uncenteredParagraphs) problems.push(`${report.uncenteredParagraphs} paragraph(s) in No./Evidence/Status not centred`);
  if (report.mediaSingle === 0 && headers.includes('Evidence')) problems.push('no mediaSingle in the table — nothing was measured, so nothing passed');
  return Object.assign(report, { ok: problems.length === 0, problems });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === '--in') a.in = argv[(i += 1)];
    else if (k === '--out') a.out = argv[(i += 1)];
    else if (k === '--check') a.check = argv[(i += 1)];
    else { console.error(`unknown argument: ${k}`); return 2; }
  }
  if (a.check) {
    let doc;
    try { doc = docOf(readJson(a.check)); } catch (e) { console.error(`could not read ${a.check}: ${e.message}`); return 2; }
    const r = verify(doc);
    console.log(JSON.stringify(r));
    return r.ok ? 0 : 1;
  }
  if (!a.in || !a.out) { console.error('usage: --in get.json --out put.json  |  --check readback.json'); return 2; }
  let doc;
  try { doc = docOf(readJson(a.in)); } catch (e) { console.error(`could not read ${a.in}: ${e.message}`); return 2; }
  let done;
  try { done = applyLayout(doc); } catch (e) { console.error(`refused: ${e.message}`); return 2; }
  const self = verify(doc);
  if (!self.ok) { console.error('laid-out doc still breaks a rule: ' + self.problems.join('; ')); return 1; }
  fs.writeFileSync(a.out, JSON.stringify({ body: doc }), 'utf8');
  console.log(JSON.stringify(Object.assign(done, { mediaSingle: self.mediaSingle, mediaNodes: self.mediaNodes })));
  return 0;
}

if (require.main === module) {
  let code;
  try { code = main(process.argv); } catch (e) { console.error('adf_colwidth could not run: ' + (e && e.stack ? e.stack : e)); code = 2; }
  process.exit(code);
}

module.exports = { applyLayout, verify, widthsFor, headerNames, docOf, CENTER_MARK };
