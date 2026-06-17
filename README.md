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

- **3 Typed CSV ออกอัตโนมัติ** — Unit_Test, Integration_Test, System_Test CSV สร้างเฉพาะประเภทที่มี TC จริง แนบ Jira พร้อม clickable link ทุกไฟล์
- **Typed CSV เนื้อหาครบทุก column** — map Jira draft → template ของแต่ละประเภทถูกต้อง; เฉพาะ execution-result columns (Actual Result, Test status ฯลฯ) เว้นให้ QA กรอกเอง
- **Import_Qase เรียงตาม Type** — Unit Test → Integration Test → System Test; AC ascending แล้ว EC ascending ภายในแต่ละกลุ่ม; TC ID รันต่อเนื่อง 1,2,3 ตลอดไฟล์
- **Fast publish — JS single call** — upload CSV ทุกไฟล์ + post ADF comment ในคำสั่งเดียว; ลดขั้นตอน retry และลด latency
- **TC ID = 1, 2, 3 ทุก output** — ไม่มี prefix, ไม่มี padding, ไม่ถาม user; สม่ำเสมอทุก file ทุกแถว
- **Tags verbatim จาก ticket** — Tags ใน Import_Qase CSV ใช้ label + ข้อความ AC/EC ตรงๆ จาก ticket ห้าม paraphrase หรือแต่งเอง
- **Skip + แจ้ง Type ที่ไม่มี TC** — ไม่สร้างไฟล์ว่าง; เพิ่มบรรทัดหมายเหตุใน Jira comment สำหรับทุก Type ที่ขาด TC

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

### v1.5.31 — helix sync (16 Jun 2026)

Synced from [Thitic9203/helix](https://github.com/Thitic9203/helix) v1.5.31.

| # | What changed |
|---|-------------|
| 1 | **Step 2.5 — Conflict check** ก่อนออกแบบ TC: เปรียบเทียบ ticket vs PRD/Figma พร้อม source recency (Bangkok ICT, format `DD Mon YYYY HH.MM AM/PM`) |
| 2 | **Step 3a — Pre-design setup**: ถามภาษา + รหัส TC + Test Type ในข้อความเดียว |
| 3 | **TC Language**: เลือก English (formal) หรือ Thai (ราชบัณฑิตยสภาก่อน → อังกฤษถ้าไม่มีคำไทย) |
| 4 | **TC ID format**: ยืนยัน format (เช่น `TC_01`, `OLS-142_TC_01`) ก่อนร่าง — ใช้สม่ำเสมอทุก row |
