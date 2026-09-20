#!/usr/bin/env node
"use strict";

/**
 * known-answer suite สำหรับ issue-creation-guard
 * กฎจาก CLAUDE.md §1 / report #0002: ทุกชุดเทสต์ต้องมี "ต้องจับได้" อย่างน้อย 1
 * และ "ต้องไม่จับ" อย่างน้อย 1 · และต้องแตะของจริงบนดิสก์อย่างน้อย 1 ข้อ
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const G = require("./check.js");
const CHECK = path.join(__dirname, "check.js");

let pass = 0;
const fails = [];
function t(name, fn) {
  try {
    fn();
    pass++;
  } catch (e) {
    fails.push(`${name}: ${e.message}`);
  }
}

// ---------- L4 Bash: ต้องจับได้ ----------
const MUST_CATCH_BASH = [
  'gh issue create --title "[Bug] x" --body-file b.md',
  "gh api -X POST repos/o/r/issues -f title=x",
  "jira issue create --project OLS",
  `command curl --cacert ca.pem -X POST "https://x/rest/api/3/issue" -d @payload.json`,
  `command curl -X POST https://x/rest/api/2/issue/bulk --data @p.json`,
];
MUST_CATCH_BASH.forEach((cmd, i) =>
  t(`bash must-catch #${i + 1}`, () =>
    assert.strictEqual(G.inspectBash(cmd).hit, true, cmd)
  )
);

// ---------- L4 Bash: ต้องไม่จับ (อ่านอย่างเดียว / ไม่เกี่ยว) ----------
const MUST_PASS_BASH = [
  "gh issue list --state open",
  "gh issue view 42",
  `command curl --cacert ca.pem "https://x/rest/api/3/issue/OLS-599"`,
  "git status",
  `command curl -X POST "https://x/rest/api/3/issue/OLS-599/comment" -d @c.json`,
];
MUST_PASS_BASH.forEach((cmd, i) =>
  t(`bash must-pass #${i + 1}`, () =>
    assert.strictEqual(G.inspectBash(cmd).hit, false, cmd)
  )
);

// ---------- L5 Agent prompt ----------
t("agent must-catch: สั่งเปิดบั๊ก", () =>
  assert.strictEqual(
    G.inspectAgentPrompt("ตรวจเคสนี้แล้วเปิดบั๊กใน Jira ให้ด้วย").hit,
    true
  )
);
t("agent must-catch: create a GitHub issue", () =>
  assert.strictEqual(
    G.inspectAgentPrompt("Then create a GitHub issue for the defect.").hit,
    true
  )
);
t("agent must-pass: บรรทัดห้าม", () =>
  assert.strictEqual(
    G.inspectAgentPrompt("ห้ามเปิดบั๊กเองเด็ดขาด รายงานในแชทพอ").hit,
    false
  )
);
t("agent must-pass: Do not open any issue", () =>
  assert.strictEqual(
    G.inspectAgentPrompt("Do not open any issue without an order.").hit,
    false
  )
);
t("agent must-pass: งานอัดคลิปปกติ", () =>
  assert.strictEqual(
    G.inspectAgentPrompt("อัดคลิป Profile_TC_009 แล้ว verify ด้วย verify_video.py").hit,
    false
  )
);

// ---------- อายุของ confirm ----------
t("isFresh: consumed แล้วใช้ไม่ได้", () =>
  assert.strictEqual(G.isFresh({ armedAt: Date.now(), consumed: true }), false)
);
t("isFresh: หมดอายุแล้วใช้ไม่ได้", () =>
  assert.strictEqual(
    G.isFresh({ armedAt: Date.now() - G.TTL_MS - 1000, consumed: false }),
    false
  )
);
t("isFresh: สดและยังไม่ใช้ = ผ่าน", () =>
  assert.strictEqual(G.isFresh({ armedAt: Date.now(), consumed: false }), true)
);

// ---------- แตะของจริงบนดิสก์: รัน check.js --gate เป็นโปรเซสจริง ----------
function gate(payload) {
  try {
    const out = execFileSync("node", [CHECK, "--gate"], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stderr || "") + (e.stdout || "") };
  }
}

const hadState = fs.existsSync(G.STATE_FILE);
assert.strictEqual(hadState, false, "เทสต์นี้ต้องเริ่มจากสถานะที่ยังไม่มี confirm");

t("disk: gate บล็อก gh issue create (exit 2)", () => {
  const r = gate({ tool_name: "Bash", tool_input: { command: "gh issue create -t x" } });
  assert.strictEqual(r.code, 2);
  assert.ok(/issue-creation-guard/.test(r.out), "ต้องมีข้อความบล็อก");
});

t("disk: gate ปล่อย git status (exit 0)", () => {
  const r = gate({ tool_name: "Bash", tool_input: { command: "git status" } });
  assert.strictEqual(r.code, 0);
});

t("disk: stdin ที่ไม่ใช่ JSON = ตรวจไม่ได้ จึงปฏิเสธ", () => {
  let code;
  try {
    execFileSync("node", [CHECK, "--gate"], { input: "not json", stdio: ["pipe", "pipe", "pipe"] });
    code = 0;
  } catch (e) {
    code = e.status;
  }
  assert.strictEqual(code, 2);
});

t("disk: บันทึกความพยายามที่ถูกบล็อกไว้จริง", () => {
  gate({ tool_name: "Bash", tool_input: { command: "gh issue create -t x" } });
  const a = G.readAttempt();
  assert.ok(a && a.channel === "Bash", "ต้องมีไฟล์ blocked-attempt");
});

t("disk: --stop-audit ปฏิเสธการจบเทิร์นแล้วล้างธง", () => {
  let code;
  try {
    execFileSync("node", [CHECK, "--stop-audit"], { stdio: ["pipe", "pipe", "pipe"] });
    code = 0;
  } catch (e) {
    code = e.status;
  }
  assert.strictEqual(code, 2);
  assert.strictEqual(G.readAttempt(), null, "ต้องล้างธงหลังรายงาน");
});

t("disk: confirm แล้วผ่านได้ครั้งเดียว", () => {
  execFileSync("node", [CHECK, "--confirm", "เจ้าของงานสั่งเปิด ticket นี้"], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const first = gate({ tool_name: "Bash", tool_input: { command: "gh issue create -t x" } });
  assert.strictEqual(first.code, 0, "ครั้งแรกต้องผ่าน");
  const second = gate({ tool_name: "Bash", tool_input: { command: "gh issue create -t y" } });
  assert.strictEqual(second.code, 2, "ครั้งที่สองต้องถูกบล็อก");
});

// คืนสภาพ: ห้ามทิ้ง confirm ค้างไว้
G.clearState();
G.clearAttempt();
assert.strictEqual(fs.existsSync(G.STATE_FILE), false, "ต้องไม่เหลือ state ค้าง");

if (fails.length) {
  console.error(`issue-creation-guard: ${pass} ผ่าน, ${fails.length} ไม่ผ่าน`);
  fails.forEach((f) => console.error("  ✗ " + f));
  process.exit(1);
}
console.log(`issue-creation-guard: ผ่านครบ ${pass} ข้อ (must-catch ${MUST_CATCH_BASH.length + 2} · must-pass ${MUST_PASS_BASH.length + 3} · แตะดิสก์จริง 6)`);
