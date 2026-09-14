#!/usr/bin/env node
"use strict";
/**
 * jira-ticket-guard — blocks creating a NEW Jira issue via the Atlassian MCP tool
 * unless the owner explicitly confirmed THIS creation, this turn.
 *
 * Root cause it closes (docs/post-mortem/20260914-post-mortem-report-0054-…): the
 * exhaustive-research rule ("ค้นคว้าให้ครบก่อนบอกว่าติด") was read as also granting
 * authority to create tickets in an external system the dev team sees. Nothing
 * mechanical stood between "research is done" and "the ticket now exists in Jira."
 * This guard is that mechanical checkpoint.
 *
 * Modeled on tools/investigation-guard/: one runtime holds the whole decision, the
 * bash wrapper only relays exit codes, and an internal crash here fails OPEN (shout,
 * then allow) rather than holding a session hostage — a guard that jams a session is
 * a guard someone deletes within a day (see that tool's own README).
 *
 * State is a single global marker, not per-session: the confirm→create pair is meant
 * to happen back-to-back in one turn anyway, this repo already runs many concurrent
 * sessions against the same worktree, and Claude Code does not expose a stable session
 * id to a plain Bash-tool invocation the way it hands one to a hook's own stdin — so a
 * per-session key here would either be unobtainable or a guess. The cost of sharing one
 * marker is small (worst case: a concurrent session's own legitimate confirm gets
 * consumed by this one's create, and this one is then correctly re-blocked) and it is
 * strictly safer than inventing a session id that might not match what the hook sees.
 *
 * Exit contract for --gate (matches investigation-gate.sh's expectations):
 *   0 = allow the tool call      2 = block it      anything else = "could not decide"
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const STATE_DIR = path.join(ROOT, ".claude", ".jira-ticket-guard-state");
const STATE_FILE = path.join(STATE_DIR, "armed.json");

// A confirm from much earlier in a long conversation should not silently authorise
// an unrelated create much later — 10 minutes is generous for "ask, get a yes, create"
// but short enough that a stale leftover cannot reach across an unrelated later task.
const TTL_MS = 10 * 60 * 1000;

// Matches createJiraIssue on ANY Atlassian MCP connector instance. The server-id
// segment (`a0daa148-...`, `af7c11f4-...` — seen as two different live connector ids
// in this very workspace) is a per-connection identifier, never stable, so hardcoding
// one would silently stop matching the moment the connector reconnects under a new id.
// Deliberately NOT restricted to a hex/UUID character class: the two ids observed live
// happen to be lowercase hex UUIDs, but that shape is not a documented guarantee, and a
// guard that stops matching the moment some future id looks different is a guard that
// fails silently — exactly the class of bug this repo's whole post-mortem log exists to
// stop. Anything between the two literal anchors counts.
const TOOL_RE = /^mcp__.+__createJiraIssue$/;

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeState(data) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

function clearState() {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    /* already gone — fine */
  }
}

function isFresh(state) {
  return typeof state?.armedAt === "number" && Date.now() - state.armedAt < TTL_MS;
}

function flagValue(argv, name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
}

/** `--confirm "<verbatim reason/quote the owner gave to create this ticket>"` */
function cmdConfirm(argv) {
  const reason = flagValue(argv, "--confirm");
  if (!reason || !reason.trim()) {
    console.error(
      "[jira-ticket-guard] --confirm ต้องมีเหตุผล/คำพูดของเจ้าของงานที่อนุญาตแนบมาด้วยเสมอ " +
        "ไม่ใส่ = ปฏิเสธ (mirrors investigation-guard's --not-an-investigation contract — " +
        "an unrecorded override is a silent one).",
    );
    process.exit(2);
    return;
  }
  writeState({ armedAt: Date.now(), reason: reason.trim(), consumed: false });
  console.log(
    "[jira-ticket-guard] อนุญาตแล้ว — ใช้ได้ 1 ครั้งกับการสร้าง Jira issue ครั้งถัดไปเท่านั้น " +
      `(หมดอายุใน ${Math.round(TTL_MS / 60000)} นาทีถ้ายังไม่ได้ใช้)\n` +
      `  เหตุผลที่บันทึกไว้: ${reason.trim()}`,
  );
  process.exit(0);
}

function cmdStatus() {
  const state = readState();
  if (!state) {
    console.log("[jira-ticket-guard] ไม่มีการอนุญาตค้างอยู่");
    return;
  }
  const ageS = Math.round((Date.now() - state.armedAt) / 1000);
  console.log(
    `[jira-ticket-guard] armed ${ageS}s ago · fresh=${isFresh(state)} · consumed=${!!state.consumed}\n` +
      `  เหตุผล: ${state.reason}`,
  );
}

/** Reads the PreToolUse hook payload from stdin and decides allow/block. */
function cmdGate() {
  let input;
  try {
    input = fs.readFileSync(0, "utf8");
  } catch {
    // Cannot even read the payload, so cannot tell what tool this is. Fail CLOSED,
    // not open — unlike a crash in our own logic below, this means the harness
    // context itself is unreadable, and the thing being guarded is an irreversible
    // external write (post-mortem #0005: a guard needs a "cannot verify" state, and
    // that state must lead to refusal, not a silent pass).
    console.error("[jira-ticket-guard] อ่าน stdin ไม่ได้ ตัดสินไม่ได้ว่าเป็น tool อะไร — ปฏิเสธไว้ก่อน");
    process.exit(2);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    console.error("[jira-ticket-guard] payload ที่ได้ไม่ใช่ JSON ที่ parse ได้ — ปฏิเสธไว้ก่อน");
    process.exit(2);
    return;
  }

  const toolName = payload.tool_name || "";
  if (!TOOL_RE.test(toolName)) {
    // Not a Jira-issue-creation call — nothing for this guard to say about it.
    process.exit(0);
    return;
  }

  const state = readState();

  if (!state || state.consumed || !isFresh(state)) {
    const why = !state
      ? "ยังไม่เคยยืนยันเลยในรอบนี้"
      : state.consumed
        ? "เคยยืนยันแล้วแต่ถูกใช้ไปกับการสร้างครั้งก่อนหน้าแล้ว (ใช้ได้ครั้งเดียวต่อการยืนยันหนึ่งครั้ง)"
        : `เคยยืนยันไว้แต่หมดอายุแล้ว (เกิน ${Math.round(TTL_MS / 60000)} นาที)`;
    console.error(
      "[jira-ticket-guard] บล็อกการสร้าง Jira issue ใหม่ — " +
        why +
        "\n\n" +
        "ตาม docs/post-mortem #0054: ห้ามสร้าง ticket ใหม่ในระบบภายนอกโดยไม่มีคำสั่งชัดจากเจ้าของงาน " +
        "ไม่ว่าจะค้นคว้ามาละเอียดแค่ไหนก็ตาม\n\n" +
        "ก่อนลองอีกครั้ง: (1) แสดงร่างเนื้อหา ticket ให้เจ้าของงานดูในแชทก่อน (2) ถามตรงๆ ว่าจะให้เปิดไหม " +
        "(3) ได้คำตอบยืนยันชัดเจนแล้วค่อยรัน:\n" +
        '  node tools/jira-ticket-guard/check.js --confirm "<คำพูดที่เจ้าของงานอนุญาต>"\n' +
        "แล้วค่อยเรียก createJiraIssue อีกครั้ง (ใช้ได้ครั้งเดียวต่อการยืนยันหนึ่งครั้ง)",
    );
    process.exit(2);
    return;
  }

  // Valid, fresh, unconsumed — allow exactly this one call, then mark it burned so a
  // single confirm can never authorise a second, unrelated create. Marking rather than
  // deleting keeps the "already used" message truthful on the next attempt instead of
  // collapsing it into the same wording as "never confirmed at all".
  writeState({ ...state, consumed: true });
  const summary = payload.tool_input?.fields?.summary || payload.tool_input?.summary || null;
  console.log(
    "[jira-ticket-guard] อนุญาตให้สร้าง Jira issue ครั้งนี้ตามที่ยืนยันไว้: " +
      state.reason +
      (summary ? `\n  summary: ${summary}` : ""),
  );
  process.exit(0);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--gate")) return cmdGate();
  if (argv.includes("--confirm")) return cmdConfirm(argv);
  if (argv.includes("--status")) return cmdStatus();
  console.error('usage: check.js --gate | --confirm "reason" | --status');
  process.exit(2);
}

if (require.main === module) main();

module.exports = { TOOL_RE, isFresh, TTL_MS, STATE_FILE, STATE_DIR, readState, writeState, clearState };
