# Session intake — Testing ticket

Collect these before any Playwright run.

## Ticket

- Jira key (`PROJ-123`) or full browse URL.
- This issue is the **scope anchor** — test what the ticket describes; do not expand to unrelated modules unless the user asks.

## URL

- Full base URL for the environment under test (e.g. `https://portal.example.com`).
- Not the Jira URL — the **application** URL.

## User (account only — no password)

- The test account (username/email). Use `guest` when the ticket is explicitly unauthenticated.
- Never ask for, accept, store, or fill a password. If the user pastes one, do not use or echo it. A fresh login is the main thread's one login window with the email prefilled — the person types the password ([WORKFLOW.md](../WORKFLOW.md) *Login reuse*).

## VPN

- **Required** — User must connect before tests; note any profile or split-tunnel quirks.
- **Not required** — Public or office network only.
- If tests fail with network errors after VPN was marked required, re-check VPN first.

## Confluence

- Optional page with AC tables, API notes, or test data.
- `none` if all context is on the Jira ticket.

## Swagger

- Optional OpenAPI/Swagger URL for API scenarios tied to the ticket.
- `none` if UI-only.

## Confirmation gate

The agent must show all six fields (or explicit `none`) plus a derived test plan and receive **confirm** before Playwright starts.
