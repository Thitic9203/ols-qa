#!/usr/bin/env node
'use strict';
/* The template printed in the workflow must agree with the rules that judge it.
 *
 * This is the exact failure the whole change set is about, one level up: when the
 * enforced rules gained a Role column and a Scope line, the template a reader copies
 * still showed the old shape — so following the documentation produced a body the
 * guard rejects. Reading both and noticing is not a plan; this test is.
 *
 *   node tools/retest-guard/workflow_template.test.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const R = require('./retest_rules');

const ROOT = path.join(__dirname, '..', '..');
const WF = path.join(ROOT, 'skills', 'procedures', 'retest-bug-workflow', 'WORKFLOW.md');

/** The workflow = WORKFLOW.md plus the part files it links in its own folder (D2 split, 2026-10-14). */
function readWorkflow(abs) {
  const dir = path.dirname(abs);
  const main = fs.readFileSync(abs, 'utf8');
  const parts = [...new Set([...main.matchAll(/\]\(([a-z0-9-]+\.md)(?:#[^)]*)?\)/g)].map((m) => m[1]))]
    .filter((n) => n !== 'WORKFLOW.md' && fs.existsSync(path.join(dir, n)));
  return [main, ...parts.map((n) => fs.readFileSync(path.join(dir, n), 'utf8'))].join('\n');
}

const wf = readWorkflow(WF);

/** The v2 wiki template block the workflow prints. */
function templateBlock() {
  const start = wf.indexOf('**Template core — v2 wiki markup**');
  assert.ok(start > -1, 'the workflow no longer prints a v2 template');
  const fenceStart = wf.indexOf('```text', start);
  const fenceEnd = wf.indexOf('```', fenceStart + 7);
  assert.ok(fenceStart > -1 && fenceEnd > -1, 'the template fence is malformed');
  return wf.slice(fenceStart + 7, fenceEnd);
}

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const tpl = templateBlock();

check('the template shows every header line the rules require of a UI retest', () => {
  const missing = R.HEADER_LINES
    .filter((h) => h.when === 'always' || h.when === 'ui')
    .map((h) => h.key)
    .filter((key) => !new RegExp('^\\*' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\*', 'm').test(tpl));
  assert.deepStrictEqual(missing, [], 'template omits header line(s): ' + missing.join(', '));
});

check('the template also shows the API-only header lines', () => {
  ['API', 'Swagger'].forEach((k) => assert.ok(tpl.includes('*' + k + ':*'), 'template omits ' + k));
});

check('the template carries ONE table and no separate case table (owner, 2026-09-24)', () => {
  const headerRows = tpl.split('\n').filter((l) => l.startsWith('||'));
  assert.strictEqual(headerRows.length, 1, 'template has ' + headerRows.length + ' table header rows');
  assert.ok(!/Test cases run/.test(tpl), 'template still prints the "Test cases run" table');
});

check('the template prints no "*Scope:* FULL" line, only the scoped form', () => {
  assert.ok(!/^\*Scope:\* FULL/m.test(tpl), 'template teaches the Scope: FULL line the owner removed');
  assert.ok(/^\*Scope:\* CASES:/m.test(tpl), 'template no longer shows the scoped Scope line');
});

check('the template shows multi-point Build / Fixture as label + bullets + one blank line', () => {
  const lines = tpl.split('\n');
  ['Build', 'Fixture'].forEach((k) => {
    const i = lines.indexOf('*' + k + ':*');
    assert.ok(i > -1, k + ' label is not on its own line');
    assert.ok(/^\* /.test(lines[i + 1]), k + ' has no bullet under it');
    let j = i + 1;
    while (/^\* /.test(lines[j])) j += 1;
    assert.strictEqual(lines[j], '', k + ' list is not followed by a blank line');
    assert.notStrictEqual(lines[j + 1], '', k + ' list is followed by more than one blank line');
  });
});

check('the template table matches VERDICT_TABLE_HEADERS exactly', () => {
  const line = tpl.split('\n').find((l) => l.startsWith('||') && l.includes('Expected Result'));
  assert.ok(line, 'no verdict-table header row in the template');
  const headers = R.splitWikiCells(line).cells.map(R.bareHeader);
  assert.deepStrictEqual(headers, R.VERDICT_TABLE_HEADERS.slice(),
    'template verdict table is [' + headers.join(', ') + ']');
});

check('the template carries no image width parameter', () => {
  assert.ok(!R.IMG_WIDTH_PARAM.test(tpl));
});

check('the template shows the coverage line the gate reconciles', () => {
  assert.ok(R.ITEM_COVERAGE_LINE.test(tpl.replace(/\{[^}]*\}/g, '1')),
    'no expected-result / acceptance-criteria coverage line in the template');
});

check('the prose that names the table columns names all of them, in the workflow', () => {
  // The stub (skills/retest-bug-workflow/SKILL.md) is outside this change's paths and still
  // describes the retired two-table shape; it is reported for a follow-up rather than checked here.
  const expected = R.VERDICT_TABLE_HEADERS.join(' · ');
  const mentions = wf.match(/retest comment's one table: (.+?) —/);
  assert.ok(mentions, 'WORKFLOW.md no longer describes the one table');
  assert.strictEqual(mentions[1].trim(), expected, 'WORKFLOW.md describes it as "' + mentions[1].trim() + '"');
});

check('the workflow documents the post-publish width and centring step', () => {
  assert.ok(/adf_colwidth\.js --in/.test(wf), 'the layout step is not documented');
  assert.ok(/adf_colwidth\.js --check/.test(wf), 'the readback check is not documented');
  assert.ok(wf.includes('[' + R.TABLE_COLUMN_WIDTHS.join(', ') + ']'), 'the documented widths drifted from TABLE_COLUMN_WIDTHS');
});

check('the workflow tells the reader the body is rendered, not typed', () => {
  assert.ok(/not something to hand-type/i.test(wf), 'the template is presented as something to copy by hand');
  assert.ok(/retest_guard\.js/.test(wf), 'the workflow never runs the guard');
});

check('the template ends with the usage marker, after one blank line', () => {
  const lines = tpl.replace(/\n+$/, '').split('\n');
  const last = lines[lines.length - 1];
  assert.ok(last.includes(R.MARKER_ANCHOR), 'the template does not end with the usage marker');
  assert.ok(last.includes('skill=' + R.MARKER_SKILL), 'the marker does not name the skill');
  assert.ok(/^_.*_$/.test(last), 'the marker is not italic');
  assert.strictEqual(lines[lines.length - 2], '', 'no blank line before the marker');
  ['src=', 'via=', 'agent='].forEach((k) => assert.ok(last.includes(k), 'the marker omits ' + k));
});

check('the workflow tells the reader how to fill the marker and to keep it on an in-place edit', () => {
  assert.ok(/src=helix/.test(wf) && /src=ols-qa/.test(wf), 'src values are not explained');
  assert.ok(/commentId[^\n]*usage marker/.test(wf), 'the commentId in-place edit does not say to keep the marker');
});

check('the template shows the measured run-time line just above the marker (owner, 2026-10-13)', () => {
  const lines = tpl.replace(/\n+$/, '').split('\n');
  const rt = lines[lines.length - 3];
  assert.ok(rt && rt.startsWith('*' + R.RUN_TIME_LABEL + '*'), 'the line above the marker is not the run-time line: ' + rt);
  assert.ok(R.RUN_TIME_LINE.test(rt.replace(/\{minutes\}/, '12.3')), 'the run-time line shape drifted from RUN_TIME_LINE');
});

check('the workflow tells the reader to measure the run time with the tool, never estimate', () => {
  assert.ok(/tools\/run-time\/measure\.js --dirs/.test(wf), 'the measure command is not documented');
  assert.ok(wf.includes(R.RUN_TIME_METHOD), 'the method id is not named');
  assert.ok(/never estimate/i.test(wf), 'the workflow does not forbid estimating');
});

/** A minimal clean body whose Design ref value is `value` — only header-inline-list matters here. */
const designRefFindings = (value) => R.scanBody([
  '*Retest Result: PASSED* ✅', '', '*Env:* dev', `*Design ref:* ${value}`, '',
].join('\n'), {}).filter((f) => f.rule === 'header-inline-list');

check('the template\'s "no design node" fallback passes header-inline-list (eval RB-1..3)', () => {
  const line = tpl.split('\n').find((l) => l.startsWith('*Design ref:*')) || '';
  const m = /or "([^"]+)"/.exec(line);
  assert.ok(m, 'the Design ref line no longer shows a quoted fallback: ' + line);
  const filled = m[1].replace('{who}', 'PO').replace('{YYYY-MM-DD}', '2026-10-14');
  assert.deepStrictEqual(designRefFindings(filled), [], 'the template fallback is refused by the guard: ' + filled);
  // must-find: the retired " — " form really is a multipoint value
  assert.strictEqual(designRefFindings('none — asked PO 2026-10-14').length, 1);
});

check('the template summary line names every verdict SUMMARY_VERDICTS accepts, and each is accepted', () => {
  const line = tpl.split('\n').find((l) => l.startsWith('*Retest Result:')) || '';
  R.SUMMARY_VERDICTS.forEach((v) => {
    assert.ok(line.includes(v), `the template summary line does not offer ${v}: ${line}`);
    assert.ok(R.SUMMARY_LINE.test(`*Retest Result: ${v}*`), `${v} is not accepted by SUMMARY_LINE`);
  });
  assert.ok(!R.SUMMARY_LINE.test('*Retest Result: DONE*'), 'must-find: an unknown verdict is refused');
});

check('no workflow line restricts the summary line to PASSED / FAILED only', () => {
  const bad = wf.split('\n').filter((l) => /\*\*PASSED ✅\*\* or \*\*FAILED ❌\*\*/.test(l));
  assert.deepStrictEqual(bad, [], 'stale PASSED-or-FAILED-only wording: ' + bad.join(' | '));
});

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
