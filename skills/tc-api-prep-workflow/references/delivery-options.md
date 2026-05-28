# Delivery options — TC API Prep

## CSV

- UTF-8 with BOM for Excel compatibility
- One row per test case; header = confirmed columns
- Replace `<br>` with newline inside cells
- Strip `**` from markdown bold

## Excel (.xlsx)

- Same data as CSV
- Prefer a small script or library in the user repo if available; otherwise CSV only and tell user to open in Excel

## Jira comment

- Bold headers: `**Test Case ID**`
- Multi-line cells: `<br>` between numbered items
- Wrap issue keys in `{{PROJ-123}}` if auto-link is unwanted
- Large tables: verify row count on Jira UI after post; consider CSV attachment + table summary (see tc-fe-prep `publish-options` patterns in sibling skill)

## Confluence

- Match existing table on the page if updating
- Read page first; do not overwrite unrelated sections

## Verification

After any delivery:

- [ ] Row count matches approved draft
- [ ] Column order matches user-confirmed format
- [ ] No draft marked “not published” still missing at destination
