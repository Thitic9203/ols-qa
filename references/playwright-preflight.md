# Playwright pre-flight (testing ticket — Phase D)

Complete **every** item before starting Phase E. Stop on first hard failure and report.

## 1 — Workspace & guide

- [ ] [workspace-guide-discovery.md](workspace-guide-discovery.md) completed for **Testing ticket**
- [ ] If `*-testing-ticket-guide.md` exists: VPN, base URL, auth file path, CP grep pattern noted

## 2 — Environment reachability

- [ ] `URL` loads (HTTP 200 or expected redirect — not CF challenge / login wall unless expected)
- [ ] VPN: if **Required**, user confirmed tunnel active or runner can reach PD3/private network
- [ ] Login: storage state / `.auth` path exists **or** credentials ready for headed login flow

## 3 — Playwright readiness (user project)

- [ ] `playwright` dependency present in user repo **or** user confirmed how to run tests
- [ ] Config file identified (`playwright.config.ts`, `playwright.e2e.config.ts`, or user path)
- [ ] `npx playwright test --list` (or project equivalent) succeeds **or** user waived with reason

## 4 — Ticket scope

- [ ] Test plan from Phase B/C still matches ticket after Jira re-fetch
- [ ] Out-of-scope list unchanged unless user edited

## 5 — Evidence plan

- [ ] Screenshot folder convention agreed (e.g. `screenshots/{KEY}/`)
- [ ] Trace on failure: user project supports `--trace on` or equivalent

## 6 — Selector resilience gate

Per [resilient-selectors.md](resilient-selectors.md) — verify **before** running, not after a flake.

- [ ] Selectors use tier 1–3 (`data-testid` → role+name → label/text), not absolute XPath / nth-child
- [ ] Fallback chain is bounded (**max 3** strategies, then fail) — no infinite retry
- [ ] Failure-mode plan agreed: selector-drift vs real-UI-bug vs timing handled distinctly
- [ ] If app lacks `data-testid`: noted for the ticket (do not patch product code unless asked)

## Pre-flight result (post in chat)

```text
━━━ Playwright pre-flight ━━━
URL: reachable | blocked ({reason})
VPN: OK | N/A | FAIL
Playwright: OK ({config}) | FAIL ({reason})
Auth: storageState | login each run | guest
Selectors: resilient (tier 1–3) | risky ({reason})
Ready to run: YES | NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**MUST NOT** start Phase E until **Ready to run: YES**.
