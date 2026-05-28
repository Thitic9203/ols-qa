---
name: tc-api-prep-workflow
description: Prepare API manual test cases from API spec and Swagger/OpenAPI — confirm column format and delivery (Jira comment link or CSV/Excel file). Use when the user chooses TC API Preparation from Helix, invokes /tc-api-prep, or asks for API test cases from Swagger.
---

# TC API Prep Workflow

Prepare **API manual test cases** from an **API spec** and **Swagger/OpenAPI**, show a draft in chat for approval, then either **post a comment** at a user-provided link or **write CSV/Excel** in the workspace for download.

**Portable:** Any agent with this skill. **Project-agnostic:** No hardcoded services or ticket IDs.

## Communication (mandatory)

Follow [user-communication.md](../../references/user-communication.md).

**Gates:** no comment post and no file write until the user approves the draft in chat (Phase F).

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

Show the **default columns** and ask whether to add more:

```text
Default API test case table columns:

| Column | Purpose |
|--------|---------|
| Test Case ID | Stable id, e.g. TC_API_{Module}_01 |
| Module / Feature | Functional area or tag group |
| Services Impacted | Backend service(s) touched |
| Test Title | Method + path + scenario (happy/negative) |
| Precondition | Auth, data state, env, headers |
| Test Data | Body, query, path params, headers (sample values) |
| Expected Result | Status code + key response fields / error body |
| Priority | High / Medium / Low |

Do you want to add any columns? If yes, list each column name and what it should contain.
If the default set is fine, reply **default** or **no changes**.
```

**Wait for an answer.** Record final column list for Phase D–G.

Optional columns users often add (only if requested): **Test Steps**, **Endpoint**, **HTTP Method**, **Acceptance Criteria**, **Notes**.

Details: [references/default-columns.md](references/default-columns.md).

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

Write under the user’s workspace:

| Format | File |
|--------|------|
| CSV | UTF-8 with BOM; `<br>` → newline in cells |
| Excel | `.xlsx` if user asked Excel or `both` |

Default paths:

- `references/{SCOPE}_API_TC.csv`
- `references/{SCOPE}_API_TC.xlsx`

`{SCOPE}` = user-provided name, ticket key, or short slug from API title.

Tell the user the **absolute or workspace-relative paths** to download.

### G2 — Comment on link (if user chose A)

1. Draft comment body in chat (same table; Jira use `<br>` in cells, bold headers `**Column**`).
2. Show draft comment → user may waive second approval if they already approved Phase F table.
3. Post using environment tools (MCP, browser). Match format: [references/delivery-options.md](references/delivery-options.md).
4. **Verify** on the destination UI: row count, formatting, correct page/issue.

### G3 — Close

```text
━━━ TC API prep complete ━━━
Draft: approved in chat
File: {paths or none}
Comment: {url or none}
Test cases: {M}
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Out of scope

- Automated API test scripts (Postman/Playwright API) unless user asks separately
- Executing tests — use `testing-ticket-workflow` or project tests
- Opening bugs — use `create-bug-workflow`

---

## References

| File | Use |
|------|-----|
| [default-columns.md](references/default-columns.md) | Column definitions |
| [api-tc-guidelines.md](references/api-tc-guidelines.md) | API TC writing rules |
| [delivery-options.md](references/delivery-options.md) | Jira / Confluence / CSV |
| [markdown-template.md](references/markdown-template.md) | Table skeleton |
