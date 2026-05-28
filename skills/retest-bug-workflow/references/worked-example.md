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
