# WIP — OLS Playwright Agentic Testing (updated 2026-08-25)

> Hand-written. Machine facts — HEAD, today's commits, uncommitted work, round totals, which cases
> are red — are in `.claude/session-state.md`, regenerated every turn. Do not duplicate them here.
> This file is only for what the artifacts cannot say: what is being worked on, and what waits on
> a person.

Plan: `ols-qa-evidence/docs/ols-playwright-agentic-testing/ols-playwright-agentic-testing-plan.md`
(read it before touching this work). Code: private `ols-qa-e2e`, committed straight to `main`, no PR.
Environment is **pre-prod only**, VPN required.

## Where this stands after 2026-08-25

Last full round: **2026-08-25 · 344 case-runs · 248 passed · 83 skipped · 13 failed · flaky 0** ·
automated **desktop 203 · tablet 23 · mobile 23** of 288 · **C1 81/150 = 54.0%** (0.7% that morning).
Confluence synced to v10. Every gate green: 10 offline plus `gate:tickets`, `typecheck`, `lint`,
`format:check`.

Four P0 rows closed and pushed (`dea67c4` · `93fa8fb` · `068b4eb` · `0081419` · `bbcee95`). The
agentic tooling is now installed and constrained rather than merely planned:

- **Read-only is the current mode, on purpose.** `playwright-ms` (`@playwright/mcp@0.0.79`) is
  registered at **local scope for `ols-qa-e2e`** — so `claude mcp list` only shows it when run from
  that directory — pointing at `node_modules/.bin/playwright-mcp`, started
  `--headless --isolated --blocked-origins`. Eleven tools are denied in `.claude/settings.json`;
  the per-tool reasoning is in `.claude/README-mcp-guard.md`.
- **G2 is not finished, and the remaining half is a proof, not a build.** Nobody has yet called a
  denied tool and captured the refusal. Until someone does, use only `browser_snapshot` ·
  `browser_find` · `browser_take_screenshot` · `browser_console_messages` ·
  `browser_network_requests` · `browser_network_request`.

## Outstanding, in priority order

1. **Write cases for the 54 Done tickets nothing asserts (plan items 9 and 10, second half).** C1 is
   **81/150 = 54.0%** and this is the only thing that moves it. Grouped by screen in the plan —
   Feed 8 · Live 6 · Course/LP 6 · NDLP import 5 · Nav/Sidebar 5, plus ten smaller groups.
   🔴 **Cannot be done from another repo**: the plan's own rule binds authoring to
   `playwright-test-planner` + `browser_snapshot`, and the MCP server is registered at *local* scope
   for `ols-qa-e2e`. Start that session there.
2. **Prove G2** — from a session whose cwd is `ols-qa-e2e`, call one denied tool and attach the
   refusal. It is the last thing between here and a usable agent loop, and it takes minutes.
3. **`AXX-002` is one live selector confirmation from running** (the logout control in the avatar
   menu). Cheapest item on the whole board.
4. **The 45 skips blamed on missing test data.** Largest skip bucket, and the one 2026-08-18 taught
   us to distrust — that round found three clusters claiming absent data that was present. Each
   reason is written to be re-checkable; go query the API rather than believe the annotation.
5. **Wire layout-twin to its five pilot cases and run them (item 13).** The fixture landed
   (`bbcee95`); nothing uses it yet. Largest lever on tablet and mobile, stuck at 23 of 288.

## Under investigation right now

- **Three throwaway media could not be deleted** — `DELETE /api/media/{id}` returned 409 three times
  during the 2026-08-25 round, so they are orphaned on shared pre-prod. The cleanup reports it
  loudly rather than swallowing it. A debug agent is on it; the fix is the missing transition.
- **`NAV-005` regressed** — the only case in 344 runs that went from ✅ to failing. It times out on
  the mode-switch control on the *first* line that touches it, before the test changes anything.
  Either the shared account is stuck in the wrong mode (see OLS-524), the test is on the wrong page,
  or the label moved under OLS-404/362/361. A debug agent is on it. Do not soften the assertion.

## Waiting on a person

- **`ssoEmbed` has no per-env variable** (item 5) — every login in the suite runs through it, so it
  is not a change to make unasked.
- **CNT-004** is a real defect verified against OLS-86 AC_12: file it, or keep it red?
- **REC-003 and REC-009 ER 2** are spec questions for the PO, not bugs (PM-006). Deliberately red.
- **OLS-325**: does its scope include 320px? The 47px horizontal overflow is measured and repeatable.

## Things that cost time — do not rediscover them

- **A gate's fixtures belong inside the gate.** Five fake exemptions living in the real register
  inflated C1 fourfold while every check passed. Full write-up in `…-lessons.md`.
- **`~/ols-qa-testing-bot` is 14 GB** — a recursive `grep` over it hangs for minutes. Always scope
  with `--include` and `--exclude-dir`.
- **A skip that blames the environment is as suspect as a failure.**
- **Playwright wipes `test-results/` at the start of every run**, including each phase of a staged
  round. Copy failure evidence before running anything else.
- **Background agents driving a browser stall.** Prefer API reads; keep browser steps short.
