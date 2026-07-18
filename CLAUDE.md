# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Auto-loaded docs

@CONTEXT.md
@references/ols-project-guide.md

## What this repo is

A **QA workflow workspace** — no build/compile/test commands. Everything is Markdown. The agent reads skill files, executes QA workflows, and writes back results to Jira/GitHub via MCP tools.

## Architecture

### Skill system

```
skills/helix/SKILL.md          ← active router skill (entry point)
skills/deprecated/<name>/WORKFLOW.md ← active workflow implementations
                                 (directory named "deprecated" but files are current — 
                                  routing happens via helix → deprecated/<name>/WORKFLOW.md)
skills/in-progress/            ← unreleased skills
commands/helix.md              ← canonical menu shown to users
commands/<workflow>.md         ← one file per workflow command
references/                    ← shared rule fragments, linked by skills (not standalone)
```

**How skills compose:** Skills link to `references/` fragments instead of duplicating rules. When editing a skill, follow links to understand the full rule set. Do not copy-paste reference content into skills — link with `[name](../../references/name.md)`.

### Key reference files

| File | Purpose |
|------|---------|
| `references/shared-preamble.md` | Required imports for every workflow skill |
| `references/skill-routing.md` | Canonical routing table — do not duplicate elsewhere |
| `references/ols-project-guide.md` | OLS project config (Jira IDs, env URLs, etc.) |
| `references/shared-must-never.md` | Global MUST/NEVER rules for all skills |
| `references/qa-evidence-gates.md` | Evidence requirements before claiming "done" |
| `references/helix-session-constraints.md` | Constraints block recited at workflow start |

### Hooks

- **SessionStart** — `.claude/hooks/inject-context.sh` injects OLS links and any `.claude/session-context.md` WIP notes
- **PreCompact** — `.claude/hooks/pre-compact.sh` runs on auto-compact

## OLS QA workspace rules (ทำได้เลยไม่ต้องถาม)

- แก้ไข .md ไฟล์ใน `skills/`, `references/`, `commands/`
- แก้ SKILL.md / WORKFLOW.md content (ไม่ใช่ rename/delete ไฟล์)
- อัปเดต `references/ols-project-guide.md` เมื่อได้ข้อมูลใหม่จาก user
- เพิ่ม reference ใหม่ใน `references/`

ต้องถามก่อน:
- ลบ/rename skill directory ทั้ง folder
- แก้ hooks/ config

## Default decisions (ไม่ต้องถาม)

- Language ใน skill/command files: English only
- Language ใน chat กับ user: Thai ได้
- Commit style: conventional commits (feat:, fix:, docs:)

## Workspace Guide Pattern

เมื่อ AI ต้องถามคำถามเกี่ยวกับ project-specific config:
1. ตรวจก่อนว่ามี guide ใน `references/ols-project-guide.md` ที่ตอบได้แล้วหรือยัง
2. ถ้ามี → ใช้คำตอบจาก guide ไม่ต้องถาม
3. ถ้ายังไม่มี → ถาม user แล้วเพิ่มลง guide ทันที

## Link discovery rule (mandatory)

**Before asking the user for any URL or link** (Jira domain, Confluence space, Figma file, staging URL, etc.) — always search the repo first:

1. Read `references/ols-project-guide.md` — primary source for all OLS project links
2. Search `references/` for any `*-guide.md` files that may contain the link
3. Only ask the user if the link is genuinely not found in any `references/` file

**Never ask for a link that is already recorded in `references/ols-project-guide.md`.**
When a new link is provided by the user → add it to `references/ols-project-guide.md` immediately.

## Jira comment formatting rules (learned from OLS-22 session)

Jira markdown ใน table cells มีพฤติกรรมแปลกหลายอย่าง — ต้องทำตามกฎนี้เสมอ:

### ห้ามใช้ `<br>` ใน table cells

Jira render `<br>` เป็น literal text ไม่ใช่ line break ใน markdown table cells
- **ห้าม:** `Step 1<br>Step 2` → แสดง "Step 1<br>Step 2" เป็นตัวอักษร
- **ใช้แทน:** `**1.** Step 1 **2.** Step 2` (inline bold numbering)

### ห้ามขึ้นต้น cell ด้วย `1.` (bare numbered list)

Jira ตีความ `1.` ที่ขึ้นต้น cell เป็น ordered list แล้ว strip เลขออก
- **ห้าม:** `| 1. Do this 2. Do that |` → "1." หายไป แสดงแค่ "Do this 2. Do that"
- **ใช้แทน:** `| **1.** Do this **2.** Do that |` → bold format ป้องกัน list parsing

### Multi-line content ใน cells

เนื่องจาก `<br>` ใช้ไม่ได้ และ newline ใน table cell ก็ไม่ render → ใช้วิธีเหล่านี้:
- **Bold numbering:** `**1.** text **2.** text` — ดีสุดสำหรับ steps/results
- **Slash separator:** `value A / value B` — ดีสำหรับ short lists (services, test data)
- **Avoid:** `\n`, `<br>`, actual newlines ใน cell content

### Comment footer ต้อง link ไปไฟล์แนบ

ใช้ markdown link ไป attachment URL: `[filename.csv](https://domain.atlassian.net/secure/attachment/{ID}/filename.csv)`

## Jira file attachment via browser JS (workaround)

> **Interactive sessions only.** The browser-JS and Chrome-MCP workarounds in this section and the
> next are for a session you drive live in chat. The unattended **`/bot-testing` bots** (retest +
> test) run headless with no attached browser and must never touch the user's screen — they write
> Jira over the REST API (`curl -u "$OLS_JIRA_CREDS"`, see `prompt-retest.md`) and never use
> `Control_Chrome` / `Claude_in_Chrome` / `computer-use`. See the always-headless rule in
> `docs/ols-login-runbook.md` and the design spec addendum (2026-07-18).

Atlassian MCP `addCommentToJiraIssue` ไม่รองรับ file upload — ต้องใช้ browser JS แทน:

```javascript
// ใช้ mcp__Control_Chrome__execute_javascript (ไม่ใช่ Claude_in_Chrome)
// Claude_in_Chrome javascript_tool จะ error "Cannot access chrome-extension://"
var blob = new Blob(["﻿", csvContent], {type: 'text/csv;charset=utf-8'});
var file = new File([blob], 'ISSUE-KEY_FE_TC.csv', {type: 'text/csv'});
var fd = new FormData();
fd.append('file', file);
fetch('/rest/api/3/issue/ISSUE-KEY/attachments', {
  method: 'POST',
  headers: {'X-Atlassian-Token': 'no-check'},
  body: fd
}).then(function(r){return r.text()}).then(function(t){
  window.__result = t;
});
```

**สำคัญ:**
- ต้อง navigate ไปหน้า Jira issue ก่อน (ใช้ browser auth session)
- ใช้ `mcp__Control_Chrome__execute_javascript` เท่านั้น — `Claude_in_Chrome__javascript_tool` ใช้กับ Jira ไม่ได้ (extension sandbox)
- Control Chrome ไม่รองรับ async/await — ใช้ `.then()` chain แล้วเก็บผลใน `window.*`
- อ่านผลด้วย `window.__result || "pending"` ในครั้งถัดไป
- หลัง upload เสร็จ ลบไฟล์ซ้ำ/test ออกด้วย `fetch('/rest/api/3/attachment/{id}', {method:'DELETE', headers:{'X-Atlassian-Token':'no-check'}})`

## Chrome MCP tool selection

| Tool | ใช้เมื่อ | ข้อจำกัด |
|------|---------|----------|
| `Claude_in_Chrome__navigate` | Navigate, screenshot, click, find elements | JS execution ใช้กับ Jira ไม่ได้ |
| `Claude_in_Chrome__file_upload` | Upload ไฟล์จาก session shared folder เท่านั้น | ไม่สามารถ upload ไฟล์จาก repo/local path |
| `Control_Chrome__execute_javascript` | Run JS บน Jira pages (upload, API calls) | ไม่รองรับ async/await, ใช้ `.then()` |
| `Control_Chrome__get_current_tab` | ดู tab ID ที่ต่างจาก Claude_in_Chrome | tab ID คนละชุดกัน |
