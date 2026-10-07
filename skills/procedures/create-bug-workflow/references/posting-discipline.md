# Posting discipline — Create bug

## GitHub

- `gh issue create` — use HEREDOC for body; capture stdout for issue URL.
- Labels: `bug`, `severity:<level>`, `module:<name>` when supported.

## Jira

| Bug type (user says) | API style | Body markup |
|----------------------|-----------|-------------|
| FE / UI | v2 comment style for descriptions if creating via UI; create issue fields per MCP | Wiki |
| API / logic | v3 | ADF / markdown per MCP |

Lock format at confirm (Phase C).

## Jira MCP → JXA fallback

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
