#!/usr/bin/env node
'use strict';

/* Pins the zsh word-split rules (post-mortem #0118, class of #0117).
 *
 * The Bash tool on this machine runs zsh. zsh does not word-split an unquoted scalar `$V`,
 * so loops written the bash way pass one whole string where the author meant several words.
 * Both directions are pinned: the incident commands must be refused, and the correct forms
 * (`${=V}`, quoted single words, plain word lists) must pass — a guard that blocks ordinary
 * loops gets removed and takes the protection with it.
 *
 *   node tools/zsh-split-guard/split_rules.test.js
 */

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const R = require('./split_rules');

let failed = 0, ran = 0;
function check(name, fn) {
  ran += 1;
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}
const d = (cmd) => R.decideCommand(cmd);

// ---- must find ----
check('#0118 incident: set -- $V inside a loop over "1920 1080" is refused', () => {
  const cmd = 'for V in "1920 1080" "1366 768"; do set -- $V; env PROBE=1 VW=$1 VH=$2 node capture/profile_tc004_t69_full.js; echo "== ${V}x rc=$?"; done';
  const r = d(cmd);
  assert.ok(r.block, JSON.stringify(r));
  assert.match(r.reason, /set -- \$V/);
});

check('#0117 shape: loop over multi-word items used unquoted as separate args is refused', () => {
  const r = d('for C in "A 25 18 0" "B 12 18 1"; do node cand_test.js $C; done');
  assert.ok(r.block, JSON.stringify(r));
  assert.match(r.reason, /\$C/);
});

check('set -- $X on its own (no loop) is refused', () => {
  assert.ok(d('X="a b c"; set -- $X; echo $2').block);
  assert.ok(d('set -- ${X}; echo $1').block);
});

check('for x in $LIST (a scalar that bash would split) is refused', () => {
  const r = d('LIST="a b"; for x in $LIST; do echo $x; done');
  assert.ok(r.block, JSON.stringify(r));
});

check('single-quoted multi-word items count too', () => {
  assert.ok(d("for V in '1920 1080'; do set -- $V; done").block);
  assert.ok(d("for V in '1920 1080'; do echo $V; done").block);
});

// ---- must not find ----
check('explicit zsh split ${=V} passes', () => {
  assert.ok(!d('for V in "1920 1080" "1366 768"; do set -- ${=V}; VW=$1 VH=$2 node x.js; done').block);
});

check('a multi-word item used quoted (one word on purpose) passes', () => {
  assert.ok(!d('for V in "a b" "c d"; do echo "$V"; printf "%s\\n" "${V}"; done').block);
});

check('a plain word list loop passes', () => {
  assert.ok(!d('for f in a.js b.js c.js; do node $f; done').block);
  assert.ok(!d('for n in 1 2 3; do echo $n; done').block);
});

check('arrays and positional lists pass', () => {
  assert.ok(!d('for x in "${arr[@]}"; do echo $x; done').block);
  assert.ok(!d('for x in "$@"; do echo $x; done').block);
  assert.ok(!d('for x in $(ls); do echo $x; done').block);
});

check('text inside quotes is not code: commit messages and echo strings pass', () => {
  assert.ok(!d('git commit -m "zsh set -- $V does not split"').block);
  assert.ok(!d("echo 'for V in \"a b\"; do set -- $V; done'").block);
});

check('a quoted heredoc body is data, not code', () => {
  assert.ok(!d("cat > f.sh <<'EOF'\nfor V in \"a b\"; do set -- $V; done\nEOF\nbash f.sh").block);
});

check('ordinary commands without loops or set pass', () => {
  for (const c of ['git status', 'node x.js', 'VW=1920 VH=1080 node x.js', 'echo $HOME', 'set -euo pipefail']) {
    assert.ok(!d(c).block, c);
  }
});

// ---- the hook entry point, run as a real process on the real file ----
const HOOK = path.join(__dirname, 'split_rules.js');
function hook(obj) {
  return spawnSync(process.execPath, [HOOK, '--hook'], { input: typeof obj === 'string' ? obj : JSON.stringify(obj), encoding: 'utf8' });
}
check('hook mode: incident command exits 2 with the reason on stderr', () => {
  const r = hook({ tool_name: 'Bash', tool_input: { command: 'for V in "1920 1080"; do set -- $V; echo $1; done' } });
  assert.strictEqual(r.status, 2, `status ${r.status} stderr ${r.stderr}`);
  assert.match(r.stderr, /zsh/);
});
check('hook mode: a clean command exits 0', () => {
  const r = hook({ tool_name: 'Bash', tool_input: { command: 'git status' } });
  assert.strictEqual(r.status, 0, `status ${r.status} stderr ${r.stderr}`);
});
check('hook mode: unreadable input fails open with a warning (exit 0, stderr says so)', () => {
  const r = hook('not json');
  assert.strictEqual(r.status, 0);
  assert.match(r.stderr, /could not read/);
});

console.log(`\n${ran - failed}/${ran} passed`);
process.exit(failed || ran === 0 ? 1 : 0);
