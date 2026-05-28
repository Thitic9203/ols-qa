# Worked example (anonymized) — Retest bug

**Bug:** `PROJ-204` — API returns 500 when end date is before start date  
**Result:** FAILED ❌ (fix incomplete)

## Inputs

- Issue key from user: `PROJ-204`
- Workspace `references/acme-retest-guide.md`: PD3 base URL, Swagger URL, BO credentials (session-only)

## Repro — agent steps (abbreviated)

1. **Step 0–1:** Loaded config; no hardcoded URLs in skill body.
2. **Step 3:** `[API]` in title → locked `COMMENT_FORMAT=v3`, no screenshots.
3. **Step 4d:** Three `fetch` calls — happy path 200, bug payload 500, boundary equal dates 400 per Swagger.
4. **Step 6:** Draft comment with full cURL + JSON bodies → user `approve`.
5. **Step 7:** MCP post → **fix-verify:** opened issue in browser; summary line showed `FAILED ❌`; table not truncated.
6. **Step 8:** Transition `In Progress`; assignee from changelog = original developer.

## Output snippet (summary only)

```markdown
**Retest Result: FAILED ❌**

**Env:** PD3 (`https://pd3-api.example.com`)
**API:** `PUT /api/v1/schedules/{id}`
**Swagger:** https://pd3-api.example.com/swagger
**Date:** 2026-05-20
```

## Lessons

- Swagger said 400 for invalid range; server still returned 500 → FAILED, not PASSED.
- NEVER switch v2/v3 mid-session after choosing v3 at Step 3.
