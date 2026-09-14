#!/usr/bin/env node
'use strict';

/* Pins jira-ticket-guard — the PreToolUse gate that post-mortem #0054 asked for.
 *
 * Every case below spawns the REAL CLI (`node check.js --gate/--confirm/--status`) as a
 * subprocess, never the exported functions directly. gate.test.js next door measured why
 * that distinction matters: a `return 0;` dropped at the top of a gate function once left
 * an entire suite green while the only blocking layer had stopped blocking, because the
 * suite only ever called the function in-process and never actually ran the CLI path a
 * real hook invocation goes through. CLAUDE_PROJECT_DIR is pointed at a fresh tmpdir per
 * test so this suite never reads or writes this session's own live state file.
 *
 *   node tools/jira-ticket-guard/jira_ticket_guard.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const CHECK = path.join(__dirname, 'check.js');

let ran = 0;
let failed = 0;
function check(name, fn) {
  ran += 1;
  try {
    fn();
    console.log('PASS  ' + name);
  } catch (e) {
    failed += 1;
    console.log('FAIL  ' + name + ' -> ' + e.message);
  }
}

/** A throwaway project dir so STATE_DIR never touches this session's real state. */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jiraguard-'));
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  return dir;
}

function run(dir, args, stdin) {
  const res = spawnSync(process.execPath, [CHECK, ...args], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    input: stdin,
    encoding: 'utf8',
  });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function gatePayload(toolName, toolInput) {
  return JSON.stringify({ session_id: 's1', tool_name: toolName, tool_input: toolInput || {} });
}

// ── the tool-name pattern itself ─────────────────────────────────────────────────

check('matches createJiraIssue behind either real connector id seen live in this workspace', () => {
  const { TOOL_RE } = require('./check.js');
  assert.ok(TOOL_RE.test('mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__createJiraIssue'));
  assert.ok(TOOL_RE.test('mcp__af7c11f4-f132-429c-aef3-6f4f21f09a74__createJiraIssue'));
});

check('does NOT match a read call, a comment, or an edit on the same connector', () => {
  const { TOOL_RE } = require('./check.js');
  for (const name of [
    'mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__getJiraIssue',
    'mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__addCommentToJiraIssue',
    'mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__editJiraIssue',
    'mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__createConfluencePage',
    'Read',
    'Bash',
    'createJiraIssue', // no mcp__..__ wrapper at all
  ]) {
    assert.ok(!TOOL_RE.test(name), `should not match: ${name}`);
  }
});

// ── the gate, run as a real subprocess ──────────────────────────────────────────

check('blocks createJiraIssue with no confirm ever recorded (exit 2, names the reason)', () => {
  const dir = sandbox();
  const r = run(dir, ['--gate'], gatePayload('mcp__abc__createJiraIssue'));
  assert.strictEqual(r.code, 2);
  assert.ok(r.out.includes('ยังไม่เคยยืนยันเลยในรอบนี้'), 'missing the specific reason in the message: ' + r.out);
  assert.ok(r.out.includes('#0054'), 'block message should point at the post-mortem it comes from');
});

check('allows a non-Jira-create tool through even with no confirm on record', () => {
  const dir = sandbox();
  const r = run(dir, ['--gate'], JSON.stringify({ session_id: 's1', tool_name: 'Read', tool_input: {} }));
  assert.strictEqual(r.code, 0);
});

check('--confirm with an empty reason is refused and writes no state', () => {
  const dir = sandbox();
  const r = run(dir, ['--confirm', ''], null);
  assert.strictEqual(r.code, 2);
  assert.ok(!fs.existsSync(path.join(dir, '.claude', '.jira-ticket-guard-state', 'armed.json')));
});

check('--confirm with a reason arms exactly one state file with that reason recorded', () => {
  const dir = sandbox();
  const r = run(dir, ['--confirm', 'เจ้าของงานพิมพ์ว่าเปิดเลยในแชทจริง'], null);
  assert.strictEqual(r.code, 0);
  const statePath = path.join(dir, '.claude', '.jira-ticket-guard-state', 'armed.json');
  assert.ok(fs.existsSync(statePath));
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.strictEqual(state.reason, 'เจ้าของงานพิมพ์ว่าเปิดเลยในแชทจริง');
  assert.strictEqual(state.consumed, false);
  assert.strictEqual(typeof state.armedAt, 'number');
});

check('after a fresh confirm, the very next createJiraIssue call is allowed', () => {
  const dir = sandbox();
  assert.strictEqual(run(dir, ['--confirm', 'ok ไปเลย'], null).code, 0);
  const r = run(dir, ['--gate'], gatePayload('mcp__xyz__createJiraIssue', { fields: { summary: 'ทดสอบ' } }));
  assert.strictEqual(r.code, 0);
  assert.ok(r.out.includes('ทดสอบ'), 'allow message should echo the summary for an audit trail: ' + r.out);
});

check('a confirm is single-use: the SECOND createJiraIssue call after it is blocked again', () => {
  const dir = sandbox();
  run(dir, ['--confirm', 'ok ไปเลย'], null);
  const first = run(dir, ['--gate'], gatePayload('mcp__xyz__createJiraIssue'));
  assert.strictEqual(first.code, 0, 'first call should have been allowed');
  const second = run(dir, ['--gate'], gatePayload('mcp__xyz__createJiraIssue'));
  assert.strictEqual(second.code, 2, 'second call on the same confirm must be blocked');
  assert.ok(second.out.includes('ถูกใช้ไปกับการสร้างครั้งก่อนหน้าแล้ว'),
    'block message after consumption must say it was already used, not "never confirmed": ' + second.out);
});

check('an expired confirm (older than the TTL) blocks and says so, not "never confirmed"', () => {
  const dir = sandbox();
  const { TTL_MS } = require('./check.js');
  const stateDir = path.join(dir, '.claude', '.jira-ticket-guard-state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'armed.json'),
    JSON.stringify({ armedAt: Date.now() - TTL_MS - 5000, reason: 'old', consumed: false }),
  );
  const r = run(dir, ['--gate'], gatePayload('mcp__xyz__createJiraIssue'));
  assert.strictEqual(r.code, 2);
  assert.ok(r.out.includes('หมดอายุแล้ว'), 'block message should say it expired, not that it was never confirmed: ' + r.out);
});

check('malformed JSON on stdin fails CLOSED (blocks), because this guards an irreversible write', () => {
  const dir = sandbox();
  const r = run(dir, ['--gate'], 'not json at all {{{');
  assert.strictEqual(r.code, 2, 'an unreadable payload must never be read as "allow" for this guard');
});

check('unreadable stdin (no input at all) also fails CLOSED, not open', () => {
  const dir = sandbox();
  const r = run(dir, ['--gate'], '');
  // Empty string parses to a JSON error too — same fail-closed path.
  assert.strictEqual(r.code, 2);
});

check('--status reports nothing armed cleanly when no state exists', () => {
  const dir = sandbox();
  const r = run(dir, ['--status'], null);
  assert.strictEqual(r.code, 0);
  assert.ok(r.out.includes('ไม่มีการอนุญาตค้างอยู่'));
});

// ── no shortcut left lying around ────────────────────────────────────────────────

check('the guard has no override flag — a shortcut that exists eventually gets used', () => {
  const src = fs.readFileSync(CHECK, 'utf8') + fs.readFileSync(
    path.join(ROOT, '.claude/hooks/jira-ticket-guard.sh'), 'utf8');
  for (const bad of ['--force', 'SKIP_JIRA', 'JIRA_GUARD_OK', 'no-verify', 'DISABLE_GUARD']) {
    assert.ok(!src.includes(bad), `found a shortcut "${bad}" in the guard's own source`);
  }
  assert.ok(src.includes('--confirm'), 'the one recorded way through must still be present');
});

// ── the harness's own matcher must actually catch what check.js decides on ─────────

check('the PreToolUse matcher registered in settings.json actually matches real tool names', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
  const entries = settings.hooks && settings.hooks.PreToolUse ? settings.hooks.PreToolUse : [];
  const owning = entries.find((e) =>
    (e.hooks || []).some((h) => (h.command || '').includes('jira-ticket-guard.sh')));
  assert.ok(owning, 'no PreToolUse entry wires jira-ticket-guard.sh into settings.json at all');
  const matcher = new RegExp(owning.matcher);
  assert.ok(matcher.test('mcp__a0daa148-9b62-40f3-8ed0-431f05143a14__createJiraIssue'),
    `settings.json matcher "${owning.matcher}" does not catch a real createJiraIssue tool name — ` +
    'the hook would simply never fire');
  assert.ok(matcher.test('mcp__af7c11f4-f132-429c-aef3-6f4f21f09a74__createJiraIssue'),
    `settings.json matcher "${owning.matcher}" does not catch the OTHER live connector id`);
});

// ── end-to-end through the actual bash wrapper, not just the node CLI ───────────────

check('the .sh wrapper end-to-end: blocks unconfirmed, allows confirmed, single-use', () => {
  const dir = sandbox();
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tools', 'jira-ticket-guard'), { recursive: true });
  fs.copyFileSync(CHECK, path.join(dir, 'tools', 'jira-ticket-guard', 'check.js'));
  fs.copyFileSync(
    path.join(ROOT, '.claude/hooks/jira-ticket-guard.sh'),
    path.join(dir, '.claude/hooks/jira-ticket-guard.sh'),
  );
  const hook = path.join(dir, '.claude/hooks/jira-ticket-guard.sh');
  const blocked = spawnSync('bash', [hook], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    input: gatePayload('mcp__abc__createJiraIssue'),
    encoding: 'utf8',
  });
  assert.strictEqual(blocked.status, 2, 'wrapper should relay the block exit code unchanged');

  const confirm = spawnSync(process.execPath,
    [path.join(dir, 'tools/jira-ticket-guard/check.js'), '--confirm', 'ผ่าน wrapper'],
    { cwd: dir, env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8' });
  assert.strictEqual(confirm.status, 0);

  const allowed = spawnSync('bash', [hook], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    input: gatePayload('mcp__abc__createJiraIssue'),
    encoding: 'utf8',
  });
  assert.strictEqual(allowed.status, 0, 'wrapper should relay the allow exit code unchanged');

  const again = spawnSync('bash', [hook], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    input: gatePayload('mcp__abc__createJiraIssue'),
    encoding: 'utf8',
  });
  assert.strictEqual(again.status, 2, 'single-use must hold through the wrapper too, not just the raw CLI');
});

check('wrapper allows through (does not jam the session) if check.js is missing entirely', () => {
  const dir = sandbox();
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  fs.copyFileSync(
    path.join(ROOT, '.claude/hooks/jira-ticket-guard.sh'),
    path.join(dir, '.claude/hooks/jira-ticket-guard.sh'),
  );
  // Deliberately no tools/jira-ticket-guard/check.js under this sandbox root.
  const res = spawnSync('bash', [path.join(dir, '.claude/hooks/jira-ticket-guard.sh')], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    input: gatePayload('mcp__abc__createJiraIssue'),
    encoding: 'utf8',
  });
  assert.strictEqual(res.status, 0, 'infra breakage must fail OPEN, matching investigation-gate.sh\'s own policy');
  assert.ok((res.stdout + res.stderr).includes('⚠️'), 'a broken guard must still shout, never fail silently');
});

// ── zero-measured-is-a-refusal (report #0010 / #0012's own lesson, applied to this file) ──

if (ran === 0) {
  console.log('\n0 FAILED (nothing was actually checked) — this counts as a refusal, not a pass');
  process.exit(2);
}

console.log(failed ? `\n${failed}/${ran} FAILED` : `\nall ${ran} passed`);
process.exit(failed ? 1 : 0);
