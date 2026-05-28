---
name: tc-api-prep-workflow
description: |
  Prepare API manual test cases from API spec and Swagger/OpenAPI — confirm columns and delivery (Jira comment link and/or CSV/Excel in workspace).
  Use when the user chooses TC API Preparation from Helix, invokes /tc-api-prep, or asks for API test cases from Swagger/OpenAPI.
  Do NOT use for frontend story AC/EC tables (tc-fe-prep-workflow), Playwright or test execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bugs (create-bug-workflow).
proactive_triggers:
  - API test cases
  - Swagger test cases
  - OpenAPI manual TC
  - /tc-api-prep
  - TC API Preparation
---

# TC API Prep Workflow

Prepare **API manual test cases** from an **API spec** and **Swagger/OpenAPI**, show a draft in chat for approval, then either **post a comment** at a user-provided link or **write CSV/Excel** in the workspace for download.

**Portable:** Any agent with this skill. **Project-agnostic:** No hardcoded services or ticket IDs.

## Communication (mandatory)

Follow [user-communication.md](../../references/user-communication.md).

Follow [skill-rules-style.md](../../references/skill-rules-style.md) for MUST/NEVER, refusal-first, and QA closing.

**Gates:** MUST NOT post a comment or write files until the user approves the draft in chat (Phase F) — because delivery is irreversible without rework.

## Refusal-first (precondition gate)

MUST refuse to start Phase D (design) until **both** are available:

| Input | Because |
|-------|---------|
| API spec (link, file, or pasted scope) | Defines in-scope behavior |
| Swagger/OpenAPI (URL or local path) | Source of truth for endpoints and schemas |

If Phase A load fails after user input, stop and report — do not invent endpoints.

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

---

## Phase E — QA self-review (before draft in chat)

- [ ] Every in-scope endpoint/method from user’s API spec has at least one case (or explicit out-of-scope list).
- [ ] Expected results cite **status code** and observable JSON fields / error codes.
- [ ] Test Data includes method, path, and payload/query samples (sanitized — no real secrets).
- [ ] Priorities assigned (happy path High, minor validation Medium/Low unless user rules differ).

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
2. **CSV:** export per [csv-export-rules.md](../../references/csv-export-rules.md) to `references/{SCOPE}_API_TC.csv` (in-agent by default).
3. **Excel:** `.xlsx` only if user asked Excel or `both` (in-agent or tool available in the **user’s** project).

`{SCOPE}` = user-provided name, ticket key, or short slug from API title.

Tell the user the **workspace-relative paths** to download.

### G2 — Comment on link (if user chose A)

1. Draft comment body in chat (same table; Jira use `<br>` in cells, bold headers `**Column**`).
2. Show draft comment → user may waive second approval if they already approved Phase F table.
3. Post using environment tools (MCP, browser). Match format: [references/delivery-options.md](references/delivery-options.md).
4. **Verify** on the destination UI: row count, formatting, correct page/issue.

### G-verify — Fix-verify (mandatory)

After G1 and/or G2:

1. Re-open the file path or comment URL on the destination.
2. Checklist:
   - [ ] Row count matches approved Phase F table.
   - [ ] Columns match Phase B confirmation.
   - [ ] No truncation (Jira) or missing header row (CSV).
3. If mismatch → fix delivery → re-read. **Max 2 rounds** — then report blockers.

MUST NOT run G3 close until at least one fix-verify round passes — because first export/post is often wrong.

**Fresh-eyes:** MUST re-read the full draft table before G2/G1 when **> 15 rows** ([skill-rules-style.md](../../references/skill-rules-style.md)).

### G3 — Close

Only after **G-verify** and **QA closing** pass:

```text
━━━ TC API prep complete ━━━
Draft: approved in chat
File: {paths or none}
Comment: {url or none}
Test cases: {M}
Verified: {what you re-read}
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## QA closing (mandatory before "done")

Follow [skill-rules-style.md — doubt and fix-verify](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume** the first draft missed endpoints or wrong status codes — Phase E exists for this reason.
2. Skill-specific:
   - [ ] Row count and columns match Phase B confirmation.
   - [ ] If comment delivery: destination UI shows full table.
   - [ ] If file delivery: CSV opens with header + N data rows.
   - [ ] Close-out block includes `Verified:` and test case count.
3. Shared checklist: [skill-rules-style.md](../../references/skill-rules-style.md#shared-closing-checklist-every-workflow).
4. G-verify completed (at least one re-read of destination).

---

## Out of scope

- Automated API test scripts (Postman/Playwright API) unless user asks separately
- Executing tests — see [skill-routing.md](../../references/skill-routing.md)
- Opening bugs — see [skill-routing.md](../../references/skill-routing.md)

---

## References

| File | Use |
|------|-----|
| [default-columns.md](references/default-columns.md) | Column definitions |
| [api-tc-guidelines.md](references/api-tc-guidelines.md) | API TC writing rules |
| [delivery-options.md](references/delivery-options.md) | Jira / Confluence / CSV |
| [markdown-template.md](references/markdown-template.md) | Table skeleton |
| [worked-example.md](references/worked-example.md) | Anonymized end-to-end sample |
| [scripts/README.md](scripts/README.md) | Optional CSV helper pointer |

---

## MUST / NEVER (summary)

| Rule | Because |
|------|---------|
| MUST refuse without API spec + Swagger | No authoritative coverage |
| MUST NOT deliver before Phase F approval | User gate |
| MUST NOT invent endpoints not in spec/Swagger | False coverage |
| MUST verify comment destination UI when using delivery A | Truncation |
