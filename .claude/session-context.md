# WIP — OLS E2E suite (updated 2026-08-20)

> Hand-written. Machine facts — HEAD, today's commits, uncommitted work, the latest round's totals
> and which cases are still red — are in `.claude/session-state.md`, regenerated every turn. Do not
> duplicate them here. This file is only for what the artifacts cannot say: what is being worked on
> and why, and what is waiting on a person.

Plan: `ols-qa-evidence/docs/ols-playwright-agentic-testing/ols-playwright-agentic-testing-plan.md` (read it before touching
this work). Results: `ols-playwright-agentic-testing-round-report.md` next to it. Code: private `ols-qa-e2e`, on `main`
directly, no PR. Environment is **pre-prod only**, VPN required.

## Outstanding, in priority order

1. **NDLP cluster — 16 skipped cases, under investigation.** The question is whether the
   "ดึงสื่อจาก NDLP" import surface is genuinely absent on pre-prod or merely unreached, and — for
   the 13 driven by an external push — whether each case needs the push to *happen* or only needs
   content that arrived that way to *exist*. The second kind is runnable today with a resolver.
2. **CNT-004 — a real product defect**, verified against OLS-86 AC_12. It stays red. Do not soften
   the assertion to make a round green.
3. **Two spec questions for the PO, both deliberately red.** REC-003: OLS-87 says "หมวดหมู่"
   without defining the level, while its sibling OLS-218 says "เป้าหมายหลัก" for the identical
   condition. REC-009 ER 2: the API stores the sub-goal, the profile does not render it, and no AC
   requires that it should. Neither is a bug until the PO answers.
4. **MLV-034 ER 2** — the recommended-courses widget is not found on the course-complete screen.
   Unsettled: the case now reaches the assertion instead of skipping, but whether the widget is
   missing or the ER overstates has not been decided. Re-running costs one real, unrepeatable
   course completion, so gather the evidence when a ready course exists rather than burning one.
5. **Badge — 22 cases still skip, and the blocker is real.** A saved badge has no delete path, so
   creating one leaves permanent residue on a shared environment. Unblocking needs either a delete
   route or a disposable environment, not more test code.

## Things that cost time today — do not rediscover them

- **A skip that blames the environment is as suspect as a failure.** Every cluster investigated
  today that claimed missing data turned out to be the test's own fault, with the data present all
  along.
- **Playwright wipes `test-results/` at the start of every run**, including each phase of a staged
  round. Copy any failure evidence before running anything else, or it is gone.
- **Background agents driving a browser stall.** Three had to be abandoned. Prefer API reads; keep
  browser steps short and bounded.
- **A bare `expect(x).toBe(true)` is unreadable a day later.** Every assertion added today prints
  the value it measured. Keep doing that.
