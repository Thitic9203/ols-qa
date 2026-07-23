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

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Jira bodies** (after approval): neutral English — no "Retested by:", no honorifics. If reproduction is unclear or results conflict with dev claims, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before posting PASSED/FAILED.

**Any verdict that is not a clean PASSED** is governed by [defect-report-completeness.md](../../../references/defect-report-completeness.md) — the comment must answer the reader's five questions (what, **which entry points**, what it should be instead, why that is a fail, **what changes and who decides**) before it is posted. A question asked after posting means a section was missing; the fix is the comment, not a chat reply.

Use plain chat for URLs/credentials; AskUserQuestion only for choices (e.g. approve comment).

## Refusal-first (precondition gate)

MUST refuse to start Step 2 until the user provides a **Jira bug key or browse URL** — because retest scope is one issue.

MUST refuse to run tests without **reachable environment config** (workspace `*-retest-guide.md` or answers from [project-config-template.md](references/project-config-template.md)) — because URLs and credentials must not be hardcoded in the skill.

On first response after constraints, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Retest bug**, then show [intake-one-pager.md](../../../references/intake-one-pager.md) (Retest section).

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

**The bug's own details are the PRIMARY verdict source.** Read the bug's description in full and extract its **Expected Result verbatim** — every item, every exact wording. The verdict criterion is:

- **PASSED** only if the retest satisfies **ALL** expected results stated in the bug — every item, character-exact where the bug specifies wording. Partial match = **FAILED**.
- Parent-story AC / Figma are **supplements** for context or when the bug is title-only — they never override or dilute the bug's own expected results. If the bug's expected result and the parent AC conflict, test against the bug's text and flag the conflict to the user.
- List each expected-result item as its own row in the result table (Step 6) so the ALL-items check is visible, not implied.

**Viewing a Figma supplement:** when the bug/parent references a Figma design, prefer the **Figma Dev Mode MCP** (`get_screenshot` / `get_metadata`) — needs the Figma desktop app with **Dev Mode MCP Server enabled** (Figma menu → Preferences) and the file open; `node-id` in the URL uses `-`, the MCP `nodeId` uses `:` (`1234-5678` → `1234:5678`). If that server is off, **fall back to the browser-automation MCP**: open the file URL (a logged-in browser session persists auth), let the canvas render, screenshot the node. Dismiss the **"view this file in Dev Mode?"** modal with **"Not now"** — NEVER "Request access". View+Comment access is enough. (Figma stays a **supplement** — it never overrides the bug's own expected results.)

---

## Step 2b — Fix claim vs verification plan (mandatory)

Follow [retest-fix-intake.md](../../../references/retest-fix-intake.md). Post the retest plan block before executing tests.

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

### 4f. Repro matrix + settle + contradiction gate (mandatory for every non-PASSED item)

Follow [defect-report-completeness.md](../../../references/defect-report-completeness.md) §2–§3. Three things happen **during the run**, not while drafting — you cannot reconstruct them later:

1. **Exercise every entry point, one at a time.** For a UI defect that means at minimum: the direct URL/route **and** the in-app path a real user takes to the same surface (list card, menu, CTA, deep link). Capture a separate screenshot per entry point and name it per path. One row per entry point in the matrix; a path you did not exercise is recorded `not tested` — **never inferred from another path**.
2. **Settle after every state change.** After a fixture step that changes server state (publish / unpublish / approve / delete / role change), hard-reload each surface before observing it. A view that was already open holds pre-change data; recording it is reporting your own test timing as the product's behavior. A stale window worth reporting is a **separate timing note** with the measured delay — not a matrix row.
3. **Resolve contradictions before drafting.** If two of your observations of the same surface disagree, name the contradiction, re-run that surface cleanly, and record which observation was the artifact and why. Never resolve it in favour of the verdict you already have. Unresolvable after a clean re-run → that item is **BLOCKED**, not FAILED.

---

## Step 5 — Evidence

### API bugs

- Full cURL (method, URL, headers, body) per case — no "same as above"
- Full response (status, headers, body)
- Swagger link for the endpoint
- Dates in headers as YYYY-MM-DD

### FE bugs

- Screenshot **every** case — upload as issue attachment first, then embed inline
- Name files `tc{N}-{short-desc}.png`
- Max ~3 bullets per case in the comment
- **Inline image embedding (mandatory):** after uploading each screenshot as an attachment, embed it in the v2 wiki comment using `!filename.png|width=450!` (≈50% of Jira comment column width). Images MUST render inline — never leave them as filename-only text references.

**Upload + embed flow:**
1. Save screenshots to `docs/result/{ISSUE_KEY}/`
2. Serve via local CORS server (127.0.0.1) for browser-based upload
3. Upload each file: `fetch('/rest/api/3/issue/{KEY}/attachments', {method:'POST', headers:{'X-Atlassian-Token':'no-check'}, body: formData})` using authenticated browser session on Jira page
4. Reference in v2 wiki comment body: `!filename.png|width=450!` — one image per evidence item

---

## Step 6 — Draft Jira comment

**Do not post until the user approves** (unless they explicitly waive approval).

**Draft in the syntax of the endpoint chosen at Step 3 — never in markdown "and convert later".**
Markdown and Jira wiki markup are different languages that share characters, so a markdown draft
posted to `/rest/api/2/` does not error — it renders as visible garbage (`**x**` → `*<b>x</b>*`).
Pick the template below that matches `COMMENT_FORMAT`; syntax map and gates in
[jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md).

**Template core — v2 wiki markup** (`/rest/api/2/…`; FE bugs, anything with screenshots):

```text
*Retest Result: PASSED* ✅   (or *Retest Result: FAILED* ❌)

*Env:* {ENV} ({url})
*API:* {METHOD} {path}   (if API bug)
*Swagger:* {link}
*Date:* {YYYY-MM-DD}
*Fixture:* {what was used, and whether it was restored}

----

*Test Step (from ticket):* …
*Expected Result (from ticket, verbatim):* …

||*No.*||*Expected result item*||*Actual*||*Status*||
|1|{item quoted from the ticket}|{observed}|✅/❌|

*Expected-result coverage:* {n} / {total} items met

----

*Evidence* — full cURL + response per case (API) or screenshots (FE)
```

**Template core — markdown/ADF** (MCP `addCommentToJiraIssue` or `/rest/api/3/…`): identical
content, but `**bold**`, `---`, and a `| col | col |` table with a `|---|` divider row.

Never mix the two in one body.

**Verbosity ceiling:** a PASSED comment stays inside the template above — no added narrative
paragraphs, no restating the ticket, no "why this matters" prose. Each field line holds only its
value. Evidence captions for FE screenshots are **one short line each**, placed directly above the
embed (e.g. "Reported-content list — pending review queue:") — never a paragraph. If a field doesn't
apply (e.g. **API**/**Swagger** on an FE bug), omit the line entirely rather than writing "N/A".

### 6a. Extra sections REQUIRED when the verdict is FAILED or BLOCKED

A PASSED comment stops at the template above. **Anything else adds these three blocks**, in this order, per [defect-report-completeness.md](../../../references/defect-report-completeness.md) §1–§4:

| Block | Content | Answers |
|-------|---------|---------|
| **Repro matrix** | one row per entry point exercised: entry point · steps · observed · reproduces? · evidence file. Untried paths listed as `not tested` | "does this only happen from a direct URL?" |
| **Why this item failed** | the failing expected-result line **quoted verbatim**, then *should be* vs *is now* as implementable facts (which elements render, which are disabled, which route) | "what should it look like instead, and which line did I break?" |
| **Resolution options** | the two mutually exclusive outcomes with a named owner each — spec owner updates the expected result (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone | "do I change code or do you change the ticket, and who decides?" |

Also state plainly, in one line, whether the **originally reported symptom is gone** — a FAILED verdict on a
different deviation is routinely misread as "the fix didn't work".

**Never edit the ticket's expected-result field** to match observed behavior. QA reports the conflict and names
the decision-maker; QA does not resolve it.

### 6b. Dev-question gate (MUST pass before the draft goes to the user)

Read your own draft as the developer who will act on it. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → **fix the
comment**, never "post now and explain in chat". Also confirm: every scope word in the draft (`always`,
`any entry point`, `only when …`) traces to a repro-matrix row, and no observation in the draft is under an
unresolved contradiction.

**Table headers:** every column MUST carry an explicit, all-English header. Give the row-number column the header `No.` — a bare `#` renders as a **blank** header cell in Jira. **Headers MUST be bold, in the syntax of the target endpoint** — v2 wiki `||*No.*||*Test Case*||…` (single asterisk, `||` delimiters, **no divider row**); markdown/ADF `| **No.** | **Test Case** | …` followed by a `|---|` divider. A `**No.**` in a v2 body renders as literal `*No.*`, and a `|---|` divider row in a v2 body renders as a visible row of dashes.

Show the full draft in chat and wait.

---

## Step 7 — Post comment

### Pre-post checklist

- [ ] Real ❌ ✅ emoji (not escaped literals in the payload)
- [ ] Issue keys in body wrapped or avoided if auto-link is unwanted
- [ ] ASCII-safe JS if using JXA (`/[^\x00-\x7F]/.test(js)` false)
- [ ] v2 vs v3 endpoint matches format

#### Syntax gate — scan the body string before the request (mandatory)

Run both gates in [jira-wiki-vs-markdown.md](../../../references/jira-wiki-vs-markdown.md):
grep the **exact outgoing body** for `**`, `^---$`, `^\|\s*-{3,}`, `![](`, backticks and unescaped
`{word}`; then after posting, re-fetch with `?expand=renderedBody` and check the four counts. Any
pre-post hit = fix the body, do not post.

This is a string scan, not a read-through — markdown leaks are invisible when proof-reading, because
the draft looks like what you meant.

### 7a. Choose method based on content

| Content | Method |
|---------|--------|
| Comment ≤ 3 table rows OR text-only (no table) | MCP `addCommentToJiraIssue` — fast for short results |
| Comment > 3 table rows | ADF-direct via browser JS (Pattern D in [jira-fast-publish.md](../../../references/jira-fast-publish.md)) |
| FE bug with screenshots | v2 wiki markup via browser JS (Step 7c) |

**Definition of "table":** `| col | col |` rows with data — the evidence summary block (`**Env:** staging`, `**API:** …`) is NOT a table.

**For MCP path (≤ 3 rows / text-only):**
`addCommentToJiraIssue` with approved body. **Verify on Jira** — truncation still possible; if truncated, switch to ADF-direct.

**For ADF-direct path (> 3 table rows):**

1. Build ADF JSON from approved draft. Convert `<br>` → `{"type": "hardBreak"}` nodes. Full rules: [jira-linebreak-conversion.md](../../../references/jira-linebreak-conversion.md).
2. Set `window.__adfBody` on page (Pattern A — ADF only, no CSV data needed).
3. Run Pattern D (comment-only): single JS fetch to `/rest/api/3/issue/{KEY}/comment`.
4. Read `window.__fastPublish` via Pattern C; check `status: 'ok'`.

Full JS patterns and error recovery: [jira-fast-publish.md](../../../references/jira-fast-publish.md).

### 7b. Fallback for MCP path only

When MCP truncates or returns 403 on a ≤ 3 row comment, switch to ADF-direct Pattern D above.

### 7c. FE + screenshots (inline image embedding)

Use **v2** wiki markup and `/rest/api/2/issue/{KEY}/comment`.

**Mandatory flow — images must render inline, not as filename text:**

1. **Upload attachments first** — for each screenshot, POST to `/rest/api/3/issue/{KEY}/attachments` via authenticated browser JS (FormData + `X-Atlassian-Token: no-check`). Serve local files through a CORS server (127.0.0.1) so the browser fetch can read them.
2. **Embed in wiki body** — reference each uploaded file as `!filename.png|width=450!` (≈50% of comment column). Place the embed directly after its corresponding evidence row or description.
3. **Post comment** — v2 wiki POST to `/rest/api/2/issue/{KEY}/comment` with the body containing `!file.png|width=450!` references. v2 renders these as inline images automatically.
4. **Verify (Step 7d)** — confirm images render as visible pictures on Jira, not as `!filename!` text.

### 7d — Post-publish review (mandatory)

Before Step 8 transition, run review per [jira-comment-post-review.md](../../../references/jira-comment-post-review.md):

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

Follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific:

- [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌** (not ambiguous text).
- [ ] `Verdict: PASSED` or `Verdict: FAILED` with issue link.
- [ ] **Non-PASSED verdict:** Step 6a's three blocks present — repro matrix (one row per entry point, untried paths `not tested`), why-this-item-failed with the expected-result line quoted verbatim, resolution options with a named owner each — plus the one-line statement of whether the originally reported symptom is gone.
- [ ] **Step 6b dev-question gate passed before the first post**; every scope word traces to a matrix row; no unresolved contradiction between your own observations.
- [ ] v2/v3 format matches Step 3 lock; FE bugs have screenshots attached before wiki embed.
- [ ] API cases: full cURL + response per row (no "same as above").
- [ ] Jira issue re-opened after post: comment visible, not truncated.
- [ ] Step 7d fix-verify completed.
- [ ] **Step 8·0 format-completeness gate passed BEFORE any transition** — FE bug: screenshots embedded inline + render-verified; API bug: full cURL/response per row.
- [ ] Bug landed in Done → **Step 8d** run: stories it blocked either moved to ready-for-QA or left with their remaining blockers reported.
- [ ] Step 9 QA notify sent if the project configures a channel (retest verdict + Jira comment link + @mention).
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Retest section).

---

## Step 8 — Close out (after successful post; no second approval unless user asked)

### 8·0 — Format-completeness gate (MUST pass before ANY transition)

**Hard gate — do NOT run 8a until the posted comment is complete per the Step 6 / Step 7c format:**

- [ ] Summary line is exactly **PASSED ✅** or **FAILED ❌**; env + results table present (bold headers, `No.` column).
- [ ] One result row per expected-result item (the ALL-items check is visible).
- [ ] **FE / UI bug:** a screenshot for **every executed case**, uploaded as an attachment **and embedded inline** (`!file.png|width=450!`), confirmed rendering on the Jira UI (Step 7d). **A text-only comment for an FE bug FAILS this gate** — the exact-text/values table is not a substitute for the required images.
- [ ] **API bug:** full cURL + response per row (no "same as above").
- [ ] No local file paths, no literal `<br>`/HTML markup.

If any item fails — including when evidence **cannot** be embedded (e.g. no Jira-auth upload path) — **STOP. Do NOT transition.** Report the specific gap to the user and resolve it (or get an explicit user waiver) first. Never move a bug's status on an evidence-incomplete comment.

### 8a. Transition

Read transition names from the workspace `*-retest-guide.md` (see [project-config-template.md](references/project-config-template.md)). If missing, ask the user for **PASSED** and **FAILED** transition names before calling the API.

NEVER hardcode transition names in the skill — Jira workflows differ per project.

Use `getTransitionsForJiraIssue` and match the names from config or the user.

**Default transitions (override in project config):**

| Verdict | Target status | Typical transition name |
|---------|--------------|------------------------|
| PASSED | Done | "approve by QA" |
| FAILED | In Progress | project-specific — check config |

**Note:** some projects use BLOCKED for FAILED retests — check the project's `*-retest-guide.md` or `references/ols-project-guide.md` for the correct target status.

### 8b. Find developer (project-overridable)

From changelog: last move into the project's **active development** status (often named "In Progress" — use the name from config if different) → that author's `accountId`.

**Some projects (e.g. OLS) never change assignee** — check the project guide before running this step.

### 8c. Assign (project-overridable)

`editJiraIssue` → assignee = that developer (PASSED and FAILED).

**Skip if the project guide says "never change assignee"** (e.g. OLS — ownership tracked by status, not assignee).

### 8d. Unblock linked stories (run once the bug reaches Done)

**Trigger: the bug is now in Done** — i.e. the retest PASSED and Step 8a moved it there. A bug in Done
counts as fixed, and that is what releases the stories it was blocking. Run this immediately after the
8a transition succeeds (and also whenever you find a Done bug whose blocked stories were never moved).

A bug usually carries a **blocks** link to one or more stories — on the story those appear as
**"is blocked by {ISSUE_KEY}"**. Once this bug is Done the story may be ready for QA again, but only
when **nothing else** still blocks it.

1. Read the bug's link list and collect every issue it **blocks**.
2. For each of those stories, re-read the story's own **inward blocks links** ("is blocked by") — do
   NOT assume this bug was the only blocker.
3. Move the story to the project's ready-for-QA status **only if every one of its blockers is in
   Done**. Take the status/transition name from the project config (`references/*-retest-guide.md` /
   project guide) — never hardcode it here.
4. **Only Done counts as resolved.** A blocker still in an in-flight status — being deployed, in
   review, in progress — leaves the story blocked.
5. **Only move a story that is parked in the project's blocked status.** A story already in QA
   (ready-for-QA / testing) or still being built (in progress / review) must be left alone — pushing it
   to ready-for-QA would move it backwards or hand QA work the dev has not finished.
6. If any blocker is unresolved, **leave the story untouched** and report the remaining blocker keys
   and their statuses to the user.
7. Never change the story's assignee or QA Owner while doing this.

**Bug not in Done → skip this step entirely.** A story stays blocked while the bug is unfixed.

| Situation | Action |
|-----------|--------|
| Bug Done, story parked in blocked status, no other blocker outside Done | transition story → ready-for-QA status |
| Bug Done, story still blocked by something not Done | leave; report the blocker keys + statuses |
| Bug Done, story already in QA or still in development | leave; never move it backwards |
| Bug Done, no blocks link on the bug | nothing to do |
| Bug not in Done (FAILED / BLOCKED verdict) | skip |

### 8e. Tell the user

> Done. Review at `https://{JIRA_DOMAIN}/browse/{ISSUE_KEY}`

Include the 8d outcome: which stories were moved, and which stayed blocked and by what.

---

## Step 9 — QA result notify (if the project configures a channel)

After the transition, if the project defines a **QA notify channel** (Discord/Slack/chat), post a **retest-result** notification so the reporter / QA owner sees the outcome.

- Load channel, format, recipient, and any helper from the workspace `*-retest-guide.md` / project guide. **Never hardcode webhook URLs, tokens, machine paths, or user IDs in this skill** ([portable-content.md](../../../references/portable-content.md)) — they live in project config or local agent memory.
- Message = the single **retest verdict** (PASSED ✅ / FAILED ❌), a short bullet of what was checked, a link to the Jira retest comment, and an @mention of the recipient.
- **Recipient resolution (mandatory):** read the recipient from the ticket field the project guide names (e.g. a "QA Owner" custom field) — fetch that field's value from the bug itself for **every** notify; do not reuse a name from an earlier ticket, and do not default to the Reporter. The label printed next to the mention MUST match the field the value came from (label "QA Owner" ⇒ value from the QA Owner field). If the field is empty or the guide names no field, ask the user before sending.
- This is a **result FYI**, not a "please review" request (the retest is already closed) — do not reuse the full-test-run "QA Review Requested / pending review" wording.
- If the project provides a notify helper, **use it** (it gets @mention + headers right) instead of hand-assembling the payload.

### Pre-notify review gate (mandatory, every send)

Run this checklist on the **dry-run output** before every real send — no exceptions, including resends and corrections:

1. **Ticket key + title** match the Jira issue exactly.
2. **Verdict + counts** match the posted Jira retest comment (PASS/FAIL/BLOCKED numbers add up to the cases actually run).
3. **Body bullets** describe what was actually tested against the **bug's own expected results** — no copy-paste from another ticket.
4. **Result link** opens the correct issue and `focusedCommentId` = the retest comment ID just posted.
5. **Recipient**: re-read the QA Owner field value fetched in this session for THIS ticket; confirm the resolved `<@id>` maps to that name in the roster, and the label matches the field source.
6. Only after all 5 pass → send. Any doubt → show the dry-run to the user first.

Skip if the project has no notify channel configured.

### Correcting a posted notification

If a verdict changes after the notification was sent (e.g. PASSED→FAILED on re-audit):

1. **PATCH the existing Discord message** — do not repost. Use `PATCH /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` with the corrected content.
2. To find the message ID: use webhook GET `GET /webhooks/{wid}/{wtok}/messages/{mid}?thread_id={thread}` (bot token GET returns empty `content` without MESSAGE_CONTENT intent).
3. Update the Jira comment in place (`addCommentToJiraIssue` with `commentId` parameter).
4. Transition the ticket to the correct status.

---

## Step 10 — A question arrives after the comment was posted

A follow-up question is a **defect in the comment**, not a normal step. Handle it in this order — see
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §6.

1. **Re-verify before answering.** If the answer is not already backed by a labelled evidence file from
   this retest, re-run that surface first. Never answer from memory of an earlier run, and never answer
   from the comment you wrote — the comment is what is being questioned.
2. **Check your own evidence set for the contradiction first.** If two captures disagree, that is the
   answer's real subject; resolve it per §3b before replying.
3. **Answer in the shape asked** (§7): direct answer first, then at most one line of why. If the user
   says it is too long, shorten the same answer — do not re-emit it at the same length.
4. **Fold the answer into the original comment** (edit in place, same comment id) so the next reader
   never needs the chat thread. Re-run Step 7d after the edit.
5. **If an earlier statement was wrong**, correct it **visibly in both places**: the in-place comment edit
   states which claim is being corrected, **and** a follow-up message goes into the thread where the wrong
   answer was given. Never a silent edit — people have already replied to the wrong version.
6. Record which Step 6a block would have prevented the question, so the next retest writes it up front.

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

- TC prep, full ticket Playwright, filing new bugs — see [skill-routing.md](../../../references/skill-routing.md)

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST read project config before testing | No hardcoded env URLs |
| MUST include full cURL/response per API case | Evidence must stand alone |
| MUST treat Swagger (+ error docs) over stale ticket text | Ticket may be wrong |
| MUST use **PASSED ✅** or **FAILED ❌** only in summary line | Scanability for dev/QA |
| MUST keep a PASSED comment inside the Step 6 template fields only — no narrative padding, one-line evidence captions | A tight comment is scannable in seconds; prose bloat buries the verdict (locked from OLS-251 accepted format 2026-07-23) |
| MUST give every table column an explicit English header; row-number column = `No.` | bare `#` renders as a blank header cell in Jira |
| MUST bold every table header cell (`\| **No.** \| **Test Case** \| …`) | Jira doesn't auto-bold markdown headers; non-bold looks unprofessional |
| MUST compare actual text against expected (customfield_12116) character-by-character when expected specifies exact wording | Any text difference = FAIL — no "minor wording" or "cosmetic" exceptions |
| MUST lock v2/v3 at Step 3; FE → v2 + screenshots | Rewrites waste time |
| MUST verify Jira UI after post (Step 7d) before Step 8 | Truncation / wrong endpoint |
| MUST pass the Step 8·0 format-completeness gate before ANY status transition — FE bug requires screenshots embedded inline **and** render-verified; a text-only FE comment fails the gate | Transitioning on an evidence-incomplete comment silently hides the gap (learned OLS-181: FE bug moved to Done with a text-only comment) |
| MUST NOT offer the user a "skip screenshots / text-only" option for an FE bug — screenshots are mandatory, not optional; if upload is blocked, STOP and resolve, don't bypass | Offering to skip a mandatory step is how the gate got bypassed (OLS-181) |
| MUST run Step 8 after successful post unless user stopped you | Workflow closure |
| MUST run Step 8d as soon as the bug lands in Done — Done = fixed = the stories it blocked may be releasable | Otherwise blocked stories sit in the backlog after their blocker is already closed |
| MUST check EVERY "is blocked by" link on a story before moving it in Step 8d, treat only **Done** as resolved, and move only stories parked in the blocked status | This bug is often not the story's only blocker; moving a still-blocked story sends untestable work back to QA, and touching a story already in QA/dev moves it backwards |
| MUST create test data when possible | "No data" is not an excuse |
| MUST NOT change COMMENT_FORMAT after Step 3 | v2/v3 rewrite cost |
| MUST NOT include local file paths in Jira comments (`docs/result/`, absolute home/machine paths, etc.) | Meaningless to Jira readers; user enforced "เน้นๆๆ ห้ามผิดอีก" |
| MUST scan Jira comment for local paths before posting | Catches leaks: `docs/`, `~/`, absolute paths |
| MUST use two-step transition for READY TO TEST → Done: `121` then `41` | Single `151` fails; READY TO TEST can't jump directly to Done |
| MUST transition FAIL verdict to In Progress (`21`), NEVER to BLOCKED | OLS workflow: BLOCKED = external block, In Progress = needs dev fix |
| MUST `--dry-run` Discord notify before real send | Catches format errors before they go live |
| MUST set `--pass-count N` + `--summary "Retest of dev fix"` + `--owner-label "QA Owner"` on every Discord retest notify | Defaults produce wrong output (0/0/0 + wrong label); learned from 3-resend incident |
| MUST fetch the notify recipient from the ticket's QA Owner field (per project guide) per ticket, and verify the @mention person = that field's value — NEVER the Reporter, never a name carried over from another ticket | Label said "QA Owner" but pinged the Reporter → 3 wrong pings, user correction 2026-07-15 |
| MUST verdict from the bug's OWN expected results — PASSED only when ALL items are met (character-exact where wording is specified); parent AC is supplement, never substitute | Bug details are the contract; partial match = FAILED (user rule 2026-07-15) |
| MUST exercise **every** entry point to a failing surface separately (direct route **and** the in-app path a user takes) and give each its own repro-matrix row + screenshot; untried paths are written `not tested` | A path with no evidence row is a guess. OLS-108: "happens via both entry points" was published from one run, the dev acted on it, and it had to be retracted in-ticket |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no repro-matrix row supports | The scope claim is the first thing a dev builds on |
| MUST hard-reload every surface after a state-changing fixture step before observing or capturing it; report a stale-data window only as a separate timing note with the measured delay | An already-open view holds pre-change data — recording it publishes your test timing as product behavior (OLS-108: card looked clickable ~5s after unpublish) |
| MUST resolve any disagreement between your own observations with one clean re-run before drafting, and record which was the artifact; unresolvable → BLOCKED, not FAILED | Resolving it in favour of the verdict you already reached is how the wrong repro path shipped |
| MUST include the Step 6a blocks on every non-PASSED comment — repro matrix, why-failed with the expected-result line quoted verbatim, resolution options with a named owner per option | These are exactly the questions a dev asks next; answering them in chat instead leaves the ticket unreadable |
| MUST state in one line whether the originally reported symptom is gone, even when the verdict is FAILED on a different deviation | "FAILED" alone reads as "the fix did not work" |
| MUST NOT edit the ticket's expected-result field to match observed behavior — name the decision owner instead | The spec owner decides; QA reports the conflict |
| MUST pass the Step 6b dev-question gate before the FIRST post — never "post now, explain in chat" | The gate exists so the answers land in the comment, not in a round-trip that ends in an edited comment (OLS-108) |
| MUST re-verify (re-run the surface) before answering any question that arrives after posting, then fold the answer into the original comment in place and re-run Step 7d | Answering from memory published a wrong claim once already |
| MUST correct a wrong published statement **visibly in both places** — in-place comment edit naming the corrected claim **and** a follow-up in the thread where the wrong answer was given | People already replied to the wrong version; a silent edit makes the thread unreadable |
| MUST run the Step 9 pre-notify review gate (5 checks on dry-run output) before EVERY send, including resends | Catches wrong recipient/link/counts before they go live (user rule 2026-07-15) |
| MUST embed FE screenshots as inline images (`!file.png\|width=450!`) in Jira comments — never leave as filename-only text | Screenshots must be visible inline; filename text is unreadable evidence |
| MUST NOT use `await` in superpowers-chrome eval — use setTimeout + window.__var | `await` returns undefined; callback pattern required |
| MUST use `mousedown` event (not `click`) for MUI Select/combobox elements | MUI Select ignores regular click events |
| MUST match OLS buttons by textContent, not generic CSS class | Generic selectors hit wrong button (e.g. "สร้างสื่อ" instead of target) |
| MUST NOT modify DOM inside MutationObserver callback | Causes infinite recursion → CDP crash |
| MUST use singular OLS management URLs (`/creator/learning-path` not `/learning-paths`) | Plural = 404; API uses plural but UI uses singular |
