# Publish options — Jira comment + CSV

Choose based on what the agent environment supports. **Always verify on Jira UI.**

## Option A — Atlassian MCP / REST (markdown)

**Use when:** Comment is small enough to render fully.  
**Risk:** Body truncation — table shows header only.  
**After post:** Count rows on Jira; if incomplete, use Option B.

## Option B — ADF + authenticated browser

**Use when:** Large tables (many TCs or long steps).  
**Pattern:**

1. Build ADF JSON from approved markdown (map `<br>` to hard breaks).
2. Use a browser tab already logged into Jira (user session).
3. `PUT` update existing comment or `POST` new comment with ADF body.
4. `POST` multipart upload CSV to the **same issue**.
5. Append footer paragraph with markdown link to attachment URL.

**Do not** embed proprietary host-specific script paths in this skill — implement fetch/upload in the user's repo if they need automation, using env vars for domain and issue key.

## Option C — Manual handoff

**Use when:** No Jira API or browser automation.

Deliver to the user:

- Full markdown in chat.
- CSV file in workspace `references/`.
- Short instructions: attach CSV, paste markdown, verify row count.

## Option D — Test.md (agent-native, additive)

**Use when:** the TCs will be handed to a Playwright/CLI agent, or read in a PR.

- Offer **alongside** CSV/Excel — never instead of (existing spreadsheet users must not break).
- Format spec: [test-md-format.md](../../../../references/test-md-format.md) (single source of truth).
- Same reviewed chat table feeds it; emit exactly the rows shown (no fabricated cases).
- File: `{ISSUE_KEY}.test.md` in workspace `references/`.

## Verification checklist

- [ ] Issue key matches user request (story not sub-task).
- [ ] Row count = number of TCs in approved draft.
- [ ] Multi-line cells render on separate lines.
- [ ] CSV opens with header + same row count.
- [ ] Attachment and comment on the **same issue**.

## CSV upload requirements

| Field | Value |
|-------|--------|
| Content-Type | `text/csv` with UTF-8 BOM |
| Filename | `{ISSUE_KEY}_FE_TC.csv` (or project convention) |
| Issue | Same as comment target |
