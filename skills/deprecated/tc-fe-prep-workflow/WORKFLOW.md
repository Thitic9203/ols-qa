---
name: tc-fe-prep-workflow
description: |
  Prepare frontend manual test cases (Thai, ราชบัณฑิตยสภา) from a Jira story (AC/EC) with mandatory AC/EC coverage review and ISTQB/29119-3 quality check, then draft table in chat, export a Qase-import CSV (Import_Qase_{ISSUE_KEY}.csv) attached to one comment on that story only, and close with a four-axis final TC review report (AC/EC alignment, spelling, numbering, scope).
  Use when the user asks for FE test cases, manual TC from acceptance criteria, draft TC comment on Jira, or TC FE Preparation from Helix (/tc-fe-prep).
  Do NOT use for API-only Swagger test cases (tc-api-prep-workflow), Playwright execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bug tickets (create-bug-workflow).
---

# TC FE Prep Workflow

Prepare **frontend manual test cases** from a Jira **story** (acceptance criteria + edge cases), get user approval in chat, then publish **one comment** on **that story only** with a markdown table plus a downloadable CSV/Excel attachment.

**Portable:** Works in any AI agent that can read this skill. **Project-agnostic:** No hardcoded repos, paths, or ticket numbers.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md). Ask one focused question at a time when setup is missing.

## Refusal-first (precondition gate)

MUST refuse to start until the user provides a **Jira story key or browse URL** — because TC rows must trace to AC/EC on a specific issue.

If missing, stop with the refusal template from skill-rules-style.md (list missing items; do not invent a story).

## Prerequisites (read before Step 0)

Read [references/prerequisites.md](references/prerequisites.md) and [references/jira-formatting.md](references/jira-formatting.md).

**Before Step 0:** confirm the **story** issue key with the user; NEVER post to Jira until they approve the draft in chat — because premature comments are hard to retract cleanly.

On first response after constraints, follow [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) for **TC FE prep**.

---

## Step 0 — Obtain the story

If the user did not provide a ticket key or URL:

> Which Jira story should I prepare FE test cases for? Please share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the URL when possible.

---

## Step 1 — Load or create project config

If workspace-guide-discovery already loaded a guide → use it and go to Step 2.

Otherwise:

1. Ask using `references/project-config-template.md` (one section at a time).
2. Offer to save answers into `references/{PROJECT}-tc-fe-prep-guide.md` in the user’s repo.

Config should capture: Jira domain, default story vs sub-task policy, portal names, shared login role, CSV column headers (if non-default), export format preference (`csv` / `xlsx`; default `csv`), and publish method preference.

---

## Step 2 — Extract requirements

From the Jira story, build a checklist:

| Source | Extract |
|--------|---------|
| AC rows | Actor, action, expected UI/API outcome |
| EC rows | Invalid input, validation messages, blocked save |
| Description | Status names, tabs, field limits, forbidden actions |
| Linked docs | Seed data steps (reference by ticket id in text only) |

**Must not:** Copy unrelated business rules from other stories unless user confirms they apply to an AC/EC here.

---

## Step 2.5 — Conflict check against PRD and Figma (pre-design gate)

**Must complete before Step 3.** Do not skip even if requirements look complete — conflicts caught here prevent rework after TCs are drafted.

### 2.5a — Locate PRD and Figma links

Check the ticket's description and linked documents for a **PRD link** and **Figma link**.

If either is missing, ask the user once:

> Before I start designing test cases, I'd like to cross-check the ticket against the PRD and Figma design to catch any conflicts early.
>
> Could you share links to any that are missing?
> - **PRD:** [found at {link} / not found — please share if available]
> - **Figma:** [found at {link} / not found — please share if available]
>
> If neither exists for this story, reply "no PRD / no Figma" and I'll proceed with ticket content only.

**Wait for the user's response.** If the user confirms that a source does not exist (or provides no link after being asked):

- **Tell the user in chat** — explicitly state which link(s) are missing, e.g.:
  - "ไม่พบลิงก์ Figma ใน ticket — จะ draft TC จาก ticket content เท่านั้น"
  - "ไม่พบลิงก์ PRD ใน ticket — จะ draft TC จาก ticket content เท่านั้น"
  - "ไม่พบทั้งลิงก์ Figma และ PRD ใน ticket — จะ draft TC จาก ticket content เท่านั้น"
- **Record which links are absent** (Figma / PRD / both) for use in the Remark block (Step 3e / Step 5).
- Go to Step 3.

### 2.5b — Collect source metadata (recency)

For each source that is available, record its **last-updated datetime** before comparing content:

| Source | What to look for |
|--------|-----------------|
| Jira ticket | "Updated" timestamp in issue detail; story status (Open / In Progress / Done) |
| PRD | Page last-modified datetime (Confluence footer); version number in page title if present |
| Figma | Frame or page last-edited datetime shown in Figma (hover the file or frame); version label in page/frame name if present |

**Timezone:** All datetimes MUST be displayed in **Bangkok time (ICT, UTC+7)**. Convert from UTC or any other timezone before displaying — never show UTC or raw platform timestamps.

Format: `DD Mon YYYY HH.MM AM/PM` (e.g. `05 Jun 2026 02.30 PM`)

If a datetime cannot be determined, mark it **"ไม่ทราบวันที่"** — do not guess.

**Recency rule:** The most recently updated source is the **stronger default truth**. When two sources conflict, the newer one takes precedence unless the user says otherwise. Always surface recency in the report so the user can override this default.

### 2.5c — Cross-reference and conflict detection

Compare against the story's AC/EC and description across these areas:

| Check area | What to look for |
|-----------|-----------------|
| AC/EC vs PRD | AC/EC items absent from PRD, or PRD requirements not reflected in any AC/EC |
| AC/EC vs Figma | UI flows, field labels, error messages, or states in Figma that differ from the AC/EC description |
| Description vs Figma | Status names, tabs, field limits, or forbidden actions in the ticket description vs Figma |
| Scope gaps | Features visible in Figma/PRD that no AC/EC covers |
| Contradictions | Conflicting expected results between ticket and PRD/Figma |

### 2.5d — Report findings in chat

Post the conflict report block in chat (always post, even when no conflicts).

**Column detail rules — every cell must be fully written out, never summarised or abbreviated:**

| Column | What to put in it |
|--------|------------------|
| **AC/EC** | Label + full text of the acceptance/edge criterion as written in the ticket (e.g. `AC_02: When the user clicks Save, the system saves the record and shows a success toast`) |
| **Area** | Specific UI element, field, flow, or rule being compared — not a generic category (e.g. `Save button → post-save feedback` not just `Save`) |
| **Ticket says** | Exact wording or behavior from the ticket — quote verbatim where possible; include field names, error texts, UI labels as written |
| **PRD/Figma says** | Exact wording, label, or behavior from PRD/Figma; include frame name/number or PRD section for traceability (e.g. `Figma frame P-14: modal titled "ยืนยันการบันทึก?" with "ตกลง" and "ยกเลิก" buttons`) |
| **Newer source (ICT)** | Source name + its last-updated datetime in `DD Mon YYYY HH.MM AM/PM` |
| **Severity** | High = blocks TC design or changes core flow; Medium = affects expected result wording or label; Low = cosmetic / minor label difference |

```
**Conflict Check — {ISSUE_KEY} vs PRD/Figma**

**Source recency** *(Bangkok time, ICT UTC+7)*
| Source | Last updated (ICT) | Notes |
|--------|-------------------|-------|
| Ticket ({ISSUE_KEY}) | {DD Mon YYYY HH.MM AM/PM or "Unknown"} | Status: {Open/In Progress/Done} |
| PRD | {DD Mon YYYY HH.MM AM/PM or "Unknown"} | {version label if any} |
| Figma | {DD Mon YYYY HH.MM AM/PM or "Unknown"} | {version/frame label if any} |

**Most recently updated:** {source name} ({DD Mon YYYY HH.MM AM/PM ICT}) → treated as stronger truth by default.

---

**Conflicts found: YES / NO**

| # | AC/EC | Area | Ticket says | PRD/Figma says | Newer source (ICT) | Severity |
|---|-------|------|-------------|----------------|-------------------|----------|
| 1 | {label}: {full AC/EC text from ticket} | {specific UI element / field / flow / rule} | {exact wording or behavior from ticket — quote verbatim} | {exact wording, label, or behavior from PRD/Figma — include frame or section ref} | {Source name} — {DD Mon YYYY HH.MM AM/PM} | High / Medium / Low |

**Scope gaps (in PRD/Figma but no AC/EC covers it):**
| # | Source | Where | What is shown | Why it may matter |
|---|--------|-------|---------------|------------------|
| 1 | {Figma frame {ref} / PRD section {ref}} | {screen / page / section name} | {full description of the feature or element shown} | {impact on TC scope if included or excluded} |

**Recommendation:** {resolve before designing TCs — list conflict numbers that need user answer / proceed and note gaps in TC remarks / proceed — no conflicts}
```

**If NO conflicts and no gaps:** set `Conflicts found: NO`, write "—" in all conflict rows, write "—" in gap table, note "Recommendation: proceed — no conflicts", then continue to Step 3 immediately.

**If conflicts or gaps found:** present the recommended resolution per item (based on recency), then **wait for the user to confirm or override** each item. Do NOT start Step 3 on unresolved conflicts — TCs built on contradictory requirements must be redesigned.

---

## Step 3 — Design test cases

### 3a — Pre-design setup

All settings in this workspace are **fixed** — do NOT ask the user about any of them:

- **TC Language = Thai (always).** All test case content is formal Thai per ราชบัณฑิตยสภา (Step 3b). English only where no official Thai term exists, and only after the Step 4.5 term-confirmation gate.
- **Type column is always present**, restricted to `System Test` / `Unit Test` / `Integration Test` (Qase Type field — Step 3d). Do not offer to skip it.
- **TC ID = simple sequential number: 1, 2, 3** (see Step 3c). No prefix, no padding, no format selection. Do not ask.
- **Typed CSVs**: all three (Unit_Test, Integration_Test, System_Test) are generated when TCs of that type exist — no selection needed. Each populated with TCs filtered by Type and mapped to that template's columns (Step 6).

**No questions needed in this step — proceed to Step 3b.**

(Note: Qase auto-generates its own case IDs on import; the Test Case ID column is for the Jira comment table and traceability only.)

### 3b — Language rules (Thai always)

This workspace writes **all** FE test case content in Thai. There is no English-only mode.

**Thai mode (the only mode):**
- All content in formal/professional Thai (ภาษาทางการ) — suitable for internal and external stakeholder delivery.
- **Term priority: ราชบัณฑิตยสภา Thai term first → English if no official term exists.**
  - Use the current Royal Institute of Thailand (ราชบัณฑิตยสภา) approved term whenever one exists.
  - Only use English when the Royal Institute has not defined a Thai equivalent, or when the system UI displays the term in English and changing it would cause confusion (e.g. a button literally labelled "Submit" in the UI).
- **Common terms with approved Thai equivalents (use these, not English):**

  | English | ใช้คำไทย |
  |---------|----------|
  | Login / Sign in | เข้าสู่ระบบ |
  | Logout / Sign out | ออกจากระบบ |
  | Button | ปุ่ม |
  | Checkbox | ช่องทำเครื่องหมาย |
  | Search | ค้นหา |
  | Filter | กรอง / ตัวกรอง |
  | Sort | เรียงลำดับ |
  | Upload | อัปโหลด *(ราชบัณฑิต ทับศัพท์)* |
  | Download | ดาวน์โหลด *(ราชบัณฑิต ทับศัพท์)* |
  | Export | ส่งออก |
  | Import | นำเข้า |
  | Status | สถานะ |
  | Role | บทบาท / สิทธิ์ |
  | Permission | สิทธิ์การเข้าถึง |
  | Password | รหัสผ่าน |
  | Username | ชื่อผู้ใช้ |
  | Cancel | ยกเลิก |
  | Confirm | ยืนยัน |
  | Reset | รีเซ็ต *(ราชบัณฑิต ทับศัพท์)* |
  | Submit | ส่ง / บันทึก *(แล้วแต่ context)* |
  | Error message | ข้อความแสดงข้อผิดพลาด |
  | Notification / Toast | การแจ้งเตือน |
  | Modal / Dialog | กล่องโต้ตอบ |
  | Tab | แท็บ *(ราชบัณฑิต ทับศัพท์)* |
  | Dropdown | รายการแบบเลื่อนลง |
  | Toggle | ปุ่มสลับ |
  | Sidebar | แถบด้านข้าง |
  | Navbar | แถบนำทาง |
  | Dashboard | แดชบอร์ด *(ราชบัณฑิต ทับศัพท์)* |
  | Input field | ช่องกรอกข้อมูล |

- **Keep in English** (no official Thai term, or internationally standardised):
  - Acronyms and technical standards: API, URL, HTTP, HTTPS, CRUD, QA, UX, UI, ID, OTP, JWT, Token
  - Feature/module names **as displayed in the system UI** — if the UI shows "Dashboard" in English, refer to it as "Dashboard" not "แดชบอร์ด"
  - Error codes and field keys (e.g. `OLS_ERR_401`, `user_id`)
- Numbered items in Test Steps and Expected Result must still use numerals (`1.`, `2.`, `3.`).

### 3c — TC ID rules (fixed — no user input)

TC IDs are always simple sequential numbers: `1`, `2`, `3`, …

- No prefix (`TC_`, `OLS-`, feature name, etc.)
- No leading-zero padding
- Applies to **every output**: Jira comment table, Draft_Jira CSV, Import_Qase CSV, and all typed CSVs
- In typed CSVs (Unit/Integration/System), the number column (`No.` / `ลำดับ`) restarts at 1 within that file (since the file is filtered to one Type)
- Do not ask the user about format — it is fixed

### 3d — Type column (always present)

**Type** is the Qase `Type` field. It is always present (after Priority).

**Allowed values (exactly these three — no others):** `System Test` | `Unit Test` | `Integration Test`

**Assignment rules:**
- Assign the type that best describes *what layer* the test case validates:
  - **System Test** — end-to-end UI flow (user can see and interact with the feature as a whole)
  - **Integration Test** — verifying that two or more components/services work together (e.g. FE → API → DB round-trip)
  - **Unit Test** — isolated behaviour of one element (e.g. field validation, single component logic)
- A ticket does **not** need to have all three types — derive only what the AC/EC actually requires.
- When a type has no applicable test cases for this ticket, **do NOT invent cases just to fill the type**. Instead, add a Remark block under the table (see below).
- Extra test cases may be added to cover a type's perspective **only if** they stay within the scope of the AC/EC on this ticket — do not pull in requirements from other tickets.

**Remark block (add after the table when any type is absent OR when Figma/PRD links were missing):**

```
**Remark — Type coverage:**
- No *System Test* cases for this ticket.
- No *Integration Test* cases for this ticket.
```

List only the types that are absent. Omit types that have at least one test case.

**Missing-link Remark lines** — append to the Remark block when a source link was not found in the ticket:

```
- ไม่มีลิงก์ Figma ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
- ไม่มีลิงก์ PRD ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
```

Include only the line(s) that apply (Figma / PRD / both). If both links exist, omit these lines entirely.

---

Default **10 columns** (change only if user specifies otherwise) — Type is always included:

| Column | Purpose |
|--------|---------|
| Acceptance Criteria | AC_0n / EC_0n label + short summary (full text in the Qase **AC/EC** column) |
| Services Impacted | e.g. `- Service Name` |
| Test Case ID | Sequential number: 1, 2, 3 (fixed — no prefix, no padding) |
| Test Title | Action + expected outcome (no `[Tag]` prefixes unless user wants them) |
| Precondition | **Jira comment table:** short reference ("ทำ shared prep ครบแล้ว") + per-case setup. **CSV exports (Draft_Jira, Import_Qase, all typed CSVs):** full shared prep steps expanded inline (numbered, continuous) + per-case setup — CSV files are standalone; no separate shared-prep block. |
| Test Data | Values to enter |
| Test Steps | Numbered manual steps |
| Expected Result | Numbered assertions |
| Priority | High / Medium / Low |
| **Type** | `System Test` / `Unit Test` / `Integration Test` (Step 3d) |

The Qase import CSV uses a **different** column set (AC/EC, Title, Preconditions, Priority, Type, Status, Suite, Steps, Tags) — see [qase-import-format.md](references/qase-import-format.md). The Jira markdown table above and the Qase CSV describe the same test cases in two layouts.

**Shared data prep (above table)** — typical pattern:

1. Log in with the required role.
2. Navigate to the feature area.
3. Open the correct tab or filter.
4. Ensure required data state exists (with "if missing, create via …" referencing another story id if needed).
5. Identify the target entity used across TCs.

Add a **Precondition column note** above the table explaining that the column means: *after shared prep, before Test Steps*.

**Precondition in CSV exports (all files):** Unlike the Jira comment table, CSV files have no separate shared-prep block. The Precondition cell must contain the full shared prep steps expanded inline, followed by any per-case steps. Re-number all steps continuously (1, 2, 3, …). Apply to Draft_Jira, Import_Qase, and all typed CSVs (Unit_Test, Integration_Test, System_Test).

### 3e — Row ordering

Sort rows before presenting the draft.

Row ordering differs by output:

**Jira comment + Draft_Jira CSV** — sort by AC/EC only (no Type grouping):
1. All ACs first, ascending by number (AC_01, AC_02, AC_03, …)
2. All ECs after, ascending by number (EC_01, EC_02, EC_03, …)

Within the same AC or EC label, keep multiple TCs together in the order they were designed.

**Import_Qase CSV** — sort by Type first, then AC/EC within each group:
1. All `Unit Test` rows first
2. Then all `Integration Test` rows
3. Then all `System Test` rows

Within each Type group: ACs ascending (AC_01, AC_02, …), then ECs ascending (EC_01, EC_02, …). TC IDs (Test Case ID column) run continuously 1, 2, 3, … across the whole file — do NOT restart per Type group.

**Typed CSVs (Unit_Test, Integration_Test, System_Test)** — each file contains only its own Type; sort rows within the file: ACs ascending, then ECs ascending. TC ID (`No.`) restarts at 1 within each file.

**Important:** Do NOT use Type as a sort/group key in the Jira comment or Draft_Jira CSV — Type is a column value only in those outputs.

---

## Step 4 — Coverage & quality review (mandatory; 1–2 rounds)

MUST complete **before** Step 5. Do not skip because the first draft “looks fine.”

### 4a — AC / EC coverage (FE scope)

Follow [ac-ec-coverage-review.md](references/ac-ec-coverage-review.md):

- Build the **traceability matrix** (every AC and EC → one or more `TC_*`).
- Confirm **ไม่ขาด** (full AC/EC outcomes covered), **ไม่เกิน / ไม่กาว / ไม่เพ้อ** (no orphan or invented cases).
- Row count **need not** equal AC+EC count; alignment matters, not 1:1 rows.

### 4b — International TC quality (ISTQB + ISO/IEC/IEEE 29119-3)

Follow [tc-quality-standards.md](../../references/tc-quality-standards.md) on every row (objective, preconditions, steps, expected results, priority, observability).

### 4c — Post review summary in chat

Post the **FE TC coverage review** block from ac-ec-coverage-review.md (with **Ready for draft: YES**).

MUST NOT show the full TC table until **Ready for draft: YES** — because stakeholders approve coverage before row-level editing.

### 4d — Coverage delta summary

Post the table from [coverage-delta-template.md](../../references/coverage-delta-template.md) (FE section) — even when all rows are `OK`.

If review fails → fix Step 3 design and re-run 4a–4d (max 2 rounds).

---

## Step 4.5 — Thai↔English term confirmation (mandatory gate)

Because content is Thai by default but some terms stay in English (Step 3b), the user MUST see and approve the term choices **before** any content is written to the real TC file.

After the Step 4 review passes and before showing the full draft (Step 5), post the term table in chat:

```
**Thai ↔ English terms used in this TC set**

These terms appear in the test cases. Thai follows ราชบัณฑิตยสภา; English is kept only where no suitable official Thai term exists or the system UI shows it in English.

| English term | ใช้ในเทสเคสเป็น | เหตุผลที่คงอังกฤษ (ถ้าคงไว้) |
|--------------|----------------|------------------------------|
| {term} | {Thai term used} / {kept as English} | {no official Thai term / UI shows it in English / acronym-standard / —} |

ต้องการปรับคำไหนไหมครับ? ถ้าโอเคทั้งหมด ผมจะใช้ชุดคำนี้เขียนลงเทสเคสจริง
```

**Rules:**
- List **every** term where a Thai-vs-English choice was made — both the ones translated to Thai and the ones deliberately kept in English.
- For each kept-English term, state the reason (no official Thai term / UI label is English / acronym or standard like API, URL, OTP).
- **Wait for the user's response.** If the user asks to change any term, apply it and re-post the changed rows.
- Only after the user confirms (or after applying their adjustments) proceed to Step 5 and use the confirmed terms in every cell.
- Do NOT write any TC content to a file (Step 6) until this gate is confirmed.

---

## Step 5 — Draft in chat (approval gate)

Post the full draft in the conversation:

```text
Draft TC FE as below

**Shared data preparation (all TCs):**
1. ...
2. ...

**Note — Precondition column:** After completing shared prep above, complete the numbered items in Precondition before Test Steps.

| **Acceptance Criteria** | **Services Impacted** | **Test Case ID** | **Test Title** | **Precondition** | **Test Data** | **Test Steps** | **Expected Result** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ... one row per TC ... |
```

**Language rule:** All content is Thai per Step 3b, using the terms confirmed at the Step 4.5 gate. Keep UI component names and technical terms in English only where the Step 4.5 table marked them as kept-English.

The **Type** column is always present. Use the 10-column header below, then append the Remark block (per Step 3d) after the table — listing any Type that has no test cases:

```text
| **Acceptance Criteria** | **Services Impacted** | **Test Case ID** | **Test Title** | **Precondition** | **Test Data** | **Test Steps** | **Expected Result** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ... one row per TC ... |

**Remark — Type coverage:**
- No *[Type]* test cases for this ticket.
- ไม่มีลิงก์ Figma ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
- ไม่มีลิงก์ PRD ระบุไว้ใน ticket ณ ขณะที่ draft TC ชุดนี้
```

*(Include missing-link lines only when the corresponding source was absent from the ticket. Omit lines for sources that were found.)*

**Header rule:** Every column header MUST be wrapped in `**bold**` in the chat draft, the Jira comment, and the markdown `.md` file — e.g. `| **Acceptance Criteria** |`. This applies here and in Step 7.

State clearly: **Not posted to Jira yet.**

**Wait for approval** or edit requests. Apply feedback, then re-show the changed sections.

---

## Step 6 — Save artifacts in the user's workspace

**Suite gate (do before writing the CSV):** The Qase CSV needs a **Suite** value per row. Inspect the OLS project's existing suite tree first (Qase web UI → Test cases → suite sidebar, or ask the user to paste the current suite list — there is no Qase MCP) and reuse a fitting suite; only propose a new suite (with user approval) when none fits. Never assign a suite blind, never create a duplicate. Full rules: [qase-import-format.md](references/qase-import-format.md) — Suite rules.

After approval (and Suite confirmed), write **four files** inside the user's project (paths relative to workspace root):

| File | Condition | Purpose |
|------|-----------|---------|
| `references/{ISSUE_KEY}_FE_TC.md` | always | Canonical markdown (prep block + Jira table) |
| `references/Draft_Jira_{ISSUE_KEY}.csv` | always (unless xlsx requested) | **Jira-format CSV** — same column set as the chat draft table (10 columns); use as source-of-truth for the comment table |
| `references/Import_Qase_{ISSUE_KEY}.csv` | always (unless xlsx requested) | **Qase import CSV** — schema per [qase-import-format.md](references/qase-import-format.md) |
| `references/Draft_Jira_{ISSUE_KEY}.xlsx` / `references/Import_Qase_{ISSUE_KEY}.xlsx` | user explicitly requested Excel/xlsx | Excel versions of both files above |
| `references/Unit_Test_{ISSUE_KEY}.csv` | only if Type = `Unit Test` TCs exist | **Typed content CSV** — 13 English columns; TCs filtered to Type = `Unit Test`, content mapped to Unit Test template columns (Step 6 mapping); Function/Sub Function groupings from ticket title + Services Impacted |
| `references/Integration_Test_{ISSUE_KEY}.csv` | only if Type = `Integration Test` TCs exist | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `Integration Test`, content mapped to Integration Test template columns (Step 6 mapping); summary footer |
| `references/System_Test_{ISSUE_KEY}.csv` | only if Type = `System Test` TCs exist | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `System Test`, content mapped to System Test template columns (Step 6 mapping); summary footer |

Both CSV files (`Draft_Jira` + `Import_Qase`) are always produced together and both are uploaded to Jira (Step 7). Follow [csv-export-rules.md](../../references/csv-export-rules.md) for cell cleaning (convert `<br>`, strip tags, preserve Thai) — applies to all CSV files. Never silently produce only one when both are required.

### Qase import CSV column mapping (`Import_Qase_{ISSUE_KEY}.csv`)

All columns must be populated — derive values for any column that has no direct source in the Jira draft:

| Qase column | Source | Derivation rule |
|-------------|--------|----------------|
| AC/EC | Acceptance Criteria | Direct copy — `{LABEL} — {full criterion text}` (e.g. `EC_07 — กรอก Metadata ไม่ครบ → ปุ่มส่งตรวจปิดใช้งาน`) |
| Title | Test Title | Direct copy |
| Preconditions | Precondition | Direct copy |
| Priority | Priority | Direct copy (`High` / `Medium` / `Low`) |
| Type | Type | Direct copy (`System Test` / `Unit Test` / `Integration Test`) |
| Status | *(fixed)* | Always `Done` |
| Suite | *(suite gate)* | From existing OLS suite tree — see Step 6 suite gate |
| Steps – Action | Test Steps | Direct copy |
| Steps – Expected result | Expected Result | Direct copy |
| Steps – Data | Test Data | Direct copy |
| Tags | Acceptance Criteria | Extract AC/EC reference(s) verbatim from the ticket — label + full criterion text, comma-separated (e.g. `AC_01 — ผู้ใช้สามารถบันทึกได้, EC_03 — กรณีที่ field ว่าง`). **MUST NOT invent or paraphrase AC/EC — use exact text from the ticket only.** Blank only if ticket has no AC/EC label for this TC. |

### Typed CSV export (generate only for types that have TCs)

Generate typed CSVs after `Draft_Jira` and `Import_Qase`. Full column/row specs and Python snippets: [csv-template-types.md](../../../references/csv-template-types.md).

**Filter TCs by Type:** Each typed CSV contains only the TCs whose `Type` column matches that file's type. TCs with a different Type are excluded.

**Column mapping — Jira draft → Unit Test (`Unit_Test_{ISSUE_KEY}.csv`):**

| Unit Test column | Source | Derivation rule |
|-----------------|--------|----------------|
| No. | Sequential within Sub Function group | Renumber from 1 per group |
| Sub Function | Services Impacted | One `Sub Function :` header row per distinct Services Impacted value |
| Test Scenario | Test Title | Direct copy |
| Test Description | Derived | Write a distinct description — NOT a repeat of Test Scenario. Synthesise from AC/EC reference + key outcome: e.g. `ตรวจสอบว่า [expected outcome from Expected Result] เมื่อ [key condition from Precondition]`. Must differ from Test Scenario in phrasing and perspective. |
| Pre-condition | Precondition | Direct copy |
| Test Step | Test Steps | Direct copy |
| Test Data | Test Data | Direct copy |
| Expected Result | Expected Result | Direct copy |
| Comment | Acceptance Criteria | Extract AC/EC label(s) (e.g. `AC_02`, `EC_05`) — traceability reference |
| Actual Result | *(execution result)* | Leave blank — tester fills after running the test |
| Test status | *(execution result)* | Leave blank — tester fills after running the test |
| Test Date | *(execution result)* | Leave blank — tester fills after running the test |
| Test By | *(execution result)* | Leave blank — tester fills after running the test |

Build 13-column English header with columns in this order: `No., Sub Function, Test Scenario, Test Description, Pre-condition, Test Step, Test Data, Expected Result, Actual Result, Test status, Test Date, Test By, Comment`. Insert one `Function :` row (col 1 only, cols 2–13 blank) using the ticket title/feature name, then for each distinct Services Impacted value insert a `Sub Function :` header row, then the numbered data rows for that group. No summary footer.

If no Unit Test TCs exist: **skip this file**. A skip-note will appear in the Jira comment footer (Step 7, after attachment links, before Disclaimer).

**Column mapping — Jira draft → Integration Test / System Test (`Integration_Test_{ISSUE_KEY}.csv` / `System_Test_{ISSUE_KEY}.csv`):**

| Thai column | Source | Derivation rule |
|-------------|--------|----------------|
| ลำดับ | Sequential (filtered set) | Renumber from 1 in filtered set |
| โมดูล | Services Impacted | Direct copy |
| รายการทดสอบ | Test Title | Direct copy |
| ขั้นตอนการทดสอบ | Test Steps | Direct copy |
| ผลการทดสอบที่คาดหวัง | Expected Result | Direct copy |
| หมายเหตุ | Precondition + Test Data | Derive: `เงื่อนไขเบื้องต้น: {Precondition text} / ข้อมูลทดสอบ: {Test Data text}` — preserves values that have no own column in this template; omit a segment if that source is blank |
| ผลการทดสอบ | *(execution result)* | Leave blank — tester fills after running the test |
| วันที่ทดสอบ | *(execution result)* | Leave blank — tester fills after running the test |
| ผู้ทดสอบ | *(execution result)* | Leave blank — tester fills after running the test |

Build 9-column Thai header; write sequential numbered rows from the filtered TC set; append 1 blank row then the 5-row summary footer. Encoding: UTF-8 BOM (`utf-8-sig`).

If no Integration Test TCs exist: **skip Integration_Test file**. If no System Test TCs exist: **skip System_Test file**. Skip-notes for each absent type appear in the Jira comment footer (Step 7, after attachment links, before Disclaimer).

See [references/publish-options.md](references/publish-options.md) for Jira delivery.

### ADF pre-compute (do in same step as CSV write)

After writing all CSV files, immediately build ADF JSON from the same approved table:

1. Convert every `<br>` in table cells → `{"type": "hardBreak"}` ADF node (rules: [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md))
2. Build complete ADF document with `__ATT1_ID__` and `__ATT2_ID__` as literal string placeholders in attachment link nodes
3. Store ADF string in agent context (transient — not written to a file)

Then report to user: "Files saved. ADF ready. Publishing..."

---

## Step 7 — Publish to Jira (story only)

**Target:** `{ISSUE_KEY}` story the user specified.

ADF is already built from Step 6 — proceed directly to fast publish. Full JS patterns: [jira-fast-publish.md](../../references/jira-fast-publish.md).

**Comment content:**

1. Intro line: `Draft TC FE as below`
2. Shared prep + precondition note
3. Full table (bold header cells) — **with `<br>` already converted to ADF hardBreak nodes**
4. Footer: clickable download links — one per uploaded file (see footer link pattern in [jira-formatting.md](references/jira-formatting.md)):
   - `[Draft_Jira_{ISSUE_KEY}.csv]({url})` — ตารางเทสเคส (Jira format)
   - `[Import_Qase_{ISSUE_KEY}.csv]({url})` — Qase import file พร้อม import เข้า OLS project
   - `[Unit_Test_{ISSUE_KEY}.csv]({url})` — Unit Test template พร้อม TC ประเภท Unit Test *(include only if file was generated)*
   - `[Integration_Test_{ISSUE_KEY}.csv]({url})` — Integration Test template พร้อม TC ประเภท Integration Test *(include only if file was generated)*
   - `[System_Test_{ISSUE_KEY}.csv]({url})` — System Test template พร้อม TC ประเภท System Test *(include only if file was generated)*
5. For each typed CSV type that was **skipped** (no TCs of that type), add one note line here (after all attachment links): `ไม่มี TC ประเภท [Unit Test / Integration Test / System Test] สำหรับ ticket นี้`
6. Disclaimer — **last line of the comment, after all attachment links** (exact text, do not translate or shorten):
   ```
   ⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io
   ```

**Publish method — ADF-direct (single JS call):**

TC tables always go ADF-direct — do NOT try MCP first.

1. Navigate to the Jira issue page (if not already there)
2. Pattern A: set `window.__csv1Data`, `window.__csv2Data`, `window.__adfBody` on `window.*`
3. Pattern B: single JS call — upload `Draft_Jira` → upload `Import_Qase` → post ADF comment. Upload order: `Draft_Jira` first, `Import_Qase` second, then typed CSVs in order (`Unit_Test`, `Integration_Test`, `System_Test` — add upload steps for each present file before the comment post)
4. Pattern C: read `window.__fastPublish` → check `status: 'ok'`; on error follow recovery rules in [jira-fast-publish.md](../../references/jira-fast-publish.md)

Attachment IDs captured in Pattern B are substituted into the ADF footer links automatically. Never write filenames as plain text.

**After publish — mandatory post-publish review on Jira UI:**

Run the **full review checklist** from [jira-comment-post-review.md](../../references/jira-comment-post-review.md). Key checks:

- [ ] All TC rows visible (not header only) — count must match approved draft.
- [ ] **No literal `<br>`, HTML tags, or `**` markers** visible as text in any cell (zero tolerance).
- [ ] Numbered items (`1. ` `2. ` `3. `) each on a **separate line** — not running together.
- [ ] Cell content matches approved draft (spot-check first, middle, last rows).
- [ ] **Both** `Draft_Jira_{ISSUE_KEY}.csv` and `Import_Qase_{ISSUE_KEY}.csv` attached to the same issue (not just in workspace) and **both** footer links work.
- [ ] Comment is on the **story**, not a sub-task.

If any check fails → fix and re-post → re-verify on Jira UI (max 3 rounds).

**MUST NOT tell user "commented" or "done" until all checks pass.** See [jira-comment-post-review.md](../../references/jira-comment-post-review.md) for fix procedures and reporting templates.

---

## Step 7.5 — Final TC review report (mandatory before "done")

After Step 7 post-publish review **passes** (or after final approved draft when publish was skipped), run the **four-axis final review** on the TC set the user will keep.

Follow [tc-final-review-report.md](references/tc-final-review-report.md):

1. Compare **published** Jira comment + attachment (or final approved draft + export) against the **story** AC, EC, description, and deferred-scope notes.
2. Score all four dimensions: **AC/EC alignment**, **spelling**, **numbering order**, **content / scope**.
3. Post the **user-facing report** from that reference (summary table + sections 1–4 + optional improvements).
4. Overall **PASS** required before Step 8. On **FAIL** → fix TC → re-publish or re-show draft → re-run (max 2 rounds).

**MUST NOT** say TC prep is complete, post the Step 8 `Verdict:` block, or offer the next workflow until this report is posted with overall **PASS**.

---

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + skill-specific:

- [ ] Step 2.5 conflict check completed; report block posted in chat; no unresolved conflicts before Step 3.
- [ ] TC IDs are simple sequential numbers (1, 2, 3) across all outputs — no prefix, no padding.
- [ ] Type column present on every row with a valid value (`System Test` / `Unit Test` / `Integration Test`); Remark block lists absent types.
- [ ] Step 4 review block posted with **Ready for draft: YES** and traceability matrix complete.
- [ ] AC/EC coverage complete; quality checklist PASS per tc-quality-standards.
- [ ] Step 4.5 Thai↔English term table posted; user confirmed (or adjustments applied) **before** any file write.
- [ ] All content is Thai per ราชบัณฑิตยสภา (Step 3b); English kept only where the Step 4.5 gate marked it kept-English.
- [ ] Suite gate done — every CSV row uses an existing OLS suite, or a new suite was user-approved; no duplicate suites.
- [ ] `Draft_Jira_{ISSUE_KEY}.csv` uses the 10-column Jira table schema; rows sorted ACs then ECs ascending; row count matches approved draft.
- [ ] `Import_Qase_{ISSUE_KEY}.csv` uses Qase schema, `Status = Done` on every row, cut fields absent; rows sorted Unit Test → Integration Test → System Test, ACs then ECs within each group, TC IDs continuous 1,2,3; row count matches approved draft.
- [ ] Both files uploaded to the Jira issue; both footer links verified working.
- [ ] Typed CSVs generated only for Types that have TCs; each filtered and content mapped to its template columns; all generated files uploaded to Jira; footer links present only for uploaded files; skipped types noted in comment.
- [ ] Disclaimer appended as **last line** of the Jira comment, after all attachment links (exact wording, not translated or shortened).
- [ ] Jira UI matches approved draft (not MCP output alone).
- [ ] Post-publish review passed per [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — no stray tags, numbered items on separate lines, attachment present.
- [ ] Step 7.5 final TC review report posted per [tc-final-review-report.md](references/tc-final-review-report.md) — all four axes **PASS**.
- [ ] Close-out includes `Verified:` after Jira re-open.
- [ ] Publish fix-verify (Step 7) completed — at least one Jira UI re-read.
- [ ] **Fresh-eyes:** re-read full draft before publish when table **> 15 rows**.
- [ ] [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section).

---

## Step 8 — Session closing

**Prerequisite:** Step 7.5 final review report posted with overall **PASS**.

Follow [session-closing.md](../../references/session-closing.md) — artifact index, one-line next workflow (e.g. `/testing-ticket` on same story), handoff file if long session, `Verdict:` block.

Complete [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section).

---

## Reference files

| File | Content |
|------|---------|
| [prerequisites.md](references/prerequisites.md) | Expanded pre-flight checklist |
| [qase-import-format.md](references/qase-import-format.md) | Qase import CSV schema, Type/Status/Suite rules, cut fields |
| [jira-formatting.md](references/jira-formatting.md) | Tables, `<br>`, ADF, CSV footer |
| [gotchas.md](references/gotchas.md) | Common failures |
| [markdown-template.md](references/markdown-template.md) | Copy-paste skeleton |
| [project-config-template.md](references/project-config-template.md) | First-time project questions |
| [publish-options.md](references/publish-options.md) | MCP vs browser vs manual |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |
| [ac-ec-coverage-review.md](references/ac-ec-coverage-review.md) | AC/EC traceability + scope review (pre-draft) |
| [tc-final-review-report.md](references/tc-final-review-report.md) | Four-axis final review + close-out report template |
| [tc-quality-standards.md](../../references/tc-quality-standards.md) | ISTQB / 29119-3 TC quality |
| [scripts/README.md](scripts/README.md) | Optional CSV/xlsx helper pointer |

---

## Out of scope

- API TC prep, Playwright ticket test, retest, create bug — see [skill-routing.md](../../references/skill-routing.md)

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST refuse without story key/URL | No traceable AC/EC source |
| MUST NOT comment on sub-tasks or other issues | Scope is one story |
| MUST NOT add TC outside story AC/EC | Traceability |
| MUST write all TC content in Thai (Step 3b) — there is no English-only mode | Workspace standard; English mode is not offered for FE TC |
| MUST use ราชบัณฑิตยสภา approved Thai term first (Step 3b); fall back to English only when no official term exists or the UI label is English | Authoritative Thai is more professional than ad-hoc transliteration or unnecessary English |
| MUST post the Step 4.5 Thai↔English term table and get user confirmation BEFORE writing any TC content to a file | User must approve term choices before they are committed to the real TC file |
| MUST use formal Thai language level throughout | TCs are delivered to internal and external teams |
| MUST keep Type to exactly `System Test` / `Unit Test` / `Integration Test` (Step 3d) | These are the OLS Qase Type values; other values break import |
| MUST set Status = `Done` on every Qase CSV row | Workspace rule for OLS Qase import |
| MUST inspect existing OLS Qase suites and reuse a fitting one; create a new suite only with user approval and never a duplicate | Duplicate/colliding suites corrupt the existing Qase tree |
| MUST verify OLS Qase Type and Status options exist before import; stop and tell user if a value is missing | Qase silently resets unknown Type/Status values on import |
| MUST produce both `Draft_Jira_{ISSUE_KEY}.csv` (Jira 10-col schema) and `Import_Qase_{ISSUE_KEY}.csv` (Qase schema) | Two different audiences: comment table consumers and Qase importers |
| MUST upload both CSV files before posting the comment; embed both as footer links | Footer must have two clickable download lines — one per file |
| MUST use simple sequential numbers (1, 2, 3) as TC IDs in all outputs — no prefix, no padding, do not ask user | Fixed workspace standard |
| MUST sort Jira comment + Draft_Jira CSV by AC/EC only (ACs ascending, then ECs ascending) — no Type grouping (Step 3e) | Comment and draft share the same AC/EC-primary ordering |
| MUST sort Import_Qase CSV by Type first (Unit Test → Integration Test → System Test), then ACs ascending, then ECs ascending within each group; TC IDs run continuously 1, 2, 3 across whole file (Step 3e) | Qase groups by Type; continuous IDs preserve global traceability |
| MUST NOT invent Type test cases that lack an AC/EC trace | Type is a label on existing coverage, not a reason to add out-of-scope rows |
| MUST add Remark block for any Type with zero test cases | Makes coverage gaps explicit rather than silently absent |
| MUST NOT reference agent-machine absolute paths in Jira | Other users cannot reproduce |
| MUST run Step 2.5 conflict check before designing TCs | Contradictions between ticket and PRD/Figma invalidate TCs built without resolution |
| MUST ask for PRD/Figma links if not found in ticket (Step 2.5a) | Cannot cross-reference without sources; one question covers both at once |
| MUST collect last-updated datetime for each source before comparing (Step 2.5b) | Recency determines which source is stronger truth; without it the recommendation is guesswork |
| MUST convert all datetimes to Bangkok time (ICT, UTC+7) before displaying | User's working timezone is Bangkok; raw UTC or platform timestamps cause confusion |
| MUST format datetimes as `DD Mon YYYY HH.MM AM/PM` (e.g. `11 Dec 2026 11.45 AM`) | Consistent, readable format agreed with user |
| MUST show "Newer source (ICT)" column with datetime per conflict row in the report | User needs to know which version to trust and exactly how much newer it is |
| MUST NOT start Step 3 while conflicts from Step 2.5 are unresolved | Designing TCs on contradictory requirements creates rework |
| MUST post the Step 2.5 conflict report block even when no conflicts found | Gives user visibility that cross-check was done |
| MUST run Step 4 review before draft table | Prevents out-of-scope cases reaching Jira |
| MUST apply tc-quality-standards on every row | ISTQB / 29119-3 consistency |
| MUST convert `<br>` to Jira-native line breaks before posting (see [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md)) | `<br>` renders as literal text on Jira |
| MUST pass post-publish review ([jira-comment-post-review.md](../../references/jira-comment-post-review.md)) before reporting "commented" or "done" to user | Prevents false success claims with broken formatting |
| MUST post Step 7.5 final review report ([tc-final-review-report.md](references/tc-final-review-report.md)) with overall **PASS** before Step 8 or any "TC prep complete" message | User receives certified four-axis review of final TC |
| MUST attach CSV/Excel to Jira issue when file was generated (not just workspace) | User expects downloadable file on the issue |
| MUST NOT use `\n` inside **chat draft** markdown table cells | Breaks table row in markdown renderers |
| MUST generate a typed CSV for each Type that has TCs — no user selection needed; skip if a Type has zero TCs | Only Types with actual TCs produce a deliverable file |
| MUST filter TCs by Type into each typed CSV: Type = `Unit Test` → Unit_Test; `Integration Test` → Integration_Test; `System Test` → System_Test | Each template's audience expects only its own test type |
| MUST map Jira draft columns to each template's columns per Step 6 mapping tables — derive values for columns with no direct source; only execution-result columns (Actual Result, Test status, Test Date, Test By, ผลการทดสอบ, วันที่ทดสอบ, ผู้ทดสอบ) are left blank | Column names differ between Jira and typed templates; all non-execution columns must have correct content |
| MUST use ticket title/feature name as Function and Services Impacted as Sub Function in Unit_Test CSV | Unit Test template requires Function/Sub Function grouping structure |
| MUST skip typed CSV for a Type that has zero TCs — do NOT generate an empty file | Empty files are not useful deliverables |
| MUST add a note line in the Jira comment for each skipped type: `ไม่มี TC ประเภท [type] สำหรับ ticket นี้` | User must know explicitly that the type was absent, not silently missing |
| MUST upload only generated typed CSVs to Jira; embed footer links only for uploaded files (after Draft_Jira + Import_Qase) | No broken or phantom links |
| MUST append disclaimer as last line of comment after all attachment links — exact text, no translation | Required quality gate for all TC FE deliverables |
| MUST NOT invent or paraphrase AC/EC labels or criterion text anywhere in any CSV — use verbatim text from the ticket only | Invented AC/EC creates false traceability and corrupts test coverage records |
