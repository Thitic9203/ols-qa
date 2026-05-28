# Worked example (anonymized) — TC FE prep

**Story:** `PROJ-100` — Edit scheduled item  
**Outcome:** 6 manual TC rows posted to the story with CSV attachment.

## Inputs (user provided)

- Jira URL: `https://jira.example.com/browse/PROJ-100`
- AC/EC from story description (3 AC, 2 EC)
- Publish: comment on same story + CSV attachment

## Repro — agent steps (abbreviated)

1. **Step 0:** User gave URL → extracted `PROJ-100`, `jira.example.com`.
2. **Step 2:** Mapped AC_01–AC_03, EC_01–EC_02 to scenarios (status unchanged after edit, validation on empty date).
3. **Step 4 QA:** Caught missing EC_02 on first pass → added `TC_Schedule_06` before draft.
4. **Step 5:** Draft table in chat → user replied `approve`.
5. **Step 6:** Wrote `references/PROJ-100_FE_TC.md` and `references/PROJ-100_FE_TC.csv` in the **user's workspace** (in-agent CSV export per [csv-export-rules.md](../../../references/csv-export-rules.md)).
6. **Step 7:** Posted via MCP; **fix-verify:** re-opened issue → 6 rows visible, CSV 6 data rows + header.

## Output snippet (draft header only)

```text
Draft TC FE as below

**Shared data preparation (all TCs):**
1. Log in as admin role from project config.
2. Open the feature area from project config.

| Acceptance Criteria | Services Impacted | Test Case ID | ... |
| --- | --- | --- | --- |
| AC_01 | - Portal | TC_Schedule_01 | ... |
```

## Lessons

- First draft missed one EC → QA self-review caught it before Jira.
- NEVER skip UI re-read after MCP `addComment` — truncation occurred once; full table re-posted via ADF path per [publish-options.md](publish-options.md).
