# Jira formatting for FE test-case comments

## Comment structure

```text
Draft TC FE as below

**Shared data preparation (all TCs):**
1. ...
2. ...

**Note — Precondition column:** After shared prep (above), complete Precondition items before Test Steps.

| **Acceptance Criteria** | **Services Impacted** | ... |
| --- | --- | --- |
| AC_01: ... | - Service | TC_... | ... |

---

**Test cases (CSV):** Same content as the table above ({N} cases). Download the attached file `{ISSUE_KEY}_FE_TC.csv`.
```

## Table rules

| Rule | Detail |
|------|--------|
| One row per TC | Never merge multiple TCs into one row |
| Line breaks in cells | Use `<br>` not raw newlines in markdown source |
| Numbered lists in cells | `1. First<br>2. Second<br>3. Third` |
| Header emphasis | Bold each header cell |

## CSV export rules

| Rule | Detail |
|------|--------|
| Encoding | UTF-8 with BOM (`\uFEFF`) for Excel |
| Header | Same 9 column names as the table |
| Cell newlines | Real `\n` inside quoted CSV fields |
| Bold | Strip `**` from markdown when exporting |

## ADF notes (when using API/browser ADF)

- Map `<br>` to hard breaks in paragraph content.
- Large tables may require ADF instead of markdown API.
- Some ADF node types for inline attachments return HTTP 400 — use a text link to `secure/attachment/{id}/{filename}` instead.

## Footer link pattern

Use the organization's Jira base URL:

`https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/{FILENAME}.csv`

Do not use local filesystem paths in the comment body.
