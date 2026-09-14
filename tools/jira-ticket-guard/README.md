# jira-ticket-guard

บล็อกการเรียก `createJiraIssue` (ทุก Atlassian MCP connector) เว้นแต่จะยืนยันสดในเทิร์นนั้นก่อน
สร้างขึ้นจาก [post-mortem #0054](../../docs/post-mortem/20260914-post-mortem-report-0054-filed-two-jira-tickets-without-explicit-go-ahead.md) —
เปิด Jira ticket ใหม่เองระหว่างค้นคว้า โดยตีความกฎ "ค้นคว้าให้ครบก่อนบอกว่าติด" ขยายไปครอบสิทธิ์สร้าง
ticket ด้วย

## กลไก

| ขั้น | ทำอะไร |
|:--:|---|
| 1 | agent แสดงร่าง ticket ในแชท ถามเจ้าของงาน ได้คำตอบยืนยันชัดเจน |
| 2 | รัน `node check.js --confirm "<คำพูดที่เจ้าของงานอนุญาต>"` — เขียน state ไฟล์เดียว หมดอายุใน 10 นาที |
| 3 | เรียก `createJiraIssue` — PreToolUse hook (`.claude/hooks/jira-ticket-guard.sh`) ดัก แล้วส่งให้ `check.js --gate` ตัดสิน |
| 4 | ยืนยันสด+ยังไม่หมดอายุ+ยังไม่เคยใช้ = ผ่าน (rc 0) แล้ว **เผาทิ้งทันที** — ยืนยันเดิมใช้ซ้ำครั้งที่ 2 ไม่ได้ |
| — | ไม่มียืนยัน/หมดอายุ/ใช้ไปแล้ว = บล็อก (rc 2) พร้อมบอกเหตุผลตรงตามจริง |

State เป็นไฟล์เดียวระดับ repo (`.claude/.jira-ticket-guard-state/armed.json`) ไม่ผูกกับ session id
เพราะ Claude Code ไม่ส่ง session id ที่เสถียรให้คำสั่ง Bash ทั่วไปนอก hook — ผูกกับ session ที่เดาไม่ได้
เสี่ยงกว่าใช้ marker กลางที่ยืนยัน-แล้ว-สร้างต้องทำติดกันในเทิร์นเดียวอยู่แล้ว

## ทำไม pattern ของ tool ถึงเป็น `mcp__.+__createJiraIssue` ไม่ผูก id

server id ของ connector (`a0daa148-...`, `af7c11f4-...`) เป็น UUID ต่อการเชื่อมต่อ ไม่เสถียรข้าม
session — ผูก id ตายตัวจะหยุดจับเงียบๆ ทันทีที่ connector reconnect ใหม่ ตั้งใจไม่จำกัด character
class ของ id ด้วยเหตุผลเดียวกัน (เทสต์ `does NOT match ...` ยืนยันว่ายังไม่ไปจับ `getJiraIssue` /
`addCommentToJiraIssue` / `editJiraIssue` ผิด — เขียน Jira ที่ไม่ใช่การ "สร้างใหม่" ยังทำได้ปกติ)

## ขอบเขตที่ตั้งใจให้แคบ

ครอบเฉพาะ **การสร้าง** ticket ใหม่ ไม่ครอบการแก้ไข/คอมเมนต์/เปลี่ยนสถานะของ ticket ที่มีอยู่แล้ว —
กฎเรื่อง "เขียน Jira ต้องผ่าน API token ของเจ้าของงาน ห้ามผ่าน MCP" (`CLAUDE.md`) เป็นคนละชั้น คนละ
เหตุผล (attribution ใน changelog) ไม่ใช่เรื่องเดียวกับที่การ์ดนี้ป้องกัน

## ไม่มีสวิตช์ปิด

ไม่มี `--force` / `SKIP_JIRA` / env ข้ามการ์ด — ทางเดียวคือ `--confirm "เหตุผล"` ซึ่งบันทึกเหตุผลไว้ใน
state file และ printed ออกมาให้เห็นทุกครั้ง (เทสต์ `the guard has no override flag` ผูกไว้)

## ข้อจำกัดที่ต้องรู้

**hook โหลดตอน session เริ่มเท่านั้น** — เซสชันที่เปิดค้างอยู่ก่อนไฟล์นี้ถูกสร้าง จะยังไม่มีการ์ดนี้
จนกว่าจะปิดแล้วเปิดใหม่ (ข้อจำกัดของ Claude Code เอง ไม่ใช่ของไฟล์นี้)

การ์ดนี้ครอบเฉพาะ Jira (`createJiraIssue`) ตามขอบเขตของเหตุการณ์ที่ทำให้เกิดรายงาน #0054 — ยังไม่ครอบ
GitHub issue/PR หรือระบบภายนอกอื่น ถ้าจะขยายให้ครอบ ต้องเป็นคำสั่งแยกจากเจ้าของงาน (ตรงกับบทเรียนของ
รายงานเดียวกันนี้เอง — ห้ามขยายขอบเขตเอง)

## คำสั่ง

```bash
node tools/jira-ticket-guard/check.js --status                 # ดูว่ามีการยืนยันค้างอยู่ไหม
node tools/jira-ticket-guard/check.js --confirm "เหตุผล"        # ยืนยัน 1 ครั้ง
node tools/jira-ticket-guard/jira_ticket_guard.test.js          # ต้องเขียวก่อน commit
```
