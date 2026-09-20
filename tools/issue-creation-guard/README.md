# issue-creation-guard

ชั้นบังคับของกฎ "ห้ามเปิดบั๊ก/issue เองโดยอัตโนมัติ ถ้าเจ้าของงานไม่ได้สั่งก่อน" (`CLAUDE.md` §7 บรรทัดแรก)

## แนวป้องกัน 7 ชั้น

| # | ชั้น | อยู่ที่ไหน |
|---|------|-----------|
| 1 | กฎในเรโป | `CLAUDE.md` §7 บรรทัดแรก (commit `b8943e1`) |
| 2 | memory ถาวรของเซสชัน | `feedback_never-open-bug-without-explicit-order.md` + แถวใน `MEMORY.md` |
| 3 | ปิดทาง MCP | `tools/jira-ticket-guard/check.js` (`createJiraIssue`) |
| 4 | ปิดทาง Bash | ไฟล์นี้ `--gate` + hook `PreToolUse:Bash` |
| 5 | ปิดทาง subagent | ไฟล์นี้ `--gate` + hook `PreToolUse:Agent`/`Task` |
| 6 | ห้ามจบเทิร์นเงียบ | ไฟล์นี้ `--stop-audit` + hook `Stop` |
| 7 | เทสต์ known-answer | `issue_creation_guard.test.js` (อยู่ในชุดของ `scripts/run-test-suites.sh`) |

ชั้น 3 กับ 4/5/6 ใช้ state คนละโฟลเดอร์กันโดยตั้งใจ — ชั้นที่พึ่งข้อสมมติเดียวกันนับเป็นชั้นเดียว (#0002/#0010)

## รหัสจบ

`0` ปล่อยผ่าน · `2` บล็อก · อื่นๆ = ตัดสินไม่ได้ (wrapper ปล่อยผ่านพร้อมเสียงดัง)
อ่าน stdin ไม่ได้ / ไม่ใช่ JSON = ตรวจไม่ได้ → ปฏิเสธ (#0005)

## ได้คำสั่งสดจากเจ้าของงานแล้ว

```bash
node tools/issue-creation-guard/check.js --confirm "<คำพูดที่เจ้าของงานอนุญาต>"
```

ใช้ได้ครั้งเดียว หมดอายุใน 10 นาที · ดูสถานะ `--status` · ล้าง `--clear`
