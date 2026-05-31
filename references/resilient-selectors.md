# Resilient selectors (Playwright — reduce flaky tests)

Teach the agent to pick **resilient selectors first** and fall back deterministically when one fails — a free, self-healing *discipline*, not a paid auto-healer. Use during testing-ticket Phase E and whenever a selector misses.

## Selector priority hierarchy

Pick the **highest** tier that uniquely identifies the element. Drop a tier only when the one above is unavailable.

| Tier | Selector | When | Example |
|------|----------|------|---------|
| 1 (best) | `data-testid` / `data-test` | element has a test id | `getByTestId('submit-order')` |
| 2 | role + accessible name | semantic, user-visible | `getByRole('button', { name: 'Submit' })` |
| 3 | label / placeholder / text | form fields, links, copy | `getByLabel('Email')`, `getByText('Checkout')` |
| 4 | scoped CSS (stable attr) | no id/role/text | `form#login >> input[name="user"]` |
| 5 (avoid) | positional CSS / nth-child | last resort, note it | `.list > div:nth-child(3)` |
| ✗ never | absolute XPath / deep CSS chains | brittle, breaks on any DOM shift | `/html/body/div[2]/...` |

If the app has **no** `data-testid`, recommend adding them in the bug/ticket notes — do not patch product code unless the user asks (see [qa-debug-discipline.md](qa-debug-discipline.md)).

## Fallback chain (bounded — max 3 strategies)

When a selector fails, retry with the **next tier down**, then stop. Never loop indefinitely.

```text
1. try data-testid        → found?  use it.
2. else try role + name   → found?  use it, log "fell back to role".
3. else try label/text    → found?  use it, log "fell back to text".
4. else → STOP. report as a genuine failure (do NOT keep guessing).
```

**Hard limit: 3 fallback attempts per element.** After the 3rd miss, treat it as a real failure and hand off to debug — a missing element after 3 resilient strategies is signal, not noise.

## Distinguish the three failure modes

Before calling a test PASSED or FAILED, classify *why* a selector missed:

| Symptom | Likely cause | Next step |
|---------|-------------|-----------|
| Element exists but selector text/id changed | **Selector drift** (not a bug) | update selector to a higher tier, re-run |
| Element truly absent / wrong state | **Real UI bug** | report via testing-ticket / create-bug |
| Element appears late / intermittently | **Timing** | use auto-waiting (`expect().toBeVisible()`), not `data-testid` swap |

Never mask timing with a selector change, and never mask a real bug as "flaky selector". See [qa-debug-discipline.md](qa-debug-discipline.md) Phase 2 hypotheses.

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST prefer `data-testid` → role → text in that order | Survives styling/DOM refactors |
| MUST cap fallback at 3 strategies, then fail | Prevents agent looping / token burn |
| MUST log which tier was used when falling back | Makes drift visible over time |
| NEVER use absolute XPath or nth-child as first choice | Breaks on any layout change |
| NEVER "fix" a flaky test by only adding fallbacks | A real bug after 3 tries is a failure, not flake |

## Where this plugs in

- Pre-run gate → [playwright-preflight.md](playwright-preflight.md) "Selector Resilience Gate"
- During run → testing-ticket Phase E retry step
- On repeated miss → [qa-debug-discipline.md](qa-debug-discipline.md)
