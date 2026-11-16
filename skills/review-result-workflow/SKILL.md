---
name: review-result-workflow
description: |-
  Review recorded test results and evidence clips: a contact sheet per clip, judge each case on ten criteria, record PASSED / FAILED / AWAITING RE-REVIEW, group fixes cheapest-first.
  Use when the user says review result, review the clips, check the evidence, audit recorded runs, verify the result sheet, or /review-result — any suite.
  Do NOT use for first runs (testing-ticket), retest (retest-bug), new TC tables (tc-fe-prep / tc-api-prep), or bugs (create-bug).
---

# Review Result (discovery stub)

Also triggers on: review results; review evidence videos.

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/review-result-workflow/WORKFLOW.md).

When invoked:

0. First, before any other work, follow [session-start-context.md](../../references/session-start-context.md) (caveman lite + context-mode).
1. Announce once: `Using **review-result-workflow** to review the recorded results and evidence.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md). Any investigation that starts during the review (a clip that will not decode, a verdict that disagrees with the sheet, a tool that returns nothing) runs under `superpowers:systematic-debugging` — never a guess, never a blind retry loop.
3. **Create the run's working directory before writing the first file** — never a system temp directory; a cleared temp directory takes the whole review with it.
4. **Judge every case against all ten criteria** (WORKFLOW.md Step 5). All ten must pass for a case to pass; one failure is enough to fail it.
5. **Only three closing statuses exist** — `PASSED`, `FAILED`, `AWAITING RE-REVIEW`. No interim status may be left on a case: a half-status makes the board read as finished while cases are still open.
6. **Result quality gate before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md): all 20 layers on every case before a verdict is reported or written; the main thread re-runs it on the lanes' files.
7. Read [WORKFLOW.md](../procedures/review-result-workflow/WORKFLOW.md) and run its progress checklist in order; open each reference file at the step that names it, not before. Never skip a step or gate.

Claude Code shortcut: `/review-result` → [commands/review-result.md](../../commands/review-result.md).

## Contents

Shared reference index, with the trigger that opens each file (see also): [skill-reference-index.md](../../references/skill-reference-index.md).

At the start of every run: [shared-preamble.md](../../references/shared-preamble.md), [user-communication.md](../../references/user-communication.md), [long-workflow-todos.md](../../references/long-workflow-todos.md).

Triggers specific to reviewing results (each is a gate at the moment named):

- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read when recording or judging evidence clips and the AC/EC coverage gate.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md), [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before recording any result that is not PASSED, setting any priority or a PWMI / FAILED verdict.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [defect-report-completeness.md](../../references/defect-report-completeness.md), [defect-candidates.md](../../references/output-templates/defect-candidates.md) — read before reporting any defect found in the round: this exact table and the fixed owner question; never file without the owner.
- [shared-must-never.md](../../references/shared-must-never.md) — read before any write or post.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — read before saying done.

Also read each only when its trigger (in WORKFLOW.md or the index) fires: [customer-escape-prevention.md](../../references/customer-escape-prevention.md), [skill-routing.md](../../references/skill-routing.md), [skill-rules-style.md](../../references/skill-rules-style.md), [test-through-real-steps.md](../../references/test-through-real-steps.md), [agent-rationalizations.md](../../references/agent-rationalizations.md), [helix-session-constraints.md](../../references/helix-session-constraints.md), [jira-comment-post-review.md](../../references/jira-comment-post-review.md), [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md), [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md), [qa-debug-discipline.md](../../references/qa-debug-discipline.md), [root-cause-investigation.md](../../references/root-cause-investigation.md), [round-time-contract.md](../../references/round-time-contract.md), [session-closing.md](../../references/session-closing.md), [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md).

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
