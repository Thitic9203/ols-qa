# Plan — create-bug: no second issue after a failed create

- File: `skills/procedures/create-bug-workflow/WORKFLOW.md`, Phase E → Jira step 4 ("MCP fails").
- Change: a duplicate check runs first in step 4, before the path list. Text only; no new tool or dependency (uses the Atlassian MCP `searchJiraIssuesUsingJql` the skill already lists, or the REST search on the locked path).
- Risk: longer step 4. Kept to one short block.
- Sync to helix follows the normal ols-qa → helix sync.
