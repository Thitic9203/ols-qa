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

## Skill sync → helix plugin (mandatory) + OLS-secret guard

The **active** skills Claude Code runs are the **helix** plugin (`~/.claude/skills/*` → symlink → `~/GitHub/helix/skills/*`), **not** this ols-qa copy. So editing a skill/reference/command **here** does NOT change the running skill until it reaches helix.

**Rule (automatic):** whenever a **shared** file under `skills/` · `references/` · `commands/` (one that also exists in helix) is committed here, it is **auto-synced to helix and a new helix version is deployed** — via the `post-commit` hook → `scripts/sync-skills-to-helix.sh` → helix `pre-commit` (guard + auto version-bump) → push. Any **skill-tree markdown change** (`skills/**.md`, `commands/*.md`, top-level `references/*.md`) bumps the patch version = the deploy. NEW generic skills absent from helix are **not** auto-created unless `HELIX_SYNC_NEW=1` (they must be introduced deliberately; the sync logs what it skipped). Run `bash scripts/setup-hooks.sh` once per clone to activate (`core.hooksPath=scripts/hooks`). OLS-specific files (e.g. `references/ols-project-guide.md`) don't exist in helix → never synced.

**Hard guard — 5 layers, helix holds ZERO cleartext OLS data:** `check-no-secrets.sh` runs at (1) ols-qa `pre-commit`, (2) sync source pre-scan, (3) sync post-copy scan, (4) helix `pre-commit`, (5) helix `pre-push`, + server-side CI. Layers 1 & 4 scan the **staged blob** (not the dirty worktree), and **fail closed** (a scanner error, a missing guard while a shared file is staged, or a dirty helix worktree all BLOCK). Detection = three independent mechanisms:
- **Shape regex** (generic, names no customer): `*.go.th`, hardcoded Google-resource URLs, `Bearer …`, discord webhook URLs, `.jira_token`/`.discord_webhook`/`.gcp-oauth`, reCAPTCHA/PEM/`xox…`/`gh…`/`AKIA` tokens. Forbidden everywhere.
- **Portable** (`/Users/`, `C:\Users`, `~/.helix`, other-customer strings) — skills/ + commands/ only; `gotchas.md` is exempt from this tier only (it teaches the rule) but is still fully shape+hash scanned.
- **Hash tier**: exact OLS identifiers — test password, usernames, resource IDs (Sheet/Drive/Figma/Confluence), infra hosts (`<ORG>.atlassian.net`, `<OTHER_CUSTOMER_HOST>`, `dev-ols`, `ndlp68`, …) — live in helix **only as SHA-256 of the lowercased token**. The cleartext literal is never in the public repo, yet an exact appearance is still caught. helix stays a **generic** plugin — use placeholders `{ISSUE_KEY}` / `{JIRA_DOMAIN}` / `{PORTAL}` only.
- **Add a new OLS secret:** append the literal to the LOCAL, off-repo `~/.helix-ols-denylist` (chmod 600, never committed) → `bash ~/GitHub/helix/scripts/gen-secret-hashes.sh` → paste the printed block into `check-no-secrets.sh` (`HASH_ALL=…`). For a *structural* leak shape (new URL/token form), add a generic regex to TIER1 instead. Ad-hoc/local runs can also set `HELIX_EXTRA_DENYLIST=/path` to hash extra literals without editing the file.
- **Residual risk (documented, not hidden):** GitHub's free tier has no server-side pre-receive hook, so a local `git push --no-verify` bypasses layers 4–5; the CI guard then runs **after** the push (blocks the release, but the blob is briefly on GitHub). Mitigation: never use `--no-verify` on helix; the CI guard is the backstop. This is a platform limit, not a config gap.

**When editing skills manually (AI):** put generic skill logic in the shared file (auto-reaches helix); keep OLS-specific config (URLs, accounts, sheet/Drive/Confluence IDs) ONLY in `references/ols-project-guide.md` (ols-qa-only). Never paste OLS creds/URLs into a shared skill/reference — the guard will block the deploy anyway.

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

## Post-mortems

Root-cause notes for mistakes that already reached a user-facing surface. Read before touching the
surface named in each entry. One rule per entry — apply it, don't re-derive it.

### PM-001 — Discord QA notify sent with the wrong header (2026-07-22, OLS-217)

**What happened.** The retest notify for OLS-217 went out as `❌ **Retest Result** — Ticket …`.
Every notify the user had previously accepted in the QA channel uses one fixed header,
`🔔 **QA Review Requested** — Ticket …`, with the verdict carried **only** by the bold count line
(`**0 PASSED / 4 FAILED / 0 BLOCKED**`). User: "ห้ามส่งโนติที่ผิดฟอแมตอีก". Fixed in place by
PATCHing the existing message — never by reposting.

**Root cause — three failures stacked, none of which the pre-send gate could catch:**

1. **The generator itself was wrong.** `discord_qa_notify.py` `build_content()` had a separate
   `mode == "retest"` branch that synthesised its own `✅/❌ Retest Result` header instead of reusing
   the shared one. The divergence came from *reasoning about semantics* ("a retest is already closed
   out, so it isn't a review request") instead of matching the format the user had already accepted.
   **Semantic reasoning overrode observed convention.**
2. **The agent memory agreed with the bug.** The retest-format memory described the retest header as
   a verdict headline, so code and memory corroborated each other. Two wrong sources that agree feel
   like verification but are one source.
3. **The pre-send gate had no format check.** The Step 9 five-check gate verifies ticket, counts,
   bullets, link and recipient — all *content*. Nothing compared the *layout* to anything. The
   dry-run was reviewed against expectation, not against evidence, so the header was never in scope.

**Underlying mistake:** treating a `LOCKED layout` claim in a docstring as authority. For a
user-facing format, authority is **the last message the user accepted on that surface** — not a
comment in the code, not a memory, not an inference about what the message "is".

**Prevention (mandatory, applies to every outbound notify):**

- **Check #6 in the pre-send gate — format diff against the channel.** Before any send, fetch the
  most recent accepted notify from the target channel and compare the dry-run to it line-by-line:
  header line, count line, bullet block, link line, owner line. Any structural difference = stop and
  ask. Reading back a real message costs one API call; a wrong send costs a correction round.
- **One header for every mode.** Header text is mode-independent. Verdict/state belongs in the count
  line only. Never add a per-verdict icon or a per-mode header variant to `build_content()`.
- **Fix the generator, not the message.** A bad send means the shared formatter is wrong — patch
  `build_content()` (the single source both the sender and `sync_qa_owner.py` use) and leave a
  comment naming the reference message, then correct the posted message with a PATCH edit in place.
- **When code and memory agree, that is not corroboration.** Confirm a user-facing format against the
  live surface before trusting either.
- Full parameter rules and the canonical reference message id live in local agent memory
  (`feedback_discord-retest-format`, `feedback_discord-canonical-format`) — the channel/webhook ids
  are secrets and MUST NOT be committed here.
