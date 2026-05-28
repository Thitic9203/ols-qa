# Session intake — Testing ticket

Collect these before any Playwright run.

## Ticket

- Jira key (`PROJ-123`) or full browse URL.
- This issue is the **scope anchor** — test what the ticket describes; do not expand to unrelated modules unless the user asks.

## URL

- Full base URL for the environment under test (e.g. `https://portal.example.com`).
- Not the Jira URL — the **application** URL.

## User / Password

- Portal login. Use `guest` + `—` when the ticket is explicitly unauthenticated.
- Never echo the password back in summaries; show `password provided (not shown)`.

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

The agent must show all seven fields (or explicit `none`) plus a derived test plan and receive **confirm** before Playwright starts.
