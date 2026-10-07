# Playwright discipline — Testing ticket

## Selectors (priority)

Full hierarchy + failure-mode rules: [resilient-selectors.md](../../../../references/resilient-selectors.md).

1. `data-testid` / `data-test`
2. `getByRole` (role + accessible name), `getByLabel`
3. `getByText` (stable copy only)
4. Avoid brittle CSS (`nth-child`, deep chains); never absolute XPath

## Retry with bounded fallback

When a selector misses, drop **one tier** and retry — then stop. **Max 3 strategies**, then report a genuine failure (do not loop).

```text
data-testid → role+name → label/text → STOP & report
```

Log which tier was used when falling back, so drift is visible over runs.

## Waits

- Use `expect(locator).toBeVisible()` / `expect.poll()` for async UI.
- Do not increase timeouts to mask flakes — fix selector or environment.
- Classify a miss before fixing: selector drift vs real UI bug vs timing (see resilient-selectors.md).

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
