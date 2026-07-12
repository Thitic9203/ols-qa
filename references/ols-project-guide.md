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

## Screenshot evidence (Drive)

Per-ticket screenshot capture for QA evidence — one folder per ticket.

| Field | Value |
|-------|-------|
| Root folder | `Capture screen (OLS)` → https://drive.google.com/drive/folders/<EVIDENCE_DRIVE_ROOT_ID> |
| Per-ticket folder | `OLS-<key>` (e.g. `OLS-44`) — create it if missing before testing |
| Naming | one screenshot per Expected Result, e.g. `TC_01-ER_1.png` — mirror `docs/result/OLS-<key>/` |

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
