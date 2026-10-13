#!/usr/bin/env node
'use strict';

/**
 * Tests for the merge-time lease check (references/parallel-test-lanes.md §6).
 *
 * Synthetic fixtures only — this repo is public. Known-answer pairs: a round that left a lease
 * behind must fail, a round that released every lease must pass, another round's lease must not
 * count. The CLI cases write real lease files and run the binary, because a suite fed only
 * in-memory objects never touches the code that reads files (post-mortem #0002).
 *
 *   node tools/lane-lease-check/check.test.js
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const C = require('./check');

const BIN = path.join(__dirname, 'check.js');
const FUTURE = new Date(Date.now() + 3600e3).toISOString();
const PAST = new Date(Date.now() - 3600e3).toISOString();

let failed = 0;
let ran = 0;
function t(name, fn) {
  ran += 1;
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

function leaseDir(leases) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lane-lease-'));
  for (const [tag, body] of Object.entries(leases)) {
    fs.writeFileSync(path.join(dir, `${tag}.lease`), typeof body === 'string' ? body : JSON.stringify(body));
  }
  return dir;
}
const lease = (tag, holder, expires = FUTURE) => ({ tag, pid: 4242, holder, created: PAST, expires });
const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });

t('assess: a lease whose holder names the round is held', () => {
  const r = C.assess([{ tag: 'acct01', state: 'fresh', holder: 'lane L2 RTT-20261013-a' }], 'RTT-20261013-a');
  assert.deepStrictEqual(r.held.map((x) => x.tag), ['acct01']);
});

t('assess: another round\'s lease is not this round\'s', () => {
  const r = C.assess([{ tag: 'acct01', state: 'fresh', holder: 'lane L1 RTT-20261012-z' }], 'RTT-20261013-a');
  assert.deepStrictEqual(r.held, []);
  assert.strictEqual(r.scanned, 1);
});

t('assess: an expired lease left on disk is still not released', () => {
  const r = C.assess([{ tag: 'acct01', state: 'expired', holder: 'L1 RTT-20261013-a' }], 'RTT-20261013-a');
  assert.strictEqual(r.held.length, 1);
});

t('assess: a corrupt lease cannot be attributed — reported separately', () => {
  const r = C.assess([{ tag: 'acct09', state: 'corrupt', holder: '' }], 'RTT-20261013-a');
  assert.deepStrictEqual(r.held, []);
  assert.deepStrictEqual(r.unattributable.map((x) => x.tag), ['acct09']);
});

t('assess: a round id shorter than 4 characters is refused', () => {
  assert.throws(() => C.assess([], 'L1'), /round id/);
});

t('readDir: reads tag, state, holder from *.lease files', () => {
  const dir = leaseDir({ a1: lease('a1', 'L1 R-0001'), b2: lease('b2', 'L2 R-0001', PAST), c3: '{not json' });
  const rows = C.readDir(dir).sort((x, y) => x.tag.localeCompare(y.tag));
  assert.deepStrictEqual(rows.map((r) => [r.tag, r.state, r.holder]), [
    ['a1', 'fresh', 'L1 R-0001'], ['b2', 'expired', 'L2 R-0001'], ['c3', 'corrupt', ''],
  ]);
});

t('parseList: reads the session_lease.js `list` text output', () => {
  const text = `a1\tfresh\tpid=1\texpires=${FUTURE}\tlane L1 R-0001\nb2\tcorrupt\tpid=null\texpires=\t\n`;
  assert.deepStrictEqual(C.parseList(text).map((r) => [r.tag, r.state, r.holder]), [
    ['a1', 'fresh', 'lane L1 R-0001'], ['b2', 'corrupt', ''],
  ]);
});

t('CLI: a lease this round left behind → exit 1, names the tag', () => {
  const dir = leaseDir({ acct01: lease('acct01', 'lane L1 R-20261013-x'), acct02: lease('acct02', 'other R-20261001-q') });
  const r = run(['--round', 'R-20261013-x', '--dir', dir]);
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.ok(/acct01/.test(r.stdout) && !/acct02/.test(r.stdout), r.stdout);
});

t('CLI: every lease this round released → exit 0, says how many it scanned', () => {
  const dir = leaseDir({ acct02: lease('acct02', 'other R-20261001-q') });
  const r = run(['--round', 'R-20261013-x', '--dir', dir]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.ok(/scanned 1 lease/.test(r.stdout), r.stdout);
});

t('CLI: an empty lease dir → exit 0 (nothing held)', () => {
  const r = run(['--round', 'R-20261013-x', '--dir', leaseDir({})]);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
});

t('CLI: a missing lease dir → exit 2 (cannot check is not a pass)', () => {
  const r = run(['--round', 'R-20261013-x', '--dir', path.join(os.tmpdir(), 'no-such-lease-dir-' + process.pid)]);
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
});

t('CLI: a corrupt lease → exit 2 (cannot attribute)', () => {
  const r = run(['--round', 'R-20261013-x', '--dir', leaseDir({ bad: '{' })]);
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
});

t('CLI: no --round → exit 2', () => {
  const r = run(['--dir', leaseDir({})]);
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
});

t('CLI: --list-cmd reads the lease tool\'s list output', () => {
  const r = run(['--round', 'R-20261013-x', '--list-cmd',
    `printf 'acct01\\tfresh\\tpid=1\\texpires=${FUTURE}\\tlane L1 R-20261013-x\\n'`]);
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
});

t('CLI: a --list-cmd that fails → exit 2, never an empty pass', () => {
  const r = run(['--round', 'R-20261013-x', '--list-cmd', 'exit 3']);
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
});

if (ran === 0) { console.log('ran zero tests — refusing'); process.exit(1); }
console.log(failed ? `\n${failed} FAILED of ${ran}` : `\nALL PASS (${ran})`);
process.exit(failed ? 1 : 0);
