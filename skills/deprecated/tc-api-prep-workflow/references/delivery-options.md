# Delivery options — TC API Prep

## CSV

Follow [csv-export-rules.md](../../../../references/csv-export-rules.md) — CSV export section. Key points:

- Apply **Cell text cleaning**: `<br>` variants → `\n`, strip ALL HTML tags, strip `**`
- UTF-8 with BOM (`encoding='utf-8-sig'`) — mandatory for Thai and non-ASCII to render correctly
- Use `csv.writer` (not string concatenation) — handles multiline cell quoting automatically
- Header row: plain text column names (no bold — CSV format does not support formatting)
- Do NOT alter Thai or non-ASCII characters

## Excel (.xlsx)

Follow [csv-export-rules.md](../../../../references/csv-export-rules.md) — Excel/xlsx section. Key points:

- Use Python + openpyxl inline script (see csv-export-rules.md for full script template)
- Apply **Cell text cleaning** same as CSV
- Header row 1: `Font(bold=True)` on every cell
- Cells with `\n`: set `Alignment(wrap_text=True)`
- **Never silently produce CSV when user asked for xlsx** — if openpyxl fails, warn and ask

## Test.md (agent-native, additive)

For hand-off to a Playwright/CLI agent or PR reading. Offer **alongside** CSV/Excel — never as a replacement.

- Format spec: [test-md-format.md](../../../../references/test-md-format.md) (single source of truth)
- Same reviewed table feeds it; emit exactly the approved rows (no fabricated cases)
- File: `{ISSUE_KEY}.test.md` in workspace

## Jira comment / chat draft

- **Bold every header cell**: `| **Test Case ID** | **Module / Feature** | **Test Title** | ... |` — ALL columns, not just one
- Multi-line cells: `<br>` between numbered items
- Wrap issue keys in `{{PROJ-123}}` if auto-link is unwanted
- Large tables: verify row count on Jira UI after post; consider CSV/xlsx attachment + table summary

## Confluence

- Match existing table on the page if updating
- Read page first; do not overwrite unrelated sections

## Verification

After any delivery:

- [ ] Row count matches approved draft
- [ ] Column order matches user-confirmed format
- [ ] No draft marked “not published” still missing at destination
