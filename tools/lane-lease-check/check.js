#!/usr/bin/env node
'use strict';

/**
 * Merge-time lease check — references/parallel-test-lanes.md §6.
 *
 * Every lane acquires a session lease on its saved login file before loading it and releases it
 * in `finally`. A lease left behind keeps a background relink from refreshing that account long
 * after the round ended, and it is the trace of a lane that died mid-run. At merge the parent runs
 * this check: any lease whose holder text contains this round's id is still on disk → the round
 * is not merged clean.
 *
 *   node tools/lane-lease-check/check.js --round <round id> --dir <lease dir>
 *   node tools/lane-lease-check/check.js --round <round id> --list-cmd "<lease tool> list"
 *
 * The lease dir and the list command come from the project guide; nothing here names one.
 * A lease is `<tag>.lease` JSON {tag, pid, holder, created, expires}; the list command prints
 * `tag \t state \t pid=… \t expires=… \t holder` per lease.
 *
 * Leftover processes (§5/§6): a lane driver or browser still running after its lane returned keeps
 * its account looking "in use" to any job that reads command lines. At merge the parent also runs
 *
 *   node tools/lane-lease-check/check.js --procs-tags <tag1,tag2,…>
 *
 * which lists every process (ps -axww -o pid=,ppid=,command=) whose command line contains one of
 * the round's account tags, except this process and its ancestors, as `LEFTOVER pid <n>: <cmd>`.
 * exit 0 = none · 1 = at least one · 2 = ps could not run or printed nothing (never a pass).
 * `--ps-cmd "<shell>"` replaces the ps call — for tests only.
 *
 * Lease mode: exit 0 = no lease of this round is held · 1 = at least one is still held (listed) ·
 * 2 = cannot check (no round id, unreadable dir, failing list command, corrupt lease that
 * cannot be attributed). "Cannot check" is never reported as a pass.
 *
 * Node >= 18, no dependencies.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MIN_ROUND_ID = 4;

/** One row per `<tag>.lease` in dir. Throws when the dir cannot be read. */
function readDir(dir, now = Date.now()) {
  const names = fs.readdirSync(dir);
  return names.filter((n) => n.endsWith('.lease')).sort().map((n) => {
    const tag = n.slice(0, -'.lease'.length);
    let lease;
    try { lease = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); } catch { return { tag, state: 'corrupt', holder: '' }; }
    const exp = lease && typeof lease.expires === 'string' ? Date.parse(lease.expires) : NaN;
    if (!lease || lease.tag !== tag || !Number.isFinite(exp)) return { tag, state: 'corrupt', holder: '' };
    return { tag, state: exp > now ? 'fresh' : 'expired', holder: String(lease.holder || '') };
  });
}

/** Rows from the lease tool's `list` text output. */
function parseList(text) {
  return String(text).split('\n').filter((l) => l.trim() !== '').map((l) => {
    const f = l.split('\t');
    return { tag: f[0], state: f[1] || 'corrupt', holder: f.slice(4).join('\t').trim() };
  });
}

/** Which rows this round still holds. An on-disk lease is held whatever its expiry says. */
function assess(rows, roundId) {
  if (typeof roundId !== 'string' || roundId.trim().length < MIN_ROUND_ID) {
    throw new Error(`round id must be at least ${MIN_ROUND_ID} characters — a short id matches other rounds' holders`);
  }
  const id = roundId.trim();
  const unattributable = rows.filter((r) => r.state === 'corrupt');
  const held = rows.filter((r) => r.state !== 'corrupt' && r.holder.includes(id));
  return { scanned: rows.length, held, unattributable };
}

const MIN_TAG = 3;
const PS_CMD = 'ps -axww -o pid=,ppid=,command=';

/** Rows {pid, ppid, command} from `ps -o pid=,ppid=,command=` text. */
function parsePs(text) {
  return String(text).split('\n').map((l) => /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(l)).filter(Boolean)
    .map((m) => ({ pid: Number(m[1]), ppid: Number(m[2]), command: m[3] }));
}

/** Processes whose command line contains any tag, minus selfPid and its ancestors. */
function findLeftovers(rows, tags, selfPid) {
  const list = (tags || []).map((x) => String(x).trim()).filter((x) => x !== '');
  if (!list.length || list.some((x) => x.length < MIN_TAG)) {
    throw new Error(`each tag must be at least ${MIN_TAG} characters and at least one is required — a short tag matches unrelated processes`);
  }
  const byPid = new Map(rows.map((r) => [r.pid, r]));
  const skip = new Set();
  for (let pid = selfPid; pid && !skip.has(pid);) {
    skip.add(pid);
    const row = byPid.get(pid);
    pid = row ? row.ppid : 0;
  }
  return rows.filter((r) => !skip.has(r.pid) && list.some((tag) => r.command.includes(tag)));
}

function procsMain(argv, say) {
  let tags = arg(argv, '--procs-tags');
  const psCmd = arg(argv, '--ps-cmd') || PS_CMD;
  tags = String(tags || '').split(',');
  const r = spawnSync('/bin/sh', ['-c', psCmd], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) { say(`ps exited ${r.error ? r.error.code : r.status} — cannot check, not a pass`); return 2; }
  const rows = parsePs(r.stdout);
  if (!rows.length) { say('ps listed no processes — cannot check, not a pass'); return 2; }
  let hits;
  try { hits = findLeftovers(rows, tags, process.pid); } catch (e) { say(e.message); return 2; }
  if (hits.length) {
    say(`${hits.length} leftover process(es) carry tag(s) ${tags.join(',')} (scanned ${rows.length}):`);
    hits.forEach((h) => process.stdout.write(`LEFTOVER pid ${h.pid}: ${h.command.slice(0, 120)}\n`));
    say('stop a process by its PID only if this round started it, then run this check again');
    return 1;
  }
  say(`ok — scanned ${rows.length} process(es), none carry tag(s) ${tags.join(',')}`);
  return 0;
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}

function main(argv) {
  const round = arg(argv, '--round');
  const dir = arg(argv, '--dir');
  const listCmd = arg(argv, '--list-cmd');
  const say = (s) => process.stdout.write(`[lane-lease-check] ${s}\n`);
  if (argv.includes('--procs-tags')) return procsMain(argv, say);
  if (!round || (!dir && !listCmd)) {
    say('usage: check.js --round <round id> (--dir <lease dir> | --list-cmd "<lease tool> list") — cannot check');
    return 2;
  }
  let rows;
  if (dir) {
    try { rows = readDir(dir); } catch (e) { say(`cannot read lease dir: ${e.code || e.message} — cannot check, not a pass`); return 2; }
  } else {
    const r = spawnSync('/bin/sh', ['-c', listCmd], { encoding: 'utf8' });
    if (r.status !== 0) { say(`list command exited ${r.status} — cannot check, not a pass`); return 2; }
    rows = parseList(r.stdout);
  }
  let res;
  try { res = assess(rows, round); } catch (e) { say(e.message); return 2; }
  if (res.held.length) {
    say(`${res.held.length} lease(s) of round ${round} still held (scanned ${res.scanned} lease(s)):`);
    res.held.forEach((h) => say(`  ${h.tag}\t${h.state}\t${h.holder}`));
    say('release each one with the lease tool (release <tag>) and run this check again');
    return 1;
  }
  if (res.unattributable.length) {
    say(`scanned ${res.scanned} lease(s); ${res.unattributable.length} cannot be read, so cannot be attributed: `
      + `${res.unattributable.map((u) => u.tag).join(', ')} — inspect them; cannot check, not a pass`);
    return 2;
  }
  say(`ok — scanned ${res.scanned} lease(s), none held by round ${round}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { readDir, parseList, assess, parsePs, findLeftovers, main, MIN_ROUND_ID, MIN_TAG };
