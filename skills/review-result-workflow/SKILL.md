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

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/review-result-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **review-result-workflow** to review the recorded results and evidence.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md). Any investigation that starts during the review (a clip that will not decode, a verdict that disagrees with the sheet, a tool that returns nothing) runs under `superpowers:systematic-debugging` — never a guess, never a blind retry loop.
3. **Create the run's working directory before writing the first file** — never a system temp directory; a cleared temp directory takes the whole review with it.
4. **Judge every case against all ten criteria** (WORKFLOW.md Step 5). All ten must pass for a case to pass; one failure is enough to fail it.
5. **Only three closing statuses exist** — `PASSED`, `FAILED`, `AWAITING RE-REVIEW`. No interim status may be left on a case: a half-status makes the board read as finished while cases are still open.
6. **Result quality gate before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md): all 20 layers on every case before a verdict is reported or written; the main thread re-runs it on the lanes' files.
7. Read and follow [WORKFLOW.md](../procedures/review-result-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/review-result` → [commands/review-result.md](../../commands/review-result.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/review-result-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [defect-candidates.md](../../references/output-templates/defect-candidates.md) — before reporting any defect found in the round — follow this exact table and the fixed owner question; never file without the owner.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — when recording or judging evidence clips and the AC/EC coverage gate.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [skill-rules-style.md](../../references/skill-rules-style.md) — when stopping for missing input, and for the fresh-eyes re-read of long drafts.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — before executing any case — drive the real screen, never a backend shortcut.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — read after posting a Jira comment, before saying done.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — read before posting a Jira table with multi-line cells.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read when a QA follow-up could be suggested.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — read before saying done; shared closing checklist.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without the result sheet (or equivalent case list) that names each case, its tab, and its expected results, **and** the recorded evidence for those cases. Reviewing clips with no case list behind them produces an opinion, not a verdict.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md). MUST NOT report the review complete while any case still carries an interim status, while the sheet's sequence numbers are not continuous, or while any evidence file has been renamed — clip filenames are never changed, in any circumstance.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- QA capture and verify tools (`{QA_TOOLS_ROOT}`)
- Python 3
- ffmpeg / ffprobe
- Node.js + in-repo guard tools (`tools/result-gate`)
- `engineering:testing-strategy`
- `superpowers:systematic-debugging`
