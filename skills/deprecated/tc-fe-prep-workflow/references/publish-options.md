# Publish options — Jira comment + CSV

Choose based on what the agent environment supports. **Always verify on Jira UI.**

## Mandatory: convert `<br>` before posting (all options)

**MUST** convert every `<br>` in the comment body **before** posting to Jira. The chat draft uses `<br>` for readability, but Jira renders it as **literal text** — not a line break.

Full conversion rules: [jira-linebreak-conversion.md](../../../../references/jira-linebreak-conversion.md).

| Option | `<br>` becomes |
|--------|----------------|
| A (MCP/REST markdown) | `\n` (literal newline in body string) |
| B (ADF JSON) | `{"type": "hardBreak"}` node |
| C (manual paste) | Instruct user to press Enter inside cell |

**Never copy the chat draft directly to the Jira comment body.** Always run conversion first.

## Option A — Atlassian MCP / REST (markdown)

**Use when:** Comment is small enough to render fully.  
**Risk:** Body truncation — table shows header only.  
**Pre-post:** Run `<br>` → `\n` conversion on every cell in the body string.  
**After post:** Count rows on Jira + confirm **no literal `<br>` in any cell**; if incomplete, use Option B.

## Option B — ADF + authenticated browser

**Use when:** Large tables (many TCs or long steps).  
**Pattern:**

1. Build ADF JSON from approved markdown (map `<br>` to `{"type": "hardBreak"}` nodes — not literal `<br>` text).
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
- [ ] **No literal `<br>` visible in any cell** (zero tolerance — fix and re-post if found).
- [ ] Multi-line cells render on separate lines (each numbered item on its own line).
- [ ] CSV opens with header + same row count.
- [ ] Attachment and comment on the **same issue**.

## CSV upload requirements

| Field | Value |
|-------|--------|
| Content-Type | `text/csv` with UTF-8 BOM |
| Filename | `{ISSUE_KEY}_FE_TC.csv` (or project convention) |
| Issue | Same as comment target |
