# Playwright discipline — Testing ticket

## Selectors (priority)

1. `data-testid`
2. `getByRole`, `getByLabel`
3. `getByText` (stable copy only)
4. Avoid brittle CSS (`nth-child`, deep chains)

## Waits

- Use `expect(locator).toBeVisible()` / `expect.poll()` for async UI.
- Do not increase timeouts to mask flakes — fix selector or environment.

## Evidence per failure

- Screenshot (named by scenario id)
- Console errors from the page
- Failed request URL + status
- Ticket step number that failed

## Project integration

If the workspace has Playwright E2E:

- Prefer existing `playwright.*.config.ts` and fixtures.
- Reuse saved `storageState` only when the user confirms that path is valid for this env.
- Do not duplicate `installCFBypassProxy` or similar if the base fixture already installs it.

## Session credentials

- Fill login from Phase A intake only.
- Do not commit credentials to spec files or guides.
