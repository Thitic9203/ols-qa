# Posting discipline — Create bug

## GitHub

- `gh issue create` — use HEREDOC for body; capture stdout for issue URL.
- Labels: `bug`, `severity:<Severity>` (matrix row: Low / Medium / High / Urgent), `module:<name>` when supported.

## Jira

Which body markup each create path takes, and which gate runs on it, is one table in
[WORKFLOW.md § Phase D — Jira](../WORKFLOW.md#jira). Lock format at confirm (Phase C).

## Jira MCP → JXA fallback

Used only when WORKFLOW Phase D's MCP-failure branch selects it (macOS with a logged-in browser
session). Otherwise follow the next branch there — REST with credentials, or hand the drafts to the user.


1. Build body; `JSON.stringify` then escape non-ASCII to `\uXXXX` for ASCII-only `.js` file.
2. Dry-run decode before `osascript`.
3. Real emoji `✅` `❌` — not literal `\\u274c` in posted content.

## Pre-post checklist

- [ ] User confirmed drafts
- [ ] Evidence attached where required (FE/UI screenshots on Jira)
- [ ] No bare `PROJ-123` in wiki — use `{{PROJ-123}}` when auto-link is unwanted
- [ ] Tool output shows issue key or URL

## Post-create verification

- Fetch or open each issue URL.
- Compare title to draft.
- Report failures explicitly.
