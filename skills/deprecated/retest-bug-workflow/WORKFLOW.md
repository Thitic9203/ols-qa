---
name: retest-bug-workflow
description: |
  Retest a Jira bug after a dev fix — read ticket, test API or UI, compare Swagger, draft evidence, post comment (with approval), transition and assign back to dev.
  Use when the user says retest bug, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
---

# Retest bug workflow

End-to-end retest from a Jira bug ticket: fetch ticket → test → compare Swagger → draft comment → post (after approval) → transition → assign back to dev.

**Project-agnostic:** Load URLs, credentials, and transitions from `references/*-retest-guide.md` in the user's workspace.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

**Jira bodies** (after approval): neutral English — no "Retested by:", no honorifics. If reproduction is unclear or results conflict with dev claims, follow [qa-debug-discipline.md](../../references/qa-debug-discipline.md) before posting PASSED/FAILED.

Use plain chat for URLs/credentials; AskUserQuestion only for choices (e.g. approve comment).

## Refusal-first (precondition gate)

MUST refuse to start Step 2 until the user provides a **Jira bug key or browse URL** — because retest scope is one issue.

MUST refuse to run tests without **reachable environment config** (workspace `*-retest-guide.md` or answers from [project-config-template.md](references/project-config-template.md)) — because URLs and credentials must not be hardcoded in the skill.

On first response after constraints, follow [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) for **Retest bug**, then show [intake-one-pager.md](../../references/intake-one-pager.md) (Retest section).

---

## Step 0 — Get the ticket

If no key or URL was provided:

> Which Jira bug should I retest? Share the issue key or browse URL.

**Wait for an answer.** Extract `{ISSUE_KEY}` and `{JIRA_DOMAIN}` from the link.

---

## Step 1 — Project config

### 1a. Find existing config

In the **workspace** `references/` folder, find `*-retest-guide.md`. If present → read → go to 1c.

### 1b. Interactive setup (first time)

Ask **one question at a time** using `references/project-config-template.md` sections:

- Jira domain, ticket prefix
- Environments + base URLs + Swagger paths
- Portals, login URLs, login method
- Test credentials (never commit production secrets)
- Optional error docs, transitions, gotchas

Write `references/{project}-retest-guide.md` in the user's repo and tell them where it was saved.

### 1c. Use config only

All URLs, credentials, transition names, and Swagger URLs come from config — **no hardcoded project values in this skill**.

---

## Step 2 — Fetch Jira ticket

Use Atlassian integration (`getJiraIssue` or equivalent):

- `issueIdOrKey`: `{ISSUE_KEY}`
- Prefer markdown or rendered fields

Capture: environment, test steps, expected/actual results, API endpoint, bug type hints (`[API]`, `[FE]`, admin vs user portal).

---

## Step 2b — Fix claim vs verification plan (mandatory)

Follow [retest-fix-intake.md](../../references/retest-fix-intake.md). Post the retest plan block before executing tests.

---

## Step 3 — Bug type and comment format (decide once)

| Bug type | Screenshots | Comment format | API |
|----------|-------------|----------------|-----|
| **API** | No | v3 ADF | `/rest/api/3/.../comment` |
| **FE / UI** | **Required** | **v2 wiki markup** | `/rest/api/2/.../comment` |

Set flag `COMMENT_FORMAT=v2` or `v3` here. **Do not change later** — rewriting between formats wastes time.

### Optional extra skills

| Need | Use |
|------|-----|
| Deep investigation | `references/debug-discipline.md` |
| Real browser UI | Browser automation / DevTools available in the environment |
| Complex multi-case proof | Verification discipline before claiming done |

---

## Step 4 — Login and test

### 4a. Environment

From config: base URL, portal, login URL for the env on the ticket.

### 4b. Login

Use browser automation: navigate to login URL, fill credentials from config (or env vars the user provides). OTP/SSO per config. If blocked → ask user for a bearer token.

### 4c. Test data

**Never stop with "no data to test."** Try in order:

1. Use existing records (list APIs).
2. Create data via API (POST) with clear test naming.
3. Clone and modify an existing record.
4. Ask the user only for data you cannot synthesize.

Do not modify unrelated production records; record IDs you create.

### 4d. API testing

Use `fetch` with **full URLs**. Patterns: baseline, bug case from ticket, edge cases if relevant.

### 4e. Swagger comparison

Load OpenAPI/Swagger from config URL.

| Check | Result |
|-------|--------|
| Code matches Swagger | Continue |
| Code mismatch | FAILED |
| Code OK, message mismatch vs error docs | FAILED |
| Swagger + docs silent | BLOCKED |

Swagger is source of truth — not stale ticket text alone.

---

## Step 5 — Evidence

### API bugs

- Full cURL (method, URL, headers, body) per case — no "same as above"
- Full response (status, headers, body)
- Swagger link for the endpoint
- Dates in headers as YYYY-MM-DD

### FE bugs

- Screenshot **every** case — upload as issue attachment first
- Name files `tc{N}-{short-desc}.png`
- Max ~3 bullets per case in the comment
- Embed with wiki: `!filename.png|width=600!`

Upload via authenticated `POST /rest/api/3/issue/{KEY}/attachments` with `X-Atlassian-Token: no-check` if using browser session.

---

## Step 6 — Draft Jira comment

**Do not post until the user approves** (unless they explicitly waive approval).

Template core:

```markdown
**Retest Result: PASSED ✅**   (or **FAILED ❌**)

**Env:** {ENV} (`{url}`)
**API:** `{METHOD} {path}`   (if API bug)
**Swagger:** {link}
**Date:** {YYYY-MM-DD}

---

**Test Step (from ticket):** …
**Expected Result:** …

| No. | Test Case | Input | Result | Status |
|-----|-----------|-------|--------|--------|
| 1 | Bug case | … | … | ✅/❌ |

---

**Evidence** — full cURL + response per case (API) or screenshots (FE)
```

**Table headers:** every column MUST carry an explicit, all-English header. Give the row-number column the header `No.` — a bare `#` renders as a **blank** header cell in Jira. Applies to both markdown (MCP) and v2 wiki (`|| No. || … ||`) tables.

Show the full draft in chat and wait.

---

## Step 7 — Post comment

### Pre-post checklist

- [ ] Real ❌ ✅ emoji (not escaped literals in the payload)
- [ ] Issue keys in body wrapped or avoided if auto-link is unwanted
- [ ] ASCII-safe JS if using JXA (`/[^\x00-\x7F]/.test(js)` false)
- [ ] v2 vs v3 endpoint matches format

### 7a. Choose method based on content

| Content | Method |
|---------|--------|
| Comment ≤ 3 table rows OR text-only (no table) | MCP `addCommentToJiraIssue` — fast for short results |
| Comment > 3 table rows | ADF-direct via browser JS (Pattern D in [jira-fast-publish.md](../../references/jira-fast-publish.md)) |
| FE bug with screenshots | v2 wiki markup via browser JS (Step 7c) |

**Definition of "table":** `| col | col |` rows with data — the evidence summary block (`**Env:** staging`, `**API:** …`) is NOT a table.

**For MCP path (≤ 3 rows / text-only):**
`addCommentToJiraIssue` with approved body. **Verify on Jira** — truncation still possible; if truncated, switch to ADF-direct.

**For ADF-direct path (> 3 table rows):**

1. Build ADF JSON from approved draft. Convert `<br>` → `{"type": "hardBreak"}` nodes. Full rules: [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md).
2. Set `window.__adfBody` on page (Pattern A — ADF only, no CSV data needed).
3. Run Pattern D (comment-only): single JS fetch to `/rest/api/3/issue/{KEY}/comment`.
4. Read `window.__fastPublish` via Pattern C; check `status: 'ok'`.

Full JS patterns and error recovery: [jira-fast-publish.md](../../references/jira-fast-publish.md).

### 7b. Fallback for MCP path only

When MCP truncates or returns 403 on a ≤ 3 row comment, switch to ADF-direct Pattern D above.

### 7c. FE + screenshots

Use **v2** wiki markup and `/rest/api/2/issue/{KEY}/comment`. Attach images before posting.

### 7d — Post-publish review (mandatory)

Before Step 8 transition, run review per [jira-comment-post-review.md](../../references/jira-comment-post-review.md):

1. Re-open `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}` (or equivalent).
2. Checklist:
   - [ ] New comment visible; summary line **PASSED ✅** or **FAILED ❌** correct.
   - [ ] **No literal `<br>`, HTML tags, or stray markup** visible as text.
   - [ ] **Numbered items** (`1. ` `2. ` `3. `) each on a separate line — not running together.
   - [ ] No truncation; screenshots attached and render (FE).
   - [ ] API evidence: cURL + response present per row.
3. If any check fails → fix → re-post → re-verify on Jira UI. **Max 3 rounds** — then report specific failures with best available workaround.

MUST NOT transition, assign, or report "done" until 7d passes — because stakeholders trust Jira, not MCP output.

**Fresh-eyes:** MUST re-read full draft from Step 6 before Step 7 when comment **> 80 lines** or table **> 15 rows**.

---

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + skill-specific:

- [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌** (not ambiguous text).
- [ ] `Verdict: PASSED` or `Verdict: FAILED` with issue link.
- [ ] v2/v3 format matches Step 3 lock; FE bugs have screenshots attached before wiki embed.
- [ ] API cases: full cURL + response per row (no "same as above").
- [ ] Jira issue re-opened after post: comment visible, not truncated.
- [ ] Step 7d fix-verify completed.
- [ ] Step 9 QA notify sent if the project configures a channel (retest verdict + Jira comment link + @mention).
- [ ] [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Retest section).

---

## Step 8 — Close out (after successful post; no second approval unless user asked)

### 8a. Transition

Read transition names from the workspace `*-retest-guide.md` (see [project-config-template.md](references/project-config-template.md)). If missing, ask the user for **PASSED** and **FAILED** transition names before calling the API.

NEVER hardcode transition names in the skill — Jira workflows differ per project.

Use `getTransitionsForJiraIssue` and match the names from config or the user.

### 8b. Find developer

From changelog: last move into the project's **active development** status (often named "In Progress" — use the name from config if different) → that author's `accountId`.

### 8c. Assign

`editJiraIssue` → assignee = that developer (PASSED and FAILED).

### 8d. Tell the user

> Done. Review at `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}`

---

## Step 9 — QA result notify (if the project configures a channel)

After the transition, if the project defines a **QA notify channel** (Discord/Slack/chat), post a **retest-result** notification so the reporter / QA owner sees the outcome.

- Load channel, format, recipient, and any helper from the workspace `*-retest-guide.md` / project guide. **Never hardcode webhook URLs, tokens, machine paths, or user IDs in this skill** ([portable-content.md](../../references/portable-content.md)) — they live in project config or local agent memory.
- Message = the single **retest verdict** (PASSED ✅ / FAILED ❌), a short bullet of what was checked, a link to the Jira retest comment, and an @mention of the recipient the project specifies (default: the bug **Reporter**).
- This is a **result FYI**, not a "please review" request (the retest is already closed) — do not reuse the full-test-run "QA Review Requested / pending review" wording.
- If the project provides a notify helper, **use it** (it gets @mention + headers right) instead of hand-assembling the payload.

Skip if the project has no notify channel configured.

---

## Skill composition

| Situation | See |
|-----------|-----|
| Still failing | `references/debug-discipline.md` |
| Encoding / v2 issues | `references/gotchas.md` |
| Session handoff | `references/handoff-template.md` |
| Lessons learned | `references/post-mortem-template.md` |
| [worked-example.md](references/worked-example.md) | On-demand: anonymized sample (read only when format reference needed) |

---

## Out of scope

- TC prep, full ticket Playwright, filing new bugs — see [skill-routing.md](../../references/skill-routing.md)

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST read project config before testing | No hardcoded env URLs |
| MUST include full cURL/response per API case | Evidence must stand alone |
| MUST treat Swagger (+ error docs) over stale ticket text | Ticket may be wrong |
| MUST use **PASSED ✅** or **FAILED ❌** only in summary line | Scanability for dev/QA |
| MUST give every table column an explicit English header; row-number column = `No.` | bare `#` renders as a blank header cell in Jira |
| MUST lock v2/v3 at Step 3; FE → v2 + screenshots | Rewrites waste time |
| MUST verify Jira UI after post (Step 7d) before Step 8 | Truncation / wrong endpoint |
| MUST run Step 8 after successful post unless user stopped you | Workflow closure |
| MUST create test data when possible | "No data" is not an excuse |
| MUST NOT change COMMENT_FORMAT after Step 3 | v2/v3 rewrite cost |
