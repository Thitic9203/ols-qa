# {Project} — Testing ticket guide

Optional workspace file: `references/{project}-testing-ticket-guide.md`  
Save **non-secret** defaults only. Never store passwords here.

## Defaults

| Field | Value |
|-------|--------|
| Default URL | |
| Default Swagger | |
| Default Confluence space/page | |
| VPN | Required / Not required — notes |
| Jira domain | |
| Ticket prefix | |

## Playwright

| Item | Value |
|------|--------|
| Config file | e.g. `playwright.config.ts` (path in **this** repo) |
| Login / auth setup command | e.g. `npm run test:login` (project-specific) |
| Auth storage path | e.g. `tests/.auth/session.json` (relative to repo root) |

## Jira comment format (if known)

- API bugs: v3 ADF
- FE bugs: v2 wiki markup

## Gotchas

- (env-specific notes)
