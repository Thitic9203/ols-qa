---
name: tc-api-prep-workflow
description: |
  Prepare API manual test cases from API spec and Swagger with mandatory spec/Swagger coverage review and ISTQB/29119-3 quality check — confirm columns and delivery (Jira comment link and/or CSV/Excel in workspace).
  Use when the user chooses TC API Preparation from Helix, invokes /tc-api-prep, or asks for API test cases from Swagger/OpenAPI.
  Do NOT use for frontend story AC/EC tables (tc-fe-prep-workflow), Playwright or test execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bugs (create-bug-workflow).
---

# TC API Prep Workflow

Prepare **API manual test cases** from an **API spec** and **Swagger/OpenAPI**, show a draft in chat for approval, then either **post a comment** at a user-provided link or **write CSV/Excel** in the workspace for download.

**Portable:** Any agent with this skill. **Project-agnostic:** No hardcoded services or ticket IDs.

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Gates:** MUST NOT post a comment or write files until the user approves the draft in chat (Phase F) — because delivery is irreversible without rework.

## Refusal-first (precondition gate)

MUST refuse to start Phase D (design) until **both** are available:

| Input | Because |
|-------|---------|
| API spec (link, file, or pasted scope) | Defines in-scope behavior |
| Swagger/OpenAPI (URL or local path) | Source of truth for endpoints and schemas |

If Phase A load fails after user input, stop and report — do not invent endpoints.

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **TC API prep**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (TC API section).

---

## Phase A — API sources (mandatory)

Collect in **one** message (skip fields already provided):

| Field | Required | What to collect |
|-------|----------|-----------------|
| **API Spec** | Yes | Link, file path in workspace, Confluence page, or pasted summary of scope |
| **Swagger** | Yes | OpenAPI/Swagger URL (JSON or YAML) or local spec path |

**Wait** until both are answered (or user says spec is only in Swagger → treat Swagger as both).

Load the spec:

- Fetch URL with authenticated session if needed (ask user).
- Parse paths, methods, parameters, request bodies, response schemas, security schemes.
- Note base URL / servers from `servers` or user override.

If load fails → stop and report; ask for export file or VPN.

If the API surface is **large** (~15+ operations or whole-service scope), follow [tc-api-chunked-scope.md](../../../references/tc-api-chunked-scope.md) before Phase D — agree chunks with the user.

### Phase A optional — Swagger / spec diff

If the user mentions Swagger **changed**, a **new API version**, or updating existing API TCs, run [swagger-diff-phase.md](../../../references/swagger-diff-phase.md) before Phase D.

---

## Phase B — Test case table format (mandatory)

Show the **default column list** from [references/default-columns.md](references/default-columns.md) (summary table only — do not duplicate the full definitions here).

Ask:

```text
Do you want to add any columns beyond the default API set?
If the default set is fine, reply **default** or **no changes**.
```

**Wait for an answer.** Record final column list for Phase D–G.

---

## Phase C — Where to deliver (mandatory)

Ask in **one** message:

```text
After you approve the draft, how should I deliver the test cases?

A) **Comment on a link** — paste the full URL (e.g. Jira issue, Confluence page).
B) **Downloadable file** — I will create CSV and/or Excel in your workspace (you choose format).

You can pick A, B, or both. For (A), provide the link now. For (B), say CSV, Excel (.xlsx), or both, and preferred folder (default: references/).
```

| Choice | Collect now |
|--------|----------------|
| **A — Comment** | Full destination URL; note if Jira wiki vs ADF (see delivery-options) |
| **B — File** | `CSV` / `Excel` / `both`; optional path e.g. `references/{name}_API_TC.csv` |
| **Both** | Link + file preferences |

**Wait for an answer** before generating the full draft (Phase E).

---

## Phase D — Scope and design

From API spec + Swagger:

1. Group endpoints by **module/feature** (tags or path prefix).
2. Per endpoint (or logical group), design cases:
   - Happy path (2xx, contract matches schema)
   - Auth / permission (401, 403) if applicable
   - Validation (400) — required fields, types, bounds
   - Not found / conflict (404, 409) where relevant
   - Idempotency / side effects if documented
3. Map each row to **Services Impacted** from spec or user naming.
4. **Test Case ID** pattern: `TC_API_{Module}_{nn}` — unique, stable.

Writing rules: [references/api-tc-guidelines.md](references/api-tc-guidelines.md).

Optional: if user gave a Jira story key in the same session, map cases to AC only when they asked — default is **API coverage from spec**, not story AC.

### Row ordering within each module

Within each module/feature group, order rows as follows:

1. **Happy path / success cases** (2xx) — listed first
2. Auth / permission failures (401, 403)
3. Validation / bad request (400)
4. Not found / conflict (404, 409)
5. Other error scenarios

This order puts verifiable success criteria at the top, making the table easier to review and execute in sequence.

---

## Phase E — Coverage & quality review (mandatory; 1–2 rounds)

MUST complete **before** Phase F.

### E1 — Spec & Swagger coverage (API scope)

Follow [spec-coverage-review.md](references/spec-coverage-review.md):

- Build the **endpoint coverage matrix** (in-scope operations → `TC_API_*`).
- Confirm alignment with **API spec** and **Swagger** — **ไม่กาว ไม่เพ้อ นอกสโคป** (no invented endpoints, documented out-of-scope list).
- Multiple TCs per endpoint allowed when scenarios differ (auth, validation, 4xx).

### E2 — International TC quality (ISTQB + ISO/IEC/IEEE 29119-3)

Follow [tc-quality-standards.md](../../../references/tc-quality-standards.md) on every row.

Also verify writing rules in [api-tc-guidelines.md](references/api-tc-guidelines.md) (status codes, payloads, no secrets).

### E3 — Post review summary in chat

Post the **API TC coverage review** block from spec-coverage-review.md (with **Ready for draft: YES**).

MUST NOT post the full TC table until **Ready for draft: YES**.

### E3b — Coverage delta summary

Post the table from [coverage-delta-template.md](../../../references/coverage-delta-template.md) (API section).

If review fails → revise Phase D and re-run E1–E3b (max 2 rounds).

---

## Phase F — Draft in chat (approval gate)

Post the full table in the conversation using the **confirmed columns**:

```text
Draft API test cases (not published yet)

**Sources:** API spec: {summary or link} · Swagger: {url}

**Coverage:** {N} endpoints / {M} test cases

| Test Case ID | Module / Feature | ... |
| --- | --- |
| ... one row per TC ... |
```

State clearly: **Not posted / no file written yet.**

**Wait for approval** or edits. Re-show changed rows after feedback.

---

## Phase G — Deliver (after approval only)

### G1 — File export (if user chose B)

1. Write markdown with the table to `references/{SCOPE}_API_TC.md` (or user path).
2. **CSV:** export per [csv-export-rules.md](../../../references/csv-export-rules.md) to `references/{SCOPE}_API_TC.csv` (in-agent by default).
3. **Excel:** `.xlsx` only if user asked Excel or `both` — follow the Excel/xlsx section in [csv-export-rules.md](../../../references/csv-export-rules.md) (Python + openpyxl inline; never silently produce CSV when xlsx was requested).

`{SCOPE}` = user-provided name, ticket key, or short slug from API title.

Tell the user the **workspace-relative paths** to download.

### ADF pre-compute (do in same step as G1 file write, even if user chose B only)

After writing the CSV/xlsx files, immediately build ADF JSON from the same approved table:

1. Convert every `<br>` in table cells → `{"type": "hardBreak"}` ADF node (rules: [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md))
2. Build complete ADF document — no attachment placeholders needed for API TC (no CSV upload required unless user chose both A + B)
3. Store ADF string in agent context (transient)

If user chose both A (comment) and B (file), include `__ATT1_ID__` placeholder in the ADF footer for the CSV attachment link.

### G2 — Comment on link (if user chose A)

ADF is already built from G1 — proceed directly to fast publish. Full JS patterns: [jira-fast-publish.md](../../../references/jira-fast-publish.md).

1. Draft comment body preview in chat (same table; **bold every header cell** — e.g. `| **Test Case ID** | **Module / Feature** | **Test Title** | ...`).
2. Show draft comment → user may waive second approval if they already approved Phase F table.
3. **Publish method — ADF-direct (do NOT try MCP first for TC tables):**
   - Navigate to the Jira/Confluence destination page
   - Pattern A: set `window.__adfBody` (and `window.__csv1Data` if uploading CSV)
   - If CSV delivery: Pattern B (upload + comment). If comment-only: Pattern D
   - Pattern C: read `window.__fastPublish` → check `status: 'ok'`
4. **Verify** on the destination UI: row count, formatting, correct page/issue, **no literal `<br>` in any cell**.

### G-verify — Post-publish review (mandatory)

After G1 and/or G2, run the **full review checklist** from [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

1. Re-open the file path or comment URL on the destination.
2. Checklist:
   - [ ] Row count matches approved Phase F table.
   - [ ] Columns match Phase B confirmation.
   - [ ] **No literal `<br>`, HTML tags, or `**` markers** visible as text in any cell (zero tolerance).
   - [ ] Numbered items (`1. ` `2. ` `3. `) each on a **separate line** — not running together.
   - [ ] Cell content matches approved draft (spot-check first, middle, last rows).
   - [ ] CSV/Excel **attached to the same issue** (not just in workspace) and footer link works.
   - [ ] No truncation (Jira) or missing header row (CSV/xlsx).
3. If any check fails → fix → re-post → re-verify on Jira UI. **Max 3 rounds** — then report specific failures to user.

**MUST NOT tell user "commented" or "done" until all checks pass.** If a problem cannot be auto-fixed, report the exact issue and propose the best available workaround — never give up with "can't do it."

MUST NOT run G3 close until post-publish review passes — because first export/post is often wrong.

**Fresh-eyes:** MUST re-read the full draft table before G2/G1 when **> 15 rows** ([skill-rules-style.md](../../../references/skill-rules-style.md)).

### G3 — Close

Only after **G-verify** pass, follow [session-closing.md](../../../references/session-closing.md) (artifact index, next workflow, handoff if needed, `Verdict:`).

---

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Phase E review block posted with **Ready for draft: YES** and endpoint matrix complete.
- [ ] Spec/Swagger coverage complete; out-of-scope documented; tc-quality-standards PASS.
- [ ] Row count and columns match Phase B confirmation.
- [ ] If comment delivery: destination UI shows full table, no stray HTML/markup tags, numbered items on separate lines.
- [ ] If comment delivery: CSV/Excel attached to the same issue and footer link works.
- [ ] If file delivery: CSV/xlsx opens with bold header row + N data rows.
- [ ] Post-publish review passed per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md).
- [ ] Close-out includes `Verified:` and test case count.
- [ ] G-verify completed (at least one re-read of destination).
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (TC API section).

---

## Out of scope

- Automated API test scripts (Postman/Playwright API) unless user asks separately
- Executing tests — see [skill-routing.md](../../../references/skill-routing.md)
- Opening bugs — see [skill-routing.md](../../../references/skill-routing.md)

---

## References

| File | Use |
|------|-----|
| [default-columns.md](references/default-columns.md) | Column definitions |
| [api-tc-guidelines.md](references/api-tc-guidelines.md) | API TC writing rules |
| [delivery-options.md](references/delivery-options.md) | Jira / Confluence / CSV |
| [markdown-template.md](references/markdown-template.md) | Table skeleton |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |
| [spec-coverage-review.md](references/spec-coverage-review.md) | Spec + Swagger traceability review |
| [tc-quality-standards.md](../../../references/tc-quality-standards.md) | ISTQB / 29119-3 TC quality |
| [scripts/README.md](scripts/README.md) | Optional CSV helper pointer |

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST refuse without API spec + Swagger | No authoritative coverage |
| MUST order rows: success (2xx) first within each module | Reviewers verify happy path before error paths |
| MUST NOT invent endpoints not in spec/Swagger | False coverage |
| MUST run Phase E review before draft table | Prevents out-of-scope API cases |
| MUST apply tc-quality-standards on every row | ISTQB / 29119-3 consistency |
| MUST convert `<br>` to Jira-native line breaks before posting (see [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md)) | `<br>` renders as literal text on Jira |
| MUST pass post-publish review ([jira-comment-post-review.md](../../../references/jira-comment-post-review.md)) before reporting "commented" or "done" to user | Prevents false success claims with broken formatting |
| MUST attach CSV/Excel to Jira issue when file was generated and user chose delivery A (not just workspace) | User expects downloadable file on the issue |
| MUST verify destination UI when using delivery A | Truncation + literal `<br>` |
