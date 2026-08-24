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

## Both investigations closed — one fixed, one is the owner's call

- **`NAV-005` was ours, not the product's — fixed and pushed (`3183a07`).** An interstitial had
  `aria-hidden` over the app root, so `getByRole` resolved zero elements and the read timed out.
  NAV-001 passed on the same control in the same round; three lines after NAV-005's ✘ the round log
  shows the `@safe` guard blocking `acknowledge-rewards` on that same shared creator account. The
  sibling cases already establish this precondition; NAV-005 never did. It now passes in 7.8s.
  Nothing was weakened — no retry, no longer timeout, no `fixme`.
- 🔴 **The orphaned media are 45, not 3, and they are in the real approval queue.** Measured:
  `PENDING_APPROVAL` count is 46 across the three creator accounts (C1 21 · C2 14 · F1 11); 45 are
  ours, dating back to 2026-08-17. `DELETE` answers 409 because nothing can be deleted out of the
  review queue, and the page object has no transition that pulls an item back out — only an
  approver rejecting it. **Not deleted: removing 45 items from a shared environment is your call**,
  and they are not deletable in this state anyway. The cause fix is in the plan (row 1b):
  `registerDeleteThrowaway` must reject via `adminContent` before deleting.

## Two things left open on purpose, both needing a person

- **The `@safe` guard blocks `POST /api/me/achievements/acknowledge-rewards`.** That endpoint is
  housekeeping on the tester's own account, not a content mutation — so an interstitial met by a
  `@safe` case can never be acknowledged and returns on the next navigation for the rest of the
  lane. Loosening a read-only guard on shared pre-prod is a risk decision, so it was reported, not
  taken.
- **`creatorPage` uses a hardcoded `poolFor('creator')[0]`** while `leasedLearner` leases by worker
  index. With two workers, concurrent creator cases share one account — the condition that let one
  case's interstitial land in another case's way.

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
