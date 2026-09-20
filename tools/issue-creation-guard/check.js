#!/usr/bin/env node
"use strict";

/**
 * issue-creation-guard — ชั้นที่ 4/5/6 ของแนวป้องกัน "ห้ามเปิดบั๊ก/issue เองโดยอัตโนมัติ"
 * (CLAUDE.md หัวข้อ 7 บรรทัดแรก)
 *
 * jira-ticket-guard ปิดทางเดียว: tool MCP `createJiraIssue` ไฟล์นี้ปิดทางที่เหลือ
 *
 *   L4  Bash      — curl POST ไป Jira REST create-issue · `gh issue create` · `jira issue create`
 *   L5  Agent     — prompt ที่สั่ง subagent ให้ "เปิดบั๊ก/เปิด issue/สร้าง ticket"
 *   L6  Stop      — เทิร์นที่มีความพยายามสร้าง issue โดยไม่มี confirm ต้องไม่จบเงียบ
 *
 * สัญญารหัสจบ (เหมือน jira-ticket-guard ทุกประการ):
 *   0 = ปล่อยผ่าน · 2 = บล็อก · อื่นๆ = "ตัดสินไม่ได้" (wrapper จะปล่อยผ่านพร้อมเสียงดัง)
 *
 * อ่าน stdin ไม่ได้ / parse JSON ไม่ได้ = ตัดสินไม่ได้ → ปฏิเสธ (exit 2)
 *   report #0005: การ์ดต้องมีสถานะ "ตรวจไม่ได้" และสถานะนั้นต้องนำไปสู่การปฏิเสธ
 * ส่วน "พังข้างใน" (throw) wrapper จะปล่อยผ่าน เพราะการ์ดที่ล็อกเซสชันคือการ์ดที่ถูกลบทิ้ง
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const STATE_DIR = path.join(ROOT, ".claude", ".issue-creation-guard-state");
const STATE_FILE = path.join(STATE_DIR, "armed.json");
const ATTEMPT_FILE = path.join(STATE_DIR, "blocked-attempt.json");
const TTL_MS = 10 * 60 * 1000;

/**
 * คำสั่ง shell ที่ "สร้าง" issue/bug ได้จริง — ไม่ใช่แค่พูดถึง
 * เจตนา: จับการสร้าง ไม่ใช่การอ่าน (`gh issue list` / `GET .../issue/KEY` ต้องผ่าน)
 */
const BASH_PATTERNS = [
  // gh issue create / gh api -X POST .../issues
  { re: /\bgh\s+issue\s+create\b/, why: "gh issue create" },
  { re: /\bgh\s+api\b[^\n]*\b(POST)\b[^\n]*\/issues\b/i, why: "gh api POST /issues" },
  // jira CLI
  { re: /\bjira\s+issue\s+create\b/, why: "jira issue create" },
  // curl POST ไป Jira REST create-issue (ทั้ง /issue และ /issue/bulk)
  {
    re: /\/rest\/api\/\d\/issue(\/bulk)?(?=["'\s?&]|$)/,
    needsPost: true,
    why: "curl POST /rest/api/N/issue",
  },
];

/** prompt ของ subagent ที่สั่งให้ "เปิด/สร้าง" bug · issue · ticket · improvement */
const AGENT_VERB = /(เปิด|สร้าง|ยื่น|แจ้ง|ลง|open|create|file|raise|submit)/i;
const AGENT_OBJECT = /(บั๊ก|บัค|ticket|issue|bug|defect|improvement)/i;

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

function clearState() {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    /* ไม่มีอยู่แล้วก็คือสิ่งที่ต้องการ */
  }
}

function isFresh(state, now = Date.now()) {
  if (!state || typeof state.armedAt !== "number") return false;
  if (state.consumed === true) return false;
  return now - state.armedAt >= 0 && now - state.armedAt <= TTL_MS;
}

function recordAttempt(channel, why) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(
      ATTEMPT_FILE,
      JSON.stringify({ at: Date.now(), channel, why }, null, 2) + "\n"
    );
  } catch {
    /* บันทึกไม่ได้ก็ไม่เปลี่ยนคำตัดสินของ gate */
  }
}

function readAttempt() {
  try {
    return JSON.parse(fs.readFileSync(ATTEMPT_FILE, "utf8"));
  } catch {
    return null;
  }
}

function clearAttempt() {
  try {
    fs.unlinkSync(ATTEMPT_FILE);
  } catch {
    /* ว่างอยู่แล้ว */
  }
}

/**
 * @returns {{hit:boolean, why?:string}} คำสั่ง bash นี้สร้าง issue ไหม
 */
function inspectBash(command) {
  if (typeof command !== "string" || command.length === 0) return { hit: false };
  const hasPost = /-X\s*['"]?POST|--request\s*['"]?POST|--data|-d\s|-F\s/i.test(command);
  for (const p of BASH_PATTERNS) {
    if (!p.re.test(command)) continue;
    if (p.needsPost && !hasPost) continue;
    return { hit: true, why: p.why };
  }
  return { hit: false };
}

/**
 * @returns {{hit:boolean, why?:string}} prompt ของ agent นี้สั่งเปิดบั๊กไหม
 */
function inspectAgentPrompt(text) {
  if (typeof text !== "string" || text.length === 0) return { hit: false };
  // ดูทีละบรรทัด เพื่อไม่ให้ "อย่าเปิดบั๊ก" ที่อยู่คนละย่อหน้ากับคำกริยาอื่นถูกนับ
  for (const raw of text.split(/\n+/)) {
    const line = raw.trim();
    if (!AGENT_OBJECT.test(line)) continue;
    if (!AGENT_VERB.test(line)) continue;
    // บรรทัดที่เป็น "ข้อห้าม" ไม่ใช่คำสั่งให้เปิด
    if (/(ห้าม|อย่า|ไม่ต้อง|never|do not|don't|must not|without)/i.test(line)) continue;
    return { hit: true, why: line.slice(0, 120) };
  }
  return { hit: false };
}

function blockMessage(channel, why) {
  return [
    "=== 🔴 issue-creation-guard: บล็อกไว้ก่อนครับ ===",
    "",
    `ช่องทาง: ${channel}`,
    `สิ่งที่ตรวจพบ: ${why}`,
    "",
    "CLAUDE.md หัวข้อ 7: ห้ามเปิดบั๊ก/issue เองโดยอัตโนมัติ ถ้าเจ้าของงานไม่ได้สั่งก่อน เด็ดขาด",
    "ให้รายงานในแชทพร้อมหลักฐาน แล้วถามว่าจะให้เปิดไหม",
    "",
    "ได้คำยืนยันสดจากเจ้าของงานแล้ว ค่อยปลดล็อกด้วย:",
    '  node tools/issue-creation-guard/check.js --confirm "<คำพูดที่เจ้าของงานอนุญาต>"',
    `  (ใช้ได้ครั้งเดียว · หมดอายุใน ${TTL_MS / 60000} นาที)`,
  ].join("\n");
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return null;
  }
}

function cmdGate() {
  const raw = readStdin();
  if (raw === null) {
    console.error("=== 🔴 issue-creation-guard: อ่าน stdin ไม่ได้ — ตรวจไม่ได้ จึงปฏิเสธ ===");
    return 2;
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error("=== 🔴 issue-creation-guard: payload ไม่ใช่ JSON — ตรวจไม่ได้ จึงปฏิเสธ ===");
    return 2;
  }

  const toolName = payload && payload.tool_name;
  const input = (payload && payload.tool_input) || {};

  let channel = null;
  let found = { hit: false };

  if (toolName === "Bash") {
    channel = "Bash";
    found = inspectBash(input.command);
  } else if (toolName === "Task" || toolName === "Agent") {
    channel = "Agent";
    found = inspectAgentPrompt(input.prompt);
  } else {
    return 0; // ไม่ใช่ช่องทางที่การ์ดนี้ดูแล
  }

  if (!found.hit) return 0;

  const state = readState();
  if (isFresh(state)) {
    writeState({ ...state, consumed: true });
    clearAttempt();
    console.error(
      `=== ✅ issue-creation-guard: มีคำยืนยันจากเจ้าของงาน (${state.reason}) — ปล่อยผ่านครั้งนี้ ===`
    );
    return 0;
  }

  recordAttempt(channel, found.why);
  console.error(blockMessage(channel, found.why));
  return 2;
}

/** L6 — Stop hook: เทิร์นที่มีความพยายามที่ถูกบล็อก ต้องไม่จบเงียบ */
function cmdStopAudit() {
  const attempt = readAttempt();
  if (!attempt) return 0;
  clearAttempt();
  console.error(
    [
      "=== 🔴 issue-creation-guard: เทิร์นนี้มีความพยายามเปิด issue ที่ถูกบล็อก ===",
      `ช่องทาง: ${attempt.channel} · ตรวจพบ: ${attempt.why}`,
      "",
      "ห้ามจบเทิร์นโดยไม่บอกเจ้าของงานครับ — ต้องรายงานในแชทว่าเจออะไร แนบหลักฐาน",
      "แล้วถามว่าจะให้เปิด issue ไหม ก่อนจะทำอย่างอื่นต่อ",
    ].join("\n")
  );
  return 2;
}

function cmdConfirm(reason) {
  if (!reason || !reason.trim()) {
    console.error('ต้องใส่เหตุผลครับ: --confirm "<คำพูดที่เจ้าของงานอนุญาต>"');
    return 1;
  }
  writeState({ armedAt: Date.now(), reason: reason.trim(), consumed: false });
  console.log(
    `ปลดล็อกให้แล้วครับ (ใช้ได้ครั้งเดียว หมดอายุใน ${TTL_MS / 60000} นาที) — เหตุผล: ${reason.trim()}`
  );
  return 0;
}

function cmdStatus() {
  const state = readState();
  if (!state) {
    console.log("ยังไม่มีคำยืนยัน — การ์ดบล็อกการสร้าง issue ทุกช่องทางที่ดูแลอยู่");
    return 0;
  }
  const age = Math.round((Date.now() - state.armedAt) / 1000);
  console.log(
    `คำยืนยัน: ${state.reason} · อายุ ${age} วินาที · consumed=${state.consumed} · fresh=${isFresh(state)}`
  );
  return 0;
}

function main(argv) {
  const mode = argv[2];
  switch (mode) {
    case "--gate":
      return cmdGate();
    case "--stop-audit":
      return cmdStopAudit();
    case "--confirm":
      return cmdConfirm(argv[3]);
    case "--status":
      return cmdStatus();
    case "--clear":
      clearState();
      clearAttempt();
      console.log("ล้างสถานะแล้วครับ");
      return 0;
    default:
      console.error(
        "ใช้: check.js --gate | --stop-audit | --confirm \"<เหตุผล>\" | --status | --clear"
      );
      return 1;
  }
}

if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = {
  BASH_PATTERNS,
  TTL_MS,
  STATE_FILE,
  STATE_DIR,
  ATTEMPT_FILE,
  inspectBash,
  inspectAgentPrompt,
  isFresh,
  readState,
  writeState,
  clearState,
  readAttempt,
  recordAttempt,
  clearAttempt,
};
