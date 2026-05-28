---
name: retest-bug-workflow
description: Retest a Jira bug after a dev fix — read the ticket, test API or UI, compare Swagger, draft evidence, post comment (with approval), transition and assign. Use when the user says retest bug, verify fix, check if PROJ-123 is fixed, or chose Retest bug from Helix.
---

# Retest bug workflow

End-to-end retest from a Jira bug ticket: fetch ticket → test → compare Swagger → draft comment → post (after approval) → transition → assign back to dev.

**Project-agnostic:** Load URLs, credentials, and transitions from `references/*-retest-guide.md` in the user's workspace.

## Communication (mandatory)

- Speak to the user in **concise English**.
- Jira comments: neutral tone — no "Retested by:", no honorifics.
- Do not claim success without tool output **and** Jira UI verification where applicable.

## AskUserQuestion rules

If your UI supports structured multiple-choice prompts, **all** AskUserQuestion fields must be **English only** (Thai and some scripts render broken in those widgets).

Use plain chat for open-ended setup (URLs, credentials). Use AskUserQuestion only for choices (test approach, approve comment).

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

---

## Step 8 — Close out (after successful post; no second approval unless user asked)

### 8a. Transition

| Result | Default transition |
|--------|-------------------|
| PASSED | Ready to Demo |
| FAILED | In Progress |

Use `getTransitionsForJiraIssue` — names vary by project; override from config.

### 8b. Find developer

From changelog: last move to **In Progress** → that author's `accountId`.

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

---

## Critical rules

1. Read project config before testing.
2. Draft comment → user approval → post.
3. Full cURL/response per API case.
4. Swagger (+ error docs) over ticket guesswork.
5. **Retest Result: PASSED ✅** or **FAILED ❌** only in summary line.
6. Step 8 runs right after post unless user stopped you.
7. Create test data when possible — do not give up on missing data.
8. Decide v2/v3 at Step 3; FE → v2 + screenshots.
9. Verify Jira UI after post.
10. English for user chat; AskUserQuestion widgets English-only.
