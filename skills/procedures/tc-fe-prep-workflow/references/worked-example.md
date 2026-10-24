# Worked example (anonymized) — TC FE prep

**Story:** `PROJ-100` — Edit scheduled item  
**Outcome:** 6 Thai manual TC rows posted to the story with a Qase import CSV attached.

## Inputs (user provided)

- Jira URL: `https://jira.example.com/browse/PROJ-100`
- AC/EC from story description (3 AC, 2 EC)
- Publish: comment on same story + Qase import CSV

## Repro — agent steps (abbreviated)

1. **Step 0:** User gave URL → extracted `PROJ-100`, `jira.example.com`.
2. **Step 2:** Mapped AC_01–AC_03, EC_01–EC_02 to scenarios (status unchanged after edit, validation on empty date).
3. **Step 4 QA:** Caught missing EC_02 on first pass → added TC `6` before draft.
4. **Step 4.5:** Posted Thai↔English term table (kept `Status`, `Dropdown` → `รายการแบบเลื่อนลง`) → user confirmed.
5. **Step 5:** HTML draft opened in the browser (Type column present) → user replied `approve` in chat.
6. **Step 6:** Suite gate — reused existing project suite `Schedule > Edit`; wrote `references/PROJ-100_FE_TC.md`, `references/Draft_Jira_PROJ-100.csv`, and `references/Import_Qase_PROJ-100.csv` in the **user's workspace** (per [csv-export-rules.md](../../../../references/csv-export-rules.md) + [qase-import-format.md](qase-import-format.md)).
7. **Step 7:** Uploaded both CSVs and posted the ADF comment (fast publish Patterns A → B → C); **fix-verify:** re-opened issue → 6 rows visible, both attachment links work, footer shows 2 lines.

## Output snippet (comment header only — posted as ADF; shown here as text)

```text
Draft TC FE as below

Shared data preparation (all TCs):
1. เข้าสู่ระบบด้วยบทบาท admin จาก project config
2. เปิดส่วนฟีเจอร์จาก project config

| AC/EC Ref | Services Impacted | ID | Test Title | Priority | Type |
| AC_01 | Portal | 1 | ... | High | System Test |
```

## Lessons

- First draft missed one EC → QA self-review caught it before Jira.
- NEVER skip the UI re-read after posting — an MCP `addComment` post once truncated the table, which is why TC tables now always go ADF-direct ([publish-options.md](publish-options.md)).
