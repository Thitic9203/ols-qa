---
name: review-result-workflow
description: |
  Review already-recorded test results and their evidence clips — build one contact sheet per clip, judge every case against the ten review criteria, record PASSED / FAILED / AWAITING RE-REVIEW, drive a live board, then group the fixes cheapest-first and re-queue what was re-recorded.
  Use when the user says review result, review the clips, check the evidence, audit the recorded runs, verify the result sheet, /review-result, or Review result from Helix. Works for any recorded set — unit, system, integration, or another suite.
  Do NOT use for running the tests in the first place (testing-ticket-workflow), retesting one ticket after a dev fix (retest-bug-workflow), writing new TC tables (tc-fe-prep / tc-api-prep), or opening bugs (create-bug-workflow).
proactive_triggers:
  - /review-result
  - review result
  - review results
  - review the clips
  - check the evidence
  - audit recorded runs
  - review evidence videos
---

# Review Result (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/review-result-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **review-result-workflow** to review the recorded results and evidence.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md). Any investigation that starts during the review (a clip that will not decode, a verdict that disagrees with the sheet, a tool that returns nothing) runs under `superpowers:systematic-debugging` — never a guess, never a blind retry loop.
3. **Create the run's working directory before writing the first file** — never a system temp directory; a cleared temp directory takes the whole review with it.
4. **Judge every case against all ten criteria** (WORKFLOW.md Step 5). All ten must pass for a case to pass; one failure is enough to fail it.
5. **Only three closing statuses exist** — `PASSED`, `FAILED`, `AWAITING RE-REVIEW`. No interim status may be left on a case: a half-status makes the board read as finished while cases are still open.
6. Read and follow [WORKFLOW.md](../deprecated/review-result-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/review-result` → [commands/review-result.md](../../commands/review-result.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without the result sheet (or equivalent case list) that names each case, its tab, and its expected results, **and** the recorded evidence for those cases. Reviewing clips with no case list behind them produces an opinion, not a verdict.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md). MUST NOT report the review complete while any case still carries an interim status, while the sheet's sequence numbers are not continuous, or while any evidence file has been renamed — clip filenames are never changed, in any circumstance.
