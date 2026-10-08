#!/usr/bin/env node
'use strict';

/**
 * Tests for the retest usage aggregator.
 *
 * Synthetic fixtures only (Tester A/B, DEMO-n) — this repo is public. Counts what
 * it ran and refuses on zero. Includes a case that writes real input files and runs
 * the CLI against them: a suite fed only hand-made objects never touches the code
 * that reads files.
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const A = require('./aggregate.js');
const CLI = path.join(__dirname, 'aggregate.js');

const tests = [];
function t(name, fn) {
  tests.push([name, fn]);
}

const MARKER = '_retestskillmarker · skill=retest-bug-workflow · src=ols-qa · via=retest-bug · agent=claude-code_';

function comment(over = {}) {
  return {
    issue_key: 'DEMO-1',
    project: 'DEMO',
    issuetype: 'Bug',
    author: 'Tester A',
    created: '2026-10-02T10:00:00.000+0700',
    body: '*Retest Result: PASSED*\nAll cases pass.\n\n' + MARKER,
    ...over,
  };
}

const SNAPSHOT_HEADER = 'issue_key,project,issuetype,comment_id,poster,created,verdict,skill';

/* ---------------------------------------------------------------- marker */

t('marker: all fields parsed, wiki-italic wrapper not glued to the last value', () => {
  assert.deepStrictEqual(A.parseMarker('text\n' + MARKER), {
    skill: 'retest-bug-workflow', src: 'ols-qa', via: 'retest-bug', agent: 'claude-code',
  });
});

t('marker: markdown-bold wrapper is stripped too', () => {
  const m = A.parseMarker('**retestskillmarker · skill=retest-bug-workflow · src=helix · via=helix-menu · agent=cursor**');
  assert.strictEqual(m.agent, 'cursor');
  assert.strictEqual(m.src, 'helix');
  assert.strictEqual(m.via, 'helix-menu');
});

t('marker: missing fields are absent, and aggregate reports them as unknown', () => {
  const m = A.parseMarker('_retestskillmarker · skill=retest-bug-workflow_');
  assert.deepStrictEqual(m, { skill: 'retest-bug-workflow' });
  const r = A.aggregate({ comments: [comment({ body: 'Retest Result: FAILED\n_retestskillmarker · skill=retest-bug-workflow_' })] });
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.rows[0].skillVia, 'retest-bug-workflow / unknown');
  assert.strictEqual(r.rows[0].src, 'unknown');
  assert.strictEqual(r.rows[0].agent, 'unknown');
});

t('marker: none → null, and the comment is counted as unmarked, not used', () => {
  assert.strictEqual(A.parseMarker('Retest Result: PASSED\nno marker here'), null);
  assert.strictEqual(A.parseMarker(''), null);
  assert.strictEqual(A.parseMarker(undefined), null);
  const r = A.aggregate({ comments: [comment({ body: 'Retest Result: PASSED' }), comment()] });
  assert.strictEqual(r.stats.unmarked, 1);
  assert.strictEqual(r.stats.marked, 1);
  assert.strictEqual(r.total, 1);
});

t('marker: read from an ADF body as well as a string', () => {
  const adf = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Retest Result: BLOCKED', marks: [{ type: 'strong' }] }] },
      { type: 'paragraph', content: [{ type: 'text', text: MARKER }] },
    ],
  };
  assert.strictEqual(A.parseMarker(adf).agent, 'claude-code');
  assert.strictEqual(A.parseVerdict(adf), 'BLOCKED');
});

/* --------------------------------------------------------------- verdict */

t('verdict: wiki bold', () => {
  assert.strictEqual(A.parseVerdict('*Retest Result: PASSED ✅*\nrest'), 'PASSED');
});

t('verdict: markdown bold', () => {
  assert.strictEqual(A.parseVerdict('**Retest Result: FAILED ❌**'), 'FAILED');
  assert.strictEqual(A.parseVerdict('**Retest Result:** BLOCKED'), 'BLOCKED');
});

t('verdict: found when the body starts with a blank line', () => {
  assert.strictEqual(A.parseVerdict('\n\nRetest Result: passed'), 'PASSED');
});

t('verdict: unknown word or no verdict line → other', () => {
  assert.strictEqual(A.parseVerdict('Retest Result: PARTIAL'), 'other');
  assert.strictEqual(A.parseVerdict('Retest Result:'), 'other');
  assert.strictEqual(A.parseVerdict('just a note'), 'other');
});

/* ---------------------------------------------------------------- cutoff */

t('cutoff: Jira +0700 dates compared correctly; earlier comments skipped and counted', () => {
  const comments = [
    comment({ issue_key: 'DEMO-1', created: '2026-10-01T06:59:00.000+0700' }), // 2026-09-30T23:59Z — before
    comment({ issue_key: 'DEMO-2', created: '2026-10-01T07:00:00.000+0700' }), // exactly at cutoff — kept
    comment({ issue_key: 'DEMO-3', created: '2026-10-05T09:00:00.000+0700' }),
  ];
  const r = A.aggregate({ comments, cutoff: '2026-10-01T00:00:00Z' });
  assert.strictEqual(r.stats.beforeCutoff, 1);
  assert.strictEqual(r.total, 2);
  assert.deepStrictEqual(r.rows[0].issues, ['DEMO-2', 'DEMO-3']);
});

t('cutoff: an undated marked comment is kept and reported, never silently dropped', () => {
  const r = A.aggregate({ comments: [comment({ created: '' })], cutoff: '2026-10-01' });
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.stats.undatedKept, 1);
  assert.match(A.renderMarkdown(r), /no parseable date, kept despite the cutoff: 1/);
});

t('cutoff: an invalid cutoff is refused', () => {
  assert.throws(() => A.aggregate({ comments: [], cutoff: 'not-a-date' }), /not a valid date/);
});

/* -------------------------------------------------------- snapshot merge */

t('snapshot: rows merge with comments, src=snapshot, agent shown as a dash', () => {
  const rows = A.parseSnapshot([
    SNAPSHOT_HEADER,
    'DEMO-4,DEMO,Task,1001,Tester B,2026-09-01T10:00:00.000+0700,FAILED,retest-bug-workflow',
    'DEMO-5,DEMO,Bug,1002,Tester B,2026-09-02T10:00:00.000+0700,PASSED,retest-bug-workflow',
  ].join('\n'));
  const r = A.aggregate({ comments: [comment()], snapshotRows: rows, cutoff: '2026-10-01' });
  assert.strictEqual(r.total, 3);
  const snap = r.rows.filter((x) => x.src === 'snapshot');
  assert.strictEqual(snap.length, 2);
  snap.forEach((x) => { assert.strictEqual(x.agent, '—'); assert.strictEqual(x.skillVia, 'retest-bug-workflow'); });
  assert.deepStrictEqual(r.totals.poster, [{ name: 'Tester B', count: 2 }, { name: 'Tester A', count: 1 }]);
  assert.deepStrictEqual(r.totals.verdict.map((v) => v.name).sort(), ['FAILED', 'PASSED']);
});

t('snapshot: quoted fields with commas, BOM and CRLF parse', () => {
  const rows = A.parseSnapshot('﻿' + SNAPSHOT_HEADER + '\r\n' +
    'DEMO-6,DEMO,Bug,1003,"Tester, C",2026-09-03,BLOCKED,"unknown (no marker, pre-ship)"\r\n');
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].poster, 'Tester, C');
  assert.strictEqual(rows[0].skill, 'unknown (no marker, pre-ship)');
});

t('snapshot: a missing column is refused', () => {
  assert.throws(() => A.parseSnapshot('issue_key,project\nDEMO-1,DEMO'), /missing column/);
});

t('snapshot without cutoff carries an overlap warning', () => {
  const rows = A.parseSnapshot(SNAPSHOT_HEADER + '\nDEMO-7,DEMO,Bug,1,Tester A,2026-09-01,PASSED,retest-bug');
  const md = A.renderMarkdown(A.aggregate({ comments: [], snapshotRows: rows }));
  assert.match(md, /Warning: --snapshot given without --cutoff/);
});

/* ------------------------------------------------------- manual separated */

t('manual rows: own table, excluded from usage rows and every total', () => {
  const rows = A.parseSnapshot([
    SNAPSHOT_HEADER,
    'DEMO-8,DEMO,Bug,1,Tester C,2026-09-01,PASSED,manual (not via skill)',
    'DEMO-9,DEMO,Bug,2,Tester C,2026-09-02,FAILED,Manual',
    'DEMO-10,DEMO,Bug,3,Tester A,2026-09-03,PASSED,retest-bug',
  ].join('\n'));
  const r = A.aggregate({ comments: [], snapshotRows: rows, cutoff: '2026-10-01' });
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.stats.snapshotManual, 2);
  assert.ok(r.rows.every((x) => x.poster !== 'Tester C'));
  for (const k of ['poster', 'issuetype', 'project', 'verdict']) {
    assert.strictEqual(r.totals[k].reduce((s, x) => s + x.count, 0), 1, k + ' total includes manual rows');
  }
  assert.strictEqual(r.manualRows.length, 2); // "manual (not via skill)" and "Manual" are different labels
  assert.ok(r.manualRows.every((x) => x.poster === 'Tester C'));
});

/* --------------------------------------------------------- markdown shape */

t('markdown: every section present, main table sorted by count desc, pipes escaped', () => {
  const comments = [
    comment({ issue_key: 'DEMO-1' }),
    comment({ issue_key: 'DEMO-2' }),
    comment({ issue_key: 'DEMO-2', author: { displayName: 'Tester B|X' } }),
  ];
  const md = A.renderMarkdown(A.aggregate({ comments }));
  for (const h of ['## Usage', '## Totals by poster', '## Totals by issuetype', '## Totals by project',
    '## Totals by verdict', '## Not via skill (snapshot)']) {
    assert.ok(md.includes(h), 'missing section ' + h);
  }
  assert.ok(md.includes('| Poster | Project | Issuetype | Skill/via | Src | Agent | Count | Issues |'));
  const usage = md.split('## Usage')[1].split('##')[0].split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Poster'));
  assert.strictEqual(usage.length, 2);
  assert.ok(usage[0].startsWith('| Tester A |'), 'highest count first: ' + usage[0]);
  assert.ok(usage[0].includes('| 2 | DEMO-1, DEMO-2 |'));
  assert.ok(usage[1].includes('Tester B\\|X'), 'pipe not escaped: ' + usage[1]);
  assert.match(md, /Comments read: 3 · marked, counted: 3 · unmarked, skipped: 0/);
  assert.match(md, /Comment date range: 2026-10-02T03:00:00.000Z → 2026-10-02T03:00:00.000Z/);
});

t('markdown: empty input still renders every table with a (none) row', () => {
  const md = A.renderMarkdown(A.aggregate({ comments: [] }));
  assert.ok((md.match(/\| \(none\) \|/g) || []).length >= 6);
  assert.match(md, /Skill uses counted: \*\*0\*\*/);
});

/* ------------------------------------------------------------------- CLI */

t('CLI: reads real files, applies cutoff + snapshot, writes --out', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retest-usage-'));
  try {
    const cj = path.join(dir, 'comments.json');
    const sc = path.join(dir, 'snapshot.csv');
    const out = path.join(dir, 'report.md');
    fs.writeFileSync(cj, JSON.stringify([
      comment({ issue_key: 'DEMO-11', created: '2026-09-20T10:00:00.000+0700' }), // before cutoff
      comment({ issue_key: 'DEMO-12' }),
      comment({ issue_key: 'DEMO-13', body: 'Retest Result: PASSED' }),           // unmarked
    ]));
    fs.writeFileSync(sc, SNAPSHOT_HEADER + '\nDEMO-14,DEMO,Bug,1,Tester B,2026-09-20,FAILED,retest-bug\n' +
      'DEMO-15,DEMO,Bug,2,Tester B,2026-09-21,PASSED,manual (not via skill)\n');
    const stdout = execFileSync('node', [CLI, '--comments', cj, '--snapshot', sc, '--cutoff', '2026-10-01', '--out', out],
      { encoding: 'utf8' });
    assert.match(stdout, /wrote /);
    const md = fs.readFileSync(out, 'utf8');
    assert.match(md, /Skill uses counted: \*\*2\*\*/);
    assert.match(md, /unmarked, skipped: 1/);
    assert.match(md, /before cutoff \(2026-10-01T00:00:00.000Z\), skipped: 1/);
    assert.match(md, /DEMO-15/);
    assert.doesNotMatch(md, /DEMO-11/);
    assert.doesNotMatch(md, /Warning: --snapshot given without --cutoff/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

t('CLI: missing --comments, unreadable file, bad JSON and bad CSV all exit 2', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retest-usage-'));
  const run = (args) => {
    try { execFileSync('node', [CLI, ...args], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; }
  };
  try {
    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, '{not json');
    const good = path.join(dir, 'ok.json');
    fs.writeFileSync(good, '[]');
    const badCsv = path.join(dir, 'bad.csv');
    fs.writeFileSync(badCsv, 'issue_key\nDEMO-1\n');
    assert.strictEqual(run([]), 2);
    assert.strictEqual(run(['--comments', path.join(dir, 'missing.json')]), 2);
    assert.strictEqual(run(['--comments', bad]), 2);
    assert.strictEqual(run(['--comments', good, '--snapshot', badCsv]), 2);
    assert.strictEqual(run(['--comments', good, '--bogus', 'x']), 2);
    assert.strictEqual(run(['--comments', good]), 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------ run */

let failed = 0;
let ran = 0;
for (const [name, fn] of tests) {
  ran += 1;
  try {
    fn();
    console.log('PASS ' + name);
  } catch (err) {
    failed += 1;
    console.log('FAIL ' + name);
    console.log('       ' + (err && err.message ? err.message : String(err)));
  }
}

if (ran === 0) {
  console.error('aggregate.test.js: ran 0 tests — refusing');
  process.exit(2);
}
console.log('\n' + (failed ? failed + ' failed' : 'all green') + ' — ' + ran + ' test(s) ran');
process.exit(failed ? 1 : 0);
