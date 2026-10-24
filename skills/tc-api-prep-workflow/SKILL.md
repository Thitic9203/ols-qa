---
name: tc-api-prep-workflow
description: |
  Prepare API manual test cases from API spec and Swagger with mandatory spec/Swagger coverage review and ISTQB/29119-3 quality check — confirm columns and delivery (Jira comment link and/or CSV/Excel in workspace).
  Use when the user chooses TC API Preparation from Helix, invokes /tc-api-prep, or asks for API test cases from Swagger/OpenAPI.
  Do NOT use for frontend story AC/EC tables (tc-fe-prep-workflow), Playwright or test execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bugs (create-bug-workflow).
metadata:
  proactive_triggers:
    - /tc-api-prep
    - TC API prep
    - API test cases
    - Swagger test cases
    - OpenAPI test cases
---

# TC API Prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **tc-api-prep-workflow** to prepare API manual test cases.`
2. Read and follow [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/tc-api-prep` → [commands/tc-api-prep.md](../../commands/tc-api-prep.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [csv-export-rules.md](../../references/csv-export-rules.md) — when exporting the CSV file(s).
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — right after posting a Jira comment — full review checklist.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — before posting a table that contains line breaks to Jira.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [session-closing.md](../../references/session-closing.md) — after the verify gate passes — artifact index, next workflow, handoff.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [skill-rules-style.md](../../references/skill-rules-style.md) — when stopping for missing input, and for the fresh-eyes re-read of long drafts.
- [swagger-diff-phase.md](../../references/swagger-diff-phase.md) — when Swagger changed, a new API version shipped, or existing API TCs are being updated.
- [tc-api-chunked-scope.md](../../references/tc-api-chunked-scope.md) — read when the API surface is large (about 15+ operations or a whole service).
- [tc-quality-standards.md](../../references/tc-quality-standards.md) — read while writing every TC row.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read on the first response, to locate the workspace project guide for this workflow.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [coverage-delta-template.md](../../references/coverage-delta-template.md) — read after the coverage review, before the full draft.
- [csv-template-types.md](../../references/csv-template-types.md) — read before exporting a CSV.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read when a QA follow-up could be suggested.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [test-md-format.md](../../references/test-md-format.md) — read when exporting Test.md.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [spec-coverage-review.md](../procedures/tc-api-prep-workflow/references/spec-coverage-review.md) — read before drafting; spec and Swagger coverage review.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without API spec + Swagger and delivery choices confirmed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC API section). MUST NOT report done until G-verify and post-publish review pass.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Python 3 + `openpyxl` (xlsx only)
- Atlassian MCP
- Jira REST credentials (ADF-direct publish)
- `superpowers:systematic-debugging`
