#!/usr/bin/env node
'use strict';

/* Pins the process-kill rules (post-mortem #0163, repeat of #0039).
 *
 * Both directions are pinned. The ALLOW direction keeps the guard alive: one that refuses
 * `kill 12345` or `grep -rn pkill docs` gets switched off the same day.
 *
 *   node tools/process-kill-guard/kill_rules.test.js
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const R = require('./kill_rules');

let failed = 0;
let passed = 0;
function check(name, fn) {
  try { fn(); passed += 1; console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
const d = (c) => R.decideCommand(c);

check('the exact shape of the 2026-10-01 incident is refused', () => {
  assert.ok(d("pkill -f 'session_capture.js some-tag'").block);
});

check('the exact shape of the 2026-09-09 incident (#0039) is refused', () => {
  assert.ok(d("pkill -f 'keep_sessions_warm.js'").block);
});

check('every by-name / by-pattern form is refused', () => {
  for (const c of [
    'pkill node', 'pkill -9 -f x', 'killall node', 'killall -9 Chrome',
    'kill $(pgrep -f session_capture.js)', 'kill -9 `pgrep -f x`', 'kill $(pidof node)',
    'kill $(lsof -t -i:9222)', "kill $(ps aux | grep x | awk '{print $2}')",
    'pgrep -f x | xargs kill', 'pgrep -f x | xargs kill -9', 'ps aux | grep x | xargs -n1 kill',
    'echo x | xargs pkill -f', 'bash -c "pkill -f x"', "sh -c 'killall node'",
    'sleep 1; pkill -f x', 'true && pkill -f x', 'false || killall x', 'a=$(pkill -f x)',
    '/usr/bin/pkill -f x',
  ]) assert.ok(d(c).block, `not refused: ${c}`);
});

check('a wrapper word in front does not hide the command', () => {
  for (const c of [
    "rtk pkill -f 'x'", 'sudo pkill x', 'command pkill x', 'env FOO=1 pkill x', 'nohup killall x',
    'timeout 5 pkill -f x', 'FOO=bar pkill x', 'exec killall x',
  ]) assert.ok(d(c).block, `wrapper hid the command: ${c}`);
});

check('stopping by a known pid is allowed', () => {
  for (const c of [
    'kill 12345', 'kill -9 12345', 'kill -TERM 12345 12346', 'kill "$PID"', 'kill $!', 'kill %1',
    'kill $(cat /tmp/x.pid)', 'kill -- -4242', 'rtk kill 12345', 'echo 12345 | xargs kill',
  ]) assert.strictEqual(d(c).block, false, `false refusal: ${c}`);
});

check('looking up and the words pkill/killall as data are allowed', () => {
  for (const c of [
    'pgrep -fl session_capture.js', 'pgrep -f x | wc -l', 'grep -rn pkill docs',
    'git commit -m "docs: never use pkill -f"', "echo 'pkill -f x'",
    "git log --grep='killall'", 'cat <<EOF\npkill -f x\nEOF',
    'node tools/process-kill-guard/kill_rules.test.js',
  ]) assert.strictEqual(d(c).block, false, `false refusal: ${c}`);
});

// Real file on disk: the hook entry point exactly as a PreToolUse hook would run it.
const SCRIPT = path.join(__dirname, 'kill_rules.js');
const runHook = (input) => spawnSync(process.execPath, [SCRIPT, '--hook'], { input, encoding: 'utf8' });

check('hook on disk: must-block payload exits 2 and names the rule', () => {
  const r = runHook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: "pkill -f 'session_capture.js some-tag'" } }));
  assert.strictEqual(r.status, 2, `exit ${r.status} stderr=${r.stderr}`);
  assert.ok(/CLAUDE\.md §9/.test(r.stderr), 'message does not cite the rule');
});

check('hook on disk: must-allow payload exits 0 silently', () => {
  const r = runHook(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'kill -9 12345' } }));
  assert.strictEqual(r.status, 0, `exit ${r.status} stderr=${r.stderr}`);
  assert.strictEqual(r.stderr, '');
});

check('hook on disk: unreadable input fails open but says so', () => {
  const r = runHook('not json');
  assert.strictEqual(r.status, 0);
  assert.ok(/NOT checked/.test(r.stderr), 'silent fail-open');
});

if (passed === 0) { console.log('FAIL  measured 0 checks'); process.exit(1); }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
