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
  assert.ok(md.includes('| Poster | Project | Issuetype | Skill/via | Src | Agent | Count | Discord | Issues |'));
  const usage = md.split('## Usage')[1].split('##')[0].split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Poster'));
  assert.strictEqual(usage.length, 2);
  assert.ok(usage[0].startsWith('| Tester A |'), 'highest count first: ' + usage[0]);
  assert.ok(usage[0].includes('| 2 | 0 | DEMO-1, DEMO-2 |'));
  assert.ok(usage[1].includes('Tester B\\|X'), 'pipe not escaped: ' + usage[1]);
  assert.match(md, /Comments read: 3 · marked, counted: 3 · unmarked, skipped: 0/);
  assert.match(md, /Comment date range: 2026-10-02T03:00:00.000Z → 2026-10-02T03:00:00.000Z/);
});

t('markdown: empty input still renders every table with a (none) row', () => {
  const md = A.renderMarkdown(A.aggregate({ comments: [] }));
  assert.ok((md.match(/\| \(none\) \|/g) || []).length >= 6);
  assert.match(md, /Skill uses counted: \*\*0\*\*/);
});

/* --------------------------------------------------------------- discord */

function disc(over = {}) {
  return { ts: '2026-10-02T10:30:00.000+07:00', ticket: 'DEMO-1', kind: 'retest', ...over };
}

function snap(lines) {
  return A.parseSnapshot([SNAPSHOT_HEADER, ...lines].join('\n'));
}

t('discord: entry within 1 day of a marked comment counts once and marks it inDiscord', () => {
  const r = A.aggregate({
    comments: [comment()],
    discord: [disc({ ts: '2026-10-03T09:00:00.000+07:00' })], // ~23h later
  });
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.rows[0].src, 'ols-qa');
  assert.strictEqual(r.rows[0].discord, 1);
  assert.deepStrictEqual({ ...r.stats.discord, range: undefined },
    { read: 1, matched: 1, upgraded: 0, added: 0, range: undefined });
});

t('discord: a date-only ts matches a Jira +0700 timestamp on the same or adjacent day', () => {
  const r = A.aggregate({
    comments: [comment({ created: '2026-10-03T20:00:00.000+0700' })],
    discord: [disc({ ts: '2026-10-02' })],
  });
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.stats.discord.matched, 1);
});

t('discord: 2 days apart is no match — the entry is added as a new run', () => {
  const r = A.aggregate({
    comments: [comment({ created: '2026-10-02T10:00:00.000+0700' })],
    discord: [disc({ ts: '2026-10-04T10:00:01.000+07:00' }), disc({ ts: '2026-10-04' })],
  });
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.stats.discord.matched, 0);
  assert.strictEqual(r.stats.discord.added, 2);
  assert.strictEqual(r.rows.find((x) => x.src === 'ols-qa').discord, 0);
});

t('discord: different ticket never matches, key compared case-insensitively', () => {
  const r = A.aggregate({
    comments: [comment({ issue_key: 'DEMO-1' })],
    discord: [disc({ ticket: 'DEMO-2' }), disc({ ticket: ' demo-1 ' })],
  });
  assert.strictEqual(r.stats.discord.matched, 1);
  assert.strictEqual(r.stats.discord.added, 1);
  assert.strictEqual(r.total, 2);
});

t('discord: one-to-one — duplicate posts for one ticket match one record each, nearest first', () => {
  const comments = [
    comment({ issue_key: 'DEMO-3', created: '2026-10-02T10:00:00.000+0700' }),
    comment({ issue_key: 'DEMO-3', created: '2026-10-05T10:00:00.000+0700' }),
  ];
  const discord = [
    disc({ ticket: 'DEMO-3', ts: '2026-10-02T11:00:00.000+07:00' }),
    disc({ ticket: 'DEMO-3', ts: '2026-10-02T12:00:00.000+07:00' }), // duplicate post, same run
    disc({ ticket: 'DEMO-3', ts: '2026-10-05T10:05:00.000+07:00' }),
  ];
  const m = A.matchDiscord(comments.map((c) => ({ issue_key: c.issue_key, span: { lo: A.parseDate(c.created), hi: A.parseDate(c.created) } })), discord);
  assert.deepStrictEqual([...m.entries()].sort(), [[0, 0], [1, 2]]);
  const r = A.aggregate({ comments, discord });
  assert.strictEqual(r.stats.discord.matched, 2);
  assert.strictEqual(r.stats.discord.added, 1); // the duplicate post is a run with no Jira record
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.rows.find((x) => x.src === 'ols-qa').discord, 2);
});

t('discord: matched manual snapshot row is upgraded and leaves the not-via-skill table', () => {
  const rows = snap([
    'DEMO-4,DEMO,Bug,1,Tester A,2026-09-01,PASSED,manual (not via skill)',
    'DEMO-5,DEMO,Bug,2,Tester A,2026-09-01,FAILED,manual (not via skill)',
  ]);
  const r = A.aggregate({ comments: [], snapshotRows: rows, discord: [disc({ ticket: 'DEMO-4', ts: '2026-09-02' })], cutoff: '2026-10-01' });
  assert.strictEqual(r.total, 1);
  assert.strictEqual(r.rows[0].skillVia, 'retest-bug-workflow (AI confirmed by Discord)');
  assert.strictEqual(r.rows[0].src, 'snapshot');
  assert.strictEqual(r.rows[0].discord, 1);
  assert.deepStrictEqual(r.manualRows.map((x) => x.issues), [['DEMO-5']]);
  assert.strictEqual(r.stats.discord.upgraded, 1);
  assert.strictEqual(r.stats.snapshotManual, 1);
  assert.strictEqual(r.stats.snapshotSkill, 1);
  assert.deepStrictEqual(r.totals.verdict, [{ name: 'PASSED', count: 1 }]);
});

t('discord: matched unknown snapshot row is upgraded; tested → testing-ticket; skill rows keep their label', () => {
  const rows = snap([
    'DEMO-6,DEMO,Task,1,Tester A,2026-09-01,PASSED,"unknown (no marker, pre-ship)"',
    'DEMO-7,DEMO,Bug,2,Tester A,2026-09-01,PASSED,retest-bug-workflow',
  ]);
  const r = A.aggregate({
    comments: [], snapshotRows: rows, cutoff: '2026-10-01',
    discord: [disc({ ticket: 'DEMO-6', ts: '2026-09-01', kind: 'tested' }), disc({ ticket: 'DEMO-7', ts: '2026-09-01' })],
  });
  assert.strictEqual(r.total, 2);
  const labels = r.rows.map((x) => x.skillVia).sort();
  assert.deepStrictEqual(labels, ['retest-bug-workflow', 'testing-ticket (AI confirmed by Discord)']);
  assert.ok(r.rows.every((x) => x.discord === 1));
  assert.strictEqual(r.stats.discord.upgraded, 1);
  assert.strictEqual(r.stats.discord.matched, 2);
});

t('discord: unmatched entry is a new run — runner as poster, else unknown; owner never the poster', () => {
  const r = A.aggregate({
    comments: [],
    discord: [
      disc({ ticket: 'DEMO-8', runner: 'Tester A', owner: 'Reviewer Q', project: 'DEMO', issuetype: 'Bug' }),
      disc({ ticket: 'DEMO-9', owner: 'Reviewer Q' }),
      disc({ ticket: 'DEMO-10', kind: 'tested' }),
    ],
  });
  assert.strictEqual(r.total, 3);
  const a = r.rows.find((x) => x.issues.includes('DEMO-8'));
  assert.deepStrictEqual([a.poster, a.project, a.issuetype, a.skillVia, a.src, a.agent, a.discord],
    ['Tester A', 'DEMO', 'Bug', 'retest-bug-workflow', 'discord', '—', 1]);
  const b = r.rows.find((x) => x.issues.includes('DEMO-9'));
  assert.deepStrictEqual([b.poster, b.project, b.issuetype], ['unknown (Discord)', 'unknown', 'unknown']);
  const c = r.rows.find((x) => x.issues.includes('DEMO-10'));
  assert.strictEqual(c.skillVia, 'testing-ticket');
  assert.deepStrictEqual(r.totals.verdict, [{ name: 'other', count: 3 }]);
  assert.doesNotMatch(A.renderMarkdown(r), /Reviewer Q/);
});

t('discord: cutoff does not drop entries; a comment before the cutoff is not a match target', () => {
  const r = A.aggregate({
    comments: [comment({ created: '2026-09-20T10:00:00.000+0700' })],
    discord: [disc({ ts: '2026-09-20' }), disc({ ticket: 'DEMO-2', ts: '2026-10-05' })],
    cutoff: '2026-10-01',
  });
  assert.strictEqual(r.stats.beforeCutoff, 1);
  assert.strictEqual(r.stats.discord.added, 2);
  assert.strictEqual(r.total, 2);
});

t('discord: footer counts and the Discord column render', () => {
  const rows = snap(['DEMO-11,DEMO,Bug,1,Tester A,2026-09-01,PASSED,manual']);
  const md = A.renderMarkdown(A.aggregate({
    comments: [comment()], snapshotRows: rows, cutoff: '2026-10-01',
    discord: [disc(), disc({ ticket: 'DEMO-11', ts: '2026-09-01' }), disc({ ticket: 'DEMO-12', ts: '2026-09-15' })],
  }));
  assert.match(md, /Discord entries read: 3 · matched: 2 · upgraded: 1 · added as new: 1/);
  assert.match(md, /Discord date range: 2026-09-01T00:00:00.000Z → 2026-10-02T03:30:00.000Z/);
  assert.match(md, /Snapshot rows: 1 · via skill: 1 · not via skill: 0/);
  assert.match(md, /\| retest-bug-workflow \/ retest-bug \| ols-qa \| claude-code \| 1 \| 1 \| DEMO-1 \|/);
  assert.doesNotMatch(A.renderMarkdown(A.aggregate({ comments: [comment()] })), /Discord entries read/);
});

t('discord: pure — inputs untouched, a rerun gives the identical result', () => {
  const comments = [comment(), comment({ issue_key: 'DEMO-2' })];
  const snapshotRows = snap(['DEMO-13,DEMO,Bug,1,Tester A,2026-10-02,PASSED,manual']);
  const discord = [disc(), disc(), disc({ ticket: 'DEMO-13' }), disc({ ticket: 'DEMO-14', runner: 'Tester A' })];
  const before = JSON.stringify({ comments, snapshotRows, discord });
  const r1 = A.renderMarkdown(A.aggregate({ comments, snapshotRows, discord, cutoff: '2026-10-01' }));
  const r2 = A.renderMarkdown(A.aggregate({ comments, snapshotRows, discord, cutoff: '2026-10-01' }));
  assert.strictEqual(JSON.stringify({ comments, snapshotRows, discord }), before);
  assert.strictEqual(r1, r2);
  assert.match(r1, /Skill uses counted: \*\*5\*\*/);
});

t('discord: malformed entries are refused', () => {
  assert.throws(() => A.validateDiscord({}), /JSON array/);
  assert.throws(() => A.validateDiscord([{ ts: '2026-10-02', kind: 'retest' }]), /no ticket/);
  assert.throws(() => A.validateDiscord([disc({ kind: 'Tested all' })]), /kind/);
  assert.throws(() => A.validateDiscord([disc({ ts: 'yesterday' })]), /unparseable ts/);
  assert.throws(() => A.aggregate({ discord: [disc({ ts: '' })] }), /unparseable ts/);
});

/* ------------------------------------------------------------------- CLI */

t('CLI: reads real files, applies cutoff + snapshot + discord, writes --out', () => {
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
    const dj = path.join(dir, 'discord.json');
    fs.writeFileSync(dj, JSON.stringify([
      { ts: '2026-10-02T10:20:00+07:00', ticket: 'DEMO-12', kind: 'retest', owner: 'Reviewer Q' },
      { ts: '2026-09-21', ticket: 'DEMO-16', kind: 'tested', runner: 'Tester A' },
    ]));
    const stdout = execFileSync('node', [CLI, '--comments', cj, '--snapshot', sc, '--discord', dj, '--cutoff', '2026-10-01', '--out', out],
      { encoding: 'utf8' });
    assert.match(stdout, /wrote /);
    const md = fs.readFileSync(out, 'utf8');
    assert.match(md, /Skill uses counted: \*\*3\*\*/);
    assert.match(md, /Discord entries read: 2 · matched: 1 · upgraded: 0 · added as new: 1/);
    assert.match(md, /DEMO-16/);
    assert.match(md, /unmarked, skipped: 1/);
    assert.match(md, /before cutoff \(2026-10-01T00:00:00.000Z\), skipped: 1/);
    assert.match(md, /DEMO-15/);
    assert.doesNotMatch(md, /DEMO-11/);
    assert.doesNotMatch(md, /Warning: --snapshot given without --cutoff/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

t('CLI: missing --comments, unreadable file, bad JSON, bad CSV and bad discord all exit 2', () => {
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
    assert.strictEqual(run(['--comments', good, '--discord', bad]), 2);
    const badKind = path.join(dir, 'bad-kind.json');
    fs.writeFileSync(badKind, JSON.stringify([{ ts: '2026-10-02', ticket: 'DEMO-1', kind: 'other' }]));
    assert.strictEqual(run(['--comments', good, '--discord', badKind]), 2);
    const notArray = path.join(dir, 'not-array.json');
    fs.writeFileSync(notArray, '{}');
    assert.strictEqual(run(['--comments', good, '--discord', notArray]), 2);
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
