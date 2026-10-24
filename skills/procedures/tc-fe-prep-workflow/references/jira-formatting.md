# Jira formatting for FE test-case comments

## Comment structure

The comment is posted as **ADF** (WORKFLOW Step 7) — never as a markdown body. Its shape, in order
(the readable preview of the same structure: [jira-comment-adf-template.md](jira-comment-adf-template.md)):

```text
Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ

Shared data preparation (all TCs):            ← ADF orderedList
1. ...
2. ...

Slim summary table — 6 columns (ADF table; headers are tableHeader nodes, bold by default):
| AC/EC Ref | Services Impacted | ID | Test Title           | Priority | Type        |
| AC_01     | Media Library     | 1  | ...                  | High     | System Test |
| EC_02     | 1. order-service 2. api-gateway | 2 | ...   | Medium   | System Test |

Attachments — one link per uploaded file (link text = filename, href from __ATT{n}_ID__):
Draft_Jira_{ISSUE_KEY}.csv — ตารางเทสเคส (Jira format)
Import_Qase_{ISSUE_KEY}.csv — Qase import file พร้อม import เข้า Qase project
Unit_Test_{ISSUE_KEY}.csv / Integration_Test_{ISSUE_KEY}.csv / System_Test_{ISSUE_KEY}.csv — only if generated

Skip-note per absent Type · Remark block (when it applies) · Disclaimer (last node)
```

IDs are plain numbers (design-and-review Step 3c); AC/EC Ref is the code only; Services Impacted
follows the Step 3 column rule (one plain name, or bold-numbered inline for 2+ — never a `- ` bullet).
Precondition, Test Data, Test Steps and Expected Result live only in the CSV attachments.

## Table rules

| Rule | Detail |
|------|--------|
| One row per TC | Never merge multiple TCs into one row |
| Line breaks in cells | `.md` file and HTML draft: `<br>`, not raw newlines. ADF: `hardBreak` nodes (the slim table has none) |
| Numbered lists in cells | `1. First<br>2. Second<br>3. Third` (`.md` / HTML draft) |
| Header emphasis | `.md` file: wrap each column name in `**...**`. Jira comment (ADF): `tableHeader` nodes — no `**` anywhere in ADF text. HTML draft: plain `<th>` |

## Export file rules

| Format | Header bold | Detail |
|--------|-------------|--------|
| `.md` file | `**Column Name**` markdown bold | Apply to every column header |
| Jira comment (ADF) | `tableHeader` node (bold by default) | Never `**` in ADF text — it renders literally |
| HTML draft | plain `<th>` | No `**` |
| `.xlsx` | `Font(bold=True)` via openpyxl | Applied to row 1 of the worksheet |
| `.csv` | Plain text — **no bold** | CSV format does not support text formatting; header row is plain column names only |

### Additional CSV rules

| Rule | Detail |
|------|--------|
| Encoding | UTF-8 with BOM (`encoding='utf-8-sig'`) for Excel |
| Header | Same 10 column names as the table (plain text, no `**`) — applies to `Draft_Jira_*` file; `Import_Qase_*` uses Qase schema |
| Cell newlines | Real `\n` inside quoted CSV fields — use `csv.writer` |
| HTML tags | Strip all; `<br>` variants → `\n` |

## Mandatory `<br>` conversion before Jira post

**MUST** convert `<br>` to Jira-native line breaks before posting. Raw `<br>` renders as **literal text** in Jira table cells — not a line break.

Full rules: [jira-linebreak-conversion.md](../../../../references/jira-linebreak-conversion.md).

| Delivery | Convert `<br>` to |
|----------|-------------------|
| MCP / REST markdown | `\n` in body string |
| ADF JSON | `{"type": "hardBreak"}` |
| Wiki (v2) | `\\` |

**The `.md` file and HTML draft keep `<br>`.** **Jira body MUST NOT contain `<br>`.**

## ADF notes (when using API/browser ADF)

- Map `<br>` to `{"type": "hardBreak"}` nodes in paragraph content — never literal `<br>` text.
- Large tables may require ADF instead of markdown API.
- Some ADF node types for inline attachments return HTTP 400 — use a text link to `secure/attachment/{id}/{filename}` instead.

## Footer link pattern

Use the organization's Jira base URL:

`https://{JIRA_DOMAIN}/secure/attachment/{ATTACHMENT_ID}/{FILENAME}.csv`

Do not use local filesystem paths in the comment body.
