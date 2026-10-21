# Project retest config — template

Save as `references/{project-name}-retest-guide.md` in the **user's workspace**. The skill detects `*-retest-guide.md` in Step 1.

---

## Project info

| Key | Value |
|-----|-------|
| Project name | `{PROJECT}` |
| Jira domain | `{org}.atlassian.net` |
| Ticket prefix | `{PREFIX}` |
| Confluence / docs | `{URL or —}` |

## Environments

| Env | Base URL | Swagger / API docs |
|-----|----------|-------------------|
| `{env}` | `https://...` | `https://.../api/docs` |

## Portals and login

| Portal | URL | Login method | Token notes |
|--------|-----|--------------|-------------|
| Admin | `https://...` | email/password | … |
| User / SP | `https://...` | OTP / SSO | … |

## Credentials

> Test/staging only — never production secrets in committed files.

| Portal | Username | Session |
|--------|----------|---------|
| Admin | `test@example.com` | saved login file; a dead session is restored by the relink / mint commands below, which the user runs. A password is never stored or filled |

### Session restore commands (login by command)

Claude never opens a login window. It shows each command to the user as its own `bash` block, and the user presses Run.

| Step | Template |
|------|----------|
| Relink (no password; every needed account) | `cd <project-dir> && <relink-command> --env <env> --account <account>` |
| Setup/mint (only accounts whose relink FAILED) | `cd <project-dir> && <mint-command> --env <env> --account <account>` |
| Probe (Claude runs it) | `<session endpoint>` returns the account's user id |

## API architecture

Short note: which portal calls which gateway, auth headers, etc.

## Token notes

- Admin token: how obtained, expiry, scope
- User token: how obtained, expiry, scope

## Error documentation (optional)

| Source | URL |
|--------|-----|
| Confluence error catalog | `{URL}` |

## Swagger comparison rules

1. Response code must match Swagger.
2. Message vs error docs if Swagger is silent.
3. Both match → PASSED; code mismatch → FAILED; ambiguous → BLOCKED.

## Jira transitions (required — project-specific)

| Retest result | Transition name (your Jira workflow) |
|---------------|--------------------------------------|
| PASSED | e.g. `Done`, `Ready for QA`, … |
| FAILED | e.g. `In Progress`, `Reopened`, … |

## Project-specific gotchas

- …
