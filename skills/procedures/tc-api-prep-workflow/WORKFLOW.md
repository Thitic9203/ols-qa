---
name: tc-api-prep-workflow
---

<!-- When to use / not use: see the description in ../../tc-api-prep-workflow/SKILL.md (single source). -->

# TC API Prep Workflow

Prepare **API manual test cases** from an **API spec** and **Swagger/OpenAPI**, show a draft in chat for approval, then either **post a comment** at a user-provided link or **write CSV/Excel** in the workspace for download.

**Portable:** Any agent with this skill. **Project-agnostic:** No hardcoded services or ticket IDs.

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Phase A — API sources (mandatory) \[medium freedom\]](#phase-a--api-sources-mandatory-medium-freedom)
- [Phase B — Test case table format (mandatory) \[medium freedom\]](#phase-b--test-case-table-format-mandatory-medium-freedom)
- [Phase C — Where to deliver (mandatory) \[medium freedom\]](#phase-c--where-to-deliver-mandatory-medium-freedom)
- [Phase D — Scope and design \[medium freedom\]](#phase-d--scope-and-design-medium-freedom)
- [Phase E — Coverage & quality review (mandatory; 1–2 rounds) \[medium freedom\]](#phase-e--coverage--quality-review-mandatory-12-rounds-medium-freedom)
- [Phase F — Draft in chat (approval gate) \[medium freedom\]](#phase-f--draft-in-chat-approval-gate-medium-freedom)
- [Phase G — Deliver (after approval only) \[low freedom\]](#phase-g--deliver-after-approval-only-low-freedom)
- [QA closing (mandatory before "done") \[low freedom\]](#qa-closing-mandatory-before-done-low-freedom)
- [Out of scope](#out-of-scope)
- [References](#references)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block into your response when the run starts and tick each line as it completes. A
failed gate sends you back to the step its **Go back:** line names — untick from there.

```text
TC API prep progress:
- [ ] Refusal-first (precondition gate)
- [ ] Phase A — API sources (mandatory)
- [ ] Phase B — Test case table format (mandatory)
- [ ] Phase C — Where to deliver (mandatory)
- [ ] Phase D — Scope and design
- [ ] Phase E — Coverage & quality review (mandatory; 1–2 rounds)
- [ ] Phase F — Draft in chat (approval gate)
- [ ] Phase G — Deliver (after approval only)
- [ ] QA closing (mandatory before "done")
```

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

## Phase A — API sources (mandatory) [medium freedom]

Collect in **one** message (skip fields already provided):

| Field | Required | What to collect |
|-------|----------|-----------------|
| **API Spec** | Yes | Link, file path in workspace, Confluence page, or pasted summary of scope |
| **Swagger** | Yes | OpenAPI/Swagger URL (JSON or YAML) or local spec path |

🔴 **STOP — wait** until both are answered (or user says spec is only in Swagger → treat Swagger as both).

Load the spec:

- Fetch the URL. When it returns 401/403 or a login page, ask the user for an authenticated export or session — never guess credentials.
- Parse paths, methods, parameters, request bodies, response schemas, security schemes.
- Note base URL / servers from `servers` or user override.

If load fails → stop and report; ask for export file or VPN.

If the API surface is **large** (~15+ operations or whole-service scope), follow [tc-api-chunked-scope.md](../../../references/tc-api-chunked-scope.md) before Phase D — agree chunks with the user.

### Phase A optional — Swagger / spec diff

If the user mentions Swagger **changed**, a **new API version**, or updating existing API TCs, run [swagger-diff-phase.md](../../../references/swagger-diff-phase.md) before Phase D.

---

## Phase B — Test case table format (mandatory) [medium freedom]

Show the **default column list** from [references/default-columns.md](references/default-columns.md) (summary table only — do not duplicate the full definitions here).

Ask:

```text
Do you want to add any columns beyond the default API set?
If the default set is fine, reply **default** or **no changes**.
```

🔴 **STOP — wait for an answer.** Record final column list for Phase D–G.

---

## Phase C — Where to deliver (mandatory) [medium freedom]

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

🔴 **STOP — wait for an answer** before designing and drafting (Phases D–F).

---

## Phase D — Scope and design [medium freedom]

From API spec + Swagger:

1. Group endpoints by **module/feature** (tags or path prefix).
2. Per endpoint (or logical group), design cases:
   - Happy path (2xx, contract matches schema)
   - Auth (401) when the operation (or the global spec) has a `security` requirement
   - Permission (403) when the spec or Swagger names roles/scopes for the operation
   - Validation (400) — required fields, types, bounds
   - Not found (404) when the path has an id parameter; conflict (409) when Swagger lists 409 for the operation
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

## Phase E — Coverage & quality review (mandatory; 1–2 rounds) [medium freedom]

MUST complete **before** Phase F.

### E1 — Spec & Swagger coverage (API scope)

Follow [spec-coverage-review.md](references/spec-coverage-review.md):

- Build the **endpoint coverage matrix** (in-scope operations → `TC_API_*`).
- Confirm alignment with **API spec** and **Swagger** — no invented content, no speculation, nothing out of scope (no invented endpoints; out-of-scope list documented).
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

**After 2 failed rounds →** post the review block with **Ready for draft: NO** plus the gap list (each gap: operation or spec item + what is missing), then 🔴 **STOP** and ask the user to narrow the scope or supply the missing spec/Swagger. Do not draft (Phase F) until a new round reaches **Ready for draft: YES**.

**Go back:** On the user's answer, return to Phase D with the narrowed scope or new source; the round count restarts.

---

## Phase F — Draft in chat (approval gate) [medium freedom]

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

🔴 **STOP — wait for approval** or edits. Re-show changed rows after feedback.

**Go back:** If the user asks for edits, apply them and return to the start of Phase F — re-show the changed rows and wait. Phase G starts only after approval.

---

## Phase G — Deliver (after approval only) [low freedom]

G1 and G2 are independent branches keyed on the Phase C answer: **B** runs G1 only, **A** runs G2
only, **both** runs G1 then G2 (G2 attaches the G1 files). Every branch ends in G-verify.

**Fresh-eyes:** MUST re-read the full draft table before G1/G2 when **> 15 rows** ([skill-rules-style.md](../../../references/skill-rules-style.md)).

### G1 — File export (B or both)

1. Write markdown with the table to `references/{SCOPE}_API_TC.md` (or user path).
2. **CSV:** export per [csv-export-rules.md](../../../references/csv-export-rules.md) to `references/{SCOPE}_API_TC.csv` (in-agent by default).
3. **Excel:** `.xlsx` only if user asked Excel or `both` — follow the Excel/xlsx section in [csv-export-rules.md](../../../references/csv-export-rules.md) (Python + openpyxl inline). When openpyxl is missing or fails, warn the user and ask before falling back to CSV — never silently produce CSV when xlsx was requested.

`{SCOPE}` = user-provided name, ticket key, or short slug from API title.

Tell the user the **workspace-relative paths** to download.

### G2 — Comment on link (A or both)

**Jira issue destination:**

1. **Build ADF** from the approved Phase F table (only on this branch):
   - Convert every `<br>` in table cells → `{"type": "hardBreak"}` ADF node (rules: [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md)).
   - Build the complete ADF document; **bold every header cell**.
   - If the user chose **both**, put the `__ATT1_ID__` placeholder in the ADF footer for the CSV attachment link; comment-only needs no placeholder.
2. 🔴 **STOP — show the comment preview in chat** (same table, bold headers) and post only after the user explicitly approves this preview — unless their Phase F approval message also said to post it.
3. **Publish — ADF-direct (do NOT try MCP first for TC tables).** Full JS patterns: [jira-fast-publish.md](../../../references/jira-fast-publish.md).
   - Navigate to the Jira issue page.
   - Pattern A: set `window.__adfBody` (and `window.__csv1Data` if uploading CSV).
   - Both (CSV attached): Pattern B (upload + comment). Comment-only: Pattern D.
   - Pattern C: read `window.__fastPublish` → check `status: 'ok'`. A non-ok status follows that file's Error recovery table first.
4. **Fallback — browser JS tool unavailable, or Pattern C still not `ok` after its Error recovery:**
   publish with Jira REST v3 using the user's own credentials (the "Jira REST credentials" row of
   [dependencies.md](../../../references/dependencies.md) — run its check first):
   - Before posting, read the issue's comments (`GET /rest/api/3/issue/{KEY}/comment`) — if a partial run already posted this table, do not post a second copy; fix that comment in place (`PUT …/comment/{id}`) instead.
   - Both: upload the CSV/xlsx with `POST /rest/api/3/issue/{KEY}/attachments` (header `X-Atlassian-Token: no-check`), put the returned attachment id in place of `__ATT1_ID__`.
   - Post the same ADF body with `POST /rest/api/3/issue/{KEY}/comment` (`{"body": <ADF>}`) and keep the returned comment id.
   - REST also fails (non-2xx, or credentials check fails) → 🔴 **STOP**: keep the G1 files and the ADF, report the exact HTTP status and response body to the user, and do not say "commented". Hand the failure to `superpowers:systematic-debugging`; do not retry blindly.

**Confluence page destination:** Patterns A–D and the REST fallback above are Jira-only. Read the page
first, then show in chat exactly what changes (new table appended, or which existing TC table is
replaced — never unrelated sections, per [delivery-options.md](references/delivery-options.md)
§ Confluence). Publish after the user approves that preview, with the Atlassian MCP's Confluence
page-update tool. MCP unavailable or the update fails → 🔴 **STOP**: deliver the G1 file instead,
report the exact error, and do not say "commented".

### G-verify — Post-publish review (mandatory)

After G1 and/or G2, run the **full review checklist** from [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

1. Re-open the file path and/or comment URL on the destination.
2. Checklist (items marked **(A only)** / **(B only)** apply only to that delivery; **both** runs all):
   - [ ] Row count matches approved Phase F table.
   - [ ] Columns match Phase B confirmation.
   - [ ] Cell content matches approved draft (spot-check first, middle, last rows).
   - [ ] **(A and B)** **No literal `<br>`, HTML tags, or `**` markers** visible as text in any cell — comment and CSV/xlsx alike (zero tolerance).
   - [ ] **(A only)** Numbered items (`1. ` `2. ` `3. `) each on a **separate line** — not running together.
   - [ ] **(A only)** No truncation on the destination UI.
   - [ ] **(A + B both)** CSV/Excel **attached to the same issue** (not just in workspace) and footer link works.
   - [ ] **(B only)** CSV/xlsx opens with a header row (bold in xlsx) + N data rows; no missing header.
3. If any check fails → fix → re-post → re-verify on the destination UI. **Max 3 rounds** — then 🔴 **STOP** and report the specific failing checks, the destination URL/path and the best available workaround to the user.

**MUST NOT tell user "commented" or "done" until all checks pass.** If a problem cannot be auto-fixed, report the exact issue and propose the best available workaround — never give up with "can't do it."

MUST NOT run G3 close until post-publish review passes — because first export/post is often wrong.

**Go back:** If any G-verify check fails, fix and return to G2 (comment) or G1 (file) to re-post, then run G-verify again — max 3 rounds. G3 waits.

### G3 — Close

Only after **G-verify** pass, follow [session-closing.md](../../../references/session-closing.md) (artifact index, next workflow, a handoff when another workflow takes over, `Verdict:`).

---

## QA closing (mandatory before "done") [low freedom]

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Phase E review block posted with **Ready for draft: YES**, endpoint matrix complete, out-of-scope documented, tc-quality-standards PASS.
- [ ] G-verify checklist passed for the chosen delivery (A, B or both), with at least one re-read of the destination.
- [ ] **(A only)** Post-publish review passed per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md).
- [ ] Close-out includes `Verified:` and test case count.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) § *TC FE / TC API prep* — skip its **Final TC review report posted** item (tc-fe-prep only) and its attachment item unless delivery was **both**.

**Go back:** If any item above is unchecked, return to the phase it names (E or G) and redo from there; do not report done.

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
