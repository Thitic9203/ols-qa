#!/usr/bin/env node
'use strict';
/* Known-answer tests for the test-run-time measurement.
 *
 * The number goes into a customer-facing comment, so the tool must give the right
 * answer on inputs whose answer is known before it is trusted on a real round:
 * two bursts with a gap, one file, no files, and video detection.
 *
 *   node tools/run-time/measure.test.js
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const T = require('./measure');

const MIN = 60 * 1000;
const t0 = Date.UTC(2026, 9, 13, 2, 0, 0);
const f = (p, offsetMs) => ({ path: p, mtimeMs: t0 + offsetMs });

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

check('the method id is the fixed string the manifest must carry', () => {
  assert.strictEqual(T.METHOD, 'evidence-burst-v1');
});

check('two bursts separated by more than the gap sum to the burst durations only', () => {
  // burst 1: 0 → 10 min (files every 1 min) · idle 30 min · burst 2: 40 → 45.5 min
  const files = [];
  for (let i = 0; i <= 10; i += 1) files.push(f(`L1/s${i}.png`, i * MIN));
  files.push(f('L2/a.png', 40 * MIN), f('L2/b.png', 42 * MIN), f('L2/c.png', 43.5 * MIN), f('L2/results.jsonl', 45.5 * MIN));
  const r = T.measure({ files, gapS: 120 });
  assert.strictEqual(r.bursts.length, 2);
  assert.strictEqual(r.minutes, 15.5);
  assert.strictEqual(r.bursts[0].minutes, 10);
  assert.strictEqual(r.bursts[1].minutes, 5.5);
  assert.strictEqual(r.files, 15);
  assert.strictEqual(r.gapS, 120);
  assert.strictEqual(r.hasVideo, false);
  assert.strictEqual(r.method, 'evidence-burst-v1');
});

check('a gap of exactly the threshold stays in the same burst; one second more splits it', () => {
  const same = T.measure({ files: [f('a.png', 0), f('b.png', 120 * 1000)], gapS: 120 });
  assert.strictEqual(same.bursts.length, 1);
  assert.strictEqual(same.minutes, 2);
  const split = T.measure({ files: [f('a.png', 0), f('b.png', 121 * 1000)], gapS: 120 });
  assert.strictEqual(split.bursts.length, 2);
  assert.strictEqual(split.minutes, 0);
});

check('lanes interleave: files from every lane are one union, sorted by time', () => {
  const r = T.measure({ files: [f('L2/x.png', 3 * MIN), f('L1/y.png', 0), f('L1/z.png', 1 * MIN), f('L2/w.png', 2 * MIN)], gapS: 120 });
  assert.strictEqual(r.bursts.length, 1);
  assert.strictEqual(r.minutes, 3);
});

check('a single file is one zero-length burst: 0.0 with a warning, never a fake duration', () => {
  const r = T.measure({ files: [f('only.png', 0)], gapS: 120 });
  assert.strictEqual(r.minutes, 0);
  assert.strictEqual(r.bursts.length, 1);
  assert.ok(/single instant/i.test(r.warning || ''), 'no warning for an unmeasurable duration');
});

check('no files → null, so nothing can print 0 as a measurement', () => {
  assert.strictEqual(T.measure({ files: [], gapS: 120 }), null);
});

check('files outside the extension list are ignored; video is detected from mp4/webm', () => {
  const r = T.measure({ files: [f('a.png', 0), f('notes.md', 1 * MIN), f('clip.MP4', 2 * MIN)], gapS: 120 });
  assert.strictEqual(r.files, 2);
  assert.strictEqual(r.hasVideo, true);
  const w = T.measure({ files: [f('a.webm', 0)], gapS: 120 });
  assert.strictEqual(w.hasVideo, true);
  const none = T.measure({ files: [f('notes.md', 0)], gapS: 120 });
  assert.strictEqual(none, null);
});

check('minutes are rounded to one decimal', () => {
  const r = T.measure({ files: [f('a.png', 0), f('b.png', 100 * 1000)], gapS: 120 });
  assert.strictEqual(r.minutes, 1.7);
});

check('parseArgs reads --dirs, --gap-s and --ext', () => {
  const a = T.parseArgs(['--dirs', 'a,b', '--gap-s', '90', '--ext', 'png,MP4']);
  assert.deepStrictEqual(a.dirs, ['a', 'b']);
  assert.strictEqual(a.gapS, 90);
  assert.deepStrictEqual(a.ext, ['png', 'mp4']);
  const d = T.parseArgs(['--dirs', 'a']);
  assert.strictEqual(d.gapS, 120);
  assert.deepStrictEqual(d.ext, ['png', 'jpg', 'mp4', 'webm', 'jsonl']);
});

// CLI end to end on real files whose mtimes are set to known values.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'run-time-'));
const lane1 = path.join(tmp, 'L1');
const lane2 = path.join(tmp, 'L2', 'nested');
fs.mkdirSync(lane1, { recursive: true });
fs.mkdirSync(lane2, { recursive: true });
function touch(p, offsetMs) {
  fs.writeFileSync(p, 'x');
  const s = (t0 + offsetMs) / 1000;
  fs.utimesSync(p, s, s);
}
touch(path.join(lane1, 'a.png'), 0);
touch(path.join(lane1, 'b.png'), 2 * MIN);
touch(path.join(lane1, 'b2.jpg'), 4 * MIN);
touch(path.join(lane2, 'c.mp4'), 30 * MIN);
touch(path.join(lane2, 'd.jsonl'), 31 * MIN);
touch(path.join(lane1, 'ignored.txt'), 90 * MIN);
const CLI = path.join(__dirname, 'measure.js');

check('CLI: walks every lane dir recursively and prints the JSON measurement', () => {
  const r = spawnSync(process.execPath, [CLI, '--dirs', `${lane1},${path.join(tmp, 'L2')}`], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.strictEqual(j.minutes, 5);
  assert.strictEqual(j.files, 5);
  assert.strictEqual(j.hasVideo, true);
  assert.strictEqual(j.bursts.length, 2);
});

check('CLI: no evidence files → exit 2 and no minutes on stdout', () => {
  const empty = path.join(tmp, 'empty');
  fs.mkdirSync(empty);
  const r = spawnSync(process.execPath, [CLI, '--dirs', empty], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
  assert.strictEqual(r.stdout.trim(), '');
});

check('CLI: a lane dir that does not exist → exit 2 (a partial measurement under-reports)', () => {
  const r = spawnSync(process.execPath, [CLI, '--dirs', `${lane1},${path.join(tmp, 'nope')}`], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
  assert.strictEqual(r.stdout.trim(), '');
});

check('CLI: no --dirs → exit 2 with usage', () => {
  const r = spawnSync(process.execPath, [CLI], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASS');
process.exit(failed ? 1 : 0);
