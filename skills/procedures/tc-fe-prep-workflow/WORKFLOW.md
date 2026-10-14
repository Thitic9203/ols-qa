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

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Prerequisites (read before Step 0)](#prerequisites-read-before-step-0)
- [Step 0 — Obtain the story \[high freedom\]](#step-0--obtain-the-story-high-freedom)
- [Step 1 — Load or create project config \[medium freedom\]](#step-1--load-or-create-project-config-medium-freedom)
- [Step 2 — Extract requirements \[medium freedom\]](#step-2--extract-requirements-medium-freedom)
- [Step 2a — AC/EC internal consistency check \[medium freedom\]](requirement-gates.md#step-2a--acec-internal-consistency-check-medium-freedom)
- [Step 2.5 — Conflict check against PRD and Figma (pre-design gate) \[medium freedom\]](requirement-gates.md#step-25--conflict-check-against-prd-and-figma-pre-design-gate-medium-freedom)
- [Step 2.6 — TC glossary re-check (mandatory gate) \[medium freedom\]](requirement-gates.md#step-26--tc-glossary-re-check-mandatory-gate-medium-freedom)
- [Step 3 — Design test cases \[medium freedom\]](design-and-review.md#step-3--design-test-cases-medium-freedom)
- [Step 4 — Coverage & quality review (mandatory; loop until zero comments, report EVERY round) \[medium freedom\]](design-and-review.md#step-4--coverage--quality-review-mandatory-loop-until-zero-comments-report-every-round-medium-freedom)
- [Step 4.5 — Thai↔English term confirmation (mandatory gate) \[medium freedom\]](design-and-review.md#step-45--thaienglish-term-confirmation-mandatory-gate-medium-freedom)
- [Step 5 — HTML draft in Chrome (approval gate) \[medium freedom\]](#step-5--html-draft-in-chrome-approval-gate-medium-freedom)
- [Step 6 — Save artifacts in the user's workspace \[medium freedom\]](#step-6--save-artifacts-in-the-users-workspace-medium-freedom)
- [Step 6.5 — Create the ticket's TC tab in the tracking sheet \[low freedom\]](#step-65--create-the-tickets-tc-tab-in-the-tracking-sheet-low-freedom)
- [Step 7 — Publish to Jira (story only) \[low freedom\]](#step-7--publish-to-jira-story-only-low-freedom)
- [Step 7.5 — Final TC review report (mandatory before "done") \[low freedom\]](#step-75--final-tc-review-report-mandatory-before-done-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [Step 8 — Session closing \[medium freedom\]](#step-8--session-closing-medium-freedom)
- [Reference files](#reference-files)
- [Out of scope](#out-of-scope)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
TC FE prep progress:
- [ ] Refusal-first (precondition gate)
- [ ] Prerequisites (read before Step 0)
- [ ] Step 0 — Obtain the story
- [ ] Step 1 — Load or create project config
- [ ] Step 2 — Extract requirements
- [ ] Step 2a — AC/EC internal consistency check
- [ ] Step 2.5 — Conflict check against PRD and Figma (pre-design gate)
- [ ] Step 2.6 — TC glossary re-check (mandatory gate)
- [ ] Step 3 — Design test cases
- [ ] Step 4 — Coverage & quality review (mandatory; loop until zero comments, report EVERY round)
- [ ] Step 4.5 — Thai↔English term confirmation (mandatory gate)
- [ ] Step 5 — HTML draft in Chrome (approval gate)
- [ ] Step 6 — Save artifacts in the user's workspace
- [ ] Step 6.5 — Create the ticket's TC tab in the tracking sheet
- [ ] Step 7 — Publish to Jira (story only)
- [ ] Step 7.5 — Final TC review report (mandatory before "done")
- [ ] QA closing (mandatory before "done")
- [ ] Step 8 — Session closing
```

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md). Ask one focused question at a time when setup is missing.

## Refusal-first (precondition gate)

MUST refuse to start until the user provides a **Jira story key or browse URL** — because TC rows must trace to AC/EC on a specific issue.

If missing, stop with the refusal template from skill-rules-style.md (list missing items; do not invent a story).

## Prerequisites (read before Step 0)

Read [references/prerequisites.md](references/prerequisites.md) and [references/jira-formatting.md](references/jira-formatting.md).

**Before Step 0:** confirm the **story** issue key with the user; NEVER post to Jira until they approve the draft in chat — because premature comments are hard to retract cleanly.

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **TC FE prep**.

---

## Step 0 — Obtain the story [high freedom]

If the user did not provide a ticket key or URL:

> Which Jira story should I prepare FE test cases for? Please share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the URL when possible.

---

## Step 1 — Load or create project config [medium freedom]

If workspace-guide-discovery already loaded a guide → use it and go to Step 2.

Otherwise:

1. Ask using `references/project-config-template.md` (one section at a time).
2. Offer to save answers into `references/{PROJECT}-tc-fe-prep-guide.md` in the user’s repo.

Config should capture: Jira domain, default story vs sub-task policy, portal names, shared login role, CSV column headers (if non-default), export format preference (`csv` / `xlsx`; default `csv`), and publish method preference.

---

## Step 2 — Extract requirements [medium freedom]

From the Jira story, build a checklist:

| Source | Extract |
|--------|---------|
| AC rows | Actor, action, expected UI/API outcome |
| EC rows | Invalid input, validation messages, blocked save |
| Description | Status names, tabs, field limits, forbidden actions |
| Linked docs | Seed data steps (reference by ticket id in text only) |

**Must not:** Copy unrelated business rules from other stories unless user confirms they apply to an AC/EC here.

---

## Steps 2a–2.6 — requirement gates

Read and follow [requirement-gates.md](requirement-gates.md) before Step 3 — Step 2a (AC/EC consistency), Step 2.5 (PRD and Figma conflict check) and Step 2.6 (glossary re-check), end to end.

---

## Steps 3–4.5 — design and review

Read and follow [design-and-review.md](design-and-review.md) before Step 5 — Step 3 (design TCs), Step 4 (coverage and quality review loop) and Step 4.5 (Thai↔English term gate), end to end.

---

## Step 5 — HTML draft in Chrome (approval gate) [medium freedom]

Do NOT post the TC table as markdown in chat. Instead:

1. **Generate** `references/{ISSUE_KEY}_FE_TC_draft.html` following [html-draft-template.md](references/html-draft-template.md) exactly — full-width table, Type-grouped rows (Unit → Integration → System), `<br>` between numbered steps, Remark block if needed.
2. **Write** the file to the workspace using the Write tool.
3. **Open** in the browser (the agent's browser tool, `open_url` / `navigate`) → `file:///absolute/path/to/references/{ISSUE_KEY}_FE_TC_draft.html`
4. **Post in chat** (short):

> Draft TC เปิดใน Chrome แล้ว — ตรวจสอบ แล้ว approve หรือแจ้ง edit ได้เลยครับ **Not posted to Jira yet.**

**Language rule:** All content is Thai per Step 3b, using the terms confirmed at the Step 4.5 gate. Keep terms in English only where Step 4.5 marked them kept-English.

**Wait for approval** or edit requests. Apply edits → regenerate HTML → re-open Chrome. Repeat until approved.

**Go back:** Step 6 starts only on approval; each edit request returns to item 1 of this step (regenerate, re-open).

**Header rule (Jira comment only):** Every column header MUST be wrapped in `**bold**` in the Jira comment and the markdown `.md` file (Step 7 / Step 6). The HTML file uses plain `<th>` — no `**` needed.

---

## Step 6 — Save artifacts in the user's workspace [medium freedom]

**Suite gate (do before writing the CSV):** The Qase CSV needs a **Suite** value per row. Inspect the OLS project's existing suite tree first (Qase web UI → Test cases → suite sidebar, or ask the user to paste the current suite list — there is no Qase MCP) and reuse a fitting suite; only propose a new suite (with user approval) when none fits. Never assign a suite blind, never create a duplicate. Full rules: [qase-import-format.md](references/qase-import-format.md) — Suite rules.

After approval (and Suite confirmed), write **four files** inside the user's project (paths relative to workspace root):

| File | Condition | Purpose |
|------|-----------|---------|
| `references/{ISSUE_KEY}_FE_TC.md` | always | Canonical markdown (prep block + Jira table) |
| `references/Draft_Jira_{ISSUE_KEY}.csv` | always (unless xlsx requested) | **Jira-format CSV** — same column set as the chat draft table (10 columns); use as source-of-truth for the comment table |
| `references/Import_Qase_{ISSUE_KEY}.csv` | always (unless xlsx requested) | **Qase import CSV** — schema per [qase-import-format.md](references/qase-import-format.md) |
| `references/Draft_Jira_{ISSUE_KEY}.xlsx` / `references/Import_Qase_{ISSUE_KEY}.xlsx` | user explicitly requested Excel/xlsx | Excel versions of both files above |
| `references/Unit_Test_{ISSUE_KEY}.csv` | only if Type = `Unit Test` TCs exist | **Typed content CSV** — 13 English columns; TCs filtered to Type = `Unit Test`, content mapped to Unit Test template columns (Step 6 mapping); Function/Sub Function groupings from ticket title + Services Impacted |
| `references/Integration_Test_{ISSUE_KEY}.csv` | only if Type = `Integration Test` TCs exist | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `Integration Test`, content mapped to Integration Test template columns (Step 6 mapping); no summary footer |
| `references/System_Test_{ISSUE_KEY}.csv` | only if Type = `System Test` TCs exist | **Typed content CSV** — 9 Thai columns; TCs filtered to Type = `System Test`, content mapped to System Test template columns (Step 6 mapping); no summary footer |

Both CSV files (`Draft_Jira` + `Import_Qase`) are always produced together and both are uploaded to Jira (Step 7). Follow [csv-export-rules.md](../../../references/csv-export-rules.md) for cell cleaning (convert `<br>`, strip tags, preserve Thai) — applies to all CSV files. Never silently produce only one when both are required.

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

Build 9-column Thai header in this order: `ลำดับ, โมดูล, รายการทดสอบ, ขั้นตอนการทดสอบ, ผลการทดสอบที่คาดหวัง, ผลการทดสอบ, วันที่ทดสอบ, ผู้ทดสอบ, หมายเหตุ`; write sequential numbered rows from the filtered TC set. **No summary footer** — end after the last data row. Encoding: UTF-8 BOM (`utf-8-sig`).

If no Integration Test TCs exist: **skip Integration_Test file**. If no System Test TCs exist: **skip System_Test file**. Skip-notes for each absent type appear in the Jira comment footer (Step 7, after attachment links, before Disclaimer).

See [references/publish-options.md](references/publish-options.md) for Jira delivery.

### ADF pre-compute (do in same step as CSV write)

After writing all CSV files, build ADF JSON for the **slim 6-column Jira comment table** (NOT the full 10-column table — Jira comment has a size limit):

1. Use only 6 columns: AC/EC Ref (code only), Services Impacted, ID, Test Title, Priority, Type
2. Set `colwidth` on every `tableHeader` node per the Step 7 table spec: `[90, 130, 50, 510, 90, 150]`
3. No hardBreak nodes needed — no multi-line cells in the slim table
4. Build complete ADF document with `__ATT1_ID__`, `__ATT2_ID__`, `__ATT3_ID__`, `__ATT4_ID__` as literal string placeholders in attachment link nodes (one placeholder per attached file)
5. Store ADF string in agent context (transient — not written to a file). Exception: when the user asks for a draft without posting ("draft only" / "do not post"), write it to `Jira_comment_{ISSUE_KEY}.adf.json` plus a readable `Jira_comment_{ISSUE_KEY}.preview.md`, per [jira-comment-adf-template.md](references/jira-comment-adf-template.md) — never a Markdown file as the comment body

Then report to user: "Files saved. ADF ready. Publishing..."

---

## Step 6.5 — Create the ticket's TC tab in the tracking sheet [low freedom]

**Gate:** the draft is approved (Step 5 in chat; for an unattended run, the owner's reply `passed` to the draft in a Slack DM), and the project guide loaded in Step 1 has a **"Create the per-ticket TC tab"** row. Without that row, skip this step and say so in one line. The tracking sheet is written only through the guide's tool, never with a raw Sheets API call or a one-off script (guide row "Write scope").

**Rows and run:** for `--rows`, use `references/Draft_Jira_{ISSUE_KEY}.csv` as it is. When Step 4e marked any case `BLOCKED`, write `references/Sheet_Tab_{ISSUE_KEY}.json` instead: a JSON list with one object per approved row, keyed by the same column names, where each blocked case adds `"Test Status": "BLOCKED"` and its Step 4e `"Remark"`. First run the guide's command with `--dry-run` and summarise it in chat (tab name, row count, dropdown source, existence check; never the sheet id). Then run it without `--dry-run`. Only exit `0` with `"readback": "clean"` counts as success. Exit `3` means nothing was written: report the reason verbatim and stop (never write into a tab that already exists). Exit `4` means the tab exists but is incomplete: report it and ask the user before anything else touches the sheet.

---

## Step 7 — Publish to Jira (story only) [low freedom]

**Target:** `{ISSUE_KEY}` story the user specified.

**Draft-only request (owner, 2026-10-14):** when the user asked for the comment without posting, do not publish — save it as `Jira_comment_{ISSUE_KEY}.adf.json` plus a readable `Jira_comment_{ISSUE_KEY}.preview.md` per [jira-comment-adf-template.md](references/jira-comment-adf-template.md), report both paths, and stop before the post.

ADF is already built from Step 6 — proceed directly to fast publish. Full JS patterns: [jira-fast-publish.md](../../../references/jira-fast-publish.md).

**Comment content:**

1. Intro line: `Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ`
2. Shared prep block (numbered list)
3. **Slim summary table — 6 columns only** (Jira comment size limit — full 10-col content is in CSV attachments):

   | Column | Content | `colwidth` (px) |
   |--------|---------|----------------|
   | AC/EC Ref | Ref code only — `AC_09`, `EC_02` (NO criterion text) | 90 |
   | Services Impacted | Same as CSV | 130 |
   | ID | TC number | 50 |
   | Test Title | Same as CSV | 510 |
   | Priority | High / Medium / Low | 90 |
   | Type | System Test / Integration Test / Unit Test | 150 |

   Set `colwidth` on **every** header cell (`tableHeader.attrs.colwidth: [N]`) so columns scale to content — do not omit. Adjust values proportionally if TC count or title length differs significantly.

   Do **not** include Precondition, Test Data, Test Steps, or Expected Result in the Jira comment table — these are in the CSV attachments.

4. Footer: clickable download links — one per uploaded file (see footer link pattern in [jira-formatting.md](references/jira-formatting.md)):
   - `[Draft_Jira_{ISSUE_KEY}.csv]({url})` — ตาราง TC ครบ (AC text, Precondition, Steps, Expected)
   - `[Import_Qase_{ISSUE_KEY}.csv]({url})` — Qase import file พร้อม import เข้า OLS project
   - `[Unit_Test_{ISSUE_KEY}.csv]({url})` — Unit Test template *(include only if file was generated)*
   - `[Integration_Test_{ISSUE_KEY}.csv]({url})` — Integration Test template *(include only if file was generated)*
   - `[System_Test_{ISSUE_KEY}.csv]({url})` — System Test template *(include only if file was generated)*
5. For each typed CSV type that was **skipped** (no TCs of that type), add one note line here (after all attachment links): `ไม่มี TC ประเภท [Unit Test / Integration Test / System Test] สำหรับ ticket นี้`
6. Disclaimer — **last line of the comment, after all attachment links** (exact text, do not translate or shorten):
   ```
   ⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io
   ```

**Pre-publish re-check (MANDATORY before every post or re-post):**

Verify ALL of the following are present in the ADF body before calling the Jira comment API. If any item is missing → add it → then publish.

| # | Required element | Where in ADF |
|---|-----------------|--------------|
| 1 | TC table — ALL rows present, count matches approved draft | After heading |
| 2 | Attachments heading + one link per uploaded file (Draft_Jira, Import_Qase + typed CSVs) | After table |
| 3 | Skip-note line for every Type that has zero TCs: `ไม่มี TC ประเภท [Type] สำหรับ ticket นี้` | After attachment links |
| 4 | **Remark block** — `Remark — Type coverage:` + missing-Figma line (if Figma absent from ticket) + missing-PRD line (if PRD absent from ticket) | After attachment links / skip-notes |
| 5 | **Disclaimer** — exact Thai text — **last line, nothing after it** | Very last node |

Shortcut check: scroll to bottom of the ADF `content` array — last node MUST be the Disclaimer paragraph. Second-to-last MUST be the Remark block (if applicable). If you are only fixing TC text, you MUST still rebuild the full ADF with all 5 elements intact.

**Go back:** If any row of this re-check is missing, add it to the ADF and run the re-check again from row 1 before calling the comment API.

---

**Publish method — ADF-direct (single JS call):**

TC tables always go ADF-direct — do NOT try MCP first.

1. Navigate to the Jira issue page (if not already there)
2. Pattern A: set `window.__csv1Data`, `window.__csv2Data`, `window.__adfBody` on `window.*`
3. Pattern B: single JS call — upload `Draft_Jira` → upload `Import_Qase` → post ADF comment. Upload order: `Draft_Jira` first, `Import_Qase` second, then typed CSVs in order (`Unit_Test`, `Integration_Test`, `System_Test` — add upload steps for each present file before the comment post)
4. Pattern C: read `window.__fastPublish` → check `status: 'ok'`; on error follow recovery rules in [jira-fast-publish.md](../../../references/jira-fast-publish.md)

Attachment IDs captured in Pattern B are substituted into the ADF footer links automatically. Never write filenames as plain text.

**After publish — mandatory post-publish review on Jira UI:**

Run the **full review checklist** from [jira-comment-post-review.md](../../../references/jira-comment-post-review.md). Key checks:

- [ ] All TC rows visible (not header only) — count must match approved draft.
- [ ] **No literal `<br>`, HTML tags, or `**` markers** visible as text in any cell (zero tolerance).
- [ ] Numbered items (`1. ` `2. ` `3. `) each on a **separate line** — not running together.
- [ ] Cell content matches approved draft (spot-check first, middle, last rows).
- [ ] **Both** `Draft_Jira_{ISSUE_KEY}.csv` and `Import_Qase_{ISSUE_KEY}.csv` attached to the same issue (not just in workspace) and **both** footer links work.
- [ ] Comment is on the **story**, not a sub-task.

If any check fails → fix and re-post → re-verify on Jira UI (max 3 rounds).

**Go back:** If a post-publish check fails, fix and return to *Publish method* item 1 to re-post, then run this checklist again — max 3 rounds. Step 7.5 waits.

**MUST NOT tell user "commented" or "done" until all checks pass.** See [jira-comment-post-review.md](../../../references/jira-comment-post-review.md) for fix procedures and reporting templates.

---

## Step 7.5 — Final TC review report (mandatory before "done") [low freedom]

After Step 7 post-publish review **passes** (or after final approved draft when publish was skipped), run the **four-axis final review** on the TC set the user will keep.

Follow [tc-final-review-report.md](references/tc-final-review-report.md):

1. Compare **published** Jira comment + attachment (or final approved draft + export) against the **story** AC, EC, description, and deferred-scope notes.
2. Score all four dimensions: **AC/EC alignment**, **spelling**, **numbering order**, **content / scope**.
3. Post the **user-facing report** from that reference (summary table + sections 1–4 + optional improvements).
4. Overall **PASS** required before Step 8. On **FAIL** → fix TC → re-publish or re-show draft → re-run (max 2 rounds).

**MUST NOT** say TC prep is complete, post the Step 8 `Verdict:` block, or offer the next workflow until this report is posted with overall **PASS**.

**Go back:** On **FAIL**, fix the TC and return to Step 7 (published) or Step 5 (draft-only), then run Step 7.5 again — max 2 rounds.

---

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Step 2a AC/EC internal consistency check completed; results shown in pre-draft review HTML; user decision applied (if issues found).
- [ ] Step 2.5 conflict check completed; results shown in pre-draft review HTML; no unresolved conflicts before Step 3.
- [ ] Step 2.6 glossary re-fetched this session (not reused from a prior run); source URL + row count + diff posted in chat; CSV shown to user; all empty-cell / conflicting-meaning questions answered before Step 3.
- [ ] TC IDs are simple sequential numbers (1, 2, 3) across all outputs — no prefix, no padding.
- [ ] Type column present on every row with a valid value (`System Test` / `Unit Test` / `Integration Test`); Remark block lists absent types.
- [ ] Step 4 review block posted with **Ready for draft: YES** and traceability matrix complete.
- [ ] Step 4f independent reviewer-agent loop run; **every round's verdict reported to the user**; loop exited only on a clean (zero-comment) round.
- [ ] AC/EC coverage complete; quality checklist PASS per tc-quality-standards.
- [ ] Step 4.5 Thai↔English term table posted with glossary source line and a `ที่มา` value on every row; user confirmed (or adjustments applied) **before** any deliverable file write (the Step 4f working draft outside the repo is the only earlier file).
- [ ] Every Thai term in the final TC matches the Step 2.6 glossary verbatim where a non-empty row exists; no term was invented, and none tagged "provisional".
- [ ] All content is Thai per ราชบัณฑิตยสภา (Step 3b); English kept only where the Step 4.5 gate marked it kept-English.
- [ ] Suite gate done — every CSV row uses an existing OLS suite, or a new suite was user-approved; no duplicate suites.
- [ ] `Draft_Jira_{ISSUE_KEY}.csv` uses the 10-column Jira table schema; rows sorted Unit Test → Integration Test → System Test, ACs then ECs within each group; row count matches approved draft.
- [ ] `Import_Qase_{ISSUE_KEY}.csv` uses Qase schema, `Status = Done` on every row, cut fields absent; rows sorted Unit Test → Integration Test → System Test, ACs then ECs within each group, TC IDs continuous 1,2,3; row count matches approved draft.
- [ ] Both files uploaded to the Jira issue; both footer links verified working.
- [ ] Typed CSVs generated only for Types that have TCs; each filtered and content mapped to its template columns; all generated files uploaded to Jira; footer links present only for uploaded files; skipped types noted in comment.
- [ ] Step 6.5: the ticket's TC tab was created (exit `0`, `"readback": "clean"`), or the step was skipped because the project guide has no "Create the per-ticket TC tab" row, or a refusal was reported verbatim.
- [ ] Disclaimer appended as **last line** of the Jira comment, after all attachment links (exact wording, not translated or shortened).
- [ ] Jira UI matches approved draft (not MCP output alone).
- [ ] Post-publish review passed per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md) — no stray tags, numbered items on separate lines, attachment present.
- [ ] Step 7.5 final TC review report posted per [tc-final-review-report.md](references/tc-final-review-report.md) — all four axes **PASS**.
- [ ] Close-out includes `Verified:` after Jira re-open.
- [ ] Publish fix-verify (Step 7) completed — at least one Jira UI re-read.
- [ ] **Fresh-eyes:** re-read full draft before publish when table **> 15 rows**.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (TC FE section).

**Go back:** If any item above is unchecked, return to the step it names and redo from there; do not report done.

---

## Step 8 — Session closing [medium freedom]

**Prerequisite:** Step 7.5 final review report posted with overall **PASS**.

Follow [session-closing.md](../../../references/session-closing.md) — artifact index, one-line next workflow (e.g. `/testing-ticket` on same story), handoff file if long session, `Verdict:` block.

Complete [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (TC FE section).

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
| [html-pre-draft-review-template.md](references/html-pre-draft-review-template.md) | Pre-draft review HTML template (Step 2a + 2.5) |
| [tc-final-review-report.md](references/tc-final-review-report.md) | Four-axis final review + close-out report template |
| [tc-glossary.md](../../../references/tc-glossary.md) | Terminology source of truth: re-check gate, precedence, gap/ambiguity policy |
| [tc-quality-standards.md](../../../references/tc-quality-standards.md) | ISTQB / 29119-3 TC quality |
| [scripts/README.md](scripts/README.md) | Optional CSV/xlsx helper pointer |

---

## Out of scope

- API TC prep, Playwright ticket test, retest, create bug — see [skill-routing.md](../../../references/skill-routing.md)

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST refuse without story key/URL | No traceable AC/EC source |
| MUST NOT comment on sub-tasks or other issues | Scope is one story |
| MUST NOT add TC outside story AC/EC | Traceability |
| MUST write all TC content in Thai (Step 3b) — there is no English-only mode | Workspace standard; English mode is not offered for FE TC |
| MUST re-fetch the TC glossary from its published sheet at Step 2.6 every run, and post the source URL, row count, and diff in chat before designing TCs | The team edits the sheet between runs; a cached CSV is not evidence of the current words |
| MUST treat the glossary as the first authority for Thai wording — above the Step 3b fallback table, above remembered wording, above the UI-label exception | Two sources of truth guarantee drift; the sheet is the one the team maintains |
| MUST NOT normalise, spell-fix, dedupe, or sort `{EVIDENCE_REPO}/references/tc-glossary.csv` — it is a verbatim mirror; typos are fixed in the sheet by its owner | A CSV that differs from the sheet is a silent drift bug |
| MUST stop and ask the user when a glossary Thai cell is empty, or when one English key carries conflicting Thai meanings across rows | The agent has no authority to coin project terminology |
| MUST NOT write a guessed term and tag it "provisional", "pending confirmation", or "documented fallback" instead of asking | Tagging a guess is not asking; the guess still reaches the deliverable |
| MUST use ราชบัณฑิตยสภา approved Thai term first (Step 3b); fall back to English only when no official term exists or the UI label is English | Authoritative Thai is more professional than ad-hoc transliteration or unnecessary English |
| MUST post the Step 4.5 Thai↔English term table and get user confirmation BEFORE writing any TC content to a deliverable file — the Step 4f reviewer working draft, outside the repo, is the only exception | User must approve term choices before they are committed to the real TC file |
| MUST use formal Thai language level throughout | TCs are delivered to internal and external teams |
| MUST keep Type to exactly `System Test` / `Unit Test` / `Integration Test` (Step 3d) | These are the OLS Qase Type values; other values break import |
| MUST set Status = `Done` on every Qase CSV row | Workspace rule for OLS Qase import |
| MUST inspect existing OLS Qase suites and reuse a fitting one; create a new suite only with user approval and never a duplicate | Duplicate/colliding suites corrupt the existing Qase tree |
| MUST verify OLS Qase Type and Status options exist before import; stop and tell user if a value is missing | Qase silently resets unknown Type/Status values on import |
| MUST produce both `Draft_Jira_{ISSUE_KEY}.csv` (Jira 10-col schema) and `Import_Qase_{ISSUE_KEY}.csv` (Qase schema) | Two different audiences: comment table consumers and Qase importers |
| MUST upload both CSV files before posting the comment; embed both as footer links | Footer must have two clickable download lines — one per file |
| MUST use simple sequential numbers (1, 2, 3) as TC IDs in all outputs — no prefix, no padding, do not ask user | Fixed workspace standard |
| MUST sort Jira comment + Draft_Jira CSV + Import_Qase CSV by Type first (Unit Test → Integration Test → System Test), then ACs ascending, then ECs ascending within each Type group; TC IDs run continuously 1, 2, 3 across whole file (Step 3e) | All three outputs share the same Type-first ordering for consistency |
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
| MUST run the Step 4 review as a LOOP that exits only on a clean (zero-comment) round — no fixed 2-round cap — and MUST run the Step 4f independent reviewer-agent pass (≥2 reviewers per round for a thorough/"superpowers" request) | One or two passes can still leave fabricated/uncovered cases; the exit condition is a clean round, not a round count |
| MUST report the verdict of EVERY review round to the user as it finishes (round number + CLEAN/defects + fixes applied) — never batch rounds into one summary, never go silent between rounds | The user must always know a round ran and what it found; silent multi-round work reads as a stalled session |
| MUST apply tc-quality-standards on every row | ISTQB / 29119-3 consistency |
| MUST convert `<br>` to Jira-native line breaks before posting (see [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md)) | `<br>` renders as literal text on Jira |
| MUST pass post-publish review ([jira-comment-post-review.md](../../../references/jira-comment-post-review.md)) before reporting "commented" or "done" to user | Prevents false success claims with broken formatting |
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
| **MUST NOT drop any required comment element when regenerating or re-posting** — every rebuild MUST include: (1) table with all TC rows, (2) Attachments heading + all file links, (3) Remark block when Figma/PRD absent or any Type has zero TCs, (4) Disclaimer as last line. Run pre-publish re-check table before every post. Fixing TC text ≠ permission to omit the rest. | Partial rebuild silently loses mandatory elements — user must not discover missing content by inspection |
| MUST NOT invent or paraphrase AC/EC labels or criterion text anywhere in any CSV — use verbatim text from the ticket only | Invented AC/EC creates false traceability and corrupts test coverage records |
| MUST run Step 2a AC/EC internal consistency check after Step 2 and before Step 2.5 | Duplicate/redundant/contradictory AC/EC within the ticket wastes TC effort or produces conflicting test cases |
| MUST include Step 2a results in the pre-draft review HTML even when no issues found | Gives user visibility that the check was done |
| MUST NOT proceed to Step 3 while Step 2a issues are unresolved | TC design on inconsistent AC/EC creates rework |
| MUST follow user's decision on how to handle flagged AC/EC (skip, draft all, fix first) | User owns the AC/EC scope — AI does not unilaterally remove or merge items |
| MUST set Test Status = `BLOCKED` on every case whose spec is uncertain, with a per-row Remark naming actor (**the QA Owner goes and contacts**), contact target, topic, and unblock condition (Step 4e) — never guess, never leave an uncertainty out of the sheet | A guessed TC produces a false verdict; an unattributed "waiting" remark means nobody acts on it |
