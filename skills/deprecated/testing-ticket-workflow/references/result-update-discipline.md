# Result update discipline

Used in **Phase G** after test summary in chat.

## Read before write

- Fetch the destination and note existing headers, status vocabulary, and date format.
- Do not invent column names — use what the user specified or what exists on the page.

## Common destinations

| Destination | Access | Rules |
|-------------|--------|--------|
| **Google Sheets** | Browser or API | Match header row; confirm tab name; batch updates; never overwrite unrelated columns without confirm |
| **Jira comment** | MCP or browser | Draft in chat first; FE often v2 wiki; API often v3 ADF; wrap keys `{{PROJ-123}}` |
| **Confluence** | Browser or API | Preserve page structure; update only the table the user named |
| **CSV / file in repo** | Read/write file | Show diff summary before commit unless user waived |

## Verification

After writing:

1. Re-read the same URL or file.
2. Compare each scenario result from the chat table to the destination.
3. Report discrepancies before claiming complete.

## Failure

If you cannot access the link → stop and list: URL tried, error, what the user must do (login, VPN, share sheet).
