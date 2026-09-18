#!/usr/bin/env node
'use strict';

/**
 * measure.js — walk this machine's agent transcripts and print the stall
 * numbers. This layer reads files and prints; every decision lives in
 * `stall_metrics.js` (report #0003).
 *
 * Exit codes — "could not run" is never a pass (#0002, #0005, #0006):
 *   0  measured something and printed it
 *   2  the transcript root is unreadable, or zero transcripts were measured
 *
 * Usage:
 *   node tools/agent-stall-metrics/measure.js
 *   node tools/agent-stall-metrics/measure.js --root <dir> --json
 *   node tools/agent-stall-metrics/measure.js --since 2026-09-01
 *
 * NOTHING HERE TOUCHES A PRODUCT ENVIRONMENT. It reads local transcripts only,
 * and it prints counts — never a path under a user's home, never an account,
 * never a host. This repo is public.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const M = require('./stall_metrics.js');

const DEFAULT_ROOT = path.join(os.homedir(), '.claude', 'projects');

function listTranscripts(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      continue; // a directory we cannot read is reported by the caller's count
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith('.jsonl')) out.push(p);
    }
  }
  return out;
}

/** Read a JSONL transcript into records, skipping lines that will not parse. */
function readRecords(file, maxBytes) {
  let size;
  try {
    size = fs.statSync(file).size;
  } catch (err) {
    return null;
  }
  if (size === 0) return [];
  let text;
  try {
    if (maxBytes && size > maxBytes) {
      const fd = fs.openSync(file, 'r');
      try {
        const buf = Buffer.alloc(maxBytes);
        fs.readSync(fd, buf, 0, maxBytes, size - maxBytes);
        text = buf.toString('utf8');
        const nl = text.indexOf('\n');
        if (nl !== -1) text = text.slice(nl + 1); // drop the partial first line
      } finally {
        fs.closeSync(fd);
      }
    } else {
      text = fs.readFileSync(file, 'utf8');
    }
  } catch (err) {
    return null;
  }
  const recs = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      recs.push(JSON.parse(line));
    } catch (err) {
      /* a truncated tail line is expected; skip it */
    }
  }
  return recs;
}

function pct(n, d) {
  return d ? ((n * 100) / d).toFixed(1) + '%' : '—';
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    process.stdout.write(
      [
        'measure.js — stall numbers for background agents, from local transcripts.',
        '',
        '  --root <dir>   transcript root (default: ~/.claude/projects)',
        '  --since <date> only agents whose first record is on/after this ISO date',
        '  --json         machine-readable output',
        '',
        'Reads local files only. Prints counts, never paths, accounts or hosts.',
      ].join('\n') + '\n'
    );
    return 0;
  }

  const rootIdx = args.indexOf('--root');
  const root = rootIdx !== -1 ? args[rootIdx + 1] : DEFAULT_ROOT;
  const sinceIdx = args.indexOf('--since');
  const since = sinceIdx !== -1 ? Date.parse(args[sinceIdx + 1]) : null;
  if (sinceIdx !== -1 && !Number.isFinite(since)) {
    process.stderr.write('[agent-stall-metrics] --since needs an ISO date — cannot run\n');
    return 2;
  }

  if (!root || !fs.existsSync(root)) {
    process.stderr.write(
      '[agent-stall-metrics] transcript root does not exist — cannot measure, refusing ' +
        '(a run that measured nothing is not a clean run)\n'
    );
    return 2;
  }

  const files = listTranscripts(root).filter((f) => f.includes(path.sep + 'subagents' + path.sep));

  const agents = [];
  let unreadable = 0;
  const ending = { tool: 0, model: 0 };
  const cause = { watchdog: 0, interrupt: 0, unknown: 0 };
  const gaps = [];

  for (const f of files) {
    const recs = readRecords(f, 8 * 1024 * 1024);
    if (recs === null) {
      unreadable += 1;
      continue;
    }
    if (!recs.length) continue;

    if (since !== null) {
      const first = Date.parse(recs[0] && recs[0].timestamp);
      if (!Number.isFinite(first) || first < since) continue;
    }

    let verdict;
    try {
      verdict = M.classifyEnding(recs);
    } catch (err) {
      unreadable += 1;
      continue;
    }

    const contexts = [];
    let model = null;
    let images = 0;
    for (const r of recs) {
      if (r && r.type === 'assistant') {
        const n = M.contextTokens(r);
        if (n !== null) {
          contexts.push(n);
          if (r.message && r.message.model) model = r.message.model;
        }
      }
      const c = r && r.message && r.message.content;
      if (Array.isArray(c)) {
        for (const b of c) {
          if (!b || typeof b !== 'object') continue;
          if (b.type === 'image') images += 1;
          if (b.type === 'tool_result' && Array.isArray(b.content)) {
            for (const x of b.content) if (x && x.type === 'image') images += 1;
          }
        }
      }
    }

    // Only a watchdog kill counts as a stall. A person pressing Escape leaves
    // the same marker and must not be folded in, and neither must a transcript
    // whose timestamps cannot separate the two.
    const stalled = !!verdict.killed && verdict.killedBy === 'watchdog';
    if (verdict.killed) {
      cause[verdict.killedBy] += 1;
      if (stalled) {
        ending[verdict.waitingOn] += 1;
        if (typeof verdict.gapSeconds === 'number') gaps.push(verdict.gapSeconds);
      }
    }

    agents.push({ stalled, model: model || 'unknown', contexts, images });
  }

  if (!agents.length) {
    process.stderr.write(
      '[agent-stall-metrics] measured 0 transcripts under the given root — refusing. ' +
        (unreadable ? unreadable + ' file(s) were unreadable.\n' : '\n')
    );
    return 2;
  }

  const withUsage = agents.filter((a) => a.contexts.length);
  const hazard = M.hazardTable(withUsage);
  const byImages = M.rateByBucket(agents, (a) => {
    if (a.images === 0) return '0';
    if (a.images <= 5) return '1-5';
    if (a.images <= 20) return '6-20';
    if (a.images <= 60) return '21-60';
    if (a.images <= 150) return '61-150';
    return '>150';
  });

  const stalled = agents.filter((a) => a.stalled).length;
  const killedTotal = ending.tool + ending.model; // watchdog kills only
  gaps.sort((a, b) => a - b);
  const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;

  const summary = {
    transcriptsMeasured: agents.length,
    unreadable,
    stalled,
    stallRatePct: Number(((stalled * 100) / agents.length).toFixed(1)),
    killedWithMarker: cause.watchdog + cause.interrupt + cause.unknown,
    killedByWatchdog: cause.watchdog,
    killedByInterrupt: cause.interrupt,
    killedCauseUnknown: cause.unknown,
    waitingOnModel: ending.model,
    waitingOnTool: ending.tool,
    medianFinalGapSeconds: medianGap,
    watchdogSeconds: M.WATCHDOG_SECONDS,
    requestsMeasured: hazard.measured,
    hazard: hazard.rows,
    byImages: byImages.rows,
  };

  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    return 0;
  }

  const L = [];
  L.push(
    `[agent-stall-metrics] measured ${summary.transcriptsMeasured} agent transcript(s)` +
      (unreadable ? `, ${unreadable} unreadable` : '') +
      ` · ${summary.requestsMeasured} model request(s)`
  );
  L.push(
    `  stalled by the watchdog: ${stalled} (${summary.stallRatePct}%) · ` +
      `ended with the kill marker for another reason: ${cause.interrupt} interrupt(s), ` +
      `${cause.unknown} with no usable timestamps (neither is counted as a stall)`
  );
  if (killedTotal) {
    L.push(
      `  when the watchdog fired the agent was waiting on the MODEL ${ending.model} time(s) ` +
        `(${pct(ending.model, killedTotal)}) and on a TOOL ${ending.tool} time(s) ` +
        `(${pct(ending.tool, killedTotal)})`
    );
    if (medianGap !== null) {
      L.push(
        `  median final silence: ${medianGap.toFixed(1)}s (watchdog threshold ${M.WATCHDOG_SECONDS}s)`
      );
    }
  }

  L.push('');
  L.push('  per-request stall hazard by context size:');
  L.push(`    ${'model'.padEnd(22)}${'bucket'.padStart(10)}${'stalls'.padStart(8)}${'requests'.padStart(10)}${'per 1000'.padStart(10)}`);
  for (const r of hazard.rows) {
    if (r.requests < 20) continue; // too few to read anything into
    L.push(
      `    ${r.model.padEnd(22)}${r.bucket.padStart(10)}${String(r.stalls).padStart(8)}` +
        `${String(r.requests).padStart(10)}${r.per1000.toFixed(1).padStart(10)}`
    );
  }

  L.push('');
  L.push('  stall rate by images pulled into context:');
  const imgOrder = ['0', '1-5', '6-20', '21-60', '61-150', '>150'];
  for (const key of imgOrder) {
    const r = byImages.rows.find((x) => x.bucket === key);
    if (!r) continue;
    L.push(
      `    ${key.padEnd(10)}${String(r.stalled).padStart(6)}/${String(r.total).padEnd(7)}` +
        `${r.pct.toFixed(1)}%`
    );
  }

  process.stdout.write(L.join('\n') + '\n');
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = { main, listTranscripts, readRecords };
