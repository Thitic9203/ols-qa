# CONTEXT — domain language

| Term | Meaning |
|------|---------|
| **Story** | Jira story/issue that holds AC/EC; default target for the TC comment |
| **Sub-task** | Child issue — **not** the default publish target |
| **AC** | Acceptance criteria row on the story |
| **EC** | Edge case / negative criteria row |
| **Shared data prep** | Numbered steps above the table; same for every TC |
| **Precondition column** | Per-row setup after shared prep, before Test Steps |
| **TC** | Manual test case (one table row) |
| **Draft comment** | Jira comment intro `Draft TC FE as below` + table |
| **ADF** | Atlassian Document Format for rich Jira comments |
| **Truncation** | API/MCP drops most of the table — only header visible |

Use `{ISSUE_KEY}`, `{JIRA_DOMAIN}`, `{PORTAL}` as placeholders — never hardcode a real project ticket in the skill files.
