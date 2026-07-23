# Worked example (anonymized) — Retest bug

**Bug:** `PROJ-204` — API returns 500 when end date is before start date  
**Result:** FAILED ❌ (fix incomplete)

## Inputs

- Issue key from user: `PROJ-204`
- Workspace `references/example-retest-guide.md` (created earlier in session): staging base URL, Swagger URL, admin credentials (session-only)

## Repro — agent steps (abbreviated)

1. **Step 0–1:** Loaded config from the **user's workspace**; no hardcoded URLs in the skill body.
2. **Step 3:** `[API]` in title → locked `COMMENT_FORMAT=v3`, no screenshots.
3. **Step 4d:** Three `fetch` calls — happy path 200, bug payload 500, boundary equal dates 400 per Swagger.
4. **Step 6:** Draft comment with full cURL + JSON bodies → user `approve`.
5. **Step 7:** MCP post → **fix-verify:** opened issue in browser; summary line showed `FAILED ❌`; table not truncated.
6. **Step 8:** Transition names taken from `example-retest-guide.md`; assignee from changelog.

## Output snippet (summary only)

```markdown
**Retest Result: FAILED ❌**

**Env:** Staging (`https://api.staging.example.com`)
**API:** `PUT /api/v1/schedules/{id}`
**Swagger:** https://api.staging.example.com/swagger
**Date:** 2026-05-20
```

## Lessons

- Swagger said 400 for invalid range; server still returned 500 → FAILED, not PASSED.
- NEVER switch v2/v3 mid-session after choosing v3 at Step 3.

---

## Worked example 2 (anonymized) — PASSED, FE, tight format

**Bug:** `PROJ-88` — admin review action shows wrong button label
**Result:** PASSED ✅

FE bug → screenshots → **v2 wiki markup**, so the body below is wiki markup, **not markdown**.
Output (full comment — this is the entire body, nothing added):

```text
*Retest Result: PASSED* {color:green}✅{color}

*Env:* Staging (app.staging.example.com)
*Date:* 2026-07-23
*Fixture:* Existing queue item — no new fixture created or modified

----

*Test Step (from ticket):* Admin opens the review action on a flagged item
*Expected Result (from ticket, verbatim):* Reject button reads "Review Failed"

||*No.*||*Expected result item*||*Actual*||*Status*||
|1|Reject button reads "Review Failed"|Button text confirmed via DOM extraction, char-exact|✅|

*Expected-result coverage:* 1 / 1 items met

----

*Evidence*

Review queue list:
!queue-list.png|width=450!

Review modal — button labels confirmed:
!modal-buttons.png|width=450!
```

## Lessons (example 2)

- No *API*/*Swagger* lines — FE bug, so they're omitted, not written as "N/A".
- Each screenshot gets one short caption line, not a paragraph.
- Nothing outside the template fields — this is the whole comment.
- **The fence says `text`, not `markdown`, on purpose.** Every construct above is wiki markup:
  `*bold*` (one asterisk), `----` (4 dashes), `||header||`, `!file.png|width=450!`. Copying this
  block into a markdown-flavoured draft — or drafting in markdown and posting to `/rest/api/2/` —
  produces `*<b>bold</b>*`, an em-dash instead of a rule, and a visible row of dashes where the
  divider was. Nothing errors; it just renders wrong. Syntax map + pre-post scan:
  [gotchas.md](gotchas.md) § markdown → wiki.
