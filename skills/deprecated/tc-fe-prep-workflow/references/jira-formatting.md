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

📎 **Attachments:**
- [Draft_Jira_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ID1}/Draft_Jira_{ISSUE_KEY}.csv) — ตารางเทสเคส (Jira format)
- [Import_Qase_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ID2}/Import_Qase_{ISSUE_KEY}.csv) — Qase import file พร้อม import เข้า OLS project
- [Unit_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ID3}/Unit_Test_{ISSUE_KEY}.csv) — Unit Test *(include only if generated)*
- [Integration_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ID4}/Integration_Test_{ISSUE_KEY}.csv) — Integration Test *(include only if generated)*
- [System_Test_{ISSUE_KEY}.csv](https://{JIRA_DOMAIN}/secure/attachment/{ID5}/System_Test_{ISSUE_KEY}.csv) — System Test *(include only if generated)*
```

## Table rules

| Rule | Detail |
|------|--------|
| One row per TC | Never merge multiple TCs into one row |
| Line breaks in cells | Use `<br>` not raw newlines in markdown source |
| Numbered lists in cells | `1. First<br>2. Second<br>3. Third` |
| Header emphasis | **Bold every header cell** \u2014 wrap each column name in `**...**` in the chat draft, Jira comment, and `.md` file e.g. `\| **Acceptance Criteria** \| **Test Title** \|` |

## Export file rules

| Format | Header bold | Detail |
|--------|-------------|--------|
| Chat draft / Jira comment / `.md` | `**Column Name**` markdown bold | Apply to every column header |
| `.xlsx` | `Font(bold=True)` via openpyxl | Applied to row 1 of the worksheet |
| `.csv` | Plain text \u2014 **no bold** | CSV format does not support text formatting; header row is plain column names only |

### Additional CSV rules

| Rule | Detail |
|------|--------|
| Encoding | UTF-8 with BOM (`encoding='utf-8-sig'`) for Excel |
| Header | Same 10 column names as the table (plain text, no `**`) — applies to `Draft_Jira_*` file; `Import_Qase_*` uses Qase schema |
| Cell newlines | Real `\n` inside quoted CSV fields \u2014 use `csv.writer` |
| HTML tags | Strip all; `<br>` variants \u2192 `\n` |

## Mandatory `<br>` conversion before Jira post

**MUST** convert `<br>` to Jira-native line breaks before posting. Raw `<br>` renders as **literal text** in Jira table cells — not a line break.

Full rules: [jira-linebreak-conversion.md](../../../../references/jira-linebreak-conversion.md).

| Delivery | Convert `<br>` to |
|----------|-------------------|
| MCP / REST markdown | `\n` in body string |
| ADF JSON | `{"type": "hardBreak"}` |
| Wiki (v2) | `\\` |

**Chat draft keeps `<br>`** (readable in markdown). **Jira body MUST NOT contain `<br>`.**

## ADF notes (when using API/browser ADF)

- Map `<br>` to `{"type": "hardBreak"}` nodes in paragraph content — never literal `<br>` text.
- Large tables may require ADF instead of markdown API.
- Some ADF node types for inline attachments return HTTP 400 — use a text link to `secure/attachment/{id}/{filename}` instead.

## Footer link pattern

Use the organization's Jira base URL:

`https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/{FILENAME}.csv`

Do not use local filesystem paths in the comment body.
