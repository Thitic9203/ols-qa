---
name: retest-bug-workflow
description: |
  Retest a Jira bug after a dev fix — read ticket, test API or UI, compare Swagger, draft evidence, post comment (with approval), transition and assign back to dev.
  Use when the user says retest bug, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
proactive_triggers:
  - retest bug
  - verify fix
  - check if fixed
  - /retest-bug
  - Retest bug
---

# Retest bug workflow

End-to-end retest from a Jira bug ticket: fetch ticket → test → compare Swagger → draft comment → post (after approval) → transition → assign back to dev.

**Project-agnostic:** Load URLs, credentials, and transitions from `references/*-retest-guide.md` in the user's workspace.

## Communication (mandatory)

Follow [user-communication.md](../../references/user-communication.md).

Follow [skill-rules-style.md](../../references/skill-rules-style.md) for MUST/NEVER, refusal-first, and QA closing.

**Jira bodies** (after approval): neutral English — no "Retested by:", no honorifics. MUST NOT claim success without tool output **and** Jira UI verification — because MCP can report OK while the comment is truncated.

Use plain chat for URLs/credentials; AskUserQuestion only for choices (e.g. approve comment).

## Refusal-first (precondition gate)

MUST refuse to start Step 2 until the user provides a **Jira bug key or browse URL** — because retest scope is one issue.

MUST refuse to run tests without **reachable environment config** (workspace `*-retest-guide.md` or answers from [project-config-template.md](references/project-config-template.md)) — because URLs and credentials must not be hardcoded in the skill.

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

| Test Case | Input | Result | Status |
|-----------|-------|--------|--------|
| Bug case | … | … | ✅/❌ |

---

**Evidence** — full cURL + response per case (API) or screenshots (FE)
```

Show the full draft in chat and wait.

---

## Step 7 — Post comment

### Pre-post checklist

- [ ] Real ❌ ✅ emoji (not escaped literals in the payload)
- [ ] Issue keys in body wrapped or avoided if auto-link is unwanted
- [ ] ASCII-safe JS if using JXA (`/[^\x00-\x7F]/.test(js)` false)
- [ ] v2 vs v3 endpoint matches format

### 7a. Try Atlassian MCP / REST first

`addCommentToJiraIssue` with approved body. **Verify on Jira** — truncation happens.

### 7b. Fallback — browser session + JXA (macOS Chrome)

When MCP truncates or returns 403:

1. Build ADF (v3) or wiki string (v2) in Node.
2. `JSON.stringify` → escape non-ASCII → save JS as **ASCII only**.
3. Execute in a Chrome tab logged into `{JIRA_DOMAIN}`.
4. Read `window.__cr` for status and comment id.

See `references/gotchas.md` for encoding.

### 7c. FE + screenshots

Use **v2** wiki markup and `/rest/api/2/issue/{KEY}/comment`. Attach images before posting.

### 7d — Fix-verify after post (mandatory)

Before Step 8 transition:

1. Re-open `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}` (or equivalent).
2. Checklist:
   - [ ] New comment visible; summary line **PASSED ✅** or **FAILED ❌** correct.
   - [ ] No truncation; screenshots attached and render (FE).
   - [ ] API evidence: cURL + response present per row.
3. If mismatch → edit/add comment per project rules → re-read. **Max 2 rounds** — then report blockers.

MUST NOT transition or assign until 7d passes — because stakeholders trust Jira, not MCP output.

**Fresh-eyes:** MUST re-read full draft from Step 6 before Step 7 when comment **> 80 lines** or table **> 15 rows**.

---

## QA closing (mandatory before "done")

Follow [skill-rules-style.md — doubt and fix-verify](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume** the first draft comment or test conclusion is wrong — re-check evidence.
2. Skill-specific:
   - [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌** (not ambiguous text).
   - [ ] Close-out includes `Verdict: PASSED` or `Verdict: FAILED` with issue link.
   - [ ] v2/v3 format matches Step 3 lock; FE bugs have screenshots attached before wiki embed.
   - [ ] API cases: full cURL + response per row (no "same as above").
   - [ ] Jira issue re-opened after post: comment visible, not truncated.
3. Shared checklist: [skill-rules-style.md](../../references/skill-rules-style.md#shared-closing-checklist-every-workflow).
4. Step 7d fix-verify completed.

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

## Skill composition

| Situation | See |
|-----------|-----|
| Still failing | `references/debug-discipline.md` |
| Encoding / v2 issues | `references/gotchas.md` |
| Session handoff | `references/handoff-template.md` |
| Lessons learned | `references/post-mortem-template.md` |
| [worked-example.md](references/worked-example.md) | Anonymized end-to-end sample |

---

## Out of scope

- TC prep, full ticket Playwright, filing new bugs — see [skill-routing.md](../../references/skill-routing.md)

---

## MUST / NEVER (critical rules)

| Rule | Because |
|------|---------|
| MUST read project config before testing | No hardcoded env URLs |
| MUST get user approval before post | Irreversible public record |
| MUST include full cURL/response per API case | Evidence must stand alone |
| MUST treat Swagger (+ error docs) over stale ticket text | Ticket may be wrong |
| MUST use **PASSED ✅** or **FAILED ❌** only in summary line | Scanability for dev/QA |
| MUST run Step 8 after successful post unless user stopped you | Workflow closure |
| MUST create test data when possible | "No data" is not an excuse |
| MUST lock v2/v3 at Step 3; FE → v2 + screenshots | Rewrites waste time |
| MUST verify Jira UI after post (Step 7d) | Truncation / wrong endpoint |
| MUST complete Step 7d before Step 8 | Transition on wrong comment misleads dev |
| MUST use English for user chat | [user-communication.md](../../references/user-communication.md) |
| MUST NOT change COMMENT_FORMAT after Step 3 | v2/v3 rewrite cost |
| MUST NOT claim retest complete without opening the issue after post | Tool output can lie |
