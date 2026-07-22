# OLS Project Guide

Project-specific config for all Helix workflows in this workspace.
AI reads this file before asking any OLS-related questions.

## Jira

| Field | Value |
|-------|-------|
| Domain | `<ORG>.atlassian.net` |
| Project key | `OLS` |
| Project ID | `10791` |
| Board ID | `818` |
| Board URL | https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog |
| QA test-ready filter | https://<ORG>.atlassian.net/issues?filter=21323 — candidate tickets for AI testing; pick those with **Status = READY TO TEST** and **TC Status = QA Reviewed** |

### Workflow statuses

| Status | Notes |
|--------|-------|
| To Do | Backlog |
| In Progress | Dev working |
| REVIEWING | PR / code review |
| DEPLOYING | Being deployed |
| READY TO TEST | QA pickup point |
| TESTING | QA in progress |
| BLOCKED | Blocked (dev or QA) |
| Done | Closed |

### QA lifecycle

1. Dev deploys → transitions to **READY TO TEST**
2. QA picks up → transitions to **TESTING**
3. Pass → transition to **Done** (or follow team convention)
4. Fail → create bug, transition ticket to **BLOCKED**

### Directed transitions (for retest-bug workflow)

| Transition | From → To |
|-----------|-----------|
| pick up by QA | READY TO TEST → TESTING |
| approve by QA | TESTING → Done |
| block | any → BLOCKED |
| Deploy done | DEPLOYING → READY TO TEST |

Transition ids (global, usable from any status): `11` To Do · `21` In Progress · `31` REVIEWING ·
`41` Done · `51` DEPLOYING · **`61` READY TO TEST** · `71` TESTING · `81`/`141` BLOCKED ·
`151` approve by QA (→ Done). From READY TO TEST to Done use `121` then `41`.

### Unblocking stories once a bug reaches Done (retest-bug-workflow Step 8d)

**Trigger = the bug is in Done** (Done means fixed). Ready-for-QA status for a story it was blocking =
**READY TO TEST** (transition `61`). Move the story **only** when every one of its "is blocked by"
links is in **Done** — OLS stories are commonly blocked by several bugs at once, and a blocker sitting
in **DEPLOYING** / REVIEWING / In Progress still counts as unresolved. Leave assignee and QA Owner
untouched.

Check the links from the **story** side (`is blocked by`), not just the bug's `blocks` list, so
blockers that this retest never touched are not missed.

### Assignee during QA

**Never change the assignee** when picking up an OLS ticket for retest or testing — not to self, not back to the developer after a verdict. Ownership is tracked by status, not assignee. This overrides the generic retest-bug-workflow Step 8b/8c (find developer → assign).

## Confluence

| Field | Value |
|-------|-------|
| Space | `PLUT` |
| OLS folder | https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID> |
| Base URL | https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE> |

## Figma

| Field | Value |
|-------|-------|
| Working file | https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file |
| Main frame | node-id `226-94221` |
| Access when Dev Mode MCP is off | Open the working-file URL in the **Chrome MCP** browser (`claude-in-chrome` — the QA Chrome login to Figma persists) → wait ~5–9s for the canvas to render → screenshot the node. Dismiss the "Want to view this file in Dev Mode?" modal with **Not now** (never Request access). This account = **View + Comment only** (toast "You can only view and comment on this file") — enough to view/screenshot/copy specs. `node-id` in the URL uses `-`; Figma `nodeId` uses `:` (`2257-114654` → `2257:114654`). Verified 2026-07-20 (node `2257:114654` = frame **AllContent-Guest**, page 💙 Learner Mode → คลังสื่อทั้งหมด). |

## Qase (test management)

| Field | Value |
|-------|-------|
| Project | `OLS` |
| Project URL | https://app.qase.io/project/OLS |
| FE TC Jira-format file | `Draft_Jira_{ISSUE_KEY}.csv` — 10-column Jira table schema; attached to story comment |
| FE TC Qase import file | `Import_Qase_{ISSUE_KEY}.csv` — Qase schema; attached to story comment alongside Draft_Jira (schema: `skills/deprecated/tc-fe-prep-workflow/references/qase-import-format.md`) |
| Type values | `System Test` · `Unit Test` · `Integration Test` *(verify these exist as OLS custom Type values before import)* |
| Status value | `Done` *(verify exists as OLS custom Status value before import)* |
| Suite | reuse existing OLS suite; new suite only with user approval, never a duplicate |

## QA tracking sheet (ticket list + TC status)

Master sheet of OLS tickets with QA/TC status. AI reads this to decide which tickets to test and to load each ticket's reviewed test cases. See workflow: [ai-assisted-testing-template.md](../docs/ai-assisted-testing-template.md).

| Field | Value |
|-------|-------|
| Sheet | https://docs.google.com/spreadsheets/d/<QA_TRACKING_SHEET_ID>/edit?gid=528925434 |
| Summary tab `gid` | `528925434` (tab literally named **"Summary"**) — the ticket list for eligibility. Columns: Issue Type · parent · Key · Summary · Status · Ticket Detail Status · QA Owner · TC Status · Added to Regression Test Plan · Remark. *(Verified 2026-07-12 via Sheets API. Earlier value `991559500` was WRONG — that gid is a different tab "Test Progress - ALL TC", a pass/fail progress rollup with columns Ticket No.·QA Owner·Total TC·% Passed·… — do NOT use it for ticket selection.)* |
| Per-ticket TC detail | click a ticket **Key** in the sheet → opens that ticket's own tab listing all its test cases |
| Eligibility for AI testing | **Status = `READY TO TEST`** AND **TC Status = `QA Reviewed`** |
| Ticket has no TC rows in sheet | TCs not yet pasted → tell user to update the sheet first; do **not** start testing |
| 🔐 **Write scope (บังคับ)** | AI เขียนได้เฉพาะแถวที่ **ว่าง/NOT STARTED** หรือแถวที่ **AI เขียนเองรอบก่อน** (Actual Result ขึ้นต้น `Tested by Claude AI`) · แถวที่ QA ใส่ status/actual/ลิงก์ไว้ = **ห้ามแตะ** · เขียนผ่าน `sheet_write.py` (`--dry-run` ก่อน · ทุกแถวมี `"tc"` anchor) **ห้ามยิง Sheets API เขียน tab TC เอง** — รายละเอียด 3 ชั้น: [ai-assisted-testing-template.md § Write-scope guard](../docs/ai-assisted-testing-template.md#-write-scope-guard--ai-แตะได้เฉพาะงานของรอบตัวเอง-3-ชั้น--บังคับ) |

## Customer UAT sheet (regression TC delivery)

Customer-facing regression sheet — HI-QA runs delivery-gate regression from it.

| Field | Value |
|-------|-------|
| Sheet | https://docs.google.com/spreadsheets/d/<CUSTOMER_UAT_SHEET_ID>/edit |
| OLS tab | `OLS: TC List` (gid `2084955184`) — cols B–G = Module · Test case name · Pre-requisite · Test data · Test step · Expected Result. **Only B–G are ours**; col A (No.) pre-filled, cols H+ = SKL-QA/HI-QA tester columns — never touch. Other tabs (ELMS/CBMS/EvMS/…) never touch. |
| Auto-sync | launchd `com.<USER>.ols-regression-sync` Mon–Fri 10:30+17:00 runs `~/ols-qa-testing-bot/regression_sync.py` — appends System-Test PASSED cases from DONE stories, idempotent. Details: [regression-tc-sync.md](../docs/regression-tc-sync.md) |

## Screenshot evidence (Drive)

Per-ticket screenshot capture for QA evidence — one folder per ticket.

| Field | Value |
|-------|-------|
| Root folder | `Capture screen (OLS)` → https://drive.google.com/drive/folders/<EVIDENCE_DRIVE_ROOT_ID> |
| Per-ticket folder | `OLS-<key>` (e.g. `OLS-44`) — create it if missing before testing |
| Naming | one screenshot per Expected Result, e.g. `TC_01-ER_1.png` — mirror `docs/result/OLS-<key>/` |
| 🔐 **Write scope (บังคับ)** | อัปโหลดผ่าน `drive_upload.py` เท่านั้น — เขียนได้เฉพาะในโฟลเดอร์ `OLS-<key>` · **ไฟล์ที่ QA อัปไว้ = ห้ามทับ ห้ามลบ ห้าม rename และห้ามเอาลิงก์มาอ้างเป็นหลักฐานของรอบ AI** · ชนชื่อ → เปลี่ยนชื่อไฟล์ของรอบเราแล้วอัปใหม่ |

## Bug ticket field schema (where the bug content actually lives)

**OLS Bug tickets keep their content in custom fields, NOT in the `description` field** (which is
empty on OLS bugs — verified OLS-75, OLS-227, 2026-07-18). Any retest/verdict logic MUST read these,
not `description`. All are ADF (`{"type":"doc",…}`) — parse the text out.

| Field ID | Meaning | Use in retest |
|----------|---------|---------------|
| `customfield_12116` | **Expected result** | the verdict source — compare the fixed behavior against this **character-by-character** where it specifies exact wording (WORKFLOW.md line 388). ALL items met = PASSED; any unmet = FAILED |
| `customfield_12113` | **Test step** | the steps to reproduce / re-verify the fix |
| `customfield_12112` | **Test data** | data/preconditions needed to reproduce |
| `customfield_12114` | **Actual result** | the original bug symptom (what to confirm is now gone) |
| `customfield_12115` | Actual result link | evidence link from the original report |
| `customfield_12111` | Root cause description | dev's root-cause note |
| `customfield_12110` | Root cause type | e.g. "Logic Error" |
| `customfield_12122` | Severity | e.g. High |
| `customfield_12118` | Web browser name | e.g. Google Chrome |
| `customfield_12125` | Detected on Environment | e.g. Dev |
| `customfield_12120` | **QA Owner** | Discord ping target (array; NEVER the Reporter — see below) |
| `customfield_12123` | Test Result Approval by QA | QA approval state |
| `customfield_12124` | Pair Testing Status | |

Read call (retest): `GET /rest/api/3/issue/<KEY>?fields=summary,status,issuetype,customfield_12116,customfield_12113,customfield_12112,customfield_12114,customfield_12111,customfield_12122,customfield_12118,customfield_12125,customfield_12120`. If `customfield_12116` is empty, fall back to any expected-result text in a comment/description; if still nothing → **BLOCKED** (cannot verdict without an expected result).

## Retest-bug QA notify

After a retest-bug close-out (retest-bug-workflow Step 9), post a **retest-result FYI** to the QA Discord thread.

- Helper: `discord_qa_notify.py --mode retest --ticket OLS-<key> --title "<jira title>" --summary "Retest of dev fix" --pass-count N --fail-count N --blocked-count N --body $'• <bullet>' --result-link "<Jira retest-comment URL>?focusedCommentId=<id>" --qa-owner "<QA Owner name>" --owner-label "QA Owner"` — always `--dry-run` first, eyeball, then send.
- **Recipient = the ticket's QA Owner — Jira field `customfield_12120` — NEVER the Reporter** (user correction 2026-07-15 after 3 wrong pings). Read the field from the bug itself before every send; pass that exact name as `--qa-owner`. If `customfield_12120` is empty → ask the user, do not fall back to Reporter silently.
- Retest mode = single verdict headline + link to the Jira retest comment — **no** "pending review" wording, no Sheet tab (a retest bug is not tracked in the QA sheet).
- Thread, webhook location, name→Discord-ID roster, and the @mention + User-Agent rules: reuse [ai-assisted-testing-template.md](../docs/ai-assisted-testing-template.md) Stage 6 and local agent memory `reference_ols-discord-qa-notify`. **Webhook URL is a secret — never commit it here.**

## TC glossary (terminology source of truth)

Thai wording used inside test case content. Rules: [tc-glossary.md](tc-glossary.md).

| Field | Value |
|-------|-------|
| Published sheet | https://docs.google.com/spreadsheets/d/e/<TC_GLOSSARY_PUB_ID>/pubhtml |
| Tab | `คำที่ใช้ใน TC` |
| `gid` | `1039533787` |
| CSV export | `https://docs.google.com/spreadsheets/d/e/<TC_GLOSSARY_PUB_ID>/pub?gid=1039533787&single=true&output=csv` |
| Local mirror | `references/tc-glossary.csv` — verbatim export; never hand-edit |
| Other tabs (not used for TC wording) | `EvMS` (gid 0) · `CBMS` (996233269) · `ELMS` (2836061) · `OLS` (1770700178) · `จำแนก TC` (221306802) |

Re-fetch and confirm with the user **before every TC design run** — see [tc-glossary.md](tc-glossary.md) § Re-check gate.

## Test Environment

| Env | URL |
|-----|-----|
| Dev | `https://<DEV_HOST>/` — **VPN required** · auth via NDLP68 SSO |
| Staging | *(not configured — ask user and update this table)* |
| Production | *(not configured — ask user and update this table)* |

### Auth / login flow

> **🛑 Pre-flight all-role login smoke gate — ก่อนเริ่มเทสสตอรี่ทุกครั้ง (บังคับ, user 2026-07-21).**
> ก่อนเริ่มเทสสตอรี่ **ทุกครั้ง** ต้องลอง **headless login ให้ครบทั้ง 5 role** ก่อน (ไม่ใช่แค่ role ที่เคสใช้) → ทำตารางผลต่อ role (✅/❌ + reason) แจ้ง user. ทุก role ผ่าน → เริ่มเทสได้; มี role ล้ม → หยุด + รายงาน + รอ user (หรือ user สั่งข้าม role นั้น). ดัก auth-backend ล้ม(เช่น NDLP68 `400` — [[ols-ndlp68-login-backend-400]]) ตั้งแต่ต้น. ขั้นตอนเต็ม → template [ai-assisted-testing-template.md](../docs/ai-assisted-testing-template.md) §2.3.4; สำหรับ unattended bot = mark role ที่ล้มเป็น Blocked ไม่ halt.

OLS ไม่มีหน้า login ของตัวเอง — login ผ่าน **NDLP68 portal** (`https://<SSO_PORTAL_HOST>`) แล้ว SSO session carry เข้า OLS อัตโนมัติ. NDLP68 เซ็ต auth cookie บน parent domain `<COOKIE_DOMAIN>` → cookie ส่งถึง `<DEV_HOST>` เอง (login ndlp68 สำเร็จ → refresh dev-ols = login แล้ว). Login API: `POST {backend}/auth/login-with-email`, cookie session (`withCredentials`); backend = `school-core-api-{env}<COOKIE_DOMAIN>` (env ∈ dev/uat/preprod/ndlp68/prod).

- **Full step-by-step runbook + NDLP→OLS role mapping:** [ols-login-runbook.md](../docs/ols-login-runbook.md) — AI ตามไฟล์นี้เพื่อ login ทดสอบระบบได้เลย
- **Account**: staging accounts มี 5 roles (Student / Teacher / School Admin / Admin OBEC / Region Admin) — email + password **ไม่ commit ลง repo (public)** → เก็บใน agent memory (local) หรือขอจาก user. Teacher = role หลักของ creator/media QA. Role mapping → OLS: Student=Learner · Teacher=NDLP Creator · School Admin=Admin Content · Admin OBEC=Admin User · Region Admin=TBD.
- **Automated login (verified working):** ใช้ headless `use_browser` (skill `superpowers-chrome:browsing`) — invisible, ไม่แตะจอ user. Flow: accept PDPA overlay ("ยอมรับ") → เปิด login modal (`#email` / `#password`) → submit. **reCAPTCHA v3 ผ่านแบบ headless ได้ ไม่โดน block.** Full runbook + selectors อยู่ใน agent memory `reference_ols-ndlp68-auto-login`. (แก้ note เดิม: automation ไม่ได้โดน classifier block — login มือเป็น fallback สุดท้ายเท่านั้น)
- Verify creator mode: sidebar มี "จัดการสื่อการเรียนรู้" + ปุ่มล่างเขียน "เปลี่ยนเป็น Learner mode" (dev-ols เปิดมาเป็น Learner view ก่อน, `localStorage.isCreator=false` → กด toggle เป็น Creator mode)
- **Detailed runbook** (tooling workarounds, สร้าง test data, status transitions): `docs/result/OLS-44/ols-44-creator-media-editing-testing.md` § Setup & Runbook

## OLS domain — LP states & test-data recipes (learned OLS-26, 2026-07-13)

**Learning Path (LP = "เส้นทางการเรียนรู้") status model** (from app bundle `LearningPathStatus`): `Draft (แบบร่าง) · Published (เผยแพร่) · PendingEdit (รอแก้ไข) · Unpublished (ยกเลิกการเผยแพร่) · Flagged (ถูกรายงาน)` + delete = **recoverable soft-delete** → view shows "เนื้อหานี้ถูกลบแล้ว".
- ⚠️ **"ไม่อนุมัติ / rejected" is NOT a normal LP status** — it belongs to the **media** community-approval vote flow (OLS-86), not LP. An LP TC asking for "ไม่อนุมัติ" is likely a spec copy-paste from the media flow → confirm with PO before testing (M2).
- **Status-specific LP views require an authenticated learner** — a pure guest gets 404/loading for non-published LPs.
- **Progress is tracked GLOBAL per media, not per enrollment** (`PUT /api/media/{id}/progress`; enrollment object is just `{"enrolled":true}`). Courses are shared across LPs → completing a course in one LP also completes it in every LP that reuses it. ⚠️ กระทบการเตรียม fixture: dev มี LP ที่ enroll ได้จริงจำกัด (ช่วง OLS-26 มีตัวเดียว "นักบวช") — ทำ state "เรียนจบ" จะทับ fixture "กำลังเรียน" ของเคสอื่น · แก้: Creator สร้าง LP+คอร์สใหม่แยกเป็น fixture.
- **Non-owner direct-URL view of a non-published LP → generic error "ไม่สามารถโหลดข้อมูลได้" (API 403/404), NOT a state-specific message** (learned OLS-26 TC_16/17/18). ข้อความเฉพาะสถานะ ("เนื้อหานี้ไม่พร้อมใช้งาน"/"ถูกลบแล้ว"/"อยู่ระหว่างการแก้ไข") อาจตั้งใจให้ขึ้นเฉพาะ surface "การเรียนของฉัน" ของ learner ที่ enroll ไว้ — ยืนยันกับ PO.
- **Delete = recoverable soft-delete** (API) แต่ **UI dialog เตือน "ไม่สามารถย้อนกลับได้"** (ขัดกัน) และไม่มีปุ่มกู้คืนใน creator UI → ยืนยันกับ dev ว่าอันไหน authoritative · toast สำเร็จ = "ลบเส้นทางการเรียนรู้เรียบร้อยแล้ว".
- **Known bug (OLS-26):** ปุ่ม **"บันทึก" (bookmark)** บนหน้า LP/course กดแล้วไม่ทำงาน — ไม่มี network request / state change / console error (ขณะ enroll ทำงานปกติ). LP ใน "การบันทึกของฉัน" เดิมเป็น placeholder id (`learning-path-1/2/3`) เปิดแล้ว error.

**Test-data recipes — which ticket + role produces which state** (use per M17 when a case is blocked for missing data):

| Need (state/data) | Recipe ticket | Role | Notes |
|---|---|---|---|
| Create an LP | OLS-24 `[LP,Create]` | Creator | |
| Enroll + progress (กำลังเรียน/เรียนจบ/progress ต่างกัน) | **OLS-29** `[LP] Enroll & Learn` · OLS-47 `[Profile-Learner]` | Learner | enroll then complete lessons through UI |
| PendingEdit (รอแก้ไข) | OLS-55 `[LP,Update]` | Creator | edit a Published LP → becomes รอแก้ไข |
| Deleted (ถูกลบ) | OLS-56 `[LP,Delete]` | Creator | "ลบ" button shows only for Draft/PendingEdit; **soft, recoverable**; safe to delete a throwaway LP you create |
| Unpublished (ยกเลิกเผยแพร่) | OLS-57 `[LP,Unpublish]` | Creator | ดูรายละเอียด → ยกเลิกการเผยแพร่ → confirm; reversible |
| Flagged (ถูกรายงาน) | OLS-31 `[Moderation][Learner] report` (+ OLS-32 Admin) | Learner reports | needs a non-owner user + report-count threshold → may be hard/Blocked |
| (media) rejected/approved | OLS-86 `[Admin] Approval/Reject` | Admin/approver | vote-based, **media only, not LP** |

**Login gotcha:** the NDLP68 landing page shows a royal **"commemorative modal"** that intercepts the login button — dismiss it first (`button[aria-label="Close commemorative modal"]` or press Escape) before the PDPA + login steps. See [ols-login-runbook.md](../docs/ols-login-runbook.md).

**Headless MP4 + screenshot capture harness:** `~/ols-qa-testing-bot/capture/ols_capture.js` (Playwright + ffmpeg) — the Stage 4.4 MP4 capability. Details: agent memory `reference_ols-mp4-capture`.

## Default assignee / reporter

*(not configured — ask user and update this table)*

## Preferred CSV format

Default: UTF-8, comma-separated, with header row (per `references/csv-export-rules.md`).
