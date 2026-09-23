#!/usr/bin/env node
'use strict';

/* Pins the rtk known-answer checker (post-mortem #0119, class of #0116).
 *
 * These run against STUB rtk binaries written to a temp dir, so they give the same answer on
 * CI (no rtk) and on the owner's machine. The live run against the real rtk is
 * `node tools/rtk-known-answer/known_answer.js` — see that file for why it is not in the suite.
 *
 *   node tools/rtk-known-answer/known_answer.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const K = require('./known_answer');

let failed = 0, ran = 0;
function check(name, fn) {
  ran += 1;
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-ka-'));
function stub(name, body) {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, `#!/bin/bash\n${body}\n`, { mode: 0o755 });
  return p;
}
// `rtk rewrite "<cmd>"` contract: exit 0 + rewritten command on stdout, exit 1 + nothing = not rewritten.
const NO_REWRITE = stub('rtk-none', 'exit 1');
const WC_LIES = stub('rtk-wc-zero', '[ "$1" = rewrite ] || exit 9\ncase "$2" in wc*) echo "echo 0"; exit 0;; *) exit 1;; esac');
const DIFF_LIES = stub('rtk-diff-same', '[ "$1" = rewrite ] || exit 9\ncase "$2" in diff*) echo "echo \'[ok] Files are identical\'"; exit 0;; *) exit 1;; esac');
const HEAD_DROPS = stub('rtk-head-drop', '[ "$1" = rewrite ] || exit 9\ncase "$2" in head*) echo "sed -n 1p a.txt"; exit 0;; *) exit 1;; esac');
const FAITHFUL = stub('rtk-faithful', '[ "$1" = rewrite ] || exit 9\necho "$2"; exit 0');

const byName = (res, n) => res.results.find((r) => r.name === n);

// ---- must find ----
check('#0119 incident: wc rewritten to print 0 is caught', () => {
  const res = K.runAll({ rtk: WC_LIES });
  const r = byName(res, 'wc -l');
  assert.ok(r.rewritten && !r.ok, JSON.stringify(r));
  assert.ok(res.divergent >= 1);
});
check('#0119 incident: diff rewritten to "Files are identical" is caught (exit code and text)', () => {
  const r = byName(K.runAll({ rtk: DIFF_LIES }), 'diff');
  assert.ok(r.rewritten && !r.ok, JSON.stringify(r));
});
check('head that silently drops lines is caught', () => {
  const r = byName(K.runAll({ rtk: HEAD_DROPS }), 'head -5');
  assert.ok(r.rewritten && !r.ok, JSON.stringify(r));
});

// ---- must not find ----
check('nothing rewritten -> 0 divergent, and every case was measured', () => {
  const res = K.runAll({ rtk: NO_REWRITE });
  assert.strictEqual(res.divergent, 0);
  assert.strictEqual(res.measured, K.CASES.length);
  assert.ok(res.measured > 0);
});
check('a rewrite that keeps the answer is not flagged', () => {
  const res = K.runAll({ rtk: FAITHFUL });
  assert.strictEqual(res.divergent, 0, JSON.stringify(res.results.filter((r) => !r.ok)));
  assert.ok(res.results.every((r) => r.rewritten));
});

// ---- the raw answers themselves are right (the fixture is a known answer, not a guess) ----
check('fixture raw answers: wc says 7, diff exits 1, head -5 has line 4', () => {
  const res = K.runAll({ rtk: NO_REWRITE });
  assert.match(byName(res, 'wc -l').raw.out, /\b7\b/);
  assert.strictEqual(byName(res, 'diff').raw.rc, 1);
  assert.match(byName(res, 'head -5').raw.out, /line4 needle/);
});

check('missing rtk binary is UNVERIFIABLE, never a pass', () => {
  const res = K.runAll({ rtk: path.join(tmp, 'does-not-exist') });
  assert.strictEqual(res.status, 'UNVERIFIABLE');
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${ran - failed}/${ran} passed`);
process.exit(failed || ran === 0 ? 1 : 0);
