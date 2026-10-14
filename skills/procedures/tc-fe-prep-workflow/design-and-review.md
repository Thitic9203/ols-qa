# TC FE prep — design and review (Steps 3, 4, 4.5)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read after the requirement gates.

## Contents

- [Step 3 — Design test cases \[medium freedom\]](#step-3--design-test-cases-medium-freedom)
  - [3a — Pre-design setup](#3a--pre-design-setup)
  - [3b — Language rules (Thai always)](#3b--language-rules-thai-always)
  - [3c — TC ID rules (fixed — no user input)](#3c--tc-id-rules-fixed--no-user-input)
  - [3d — Type column (always present)](#3d--type-column-always-present)
  - [3e — Row ordering](#3e--row-ordering)
- [Step 4 — Coverage & quality review (mandatory; loop until zero comments, report EVERY round) \[medium freedom\]](#step-4--coverage--quality-review-mandatory-loop-until-zero-comments-report-every-round-medium-freedom)
  - [4a — AC / EC coverage (FE scope)](#4a--ac--ec-coverage-fe-scope)
  - [4b — International TC quality (ISTQB + ISO/IEC/IEEE 29119-3)](#4b--international-tc-quality-istqb--isoiecieee-29119-3)
  - [4c — Post review summary in chat](#4c--post-review-summary-in-chat)
  - [4d — Coverage delta summary](#4d--coverage-delta-summary)
  - [4e — Unclear spec → BLOCK the case, never guess (mandatory, zero omissions)](#4e--unclear-spec--block-the-case-never-guess-mandatory-zero-omissions)
  - [4f — Independent reviewer-agent loop (mandatory; report EVERY round)](#4f--independent-reviewer-agent-loop-mandatory-report-every-round)
- [Step 4.5 — Thai↔English term confirmation (mandatory gate) \[medium freedom\]](#step-45--thaienglish-term-confirmation-mandatory-gate-medium-freedom)

---

## Step 3 — Design test cases [medium freedom]

### 3a — Pre-design setup

All settings in this workspace are **fixed** — do NOT ask the user about any of them:

- **TC Language = Thai (always).** All test case content is formal Thai per ราชบัณฑิตยสภา (Step 3b), using the project TC glossary re-fetched at Step 2.6 as the first authority. English only where no official Thai term exists, and only after the Step 4.5 term-confirmation gate.
- **Type column is always present**, restricted to `System Test` / `Unit Test` / `Integration Test` (Qase Type field — Step 3d). Do not offer to skip it.
- **TC ID = simple sequential number: 1, 2, 3** (see Step 3c). No prefix, no padding, no format selection. Do not ask.
- **Typed CSVs**: all three (Unit_Test, Integration_Test, System_Test) are generated when TCs of that type exist — no selection needed. Each populated with TCs filtered by Type and mapped to that template's columns (Step 6).

**No questions needed in this step — proceed to Step 3b.**

(Note: Qase auto-generates its own case IDs on import; the Test Case ID column is for the Jira comment table and traceability only.)

### 3b — Language rules (Thai always)

This workspace writes **all** FE test case content in Thai. There is no English-only mode.

**Thai mode (the only mode):**
- All content in formal/professional Thai (ภาษาทางการ) — suitable for internal and external stakeholder delivery.
- **Term priority (stop at the first rule that answers):**
  1. **The project TC glossary** re-fetched at Step 2.6 — if the English term has a row with a non-empty Thai cell, use that Thai term **verbatim**. The glossary outranks every table in this file.
  2. **The fallback table below** — only for terms the glossary has no row for.
  3. **Ask the user** — anything else. Never coin a term.
- Where the glossary and this file disagree, **the glossary wins**. Do not "reconcile" them or prefer the wording you remember.
- Terms whose glossary row exists but has an **empty** Thai cell are a Step 2.6 blocking question, not a free choice. Where a former default exists (e.g. `Dropdown` → `รายการแบบเลื่อนลง`), offer it as a **suggestion** in that question — never as the answer.
- **Fallback table — only for terms absent from the glossary:**

  | English | ใช้คำไทย |
  |---------|----------|
  | Logout / Sign out | ออกจากระบบ |
  | Button | ปุ่ม |
  | Search | ค้นหา |
  | Sort | เรียงลำดับ |
  | Download | ดาวน์โหลด *(ราชบัณฑิต ทับศัพท์)* |
  | Export | ส่งออก |
  | Import | นำเข้า |
  | Permission | สิทธิ์การเข้าถึง |
  | Password | รหัสผ่าน |
  | Username | ชื่อผู้ใช้ |
  | Reset | รีเซ็ต *(ราชบัณฑิต ทับศัพท์)* |
  | Submit | ส่ง / บันทึก *(แล้วแต่ context)* |
  | Error message | ข้อความแสดงข้อผิดพลาด |
  | Toggle | ปุ่มสลับ |
  | Sidebar | แถบด้านข้าง |
  | Navbar | แถบนำทาง |
  | Input field | ช่องกรอกข้อมูล |

  Terms removed from this table because the glossary now owns them: Login, Checkbox, Filter, Upload, Status, Role, Cancel, Confirm, Notification, Toast, Modal, Dialog, Tab, Dashboard. Read them from the glossary — do not re-add them here.

- **Keep in English** (no official Thai term, or internationally standardised):
  - Acronyms and technical standards: API, URL, HTTP, HTTPS, CRUD, QA, UX, UI, ID, OTP, JWT, Token
  - Feature/module names **as displayed in the system UI** — if the UI shows a label in English, refer to it by that label
  - Error codes and field keys (e.g. `OLS_ERR_401`, `user_id`)

  **Collision rule:** when a term is *both* in the glossary *and* rendered in English by the UI (e.g. glossary says `Dashboard → แผงควบคุม` but the screen reads "Dashboard"), this is a Step 2.6 question — **ask the user which to use**. Do not silently apply the UI-label exception to escape a glossary term.
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
  - **Integration Test** — verifying that two or more components/services work together (e.g. FE → API → DB round-trip, real-time state change, cache invalidation)
  - **Unit Test** — isolated behaviour of one logic unit (e.g. a pure function, single component input→output), testable without the full UI flow
- A ticket does **not** need to have all three types — derive only what the AC/EC actually requires.
- When a type has no applicable test cases for this ticket, **do NOT invent cases just to fill the type**. Instead, add a Remark block under the table (see below).
- Extra test cases may be added to cover a type's perspective **only if** they stay within the scope of the AC/EC on this ticket — do not pull in requirements from other tickets.

**Unit Test heuristic — derive from PRD, ticket description, and Figma only (do not ask dev):**

Look for AC/EC that implies **pure function / logic behavior** that can be verified with input → expected output, without needing the full browser flow:

| Signal in AC/EC | Likely Type |
|-----------------|-------------|
| "function returns X when given Y" / "logic applies Z correctly" | Unit Test |
| Search/filter matching across multiple fields (name OR desc OR tag) | Unit Test |
| Combining filter criteria with AND/OR logic | Unit Test |
| Visibility/access guard based on a single state (published, deleted, auth) | Unit Test |
| Format / calculate / transform a value | Unit Test |
| Two or more real services/modules communicating (API ↔ DB, cache invalidate, cross-service event) | Integration Test |
| User performs an action → UI responds (full flow through browser) | System Test |

**Key question:** Can this criterion be verified by calling a single function with test inputs and checking the output — **without a browser**? → Unit Test. If yes, write a Unit TC for the logic AND a System TC for the UI flow (they test different layers of the same AC/EC).

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

Default **10 columns** for the HTML draft, CSV files, and markdown `.md` — Type is always included:

| Column | Purpose |
|--------|---------|
| Acceptance Criteria | AC_0n / EC_0n label + full criterion text |
| Services Impacted | 1 service: plain name, no prefix (e.g. `Media Library`). 2+ services: bold-numbered inline (e.g. `**1.** order-service **2.** api-gateway`) — never use `- ` bullet prefix |
| Test Case ID | Sequential number: 1, 2, 3 (fixed — no prefix, no padding) |
| Test Title | Action + expected outcome (no `[Tag]` prefixes unless user wants them) |
| Precondition | **Jira comment table:** omitted (see Step 7 slim-table rule). **CSV exports (Draft_Jira, Import_Qase, all typed CSVs):** full shared prep steps expanded inline (numbered, continuous) + per-case setup — CSV files are standalone; no separate shared-prep block. |
| Test Data | Values to enter |
| Test Steps | Numbered manual steps |
| Expected Result | Numbered assertions |
| Priority | High / Medium / Low |
| **Type** | `System Test` / `Unit Test` / `Integration Test` (Step 3d) |

> **Jira comment table** uses a **slim 6-column** version (see Step 7) — Precondition, Test Data, Steps, Expected are omitted to stay within Jira's comment size limit. Full content is always available in the attached CSV files.

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

**Jira comment + Draft_Jira CSV + Import_Qase CSV** — all three use the same ordering: Type first, then AC/EC within each group:
1. All `Unit Test` rows first
2. Then all `Integration Test` rows
3. Then all `System Test` rows

Within each Type group: ACs ascending (AC_01, AC_02, …), then ECs ascending (EC_01, EC_02, …). TC IDs run continuously 1, 2, 3, … across the whole file — do NOT restart per Type group.

**Typed CSVs (Unit_Test, Integration_Test, System_Test)** — each file contains only its own Type; sort rows within the file: ACs ascending, then ECs ascending. TC ID (`No.`) restarts at 1 within each file.

---

## Step 4 — Coverage & quality review (mandatory; loop until zero comments, report EVERY round) [medium freedom]

MUST complete **before** Step 5. Do not skip because the first draft “looks fine.”

**Review is a loop, not a fixed number of passes.** Run the checks (4a–4e) and the independent
reviewer-agent pass (4f), fix every finding, then **re-review**, and keep looping until a review round
returns **zero actionable comments**. There is no “good enough after 2 rounds” exit — the exit
condition is a clean round, however many rounds that takes. **Report the outcome of EVERY round to the
user** as it happens (round number + verdict + what was fixed) — never batch the rounds into one
end-of-run summary, and never go silent between rounds.

### 4a — AC / EC coverage (FE scope)

Follow [ac-ec-coverage-review.md](references/ac-ec-coverage-review.md):

- Build the **traceability matrix** (every AC and EC → one or more `TC_*`).
- Confirm **ไม่ขาด** (full AC/EC outcomes covered), **ไม่เกิน / ไม่กาว / ไม่เพ้อ** (no orphan or invented cases).
- Row count **need not** equal AC+EC count; alignment matters, not 1:1 rows.

### 4b — International TC quality (ISTQB + ISO/IEC/IEEE 29119-3)

Follow [tc-quality-standards.md](../../../references/tc-quality-standards.md) on every row (objective, preconditions, steps, expected results, priority, observability).

### 4c — Post review summary in chat

Post the **FE TC coverage review** block from ac-ec-coverage-review.md (with **Ready for draft: YES**).

MUST NOT show the full TC table until **Ready for draft: YES** — because stakeholders approve coverage before row-level editing.

### 4d — Coverage delta summary

Post the table from [coverage-delta-template.md](../../../references/coverage-delta-template.md) (FE section) — even when all rows are `OK`.

If review fails → fix Step 3 design and re-run 4a–4d. Repeat until a round is clean (no cap).

### 4e — Unclear spec → BLOCK the case, never guess (mandatory, zero omissions)

During review, any case whose expected behaviour is **not certain** — contradictory AC/EC, spec that
conflicts with Key Feature/Business Rules/PRD/Figma, values referenced from another ticket that is not
confirmed, mis-threaded comments, or any point the reviewer cannot verify from the ticket itself —
MUST NOT be resolved by guessing or by silently picking one interpretation.

For every such case, do ALL of the following — no case may be skipped:

1. Set that case's **Test Status = `BLOCKED`** (per-row, in the tracking sheet / result table — not
   the whole ticket unless every case is affected).
2. Write a **Remark on that exact case's row** that names, explicitly:
   - **Actor** — the case's **QA Owner** is the person who must go make contact (name them, e.g.
     `QA Owner ({owner}) ติดต่อ …` — never a bare "waiting for X" with no actor);
   - **Contact target** — the specific person to contact (Reporter / PO / designer, by name);
   - **Topic** — exactly what must be confirmed, quoting the conflicting AC/EC labels or sources;
   - **Unblock condition** — what happens after the answer (e.g. "ได้คำตอบแล้วจึงปรับ TC และรันได้").
3. Cases that are certain remain unblocked — blocking is per-case, surgical, never blanket.

**Zero-omission rule:** every uncertainty found anywhere in the review (coverage check, quality check,
conflict check, comment triage) MUST end up as a `BLOCKED` row with such a Remark. An uncertainty
mentioned only in chat, a report, or a commit message — but absent from the sheet row — is a
workflow violation.

### 4f — Independent reviewer-agent loop (mandatory; report EVERY round)

The agent's own 4a–4e pass is not enough — draft TCs MUST also be checked by **independent reviewer
subagents** (dispatch via the Agent/Task tool; when the user asks for "superpowers" review, this is it)
so a second, skeptical set of eyes catches fabrication and coverage gaps the author is blind to.

Run it as a loop, and **tell the user the result of each round the moment it finishes** — round number,
verdict, and every finding + how it was fixed. Do not proceed to Step 4.5 until a round is clean.

1. **Dispatch reviewer(s).** Give each reviewer the ticket's **verbatim AC/EC + seed** and the current
   TC draft, and instruct them to judge **only** against the ticket content (no requirements of their
   own). Each must check: every AC/EC covered; **nothing fabricated** (no invented role, service,
   surface, count, severity, or EC the ticket never states); scope honored (per the user's Step 2a/2.5
   decisions); char-exact seed text; correct Thai/glossary terms; Type classification; testability. For
   a thorough/"2 rounds"/"superpowers" request, run ≥2 independent reviewers per round.
   **Working-draft file for reviewers (owner, 2026-10-14):** the draft may be handed to reviewers as a
   file written **outside the repo** (the session scratchpad or a temp directory) — never inside the
   repository or the deliverable folder. It is review input only: not a deliverable, never attached,
   never committed. This is the one exception to the Step 4.5 no-file rule.
2. **Reviewer output is binary per round:** `CLEAN` (zero actionable defects) or `HAS-COMMENTS` (a
   numbered defect list). Nitpicks/optional polish are not defects — only genuine defects against the
   ticket count.
3. **Report the round to the user** immediately: `รีวิวรอบ N: CLEAN` or `รีวิวรอบ N: พบ X จุด — …` with
   the fixes applied. This report is mandatory every round (the user must never wonder whether a round
   ran or what it found).
4. **If HAS-COMMENTS →** fix every finding in the draft, then dispatch a **fresh** reviewer round and
   go back to step 2. **If CLEAN →** the loop is done; continue to Step 4.5.
5. **No round cap and no silent rounds.** Loop until a reviewer round returns zero comments, however
   many rounds it takes; a round whose result was never reported to the user does not count.

---

## Step 4.5 — Thai↔English term confirmation (mandatory gate) [medium freedom]

Because content is Thai by default but some terms stay in English (Step 3b), the user MUST see and approve the term choices **before** any content is written to the real TC file.

After the Step 4 review passes and before showing the full draft (Step 5), post the term table in chat:

```
**Thai ↔ English terms used in this TC set**

Glossary: {published sheet URL} · tab {tab name} (gid {gid}) · {N} คำ · re-checked {date}

These terms appear in the test cases. Thai follows the glossary first, then ราชบัณฑิตยสภา; English is kept only where no suitable official Thai term exists or the system UI shows it in English.

| English term | ใช้ในเทสเคสเป็น | ที่มา | เหตุผลที่คงอังกฤษ (ถ้าคงไว้) |
|--------------|----------------|-------|------------------------------|
| {term} | {Thai term used} / {kept as English} | glossary / fallback / user | {no official Thai term / UI shows it in English / acronym-standard / —} |

ต้องการปรับคำไหนไหมครับ? ถ้าโอเคทั้งหมด ผมจะใช้ชุดคำนี้เขียนลงเทสเคสจริง
```

**Rules:**
- List **every** term where a Thai-vs-English choice was made — both the ones translated to Thai and the ones deliberately kept in English.
- The **ที่มา** column is mandatory on every row: `glossary` (row in the Step 2.6 CSV), `fallback` (Step 3b table, no glossary row), or `user` (answered a Step 2.6 question). A row with no provenance means the term was invented — remove it and ask.
- Where the glossary offered comma-separated variants (e.g. `แถบ, แท็บ`), propose one and mark the row `glossary` — the user confirms the pick here.
- For each kept-English term, state the reason (no official Thai term / UI label is English / acronym or standard like API, URL, OTP).
- **Wait for the user's response.** If the user asks to change any term, apply it and re-post the changed rows.
- Only after the user confirms (or after applying their adjustments) proceed to Step 5 and use the confirmed terms in every cell.
- Do NOT write any TC content to a deliverable file (Step 6) until this gate is confirmed. The only file allowed earlier is the Step 4f reviewer working draft, outside the repo.

---
