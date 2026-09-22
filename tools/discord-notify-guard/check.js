#!/usr/bin/env node
"use strict";

/**
 * discord-notify-guard — the outer ring around the smoke notify guard (notify_guard.py in the
 * off-repo bot, which holds layers L1–L7). Owner orders 2026-09-21: "สร้างแนวป้องกัน 7 ชั้น
 * ห้ามส่งโนติผิดฟอแมต" + "ต้องให้เราอนุมัติก่อนเสมอ".
 *
 * notify_guard can only stop code that goes through it (L1–L10). This file stops an agent
 * from going around it, and it is the only writer of the owner-approval ledger:
 *
 *   --gate    PreToolUse (Bash · Write · Edit · MultiEdit · NotebookEdit · Desktop Commander)
 *             blocks: a Discord API write with bot auth (curl/fetch/requests) · any read of the
 *             bot token file · inline code that drives smoke_watch/notify_guard's senders ·
 *             any write to the approval ledger or to a notify draft
 *             allows:  webhook posts (other workflows), Discord GETs, and running
 *                      `notify_guard.py <round> --approve <code>` as a file — that path
 *                      re-checks every layer and the owner's approval itself
 *   --record  UserPromptSubmit: when the OWNER's own prompt says `อนุมัติ <code>` or
 *             `approve <code>`, append that code to the ledger. The prompt text reaches this hook
 *             from the harness, so an agent cannot forge it — that is what makes it approval.
 *
 * Exit contract (same as the other guards here): 0 = allow · 2 = block · anything else = could
 * not decide (the wrapper lets it through, loudly). Unreadable stdin on --gate = block
 * (report #0005: "cannot verify" must lead to "no"). --record never blocks a prompt.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const LEDGER =
  process.env.DISCORD_NOTIFY_APPROVALS ||
  path.join(os.homedir(), "ols-qa-testing-bot", "smoke", "state", "approvals.jsonl");

// host and path can arrive apart (node https.request({hostname, path})), so either form counts
const DISCORD_API = /\bdiscord(?:app)?\.com\/api\b|\bdiscord(?:app)?\.com\b[\s\S]*\/api\/(?:v\d+\/)?channels\//i;
const WEBHOOK = /\bdiscord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\//i;
const WRITE_VERB = /(-X\s*|--request\s+|method\s*[:=]\s*["']?)(POST|PATCH|PUT|DELETE)\b|\s(-d|--data(?:-\w+)?|-F|--form)\s|\.(post|patch|put|delete)\(/i;
const BOT_AUTH = /Authorization["']?\s*[:=,]?\s*["']?\s*Bot\b|["']Bot\s+["']?\s*\+|f["']Bot \{/i;
const TOKEN_FILE = /\.discord_bot_token\b/;
const SENDER_MODULE = /\b(smoke_watch|notify_guard|passed_report)\b/;
const SENDER_CALL =
  /(\.post\(|\.edit\(|\.dm\(|_req\(\s*["'](POST|PATCH|PUT|DELETE)|\.send\(|send_start\(|send_approved_pending\(|write_draft\(|build_draft\(|_guard\s*=\s*True|\._token\(|APPROVALS\s*=)/;
const INLINE_CODE = /\b(python3?|node|ruby|perl)\b[^\n|;&]*\s(-c|-e|--eval)\s|<<\s*['"]?[A-Z_]+|\bpython3?\s*-\s*$|\bpython3?\s+-\s/m;
const LEDGER_NAME = /approvals\.jsonl\b/;
const DRAFT_NAME = /notify-draft\.json\b/;
const MUTATE = /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\brm\b|\bsed\s+-i|\btruncate\b|\btouch\b|\bln\b|open\([^)]*["'][wa]|write_text|write\(|\bdd\b)/;

function inspectBash(cmd) {
  const c = String(cmd || "");
  if (TOKEN_FILE.test(c)) return { hit: true, why: "reads the smoke bot token directly" };
  if (DISCORD_API.test(c) && !WEBHOOK.test(c) && WRITE_VERB.test(c) && BOT_AUTH.test(c))
    return { hit: true, why: "writes to the Discord API with bot auth, bypassing notify_guard" };
  if (SENDER_MODULE.test(c) && INLINE_CODE.test(c) && SENDER_CALL.test(c))
    return { hit: true, why: "inline code drives the smoke senders instead of running notify_guard.py" };
  if ((LEDGER_NAME.test(c) || DRAFT_NAME.test(c)) && MUTATE.test(c))
    return { hit: true, why: "writes the approval ledger or a notify draft — only the owner's prompt may approve" };
  return { hit: false };
}

function inspectPath(p) {
  const s = String(p || "");
  if (LEDGER_NAME.test(s)) return { hit: true, why: "the approval ledger is written only by the owner's prompt hook" };
  if (DRAFT_NAME.test(s)) return { hit: true, why: "notify drafts are built by passed_report.py, never edited by hand" };
  if (TOKEN_FILE.test(s)) return { hit: true, why: "the smoke bot token is not for direct use" };
  return { hit: false };
}

function decide(input) {
  const name = String(input.tool_name || "");
  const ti = input.tool_input || {};
  const commands = [ti.command, ti.cmd, ti.script].filter((x) => typeof x === "string");
  const paths = [ti.file_path, ti.path, ti.notebook_path, ti.source, ti.destination].filter((x) => typeof x === "string");
  for (const c of commands) {
    const r = inspectBash(c);
    if (r.hit) return { block: true, why: r.why, tool: name };
  }
  for (const p of paths) {
    const r = inspectPath(p);
    if (r.hit) return { block: true, why: r.why, tool: name };
  }
  return { block: false };
}

function gate(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    console.log("[discord-notify-guard] อ่าน input ของ hook ไม่ได้ — ตัดสินไม่ได้ จึงบล็อกไว้ก่อน");
    return 2;
  }
  const d = decide(input);
  if (!d.block) return 0;
  console.log(
    `[discord-notify-guard] บล็อก ${d.tool}: ${d.why}\n` +
      "โนติ smoke เข้าช่อง QA release ต้องผ่าน notify_guard 10 ชั้น + ได้รับอนุมัติจากเจ้าของงานก่อนทุกครั้ง\n" +
      "ทางที่ถูก: python3 smoke/passed_report.py <round> --version <tag>  → แสดงร่างและรหัสให้เจ้าของงาน\n" +
      "  → เจ้าของงานพิมพ์ `อนุมัติ <รหัส>` เอง → python3 smoke/notify_guard.py <round> --approve <รหัส>"
  );
  return 2;
}

const APPROVE = /(?:อนุมัติ|approve)\s+([0-9a-f]{8})\b/gi;

function record(raw, now = new Date()) {
  let prompt = "";
  try {
    prompt = String(JSON.parse(raw).prompt || "");
  } catch {
    return 0;
  }
  const codes = [...new Set([...prompt.matchAll(APPROVE)].map((m) => m[1].toLowerCase()))];
  if (!codes.length) return 0;
  try {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    for (const code of codes)
      fs.appendFileSync(LEDGER, JSON.stringify({ code, at: now.toISOString(), source: "owner-prompt" }) + "\n");
    console.log(`[discord-notify-guard] บันทึกการอนุมัติของเจ้าของงานแล้ว: ${codes.join(", ")} (ใช้ได้ 24 ชม. ครั้งเดียว)`);
  } catch (e) {
    console.log(`[discord-notify-guard] ⚠️ บันทึกการอนุมัติไม่สำเร็จ (${e.message}) — ยังส่งโนติไม่ได้จนกว่าจะบันทึกได้`);
  }
  return 0;
}

function main(argv) {
  const mode = argv[2];
  const raw = fs.readFileSync(0, "utf8");
  if (mode === "--gate") return gate(raw);
  if (mode === "--record") return record(raw);
  console.log("usage: check.js --gate | --record  (stdin = hook JSON)");
  return 3;
}

module.exports = { inspectBash, inspectPath, decide, gate, record, LEDGER };

if (require.main === module) {
  process.exit(main(process.argv));
}
