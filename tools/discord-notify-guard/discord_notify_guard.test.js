#!/usr/bin/env node
"use strict";

/**
 * known-answer suite for discord-notify-guard (CLAUDE.md §1 / report #0002: must-catch ≥ 1,
 * must-pass ≥ 1, and at least one case that touches the real disk).
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "dng-"));
process.env.DISCORD_NOTIFY_APPROVALS = path.join(TMP, "state", "approvals.jsonl");
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

const MUST_CATCH_BASH = [
  `command curl -X POST -H "Authorization: Bot $(cat ~/ols-qa-testing-bot/.discord_bot_token)" https://discord.com/api/v10/channels/123/messages -d '{"content":"x"}'`,
  `command curl -H "Authorization: Bot $TOK" -F payload_json='{}' -F files[0]=@a.pdf https://discord.com/api/v10/channels/1/messages`,
  `curl --request PATCH -H 'Authorization: Bot abc' https://discordapp.com/api/channels/1/messages/2 --data '{}'`,
  `TOK=$(head -1 ~/ols-qa-testing-bot/.discord_bot_token)`,
  `cd ~/ols-qa-testing-bot/smoke && python3 -c "import smoke_watch as sw; sw.post(sw._ids()[0], 'hi', _guard=True)"`,
  `python3 -c "import notify_guard as ng; ng.send(p, 'abcd1234')"`,
  `python3 -c "import smoke_watch as sw; sw._req('POST', '/channels/1/messages', {'content': 'x'})"`,
  `python3 - <<'EOF'\nimport smoke_watch as sw\nsw.edit('1','2','x')\nEOF`,
  `echo '{"code":"abcd1234","at":"2026-09-21T10:00:00Z"}' >> ~/ols-qa-testing-bot/smoke/state/approvals.jsonl`,
  `python3 -c "open('/x/smoke/state/approvals.jsonl','a').write('{}')"`,
  `sed -i '' 's/"code": ".*"/"code": "00000000"/' out/dev-smoke-x/notify-draft.json`,
  `node -e "require('https').request({hostname:'discord.com',path:'/api/v10/channels/1/messages',method:'POST',headers:{Authorization:'Bot '+t}})"`,
];
MUST_CATCH_BASH.forEach((cmd, i) =>
  t(`bash must-catch #${i + 1}`, () => assert.strictEqual(G.inspectBash(cmd).hit, true, cmd))
);

const MUST_PASS_BASH = [
  "python3 smoke/passed_report.py out/dev-smoke-2026-09-21-1550 --version v2026.09.21.1",
  "python3 smoke/notify_guard.py out/dev-smoke-2026-09-21-1550 --approve abcd1234",
  "python3 smoke/test_notify_guard.py",
  `python3 -c "import smoke_watch as sw; print(sw._req('GET', '/channels/1/messages/2')['content'])"`,
  // check-no-secrets.sh rejects the literal webhook-URL shape anywhere in this public repo, so the
  // fixture is assembled here from placeholders — it never carries a real id or token.
  `command curl -s -X POST -H 'Content-Type: application/json' https://discord.com/api/` +
    `webhooks/<WEBHOOK_ID>/<WEBHOOK_TOKEN> -d '{"content":"TC review done"}'`,
  "python3 ~/ols-qa-testing-bot/discord_qa_notify.py --dry-run --registry r.json",
  "tail -5 ~/ols-qa-testing-bot/smoke/state/approvals.jsonl",
  "cat out/dev-smoke-2026-09-21-1550/notify-draft.json",
  "git status --short",
];
MUST_PASS_BASH.forEach((cmd, i) =>
  t(`bash must-pass #${i + 1}`, () => assert.strictEqual(G.inspectBash(cmd).hit, false, cmd))
);

t("Write to the ledger is blocked", () =>
  assert.strictEqual(G.decide({ tool_name: "Write", tool_input: { file_path: "/h/ols-qa-testing-bot/smoke/state/approvals.jsonl" } }).block, true));
t("Edit of a draft is blocked", () =>
  assert.strictEqual(G.decide({ tool_name: "Edit", tool_input: { file_path: "/h/out/r/notify-draft.json" } }).block, true));
t("Desktop Commander start_process is inspected like Bash", () =>
  assert.strictEqual(G.decide({ tool_name: "mcp__Desktop_Commander__start_process", tool_input: { command: "cat ~/ols-qa-testing-bot/.discord_bot_token" } }).block, true));
t("an ordinary Write passes", () =>
  assert.strictEqual(G.decide({ tool_name: "Write", tool_input: { file_path: "/h/ols-qa-testing-bot/smoke/notify_guard.py" } }).block, false));

function run(mode, stdin) {
  try {
    const out = execFileSync("node", [CHECK, mode], { input: stdin, env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    return { code: 0, out: out.toString() };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || "") };
  }
}

t("disk: --gate blocks a direct bot post (exit 2)", () =>
  assert.strictEqual(run("--gate", JSON.stringify({ tool_name: "Bash", tool_input: { command: MUST_CATCH_BASH[0] } })).code, 2));
t("disk: --gate allows the sanctioned sender (exit 0)", () =>
  assert.strictEqual(run("--gate", JSON.stringify({ tool_name: "Bash", tool_input: { command: MUST_PASS_BASH[1] } })).code, 0));
t("disk: --gate blocks unreadable input (report #0005)", () => assert.strictEqual(run("--gate", "{not json").code, 2));

t("disk: --record writes the owner's approval to the ledger", () => {
  const r = run("--record", JSON.stringify({ prompt: "โอเค อนุมัติ 1a2b3c4d ส่งได้เลย" }));
  assert.strictEqual(r.code, 0);
  const rows = fs.readFileSync(G.LEDGER, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].code, "1a2b3c4d");
  assert.ok(!Number.isNaN(Date.parse(rows[0].at)), "timestamp must parse");
});
t("disk: --record ignores prompts without an approval", () => {
  run("--record", JSON.stringify({ prompt: "ส่งเลย" }));
  run("--record", JSON.stringify({ prompt: "approve it" }));
  assert.strictEqual(fs.readFileSync(G.LEDGER, "utf8").trim().split("\n").length, 1);
});
t("disk: --record never blocks a prompt, even on garbage", () => assert.strictEqual(run("--record", "garbage").code, 0));

fs.rmSync(TMP, { recursive: true, force: true });
assert.strictEqual(fs.existsSync(TMP), false, "temp ledger must not be left behind");

if (fails.length) {
  console.error(`discord-notify-guard: ${pass} ผ่าน, ${fails.length} ไม่ผ่าน`);
  fails.forEach((f) => console.error("  ✗ " + f));
  process.exit(1);
}
console.log(
  `discord-notify-guard: ผ่านครบ ${pass} ข้อ (must-catch ${MUST_CATCH_BASH.length + 3} · must-pass ${MUST_PASS_BASH.length + 1} · แตะดิสก์จริง 6)`
);
