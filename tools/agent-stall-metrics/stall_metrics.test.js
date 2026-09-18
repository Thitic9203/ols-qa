#!/usr/bin/env node
'use strict';

/**
 * Tests for the stall metrics.
 *
 * Counts what it ran and refuses on zero (#0010, #0012). Includes cases that
 * build real JSONL files on disk and run `measure.js` against them (#0002 —
 * a suite fed only hand-made objects never touches the code that reads files).
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const M = require('./stall_metrics.js');
const MEASURE = path.join(__dirname, 'measure.js');

const tests = [];
function t(name, fn) {
  tests.push([name, fn]);
}

const T0 = '2026-09-18T00:00:00.000Z';
const T1 = '2026-09-18T00:10:00.000Z'; // +600s

const assistantTurn = (tokens, model, ts) => ({
  type: 'assistant',
  timestamp: ts || T0,
  message: {
    model: model || 'claude-sonnet-5',
    usage: { input_tokens: 10, cache_read_input_tokens: tokens - 10, cache_creation_input_tokens: 0 },
    content: [{ type: 'text', text: 'ok' }],
  },
});
const toolUseTurn = (name, ts) => ({
  type: 'assistant',
  timestamp: ts || T0,
  message: { model: 'claude-sonnet-5', content: [{ type: 'tool_use', id: 'x', name }] },
});
const toolResult = (ts) => ({
  type: 'user',
  timestamp: ts || T0,
  message: { content: [{ type: 'tool_result', tool_use_id: 'x', content: 'done' }] },
});
const killRecord = (ts) => ({
  type: 'user',
  timestamp: ts || T1,
  message: { content: [{ type: 'text', text: M.KILL_MARKER }] },
});
const attachment = (ts) => ({ type: 'attachment', timestamp: ts || T0, attachment: { type: 'hook_success' } });

// ------------------------------------------------------------- bucketing

t('bucketOf places a token count in the right band', () => {
  assert.strictEqual(M.bucketOf(0), '<100k');
  assert.strictEqual(M.bucketOf(99999), '<100k');
  assert.strictEqual(M.bucketOf(100000), '100-200k');
  assert.strictEqual(M.bucketOf(299999), '200-300k');
  assert.strictEqual(M.bucketOf(300000), '300-400k');
  assert.strictEqual(M.bucketOf(5000000), '>700k');
});

t('bucketOf refuses a non-count rather than bucketing it as zero', () => {
  for (const bad of [null, undefined, 'x', -1, NaN]) {
    assert.throws(() => M.bucketOf(bad), TypeError, 'should refuse ' + String(bad));
  }
});

t('contextTokens sums the cache fields, not just input_tokens', () => {
  const r = assistantTurn(350000);
  assert.strictEqual(M.contextTokens(r), 350000);
});

t('contextTokens returns null when there is no usage — null is not zero', () => {
  assert.strictEqual(M.contextTokens({ type: 'assistant', message: { content: [] } }), null);
  assert.strictEqual(M.contextTokens(null), null);
});

// ------------------------------------------------------- ending classification

t('a transcript with no kill marker is not counted as killed', () => {
  const v = M.classifyEnding([assistantTurn(1000), toolResult()]);
  assert.strictEqual(v.killed, false);
});

t('a kill after a tool_result is classified as waiting on the MODEL', () => {
  const v = M.classifyEnding([assistantTurn(1000), toolResult(T0), killRecord(T1)]);
  assert.strictEqual(v.killed, true);
  assert.strictEqual(v.waitingOn, 'model');
  assert.strictEqual(v.gapSeconds, 600);
});

t('a kill while a tool_use is in flight is classified as waiting on the TOOL', () => {
  const v = M.classifyEnding([toolResult(T0), toolUseTurn('Bash', T0), killRecord(T1)]);
  assert.strictEqual(v.waitingOn, 'tool');
  assert.deepStrictEqual(v.toolNames, ['Bash']);
});

t('attachments between the records do not change the verdict', () => {
  // This is the case that matters: harness injections sit between the real
  // records, and reading one as "what the agent was doing" flips the answer.
  const withAttach = M.classifyEnding([
    toolUseTurn('Bash', T0),
    attachment(T0),
    attachment(T0),
    killRecord(T1),
  ]);
  assert.strictEqual(withAttach.waitingOn, 'tool', 'must walk back past attachments');
});

t('a full-threshold silence is a WATCHDOG kill', () => {
  const v = M.classifyEnding([assistantTurn(1000), toolResult(T0), killRecord(T1)]);
  assert.strictEqual(v.killedBy, 'watchdog');
});

t('a short gap before the same marker is a PERSON, not the watchdog', () => {
  // The harness writes the identical text when someone presses Escape. Merging
  // the two would put every manual interrupt into the stall numbers.
  const v = M.classifyEnding([
    assistantTurn(1000),
    toolResult('2026-09-18T00:00:00.000Z'),
    killRecord('2026-09-18T00:00:12.000Z'),
  ]);
  assert.strictEqual(v.killed, true);
  assert.strictEqual(v.killedBy, 'interrupt');
  assert.strictEqual(v.gapSeconds, 12);
});

t('no usable timestamps yields killedBy "unknown" — never "watchdog"', () => {
  const v = M.classifyEnding([
    { type: 'assistant', message: { content: [{ type: 'text', text: 'x' }] } },
    { type: 'user', message: { content: [{ type: 'text', text: M.KILL_MARKER }] } },
  ]);
  assert.strictEqual(v.killedBy, 'unknown', 'cannot tell must not default to the answer we want');
});

t('measure.js counts only watchdog kills as stalls', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-metrics-cause-'));
  try {
    const sub = path.join(root, 'p', 's', 'subagents');
    fs.mkdirSync(sub, { recursive: true });
    writeTranscript(sub, 'agent-watchdog.jsonl', [assistantTurn(150000), toolResult(T0), killRecord(T1)]);
    writeTranscript(sub, 'agent-escape.jsonl', [
      assistantTurn(150000),
      toolResult('2026-09-18T00:00:00.000Z'),
      killRecord('2026-09-18T00:00:05.000Z'),
    ]);
    const r = runMeasure(['--root', root, '--json']);
    assert.strictEqual(r.code, 0, r.err);
    const s = JSON.parse(r.out);
    assert.strictEqual(s.stalled, 1, 'the Escape case must not be counted as a stall');
    assert.strictEqual(s.killedByWatchdog, 1);
    assert.strictEqual(s.killedByInterrupt, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

t('classifyEnding refuses a non-array — cannot measure is not "not killed"', () => {
  assert.throws(() => M.classifyEnding(null), TypeError);
  assert.throws(() => M.classifyEnding('x'), TypeError);
});

// ------------------------------------------------------------- hazard table

t('hazard is counted per request, not per agent', () => {
  // One agent with 100 turns must contribute 100 requests, not 1 — otherwise a
  // long agent and a short one weigh the same and the table says nothing.
  const contexts = new Array(100).fill(250000);
  const { rows, measured } = M.hazardTable([{ stalled: false, model: 'm', contexts }]);
  assert.strictEqual(measured, 100);
  const row = rows.find((r) => r.bucket === '200-300k');
  assert.strictEqual(row.requests, 100);
  assert.strictEqual(row.stalls, 0);
});

t('a stalled agent books its stall against its FINAL context size', () => {
  const { rows } = M.hazardTable([
    { stalled: true, model: 'm', contexts: [120000, 350000] },
  ]);
  const small = rows.find((r) => r.bucket === '100-200k');
  const big = rows.find((r) => r.bucket === '300-400k');
  assert.strictEqual(small.stalls, 0, 'the early turn survived');
  assert.strictEqual(small.requests, 1);
  assert.strictEqual(big.stalls, 1, 'the stall belongs to the size it died at');
  assert.strictEqual(big.requests, 1);
});

t('hazard per 1000 is computed from requests, not agents', () => {
  const agents = [];
  for (let i = 0; i < 10; i += 1) {
    agents.push({ stalled: i === 0, model: 'm', contexts: new Array(50).fill(350000) });
  }
  const { rows } = M.hazardTable(agents);
  const row = rows.find((r) => r.bucket === '300-400k');
  assert.strictEqual(row.requests, 500);
  assert.strictEqual(row.stalls, 1);
  assert.ok(Math.abs(row.per1000 - 2) < 1e-9, 'expected 2.0 per 1000, got ' + row.per1000);
});

t('hazardTable reports how much it measured, and refuses a non-array', () => {
  assert.strictEqual(M.hazardTable([]).measured, 0);
  assert.throws(() => M.hazardTable(null), TypeError);
});

t('rateByBucket refuses bad input rather than returning an empty clean result', () => {
  assert.throws(() => M.rateByBucket(null, () => '0'), TypeError);
  assert.throws(() => M.rateByBucket([], 'not a function'), TypeError);
});

// ------------------------------------------------ measure.js against real files

function writeTranscript(dir, name, records) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return p;
}

function runMeasure(args) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [MEASURE].concat(args), { encoding: 'utf8' }), err: '' };
  } catch (err) {
    return { code: err.status, out: err.stdout || '', err: err.stderr || '' };
  }
}

t('measure.js reads real transcripts off disk and reports the split', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-metrics-'));
  try {
    const sub = path.join(root, 'proj', 'sess', 'subagents');
    fs.mkdirSync(sub, { recursive: true });

    writeTranscript(sub, 'agent-a1.jsonl', [
      assistantTurn(350000),
      toolResult(T0),
      killRecord(T1),
    ]);
    writeTranscript(sub, 'agent-a2.jsonl', [
      toolResult(T0),
      toolUseTurn('Bash', T0),
      killRecord(T1),
    ]);
    writeTranscript(sub, 'agent-a3.jsonl', [assistantTurn(120000), toolResult(T0)]);

    const r = runMeasure(['--root', root, '--json']);
    assert.strictEqual(r.code, 0, r.err);
    const s = JSON.parse(r.out);
    assert.strictEqual(s.transcriptsMeasured, 3);
    assert.strictEqual(s.stalled, 2);
    assert.strictEqual(s.waitingOnModel, 1);
    assert.strictEqual(s.waitingOnTool, 1);
    assert.strictEqual(s.medianFinalGapSeconds, 600);
    assert.ok(s.requestsMeasured > 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

t('measure.js REFUSES (exit 2) when the root does not exist', () => {
  const r = runMeasure(['--root', path.join(os.tmpdir(), 'no-such-root-' + Date.now())]);
  assert.strictEqual(r.code, 2, 'a root it cannot read must not read as clean');
  assert.ok(/refus/i.test(r.err), r.err);
});

t('measure.js REFUSES (exit 2) when it measured zero transcripts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-metrics-empty-'));
  try {
    const r = runMeasure(['--root', root]);
    assert.strictEqual(r.code, 2, 'zero measured is a refusal, never a pass');
    assert.ok(/0 transcripts/.test(r.err), r.err);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

t('measure.js ignores transcripts outside a subagents/ directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-metrics-main-'));
  try {
    const proj = path.join(root, 'proj');
    fs.mkdirSync(proj, { recursive: true });
    writeTranscript(proj, 'main-session.jsonl', [assistantTurn(100000), toolResult()]);
    const r = runMeasure(['--root', root]);
    assert.strictEqual(r.code, 2, 'a parent-session transcript is not an agent transcript');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

t('--since drops agents that started earlier', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stall-metrics-since-'));
  try {
    const sub = path.join(root, 'p', 's', 'subagents');
    fs.mkdirSync(sub, { recursive: true });
    writeTranscript(sub, 'agent-old.jsonl', [
      assistantTurn(100000, 'claude-sonnet-5', '2026-01-01T00:00:00.000Z'),
    ]);
    writeTranscript(sub, 'agent-new.jsonl', [assistantTurn(100000)]);
    const r = runMeasure(['--root', root, '--since', '2026-09-01', '--json']);
    assert.strictEqual(r.code, 0, r.err);
    assert.strictEqual(JSON.parse(r.out).transcriptsMeasured, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

t('--help exits 0 and names no home path, account or host', () => {
  const r = runMeasure(['--help']);
  assert.strictEqual(r.code, 0);
  assert.ok(!/\/Users\//.test(r.out), 'this repo is public — no machine paths in output');
});

t('measure.js holds no bucket boundaries of its own', () => {
  // #0003: the decision lives in one module. measure.js may format; it may not
  // decide where a bucket begins.
  const src = fs.readFileSync(MEASURE, 'utf8');
  assert.ok(!/\b[234]00000\b/.test(src), 'context boundaries must come from stall_metrics.js');
});


// ------------------------------------------------ who wrote the reply (#0070)

t('replyAuthor separates app-written replies from model replies', () => {
  const synth = { type: 'assistant', message: { model: '<synthetic>', content: [{ type: 'text', text: 'No response requested.' }] } };
  assert.strictEqual(M.replyAuthor(synth), 'synthetic');
  assert.strictEqual(M.replyAuthor(assistantTurn(1000)), 'model');
  assert.strictEqual(M.replyAuthor(toolResult()), null);
  assert.strictEqual(M.replyAuthor(null), null);
});

t('replyAuthor reads the real transcript shape on disk (#0002)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reply-author-'));
  const f = path.join(dir, 's.jsonl');
  const meta = { type: 'user', isMeta: true, message: { content: [{ type: 'text', text: 'Continue from where you left off.' }] } };
  const synth = { type: 'assistant', message: { model: '<synthetic>', usage: { input_tokens: 0, output_tokens: 0 }, content: [{ type: 'text', text: 'No response requested.' }] } };
  fs.writeFileSync(f, [meta, synth].map((r) => JSON.stringify(r)).join('\n') + '\n');
  const recs = fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepStrictEqual(recs.map(M.replyAuthor), [null, 'synthetic']);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ------------------------------------------------------------------ harness

let failed = 0;
let ran = 0;
for (const [name, fn] of tests) {
  ran += 1;
  try {
    fn();
    console.log('ok   ' + name);
  } catch (err) {
    failed += 1;
    console.log('FAIL ' + name);
    console.log('       ' + (err && err.message ? err.message : String(err)));
  }
}

if (ran === 0) {
  console.error('stall_metrics.test.js: ran 0 tests — refusing');
  process.exit(2);
}
console.log('\n' + (failed ? failed + ' failed' : 'all green') + ' — ' + ran + ' test(s) ran');
process.exit(failed ? 1 : 0);
