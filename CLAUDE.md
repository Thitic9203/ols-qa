# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Auto-loaded docs

@CONTEXT.md
@references/ols-project-guide.md

> ⚠️ **This repo is PUBLIC** (github.com/Thitic9203/ols-qa). `references/ols-project-guide.md`
> holds the workflow knowledge but only **placeholders** for every real value. Resolve a
> placeholder from the local, untracked store `~/.ols-qa-secrets/ols-secrets.md` (chmod 600) at
> runtime — never write the resolved value back into any file in this repo. See
> [SECURITY.md](SECURITY.md).

## 🔴 กฎเหล็ก — ห้ามมีข้อมูลบริษัทใน repo (อ่านก่อนเขียนไฟล์ใดๆ)

**`ols-qa` เป็น public repo บน GitHub (public ตั้งแต่ 2026-06-11) ใครก็อ่านได้ ทุกอย่างที่ commit = เผยแพร่สู่สาธารณะถาวร**
ข้อมูลในนี้เป็น**ข้อมูลภายในของบริษัท (<ORG> / ลูกค้า)** → **ห้ามมีข้อมูลสำคัญอยู่ใน repo เด็ดขาด ทั้ง repo ไม่ใช่แค่บางโฟลเดอร์**

### ห้าม commit เด็ดขาด (ไม่มีข้อยกเว้น)

| ประเภท | ตัวอย่าง |
|---|---|
| **รหัสผ่าน / credential** | password, API key, token, secret, refresh token, service-account JSON, PEM/private key |
| **บัญชีผู้ใช้จริง** | email/username ของ test account หรือพนักงาน |
| **Host / URL ภายใน** | โดเมนภายในองค์กร, auth-API host, env host (dev/uat/preprod/prod) |
| **Resource ID** | Google Sheet / Drive **(รวมลิงก์หลักฐาน `drive.google.com/file/d/…`)** / Figma / Confluence / Jira tenant |
| **ชื่อลูกค้า / ระบบภายใน** | ชื่อองค์กรลูกค้า, ชื่อโปรเจกต์ภายในที่ไม่ใช่ของเรา |
| **Path เครื่องคน** | `/Users/<name>/…`, `C:\Users\…` |

### แล้วเก็บของจริงไว้ที่ไหน

- ค่าจริงทั้งหมด → `~/.ols-qa-secrets/ols-secrets.md` (**นอก repo ทั้งสองตัว**) หรือ local agent memory
- ในไฟล์ที่ commit ใช้ **placeholder เท่านั้น** → `{ISSUE_KEY}` · `{JIRA_DOMAIN}` · `{PORTAL}` · `<QA_TRACKING_SHEET_ID>`
- **ลิงก์หลักฐานการเทส** อยู่ในคอลัมน์ Capture ของ Google Sheet เท่านั้น **ห้ามเขียนลง md ที่ commit**
  *(บทเรียนจริง 2026-07-24: session record มีลิงก์ Drive 16 อัน ต้องย้ายไปเก็บนอก repo)*

### เจอ secret หลุดเข้าไปแล้ว → ลบไฟล์เฉยๆ ไม่พอ

commit ที่ผ่านไปแล้วยังอยู่ใน git history และอาจถูก clone/cache/index ไปแล้ว ต้อง **rewrite history + หมุน (rotate) ค่าที่หลุดทุกตัว**
แจ้ง user ทันที **ห้ามเงียบ ห้ามแก้เองแบบลบไฟล์แล้วจบ** — ดู [SECURITY.md](SECURITY.md)

### Guard ไม่ใช่ใบอนุญาต

`scripts/check-no-secrets.sh` + pre-commit/pre-push จับให้ได้ระดับหนึ่ง แต่มันคือ **ตาข่ายกันพลาด ไม่ใช่ตัวตัดสินว่าปลอดภัย**
ของใหม่ที่ยังไม่อยู่ใน denylist มันจับไม่ได้ → **คนเขียนต้องไม่ใส่ตั้งแต่แรก**
**ห้ามใช้ `--no-verify` ทุกกรณี** (bypass guard = ทางเดียวที่ secret หลุดขึ้น GitHub ได้จริง)

> ⚠️ ตอนที่ repo ยังเป็น private เคยออกแบบให้ OLS secret มากองรวมที่ ols-qa เพื่อปกป้อง helix
> พอ repo กลายเป็น public โมเดลนั้นกลับหัวทันที — audit เจอ credential/host/resource id กระจาย **71 ไฟล์**
> **ตอนนี้ทั้ง ols-qa และ helix เป็น public → ปฏิบัติเหมือนกันทุกประการ**

## What this repo is

A **QA workflow workspace** — no build/compile/test commands. Everything is Markdown. The agent reads skill files, executes QA workflows, and writes back results to Jira/GitHub via MCP tools.

## Architecture

### Skill system

```
skills/helix/SKILL.md          ← active router skill (entry point)
skills/<name>/SKILL.md         ← thin discovery stub, one per workflow — what the agent
                                 discovers and announces; loads the WORKFLOW.md below
skills/deprecated/<name>/WORKFLOW.md ← active workflow implementations
                                 (directory named "deprecated" but files are current —
                                  routing: helix → stub → deprecated/<name>/WORKFLOW.md)
skills/in-progress/            ← unreleased skills
commands/helix.md              ← canonical menu shown to users (menu text: references/menu-text.md)
commands/<workflow>.md         ← one file per workflow command
references/                    ← shared rule fragments, linked by skills (not standalone)
```

**How skills compose:** Skills link to `references/` fragments instead of duplicating rules. When editing a skill, follow links to understand the full rule set. Do not copy-paste reference content into skills — link relative to the file's own depth: from `skills/<name>/SKILL.md` that is `[name](../../references/name.md)`; from `skills/deprecated/<name>/WORKFLOW.md` it is **`../../../references/name.md`** (one level deeper).

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
- อัปเดต `references/ols-project-guide.md` เมื่อได้ข้อมูลใหม่จาก user — **เขียนได้เฉพาะ placeholder**
  (`<JIRA_DOMAIN>`, `<DEV_HOST>`, `<TEST_ACCOUNT_1>`, `QA Owner A`, …) ค่าจริงไปอยู่ที่
  `~/.ols-qa-secrets/ols-secrets.md` เท่านั้น
- เพิ่ม reference ใหม่ใน `references/`

ต้องถามก่อน:
- ลบ/rename skill directory ทั้ง folder
- แก้ hooks/ config

**ห้ามเด็ดขาด (repo นี้ public):** เขียน password / อีเมล test account / hostname จริง / Jira tenant /
Google Sheet–Drive ID / Figma ID / Discord id / ชื่อจริงพนักงาน / `/Users/<name>` ลงไฟล์ใดๆ ใน repo นี้
รวมถึง commit message. `pre-commit` จะบล็อกให้ แต่ห้ามพึ่ง hook อย่างเดียว

## Skill sync → helix plugin (mandatory) + OLS-secret guard

The **active** skills Claude Code runs are the **helix** plugin (`~/.claude/skills/*` → symlink → `~/GitHub/helix/skills/*`), **not** this ols-qa copy. So editing a skill/reference/command **here** does NOT change the running skill until it reaches helix.

**Rule (automatic):** whenever a **shared** file under `skills/` · `references/` · `commands/` (one that also exists in helix) is committed here, it is **auto-synced to helix and a new helix version is deployed** — via the `post-commit` hook → `scripts/sync-skills-to-helix.sh` → helix `pre-commit` (guard + auto version-bump) → push. Any **skill-tree markdown change** (`skills/**.md`, `commands/*.md`, top-level `references/*.md`) bumps the patch version = the deploy. NEW generic skills absent from helix are **not** auto-created unless `HELIX_SYNC_NEW=1` (they must be introduced deliberately; the sync logs what it skipped). Run `bash scripts/setup-hooks.sh` once per clone to activate (`core.hooksPath=scripts/hooks`). OLS-specific files (e.g. `references/ols-project-guide.md`) don't exist in helix → never synced.

> 🔴 **2026-07-24 — the model below was built when ols-qa was PRIVATE.** It protected *helix* by
> routing every OLS secret **into** ols-qa. ols-qa went public on 2026-06-11, which inverted the
> threat model: the guard kept passing green while the vault itself was open. An audit found
> credentials, internal hosts, tenant and resource ids across 71 files. History was rewritten and
> the ols-qa `pre-commit` no longer exempts any path. **Both repos are public now — treat them
> identically.** See [SECURITY.md](SECURITY.md).

**Hard guard — 5 layers, BOTH repos hold ZERO cleartext OLS data:** ols-qa runs its own
`scripts/check-no-secrets.sh` over **every** staged text blob (1) at ols-qa `pre-commit`; the helix
copy then runs at (2) sync source pre-scan, (3) sync post-copy scan, (4) helix `pre-commit`,
(5) helix `pre-push`, + server-side CI. Layers 1 & 4 scan the **staged blob** (not the dirty
worktree), and **fail closed** (a scanner error, a missing guard, or a dirty helix worktree all
BLOCK). Detection = three independent mechanisms:
- **Shape regex** (generic, names no customer): `*.go.th`, hardcoded Google-resource URLs, `Bearer …`, discord webhook URLs, `.jira_token`/`.discord_webhook`/`.gcp-oauth`, reCAPTCHA/PEM/`xox…`/`gh…`/`AKIA` tokens. Forbidden everywhere.
- **Portable** (`/Users/`, `C:\Users`, `~/.helix`, other-customer strings) — skills/ + commands/ only; `gotchas.md` is exempt from this tier only (it teaches the rule) but is still fully shape+hash scanned.
- **Hash tier**: exact OLS identifiers — test password, usernames, resource IDs (Sheet/Drive/Figma/Confluence), Jira tenant, env + auth-API hosts, other-customer hosts — live in **both** repos **only as SHA-256 of the lowercased token** (never enumerate the cleartext here; the list lives in `~/.ols-qa-secrets/ols-secrets.md`). The cleartext literal is never in the public repo, yet an exact appearance is still caught. helix stays a **generic** plugin — use placeholders `{ISSUE_KEY}` / `{JIRA_DOMAIN}` / `{PORTAL}` only.
- **Add a new OLS secret:** append the literal to the LOCAL, off-repo `~/.helix-ols-denylist` (chmod 600, never committed) → `bash ~/GitHub/helix/scripts/gen-secret-hashes.sh` → paste the printed block into `check-no-secrets.sh` (`HASH_ALL=…`). For a *structural* leak shape (new URL/token form), add a generic regex to TIER1 instead. Ad-hoc/local runs can also set `HELIX_EXTRA_DENYLIST=/path` to hash extra literals without editing the file.
- **Residual risk (documented, not hidden):** GitHub's free tier has no server-side pre-receive hook, so a local `git push --no-verify` bypasses layers 4–5; the CI guard then runs **after** the push (blocks the release, but the blob is briefly on GitHub). Mitigation: never use `--no-verify` on helix; the CI guard is the backstop. This is a platform limit, not a config gap.

**When editing skills manually (AI):** put generic skill logic in the shared file (auto-reaches
helix). OLS-specific *structure* (which sheet, which env, which role) goes in
`references/ols-project-guide.md` **as placeholders**; the resolved values live ONLY in
`~/.ols-qa-secrets/ols-secrets.md`, outside both repos. Never paste a real cred/URL/id into any
file in either repo — the guard blocks it, and a blocked commit is the cheap outcome; a pushed one
is not.

## Default decisions (ไม่ต้องถาม)

- Language ใน skill/command files: English only
- Language ใน chat กับ user: Thai ได้
- Commit style: conventional commits (feat:, fix:, docs:)

## Workspace Guide Pattern

เมื่อ AI ต้องถามคำถามเกี่ยวกับ project-specific config:
1. ตรวจก่อนว่ามี guide ใน `references/ols-project-guide.md` ที่ตอบได้แล้วหรือยัง (placeholder)
2. ถ้ามี → resolve placeholder จาก `~/.ols-qa-secrets/ols-secrets.md` ไม่ต้องถาม
3. ถ้ายังไม่มี → ถาม user แล้วเพิ่ม **placeholder** ลง guide + **ค่าจริง** ลง `~/.ols-qa-secrets/`
   ทันที (สองที่ แยกกันเสมอ)

## Link discovery rule (mandatory)

**Before asking the user for any URL or link** (Jira domain, Confluence space, Figma file, staging URL, etc.) — always search the repo first:

1. Read `~/.ols-qa-secrets/ols-secrets.md` — **the only place real URLs live** (local, untracked)
2. Read `references/ols-project-guide.md` — tells you *which* placeholder to resolve, and what it means
3. Search `references/` for any `*-guide.md` files that may name the placeholder
4. Only ask the user if the link is genuinely in neither store

**Never ask for a link that is already recorded in `~/.ols-qa-secrets/ols-secrets.md`.**
When a new link is provided by the user → add the **placeholder** to
`references/ols-project-guide.md` and the **real URL** to `~/.ols-qa-secrets/ols-secrets.md`.
Never the real URL into the repo — it is public.

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

### PM-002 — Retest comment shipped incomplete, then had to be corrected in-ticket (2026-07-23, OLS-108)

**Surface:** the Jira retest comment (retest-bug-workflow Step 6/7) and any Phase F3 defect write-up.

**What happened.** OLS-108's round-1 comment posted a `FAILED` verdict with an env block, the ticket's
test step/expected result, a 3-row expected-result table and 5 screenshots — and nothing else. The dev
then asked two questions: *"เกิดต่อเมื่อ user ก๊อป URL มาเปิดตรงๆ ใช่ไหม"* and *"ต้องโชว์ detail เหมือนปกติแต่ disable
ปุ่มไว้ ใช่ไหม"*. The answer given was **"ไม่ใช่ เกิดทั้ง 2 ทาง"** — wrong. The user then had to ask three more
times what actually needs fixing and who decides. The comment was edited **twice**, the second time
8 hours after posting, and had to carry an in-ticket retraction (*"ขอแก้ข้อมูลจากที่เคยแจ้งไว้ว่าเกิดทั้ง 2 ทาง"*)
plus a correction posted into the Discord thread where the wrong answer had already been replied to.

**Root cause — four failures, in the order they compounded:**

1. **The wrong claim came from a stale client view, recorded as product behavior.** Run 1 observed
   the "การเรียนของฉัน" list ~5 s after the course was unpublished, while the list still held
   pre-change data — the card had no badge and was still clickable. That is a property of test
   timing, not of the product. Run 2, ten minutes later, showed the badge and no anchor.
2. **Two of our own runs contradicted each other and the contradiction was never reconciled.** Both
   captures were in the evidence set (`C2-me-learning-after-unpublish.png` vs `tc3-mylearning-badge.png`).
   The observation that matched the already-formed verdict was the one that got published.
3. **The claim was asserted from memory, not re-verified.** The dev's question was answered directly
   from recollection of run 1 rather than by re-running the surface — so a one-run artifact was
   escalated into an authoritative statement to a developer.
4. **The comment answered only "what is wrong", not the three things a reader acts on** — which entry
   points reproduce it, what the screen should look like instead (concretely enough to implement),
   and what must change / who decides between updating the expected result and changing the code.
   Every question asked afterwards mapped 1:1 to a section that was never written.

**Underlying mistake:** treating a defect report as a *verdict record* rather than as *the artifact
someone else acts on*. A verdict record is finished when the status is right; a defect report is
finished only when a developer who has never seen the ticket needs to ask nothing.

**Prevention (now enforced in the skills — apply, don't re-derive):**

- Full contract: [references/defect-report-completeness.md](references/defect-report-completeness.md).
  Wired into retest-bug-workflow (Step 4f · 6a · 6b · 10) and testing-ticket-workflow (E1 · F3 · F4 · H).
- **Repro matrix, one row per entry point, or no scope claim.** Exercise the direct route *and* the
  in-app path separately, one screenshot each. An untried path is written `not tested` — never
  inferred. Words like "always" / "both ways" must trace to a row.
- **Hard-reload after every state-changing fixture step before observing.** A stale window is reported
  as a separate timing note with the measured delay, never as a repro row.
- **A contradiction between your own observations blocks drafting** until one clean re-run settles it;
  record which capture was the artifact. Never settle it in favour of the verdict you already hold.
- **A non-PASSED comment carries three extra blocks** — repro matrix, why-failed with the expected line
  quoted verbatim, and resolution options with a named owner each — plus one line stating whether the
  originally reported symptom is gone.
- **Pass the dev-question gate before the FIRST post.** Never "post now and explain in chat".
- **A question arriving after posting = re-verify, answer in the shape asked, then fold the answer back
  into the comment in place.** A wrong published statement is corrected visibly in both places — the
  in-place edit and the thread where it was given. Never a silent edit.

### PM-003 — Retest comment picked the wrong precedent, twice, before matching the real current format (2026-07-23, OLS-252)

**Surface:** the Jira retest comment body (retest-bug-workflow Step 6), posted via raw `PUT
/rest/api/2/issue/{key}/comment/{id}` with a hand-built wiki-markup string (not the Atlassian MCP
`addCommentToJiraIssue` tool).

**What happened — three drafts before it matched.** Draft 1 came from
`retest-bug-workflow/references/worked-example.md` (generic, anonymized): a `**Fixture:**` line, `---`
dividers, "Expected result item"/"Actual"/"Expected-result coverage" wording, emoji inside the bold
marker, a markdown `[text](url)` link, and a markdown table divider row `| --- | --- |`. The user
rejected it. Draft 2 was rebuilt from OLS-199 (comments `80459`/`80901`, 2026-07-20/22) — but that
ticket turned out to be an **older, superseded** style: no Fixture line, no dividers, different column
names. The user pointed at OLS-251 (comment `81050`, posted the same day, later) as the actual current
format — which turned out to be far closer to Draft 1 (Fixture line, dividers, "Expected result
item"/"Actual"/"Expected-result coverage" all present) than to OLS-199. Draft 3 matched OLS-251
structurally, but its table used the same `| --- | --- |` divider row from Draft 1 — which rendered
clean in OLS-251 but rendered as a **visible garbage row of literal dashes** when posted through this
session's raw-API path. Fixed by switching to a real Jira-wiki header row (`||No.||...||`) with no
separator row.

**Root cause — two distinct mistakes stacked.**
1. **Treated a reference template as authority before checking any real precedent** (PM-001's lesson,
   not yet internalized): should have fetched a real prior comment from this project *first*, before
   drafting from `worked-example.md` at all.
2. **When correcting, grabbed the nearest precedent found (OLS-199) instead of the most recent one.**
   Precedent authority is chronological — the latest real comment on the surface wins — but OLS-199 was
   simply the first search hit, not verified as the current standard. This is exactly PM-001's "last
   accepted artifact wins" rule, misapplied by picking *an* old artifact instead of *the newest* one.
3. **A markdown table divider row (`| --- | --- |`) is not reliably safe even when precedent contains
   it** — it evidently depends on how the comment reaches Jira (this session's raw `fetch()` PUT vs.
   whatever produced OLS-251, likely the MCP tool's markdown→ADF conversion). Copying a raw-source
   snippet is not proof it will render the same way through a different posting path.

**Prevention:**

- **Before drafting a retest comment in an established project, fetch the *most recent* real comment(s)
  from the same Jira project** (`getJiraIssue` with `fields:["comment"]`, sorted/read by `created`
  timestamp) — not just any past comment that happens to match the bug type. If two precedents disagree
  (as OLS-199 vs OLS-251 did here), the newer one is the standard; treat the older one as stale, don't
  average or guess between them.
- **Never include a markdown table divider row (`| --- | --- |`) when posting via raw API `fetch()`
  wiki-markup body.** Use a real Jira-wiki header row (`|| col || col ||`) with no separator line
  instead — confirmed safe in this posting path regardless of what a copied raw-source example shows.
- **Re-render and read the full comment top to bottom after every post or edit** — a partial scroll-check
  missed the garbage row and a duplicated-URL line in earlier drafts here; only a full top-to-bottom
  pass caught both.

> **Correction (see PM-004):** item 3 above guessed that the divider row's behaviour "depends on the
> posting path". It does not. The divider row is markdown; it was never valid in a v2 wiki body, in
> any posting path. The real fault was that the whole body was markdown while the endpoint was wiki.

### PM-004 — Markdown drafted into a wiki-markup endpoint; literal `*` shipped on 10 tickets (2026-07-23, OLS-252 + 9)

**Surface:** the body string of any Jira comment sent to `/rest/api/2/issue/{key}/comment` — the v2
wiki-markup endpoint used for every FE retest (Step 7c), and by the unattended retest bot.

**What happened.** The OLS-252 retest comment rendered as `*Retest Result: PASSED*`, `*Env:*`,
`*No.*` — bold text visibly wrapped in asterisks. User: "ต้องไม่มีดอกจันทร์แบบนี้อะ ผิดๆๆๆๆ". The
body had been drafted in **markdown** (`**bold**`, `---`, `| --- |`) and POSTed to the **wiki**
endpoint. Wiki bold is a single `*`, so `**X**` parses as *bold containing a literal `*X*`*. Nothing
errored — HTTP 200, table rendered, images rendered. An audit of all 51 OLS tickets carrying retest
comments found the same defect on **10** of them, dating back to 2026-07-15, plus a second silent
failure mode (below) that had destroyed a whole table on OLS-108 unnoticed.

**Root cause — the template taught markdown for a wiki endpoint.**

1. **`WORKFLOW.md` Step 6's "Template core" was fenced ` ```markdown `** and written in markdown,
   while Step 3/7c route FE bugs to v2 wiki. The two languages share `|`, `*` and `-`, so a markdown
   body is *accepted* by the wiki parser and renders as plausible-looking garbage.
2. **`WORKFLOW.md` said the bold rule "applies to both markdown (MCP) and v2 wiki"** and gave only
   the markdown form — the one line most likely to be obeyed literally was the wrong one.
3. **`worked-example.md`'s "tight PASSED format"** (commit `8b75993`, added the same day) had been
   transcribed from a correct wiki comment **into markdown** while anonymising it, then served as the
   drafting source. PM-003 corrected the *posted comment* and never touched the template that
   produced it — so the defect kept shipping.
4. **Every gate was a human-eye gate.** `jira-comment-post-review.md` did list "no literal `**`", but
   a markdown draft reads as *correct* when proof-read, because markdown is what the author meant.
   Only a scan of the outgoing string finds it, and no step scanned the string.

**Second failure mode found by the same audit — unknown `{macro}`.** A bare `{id}` in prose (from
`/api/course/{id}`) is parsed as a macro that never closes: on OLS-108 it silently turned the second
table, a horizontal rule and three bullets into raw text, **while all five images still rendered**.
Image-count checks pass straight through this. Already in memory as `feedback_jira-no-literal-braces`
— it recurred because nothing mechanical enforced it.

**Prevention (enforced in the skill — apply, don't re-derive):**

- **Draft in the target endpoint's syntax from the first keystroke.** Never "draft in markdown and
  convert at post time". Step 6 now carries a v2-wiki template and a markdown/ADF template as
  separate blocks; pick by `COMMENT_FORMAT`, never mix.
- **Run the Step 7 syntax gate as a string scan of the exact outgoing body** — `**`, `^---$`,
  `^\|\s*-{3,}`, `![](`, backticks, unescaped `{word}`. Reading the draft does not substitute.
- **Verify structure by counting, not by looking**: rendered `<table>` == source `||` header rows,
  `<hr>` == `----`, `<img>` == `!…!`, and zero `*` / `||` / `----` in the tag-stripped rendered text.
- **Thai and other unspaced scripts break wiki bold** — `คำ*เน้น*ต่อ` renders literal because `*`
  needs whitespace on the outside. Use `{*}เน้น{*}` mid-word.
- **Not every `*` is a defect.** Footnote markers, required-field markers quoted off a form, and CSS
  selectors like `[class*=Toast]` are content. Scan output is triaged, never auto-stripped.
- **When a rendering bug is found, fix the generator/template in the same pass as the comment.**
  PM-003 fixed one comment; the template kept emitting the fault for another nine.
- **Correct posted comments in place** with `PUT …/comment/{id}` — never delete and repost.
