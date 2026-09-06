#!/usr/bin/env node
'use strict';

/* Pins what the investigation gate DOES, by running it.
 *
 * `investigation_rules.test.js` next door pins the rules, and pins that the hooks mention
 * the flags — but `grep -c 'execFileSync\|spawnSync\|execSync'` on it returns 0, so the
 * 285-line layer that actually refuses to end a turn was never executed by any suite.
 * Measured 2026-09-06: inserting `return 0;` at the top of `gate()` left every suite green
 * while the only blocking layer stopped blocking.
 *
 * Everything here runs against a COPY of the tool tree under a temp root, so the live
 * `.claude/.investigation-state/` — which holds this session's own flags — is never read
 * or written.
 *
 *   node tools/investigation-guard/gate.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

let failed = 0;
function check(name, fn) {
  try { fn(); console.log('PASS  ' + name); } catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

/** A throwaway project root carrying the real guard and the real hook. */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'invgate-'));
  fs.mkdirSync(path.join(dir, 'tools/investigation-guard'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude/hooks'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude/.investigation-state'), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'tools/investigation-guard'))) {
    if (f.endsWith('.test.js')) continue;
    const src = path.join(ROOT, 'tools/investigation-guard', f);
    if (fs.statSync(src).isDirectory()) continue;
    fs.copyFileSync(src, path.join(dir, 'tools/investigation-guard', f));
  }
  fs.copyFileSync(path.join(ROOT, '.claude/hooks/investigation-gate.sh'),
    path.join(dir, '.claude/hooks/investigation-gate.sh'));
  return dir;
}

/**
 * Arm a flag through the REAL code path, not by writing the json by hand.
 *
 * A hand-written fixture diverges from what the tool produces the moment the tool starts
 * writing anything else beside it — which is exactly what happened here: the module now
 * publishes an `ARMED` list for the shell layer to read, and a fixture that skipped
 * `saveState` produced a state the product can never be in.
 */
function arm(dir, session) {
  const r = spawnSync('node', [path.join(dir, 'tools/investigation-guard/check.js'), '--arm'], {
    input: JSON.stringify({ session_id: session, prompt: 'the sync job failed and I do not know why' }),
    encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });
  assert.ok(fs.existsSync(path.join(dir, '.claude/.investigation-state', `${session}.json`)),
    'the fixture did not arm — the prompt no longer trips detectIntent:\n' + (r.stdout || '') + (r.stderr || ''));
}

/** Arm, then record the owner's "this flag is wrong" — again through the real path. */
function armThenDismiss(dir, session) {
  arm(dir, session);
  spawnSync('node', [path.join(dir, 'tools/investigation-guard/check.js'),
    '--not-an-investigation', 'ธงติดผิด — ไม่ใช่การตรวจสอบ', '--session', session], {
    encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });
}

/** A transcript with no skill invocation in it — the shape that must be refused. */
function transcript(dir, name) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'สรุปว่าแก้แล้ว' }] } }) + '\n', 'utf8');
  return p;
}

/** Run the HOOK (not check.js) the way Claude Code does. */
function runHook(dir, payload, env) {
  const r = spawnSync('bash', [path.join(dir, '.claude/hooks/investigation-gate.sh')], {
    input: JSON.stringify(payload), encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir, ...(env || {}) },
  });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const made = [];
function fresh() { const d = sandbox(); made.push(d); return d; }

try {
  check('an armed turn that never invoked the skill is REFUSED (exit 2)', () => {
    const dir = fresh();
    arm(dir, 'sessA');
    const t = transcript(dir, 'sessA.jsonl');
    const r = runHook(dir, { session_id: 'sessA', transcript_path: t });
    assert.strictEqual(r.code, 2, 'the gate did not refuse an unsatisfied investigation:\n' + r.out);
  });

  check('an unarmed turn ends normally (exit 0)', () => {
    const dir = fresh();
    const t = transcript(dir, 'sessB.jsonl');
    const r = runHook(dir, { session_id: 'sessB', transcript_path: t });
    assert.strictEqual(r.code, 0, 'an ordinary turn was blocked:\n' + r.out);
  });

  check('a broken rules module SHOUTS and lets the turn end — the documented fail-open, actually honoured', () => {
    // The hook's header states the decision plainly: "node พังเมื่อไหร่ = ตะโกนดังๆ แล้ว
    // ปล่อยผ่าน (exit 0)". What it did was `exit $?`, and a module-load error escapes
    // check.js's own try/catch because `require` runs before it — so the turn ended with a
    // raw SyntaxError, exit 1, and no shout at all. Neither half of the contract held.
    const dir = fresh();
    arm(dir, 'sessC');
    const t = transcript(dir, 'sessC.jsonl');
    fs.appendFileSync(path.join(dir, 'tools/investigation-guard/investigation_rules.js'),
      '\nthis is not ( valid javascript\n');
    const r = runHook(dir, { session_id: 'sessC', transcript_path: t });
    assert.strictEqual(r.code, 0, 'a broken guard blocked the turn instead of passing:\n' + r.out);
    assert.ok(/investigation gate|รันไม่ได้|ชั้นที่บล็อกหายไป/.test(r.out),
      'it failed open in silence — no warning that the blocking layer is gone:\n' + r.out);
    assert.ok(!/SyntaxError|at Object\.<anonymous>/.test(r.out),
      'a raw stack trace reached the agent instead of the guard\'s own message:\n' + r.out);
  });

  check('with node gone it shouts only when a flag is really armed', () => {
    const noNode = (process.env.PATH || '').split(':')
      .filter((d) => d && !fs.existsSync(path.join(d, 'node'))).join(':');

    const quiet = fresh();
    const r1 = runHook(quiet, { session_id: 'sessD' }, { PATH: noNode });
    assert.strictEqual(r1.code, 0, r1.out);
    assert.strictEqual(r1.out.trim(), '', 'it shouted with nothing armed:\n' + r1.out);

    const loud = fresh();
    arm(loud, 'sessE');
    const r2 = runHook(loud, { session_id: 'sessE' }, { PATH: noNode });
    assert.strictEqual(r2.code, 0, r2.out);
    assert.ok(/รันไม่ได้/.test(r2.out), 'the blocking layer vanished in silence:\n' + r2.out);
  });

  check('a DISMISSED flag is not counted as an armed one by the degraded-mode warning', () => {
    // The fallback branch asked `ls .investigation-state/*.json`, a different rule from the
    // module's (armed and not dismissed/satisfied). Settled files are kept for seven days,
    // so a broken node made this warn for a week about flags nobody owes anything on —
    // and a warning that fires when nothing is wrong is how a real one gets ignored.
    const noNode = (process.env.PATH || '').split(':')
      .filter((d) => d && !fs.existsSync(path.join(d, 'node'))).join(':');
    const dir = fresh();
    armThenDismiss(dir, 'sessF');
    const r = runHook(dir, { session_id: 'sessF' }, { PATH: noNode });
    assert.strictEqual(r.code, 0, r.out);
    assert.strictEqual(r.out.trim(), '',
      'a dismissed flag was reported as an outstanding investigation:\n' + r.out);
  });
} finally {
  for (const d of made) fs.rmSync(d, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
