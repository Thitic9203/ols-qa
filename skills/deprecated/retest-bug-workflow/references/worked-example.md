# Worked example (anonymized) — Retest bug

> **These bodies are machine-checked** where the workspace provides the guard.
> `tools/retest-guard/worked_example.test.js` extracts the
> fenced blocks below and runs them through `tools/retest-guard/retest_rules.js` — the single source
> of truth for every mechanical rule. An example that drifts from the rules fails a test instead of
> teaching the next reader to write a broken comment (which is exactly what happened when this file
> carried `|width=450`, a parameter whose pipe splits the table row).

**Bug:** `PROJ-204` — API returns 500 when end date is before start date
**Result:** FAILED ❌ (fix incomplete)

## Inputs

- Issue key from user: `PROJ-204`
- Workspace `references/example-retest-guide.md` (created earlier in session): staging base URL, Swagger URL, admin credentials (session-only)

## Repro — agent steps (abbreviated)

1. **Step 0–1:** Loaded config from the **user's workspace**; no hardcoded URLs in the skill body.
2. **Step 3:** `[API]` in title → locked `COMMENT_FORMAT=v3`, no screenshots.
3. **Step 4:** Three `fetch` calls — happy path 200, bug payload 500, boundary equal dates 400 per Swagger.
4. **Step 6:** Draft comment with full cURL + JSON bodies → guard clean → user `approve`.
5. **Step 7:** MCP post → **fix-verify:** opened issue in browser; summary line showed `FAILED ❌`; table not truncated.
6. **Step 8:** Transition names taken from `example-retest-guide.md`; assignee from changelog.

## Output snippet — API bug, markdown/ADF body

API bug → `COMMENT_FORMAT=v3`, so this body is **markdown** (MCP converts it to ADF). The same text
on the v2 path would have to be wiki markup — see example 2 below. An API bug carries **no Evidence
column**; the full cURL + response for each row goes in a section under the table, because a cURL
block does not fit in a cell.

```markdown
**Retest Result: FAILED** ❌

**Env:** Staging (https://api.staging.example.com)
**API:** PUT /api/v1/schedules/:id
**Swagger:** https://api.staging.example.com/swagger
**Role:** ADMIN
**Date:** 2026-05-20
**Build:** 4f21c0e
**Fixture:** schedule created via POST, deleted after the run
**Scope:** FULL

**Test cases run:** 1

| **Case** | **Title** | **Covers** | **Role** | **Status** |
|---|---|---|---|---|
| TC_01 | invalid date range is rejected | ER1 | ADMIN | ❌ |

| **No.** | **Expected Result** | **Actual Result** | **Status** |
|---|---|---|---|
| 1 | 400 with message "end date must be after start date" | 500, unhandled exception | ❌ |

**Expected-result coverage:** 1 / 1 items met

**Root cause:** the range check runs after the persistence call, so the driver raises before
validation is reached — Confirmed (response body carries the driver's constraint name; the same
payload against the sibling endpoint returns 400).

**Resolution options:** dev moves the range check ahead of persistence on `PUT /api/v1/schedules/:id`
and leaves the equal-dates path alone, **or** the spec owner accepts 500 for this input and updates
the expected result. Decided by: spec owner.

Originally reported symptom: still present.
```

## Lessons

- Swagger said 400 for invalid range; server still returned 500 → FAILED, not PASSED.
- NEVER switch v2/v3 mid-session after choosing v3 at Step 3.
- A path parameter is written `:id`, never `{id}` — an unknown `{word}` is read as a macro that never
  closes and swallows every table and rule below it.

---

## Worked example 2 (anonymized) — PASSED, FE, tight format

**Bug:** `PROJ-88` — admin review action shows wrong button label
**Result:** PASSED ✅

FE bug → evidence → **v2 wiki markup**, so the body below is wiki markup, **not markdown**.
Output (full comment — this is the entire body, nothing added):

```text
*Retest Result: PASSED* ✅

*Env:* Staging (app.staging.example.com)
*Design ref:* https://figma.example.com/design/abc/Review?node-id=210-4471
*Role:* CONTENT_ADMIN
*Date:* 2026-07-23
*Build:* 9c3ab77
*Fixture:* Existing queue item — no new fixture created or modified
*Scope:* FULL

----

*Test Step (from ticket):* Admin opens the review action on a flagged item
*Expected Result (from ticket, verbatim):* Reject button reads "Review Failed" and the queue row keeps its flagged badge

*Test cases run:* 1

||*Case*||*Title*||*Covers*||*Role*||*Status*||
|TC_01|review modal button labels and queue badge|ER1, ER2|CONTENT_ADMIN|✅|

||*No.*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||
|1|Reject button reads "Review Failed"|Reads "Review Failed" — char-exact from the DOM|[▶ PROJ-88_TC_01_CONTENT_ADMIN.mp4|^PROJ-88_TC_01_CONTENT_ADMIN.mp4] !TC_01_CONTENT_ADMIN-ER_1.png!|✅|
|2|queue row keeps its flagged badge|Badge present after the modal closes|[▶ PROJ-88_TC_01_CONTENT_ADMIN.mp4|^PROJ-88_TC_01_CONTENT_ADMIN.mp4] !TC_01_CONTENT_ADMIN-ER_2.png!|✅|

*Expected-result coverage:* 2 / 2 items met
*Case coverage:* 1 / 1 cases run — 1 passed / 0 failed / 0 blocked
```

## Lessons (example 2)

- No *API*/*Swagger* lines — FE bug, so they're omitted, not written as "N/A".
- **Evidence lives in the row's own `Evidence` cell**, not in a separate section below the table. The
  `Actual Result` cell already says what the image shows, so no caption line is needed.
- Every embedded still is `!file.png!` — **bare**. Resize to ~600–640 px before upload; a width
  parameter puts a `|` inside the cell and splits the row.
- The whole-flow MP4 is linked per row; a still is added only on rows that verify exact wording,
  a count, or a displayed value.
- Nothing outside the template fields — this is the whole comment.
- **The fence says `text`, not `markdown`, on purpose.** Every construct above is wiki markup:
  `*bold*` (one asterisk), `----` (4 dashes), `||header||`, `!file.png!`. Copying this block into a
  markdown-flavoured draft — or drafting in markdown and posting to `/rest/api/2/` — produces
  `*<b>bold</b>*`, an em-dash instead of a rule, and a visible row of dashes where the divider was.
  Nothing errors; it just renders wrong. Syntax map: [jira-wiki-vs-markdown.md](../../../../references/jira-wiki-vs-markdown.md).
  The rules themselves live in the workspace at `tools/retest-guard/retest_rules.js`.
