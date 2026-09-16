#!/usr/bin/env node
'use strict';
/**
 * ask-guard — PreToolUse hook entry for AskUserQuestion. All decisions live in ask_rules.js;
 * this file only does I/O (stdin payload, transcript file, override marker) and maps the result
 * to an exit code.
 *
 * Exit contract for --gate (same as the other guards in this repo):
 *   0 = allow the question      2 = block it (message on stderr)      anything else = could not decide
 * The bash wrapper allows on "could not decide" with a loud warning — a guard that jams every
 * question on its own crash gets deleted within a day (see tools/jira-ticket-guard/README.md).
 * A payload or transcript this file cannot READ is not a crash: it is the "unverifiable" state,
 * which refuses (report #0005) and prints the recorded way out.
 *
 * Usage:
 *   node tools/ask-guard/check.js --gate                       # hook: payload on stdin
 *   node tools/ask-guard/check.js --unverifiable-ok "reason"   # one recorded pass, only when unverifiable
 *   node tools/ask-guard/check.js --status
 */

const fs = require('fs');
const path = require('path');
const rules = require('./ask_rules');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const STATE_DIR = process.env.ASK_GUARD_STATE_DIR || path.join(ROOT, '.claude', '.ask-guard-state');
const OVERRIDE_FILE = path.join(STATE_DIR, 'override.json');
const TTL_MS = 10 * 60 * 1000;

function readOverride() {
  try {
    const o = JSON.parse(fs.readFileSync(OVERRIDE_FILE, 'utf8'));
    const fresh = typeof o.armedAt === 'number' && Date.now() - o.armedAt < TTL_MS && !o.consumed;
    return { ...o, fresh };
  } catch {
    return null;
  }
}

function writeOverride(data) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(OVERRIDE_FILE, JSON.stringify(data, null, 2));
}

function readTranscript(p) {
  if (typeof p !== 'string' || !p) return { lines: null, why: 'the hook payload has no transcript_path' };
  try {
    return { lines: fs.readFileSync(p, 'utf8').split('\n'), why: null };
  } catch (e) {
    return { lines: null, why: `cannot read transcript_path (${e.code || e.message})` };
  }
}

function cmdGate() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    process.stderr.write('[ask-guard] อ่าน payload ของ hook ไม่ได้ (ไม่ใช่ JSON) — ตัดสินไม่ได้ จึงบล็อกไว้ก่อน\n');
    process.exit(2);
    return;
  }

  const toolName = payload.tool_name || '';
  // Only a question that carries a signal needs the transcript. Read it lazily so an unrelated
  // tool or a plain decision question never fails on a transcript problem.
  const quick = rules.decide({ toolName, toolInput: payload.tool_input, transcriptLines: [], override: null });
  if (quick.state === 'not-ask' || quick.state === 'no-signal') {
    process.exit(0);
    return;
  }

  const { lines, why } = readTranscript(payload.transcript_path);
  const override = readOverride();
  const result = rules.decide({ toolName, toolInput: payload.tool_input, transcriptLines: lines, override });
  // A transcript that could not be read explains itself better than "no transcript lines" does —
  // but only when the question itself was readable; an unreadable question keeps its own reason.
  if (lines === null && result.state === 'unverifiable' && rules.questionText(payload.tool_input) !== null) {
    result.why = why;
  }

  if (result.decision === 'allow') {
    if (result.consumeOverride) {
      writeOverride({ ...override, fresh: undefined, consumed: true, consumedAt: Date.now() });
      process.stdout.write(`[ask-guard] ผ่านด้วย override ที่บันทึกไว้: ${override.reason}\n`);
    }
    process.exit(0);
    return;
  }
  process.stderr.write(rules.denyMessage(result) + '\n');
  process.exit(2);
}

function cmdUnverifiableOk(argv) {
  const i = argv.indexOf('--unverifiable-ok');
  const reason = i === -1 ? '' : String(argv[i + 1] || '').trim();
  if (!reason) {
    process.stderr.write('[ask-guard] --unverifiable-ok ต้องมีเหตุผลเสมอ: ค้นอะไรไปแล้ว ได้ผลอะไร — ไม่ใส่ = ปฏิเสธ\n');
    process.exit(2);
    return;
  }
  writeOverride({ armedAt: Date.now(), reason, consumed: false });
  process.stdout.write(
    `[ask-guard] บันทึกแล้ว — ใช้ได้ 1 ครั้ง ภายใน ${TTL_MS / 60000} นาที และมีผลเฉพาะเมื่อการ์ดอ่านบันทึกเซสชันไม่ได้เท่านั้น\n` +
      `  เหตุผล: ${reason}\n`,
  );
  process.exit(0);
}

function cmdStatus() {
  const o = readOverride();
  process.stdout.write(
    o
      ? `[ask-guard] override: fresh=${o.fresh} consumed=${!!o.consumed} reason=${o.reason}\n`
      : '[ask-guard] ไม่มี override ค้างอยู่\n',
  );
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--gate')) return cmdGate();
  if (argv.includes('--unverifiable-ok')) return cmdUnverifiableOk(argv);
  if (argv.includes('--status')) return cmdStatus();
  process.stderr.write('usage: check.js --gate | --unverifiable-ok "reason" | --status\n');
  process.exit(2);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`[ask-guard] internal error: ${e && e.stack ? e.stack : e}\n`);
    process.exit(3);
  }
}

module.exports = { OVERRIDE_FILE, STATE_DIR, TTL_MS, readOverride, readTranscript };
