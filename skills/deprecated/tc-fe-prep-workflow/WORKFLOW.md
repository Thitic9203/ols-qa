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

**Wait for the user's response.** If the user confirms no PRD/Figma exists, post a one-line note ("No PRD/Figma — proceeding from ticket only.") and go to Step 3.

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

Two settings are **fixed for this workspace** — do NOT ask about them:

- **TC Language = Thai (always).** All test case content is formal Thai per ราชบัณฑิตยสภา (Step 3b). English only where no official Thai term exists, and only after the Step 4.5 term-confirmation gate.
- **Type column is always present**, restricted to `System Test` / `Unit Test` / `Integration Test` (Qase Type field — Step 3d). Do not offer to skip it.

Ask for the only setting that varies, in a single message:

> **TC ID format** — what format should I use for TC IDs? Examples:
> - `TC_01`, `TC_02` (simple sequential)
> - `TC_Feature_01` (feature prefix)
> - `{ISSUE_KEY}_TC_01` (e.g. `OLS-142_TC_01`)
> - Other — please specify

**Wait for the answer.** If the user skips TC ID format, default to `TC_01`.

All three typed CSVs (Unit_Test, Integration_Test, System_Test) are always generated — no need to ask. Each is populated with TCs filtered by Type and mapped to that template's columns (Step 6).

(Note: Qase auto-generates its own case IDs on import; the Test Case ID column is for the Jira comment table and traceability, not the Qase `id` field.)

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

### 3c — TC ID format rules (apply after user confirms)

- Record the confirmed format at the top of your working notes before designing any row.
- Apply the format **consistently** to every TC row in this session.
- Pad numbers with leading zeros to match the widest number in the set (e.g. if 12 TCs, use `TC_01`–`TC_12`; if 100+, use `TC_001`).
- **Never mix formats** within the same TC set (e.g. do not switch from `TC_01` to `TC_Feature_02`).
- If the user specifies a feature prefix, derive it from the ticket title or AC group label — do not invent one.

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

**Remark block (add after the table when any type is absent):**

```
**Remark — Type coverage:**
- No *System Test* cases for this ticket.
- No *Integration Test* cases for this ticket.
```

List only the types that are absent. Omit types that have at least one test case.

---

Default **10 columns** (change only if user specifies otherwise) — Type is always included:

| Column | Purpose |
|--------|---------|
| Acceptance Criteria | AC_0n / EC_0n label + short summary (full text in the Qase **AC/EC** column) |
| Services Impacted | e.g. `- Service Name` |
| Test Case ID | Stable id — format confirmed in 3a |
| Test Title | Action + expected outcome (no `[Tag]` prefixes unless user wants them) |
| Precondition | Shared prep done + per-case setup |
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

### 3e — Row ordering

Sort rows before presenting the draft.

Group rows by type in this order: `Unit Test` → `Integration Test` → `System Test`. Within each group, maintain AC/EC sequence order (the order AC/EC items appear in the ticket, top to bottom — do not batch all ACs before all ECs). Multiple TCs for the same AC/EC stay together in the order they were designed.

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
```

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
| `references/Unit_Test_{ISSUE_KEY}.csv` | always | **Typed content CSV** — 13 English columns; TCs filtered to Type = `Unit Test`, content mapped to Unit Test template columns (Step 6 mapping); Function/Sub Function groupings from ticket title + Services Impacted |
| `references/Integration_Test_{ISSUE_KEY}.csv` | always | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `Integration Test`, content mapped to Integration Test template columns (Step 6 mapping); summary footer |
| `references/System_Test_{ISSUE_KEY}.csv` | always | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `System Test`, content mapped to System Test template columns (Step 6 mapping); summary footer |

Both CSV files (`Draft_Jira` + `Import_Qase`) are always produced together and both are uploaded to Jira (Step 7). Follow [csv-export-rules.md](../../references/csv-export-rules.md) for cell cleaning (convert `<br>`, strip tags, preserve Thai) — applies to all CSV files. Never silently produce only one when both are required.

### Typed CSV export (always generate all three)

Generate all three typed CSVs after `Draft_Jira` and `Import_Qase`. Full column/row specs and Python snippets: [csv-template-types.md](../../../references/csv-template-types.md).

**Filter TCs by Type:** Each typed CSV contains only the TCs whose `Type` column matches that file's type. TCs with a different Type are excluded.

**Column mapping — Jira draft → Unit Test (`Unit_Test_{ISSUE_KEY}.csv`):**

| Jira draft column | Unit Test column | Notes |
|-------------------|-----------------|-------|
| Test Title | Test Scenario | |
| Test Title (repeat) | Test Description | Tester may elaborate; prepopulate with title |
| Precondition | Pre-condition | |
| Test Data | Test Data | |
| Test Steps | Test Step | |
| Expected Result | Expected Result | |
| *(blank — tester fills)* | Actual Result / Test status / Test Date / Test By / Comment | Leave blank |
| Sequential within group | No. | Renumber from 1 per Sub Function group |
| Services Impacted | Sub Function header | One `Sub Function :` header row per distinct Services Impacted value |
| Ticket title / feature name | Function header | One `Function :` header row at the top |

Build 13-column English header. Insert one `Function :` row (col 1 only, cols 2–13 blank) using the ticket title/feature name, then for each distinct Services Impacted value insert a `Sub Function :` header row, then the numbered data rows for that group. No summary footer.

If no Unit Test TCs exist: write header row only (no data rows, no footer).

**Column mapping — Jira draft → Integration Test / System Test (`Integration_Test_{ISSUE_KEY}.csv` / `System_Test_{ISSUE_KEY}.csv`):**

| Jira draft column | Thai column | Notes |
|-------------------|-------------|-------|
| Sequential (filtered set) | ลำดับ | Renumber from 1 in filtered set |
| Services Impacted | โมดูล | |
| Test Title | รายการทดสอบ | |
| Test Steps | ขั้นตอนการทดสอบ | |
| Expected Result | ผลการทดสอบที่คาดหวัง | |
| *(blank — tester fills)* | ผลการทดสอบ / วันที่ทดสอบ / ผู้ทดสอบ / หมายเหตุ | Leave blank |

Build 9-column Thai header; write sequential numbered rows from the filtered TC set; append 1 blank row then the 5-row summary footer. Encoding: UTF-8 BOM (`utf-8-sig`).

If no Integration/System Test TCs exist: write header row + blank separator row + summary footer only (no data rows).

Note: `Precondition` and `Test Data` from the Jira draft have no column in the Integration/System Test template — omit them. Refer to the Jira comment table or the Qase import CSV for those values.

See [references/publish-options.md](references/publish-options.md) for Jira delivery.

---

## Step 7 — Publish to Jira (story only)

**Target:** `{ISSUE_KEY}` story the user specified.

**Pre-post conversion (mandatory):** Before building the comment body, convert every `<br>` in table cells to Jira-native line breaks. Full rules: [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md). **Never copy the chat draft directly — it contains `<br>` that Jira renders as literal text.**

**Content:** Single comment (unless user asked otherwise) containing:

1. Intro line: `Draft TC FE as below`
2. Shared prep + precondition note
3. Full table (bold header cells) — **with `<br>` already converted**
4. Footer: clickable download links — one per uploaded file (see footer link pattern in [jira-formatting.md](references/jira-formatting.md)):
   - `[Draft_Jira_{ISSUE_KEY}.csv]({url})` — ตารางเทสเคส (Jira format)
   - `[Import_Qase_{ISSUE_KEY}.csv]({url})` — Qase import file พร้อม import เข้า OLS project
   - `[Unit_Test_{ISSUE_KEY}.csv]({url})` — Unit Test template พร้อม TC ประเภท Unit Test
   - `[Integration_Test_{ISSUE_KEY}.csv]({url})` — Integration Test template พร้อม TC ประเภท Integration Test
   - `[System_Test_{ISSUE_KEY}.csv]({url})` — System Test template พร้อม TC ประเภท System Test
5. Disclaimer — **last line of the comment, after all attachment links** (exact text, do not translate or shorten):
   ```
   ⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io
   ```

**Upload-first rule:** Upload **all required files** to the issue BEFORE posting the comment. Capture each attachment `id` from the upload response, build `secure/attachment/{id}/{filename}` URLs, then embed as hyperlinks in the footer. Never write a filename as plain text. Upload order: `Draft_Jira` first, `Import_Qase` second, then `Unit_Test`, `Integration_Test`, `System_Test` in that order.

**Publish methods** (choose what works in the environment — details in `references/publish-options.md`):

| Method | When to use |
|--------|-------------|
| Atlassian MCP / REST | Short comments; **verify** full table rendered |
| ADF JSON + browser session | Large tables; upload CSV/xlsx via authenticated session |
| User pastes | Fallback if automation unavailable |

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
- [ ] TC ID format confirmed (Step 3a), recorded, and applied consistently to every row — no mixed formats.
- [ ] Type column present on every row with a valid value (`System Test` / `Unit Test` / `Integration Test`); Remark block lists absent types.
- [ ] Step 4 review block posted with **Ready for draft: YES** and traceability matrix complete.
- [ ] AC/EC coverage complete; quality checklist PASS per tc-quality-standards.
- [ ] Step 4.5 Thai↔English term table posted; user confirmed (or adjustments applied) **before** any file write.
- [ ] All content is Thai per ราชบัณฑิตยสภา (Step 3b); English kept only where the Step 4.5 gate marked it kept-English.
- [ ] Suite gate done — every CSV row uses an existing OLS suite, or a new suite was user-approved; no duplicate suites.
- [ ] `Draft_Jira_{ISSUE_KEY}.csv` uses the 10-column Jira table schema; row count matches approved draft.
- [ ] `Import_Qase_{ISSUE_KEY}.csv` uses Qase schema, `Status = Done` on every row, cut fields absent; row count matches approved draft.
- [ ] Both files uploaded to the Jira issue; both footer links verified working.
- [ ] All three typed CSVs (`Unit_Test_{ISSUE_KEY}.csv`, `Integration_Test_{ISSUE_KEY}.csv`, `System_Test_{ISSUE_KEY}.csv`) generated — each filtered by Type and content mapped to its template columns; all three uploaded to Jira; all three footer links verified working.
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
| MUST confirm TC ID format before designing (Step 3a) | Format must be consistent across all rows; cannot reformat after design |
| MUST apply confirmed TC ID format to every row with consistent zero-padding (Step 3c) | Mixed formats make TC sets unmaintainable |
| MUST sort rows per Step 3e before presenting draft | Consistent order makes review and execution easier |
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
| MUST always generate all three typed CSVs (Unit_Test, Integration_Test, System_Test) — no user selection needed | All three types are standard deliverables |
| MUST filter TCs by Type into each typed CSV: Type = `Unit Test` → Unit_Test; `Integration Test` → Integration_Test; `System Test` → System_Test | Each template's audience expects only its own test type |
| MUST map Jira draft columns to each template's columns per Step 6 mapping tables | Column names differ between Jira and typed templates; mapping ensures correct placement |
| MUST use ticket title/feature name as Function and Services Impacted as Sub Function in Unit_Test CSV | Unit Test template requires Function/Sub Function grouping structure |
| MUST generate empty-but-valid file when a Type has no TCs: Unit_Test = header row only; Integration/System_Test = header + blank separator + summary footer | File must always be present even if that type has no TCs |
| MUST upload all three typed CSVs to Jira and embed all three footer links in the comment (after Draft_Jira + Import_Qase) | All five deliverable files must be accessible from the issue |
| MUST append disclaimer as last line of comment after all attachment links — exact text, no translation | Required quality gate for all TC FE deliverables |
