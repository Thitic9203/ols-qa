# WIP — OLS Playwright Agentic Testing (updated 2026-08-25)

> Hand-written. Machine facts — HEAD, today's commits, uncommitted work, round totals, which cases
> are red — are in `.claude/session-state.md`, regenerated every turn. Do not duplicate them here.
> This file is only for what the artifacts cannot say: what is being worked on, and what waits on
> a person.

Plan: `ols-qa-evidence/docs/ols-playwright-agentic-testing/ols-playwright-agentic-testing-plan.md`
(read it before touching this work). Code: private `ols-qa-e2e`, committed straight to `main`, no PR.
Environment is **pre-prod only**, VPN required.

## Where this stands after 2026-08-25

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

1. **Bind 254 cases to tickets (plan item 10).** C1 is **1/150 = 0.7%** — the worst number in the
   project, and goal criterion 1 measures exactly it. Needs no VPN: Jira is cloud. Every mapping
   must be read from the board, never inferred from a module name.
2. **Prove G2.** From a session whose cwd is `ols-qa-e2e`, call one denied tool, attach the refusal.
   Cheap, and it is the last thing between here and a usable agent loop.
3. **Wire layout-twin to its five pilot cases and run them (item 13).** The fixture landed
   (`bbcee95`) but nothing uses it and no round has exercised it. Largest lever on the tablet and
   mobile numbers, which have sat at 23 of 288.
4. **One full round on pre-prod (item 2).** Every figure quoted anywhere is still from 2026-08-20;
   `35d6a3a` has never been covered by a round. Needs VPN and an env confirmation from the owner.
5. **The 91 blocked case-runs (item 11).** Badge and Auth are confirmed real blockers; the rest has
   never been investigated, and 2026-08-18 showed most "the environment lacks data" skips were the
   test's own fault.

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
