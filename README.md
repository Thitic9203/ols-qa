# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at <ORG>.

Helix skills embedded directly — no separate install needed.

**OLS Workspace version: v1.7.0** (17 Jun 2026) — based on helix v1.5.31

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend TC (Thai) from a story — outputs Jira comment + สูงสุด 5 CSV attachments (Draft_Jira, Import_Qase, Unit_Test, Integration_Test, System_Test) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, add evidence, comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |

## OLS links

- **Jira board:** https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID>
- **Figma:** https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file
- **Qase:** https://app.qase.io/project/OLS

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## Changelog

### v1.7.0 — TC FE Prep: Typed CSVs + Fast Publish + Import_Qase Sort (17 Jun 2026)

OLS-local customizations on top of helix v1.5.31.

- **ไฟล์ CSV แยกตามประเภทเทสเคส** — สร้างไฟล์แยกสำหรับ Unit Test, Integration Test, และ System Test ให้อัตโนมัติ พร้อมแนบลง Jira ทุกไฟล์
- **เนื้อหาในไฟล์ CSV ครบทุกช่อง** — ข้อมูลทุกคอลัมน์กรอกให้ถูกรูปแบบของแต่ละประเภทแล้ว; เหลือเฉพาะช่องผลการทดสอบที่ QA กรอกเองหลังทดสอบจริง
- **ไฟล์นำเข้า Qase เรียงตามประเภท** — Unit Test มาก่อน ตามด้วย Integration Test และ System Test; ภายในแต่ละกลุ่มเรียง AC ก่อน EC; หมายเลข TC รันต่อเนื่องตลอดไฟล์
- **แนบไฟล์และโพสต์ comment ลง Jira เร็วขึ้น** — ลดขั้นตอนการส่งข้อมูลขึ้น Jira ให้เสร็จในรอบเดียว ไม่ต้องรอหลายรอบ
- **หมายเลขเทสเคสเป็นตัวเลขล้วน 1, 2, 3** — ไม่มีตัวอักษรนำหน้า ทุกไฟล์ใช้รูปแบบเดียวกันสม่ำเสมอ
- **Tags ใน Qase ใช้ข้อความจาก ticket โดยตรง** — คัดลอก AC/EC พร้อมข้อความจาก ticket ทุกตัวอักษร ไม่มีการสรุปหรือแต่งเพิ่มเอง
- **ถ้าประเภทใดไม่มีเทสเคส จะแจ้งไว้ใน Jira comment** — ไม่สร้างไฟล์ว่าง; ระบุหมายเหตุในความคิดเห็นแทนว่าประเภทนั้นไม่มี TC

### v1.6.0 — TC FE Prep: Qase integration + Thai language (17 Jun 2026)

OLS-local customizations on top of helix v1.5.31.

| # | What changed |
|---|-------------|
| 1 | **ภาษาไทยเสมอ** — เนื้อหาเทสเคสทั้งหมดเป็นภาษาไทยตามราชบัณฑิตยสภา ไม่มีโหมด English-only |
| 2 | **Step 4.5 — Term gate** — หลัง coverage review ต้องโชว์ตาราง Thai↔English ให้ user ยืนยันก่อนเขียนไฟล์จริง |
| 3 | **Type column ถาวร** — `System Test` / `Unit Test` / `Integration Test` (Qase Type values) ทุก TC เสมอ |
| 4 | **2 CSV attachments ใน Jira comment** — `Draft_Jira_{ISSUE_KEY}.csv` (Jira table format) + `Import_Qase_{ISSUE_KEY}.csv` (Qase import schema); footer มี 2 clickable download links |
| 5 | **Suite gate** — ตรวจ suite tree ใน Qase OLS ก่อน; reuse ของเดิมถ้าตรง; สร้างใหม่ต้องขอ user อนุมัติ ห้ามซ้ำ |
| 6 | **qase-import-format.md** — reference ใหม่: Qase column schema, Type/Status/AC-EC field warnings |
| 7 | **ols-project-guide.md** — เพิ่ม Qase section (project URL, file naming, Type/Status/Suite rules) |
