# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at SkillLane.

Helix skills embedded directly — no separate install needed.

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend test cases from a story (AC/EC) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, add evidence, comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |

## OLS links

- **Jira board:** https://skilllane.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://skilllane.atlassian.net/wiki/spaces/PLUT/folder/3592814638
- **Figma:** https://www.figma.com/design/EzwBjyCfqCCof1MuPdQUsq/OLS_Working-file

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## Helix skills source

Skills synced from [Thitic9203/helix](https://github.com/Thitic9203/helix) **v1.5.31** (16 Jun 2026).

### TC FE Prep changes in v1.5.31

| # | What changed |
|---|-------------|
| 1 | **Step 2.5 — Conflict check** ก่อนออกแบบ TC: เปรียบเทียบ ticket vs PRD/Figma พร้อม source recency (Bangkok ICT, format `DD Mon YYYY HH.MM AM/PM`) |
| 2 | **Step 3a — Pre-design setup**: ถามภาษา + รหัส TC + Test Type ในข้อความเดียว |
| 3 | **TC Language**: เลือก English (formal) หรือ Thai (ราชบัณฑิตยสภาก่อน → อังกฤษถ้าไม่มีคำไทย) |
| 4 | **TC ID format**: ยืนยัน format (เช่น `TC_01`, `OLS-142_TC_01`) ก่อนร่าง — ใช้สม่ำเสมอทุก row |
