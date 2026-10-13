#!/usr/bin/env node
'use strict';

/**
 * Measure a test round's run time from the evidence it wrote — never estimate it.
 *
 * Method `evidence-burst-v1`: take every evidence/result file (screenshots, clips,
 * results.jsonl) across every lane directory, sort their modification times as one
 * union, and split them into bursts — a new burst starts whenever no file was written
 * for more than `gapS` seconds. The run time is the sum of burst durations. It counts
 * the time spent running and capturing evidence, and leaves out idle time, thinking,
 * re-checks, design lookup and drafting the comment (nothing is written then).
 *
 *   node tools/run-time/measure.js --dirs <laneDir1>,<laneDir2> [--gap-s 120] [--ext png,jpg,mp4,webm,jsonl]
 *
 * stdout: JSON {method, minutes, bursts:[{start,end,minutes}], files, gapS, hasVideo[, warning]}
 * exit 0 = measured · 2 = cannot measure (no --dirs, a dir is missing, or no evidence files) —
 * nothing is printed on stdout then, so no caller can read 0 as a measurement.
 *
 * Node >= 18, no dependencies.
 */

const fs = require('fs');
const path = require('path');

const METHOD = 'evidence-burst-v1';
const DEFAULT_GAP_S = 120;
const DEFAULT_EXT = Object.freeze(['png', 'jpg', 'mp4', 'webm', 'jsonl']);
const VIDEO_EXT = Object.freeze(['mp4', 'webm']);

function extOf(p) { return path.extname(String(p)).slice(1).toLowerCase(); }
function round1(n) { return Math.round(n * 10) / 10; }

/**
 * Pure measurement over an injected file list [{path, mtimeMs}].
 * Returns null when no file matches — the caller must treat that as "cannot measure".
 */
function measure({ files, gapS = DEFAULT_GAP_S, ext = DEFAULT_EXT }) {
  const want = new Set(ext.map((e) => String(e).toLowerCase()));
  const kept = (files || []).filter((f) => want.has(extOf(f.path)) && Number.isFinite(f.mtimeMs));
  if (kept.length === 0) return null;
  const times = kept.map((f) => f.mtimeMs).sort((a, b) => a - b);
  const gapMs = gapS * 1000;
  const raw = [];
  let start = times[0];
  let prev = times[0];
  for (let i = 1; i < times.length; i += 1) {
    if (times[i] - prev > gapMs) {
      raw.push([start, prev]);
      start = times[i];
    }
    prev = times[i];
  }
  raw.push([start, prev]);
  const totalMs = raw.reduce((s, [a, b]) => s + (b - a), 0);
  const out = {
    method: METHOD,
    minutes: round1(totalMs / 60000),
    bursts: raw.map(([a, b]) => ({
      start: new Date(a).toISOString(),
      end: new Date(b).toISOString(),
      minutes: round1((b - a) / 60000),
    })),
    files: kept.length,
    gapS,
    hasVideo: kept.some((f) => VIDEO_EXT.includes(extOf(f.path))),
  };
  if (totalMs === 0) {
    out.warning = 'every burst is a single instant — the duration cannot be measured from file times';
  }
  return out;
}

function parseArgs(argv) {
  const a = { dirs: [], gapS: DEFAULT_GAP_S, ext: DEFAULT_EXT.slice() };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--dirs') { a.dirs = String(v || '').split(',').map((s) => s.trim()).filter(Boolean); i += 1; }
    else if (k === '--gap-s') { a.gapS = Number(v); i += 1; }
    else if (k === '--ext') { a.ext = String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean); i += 1; }
  }
  return a;
}

/** Every regular file under dir, recursively. */
function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) out.push({ path: p, mtimeMs: fs.statSync(p).mtimeMs });
    });
  }
  return out;
}

function main(argv) {
  const a = parseArgs(argv);
  if (a.dirs.length === 0 || !Number.isFinite(a.gapS) || a.gapS <= 0 || a.ext.length === 0) {
    process.stderr.write('usage: measure.js --dirs <dir1>,<dir2> [--gap-s 120] [--ext png,jpg,mp4,webm,jsonl]\n');
    return 2;
  }
  const missing = a.dirs.filter((d) => { try { return !fs.statSync(d).isDirectory(); } catch { return true; } });
  if (missing.length) {
    process.stderr.write(`cannot measure: not a directory: ${missing.join(', ')} — a partial measurement under-reports\n`);
    return 2;
  }
  const r = measure({ files: a.dirs.flatMap(walk), gapS: a.gapS, ext: a.ext });
  if (!r) {
    process.stderr.write(`cannot measure: no ${a.ext.join('/')} files under ${a.dirs.join(', ')}\n`);
    return 2;
  }
  process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { METHOD, DEFAULT_GAP_S, DEFAULT_EXT, VIDEO_EXT, measure, parseArgs, walk, main };
