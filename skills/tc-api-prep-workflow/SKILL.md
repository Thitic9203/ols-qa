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

Slash-command shortcut (runtimes that support commands): `/tc-api-prep` → [commands/tc-api-prep.md](../../commands/tc-api-prep.md).

## Contents

Every file this workflow can need, linked directly from here. Read the first group on every run, the second at the phase named, and the third only when its exact condition holds.

### Every run

- [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read on the first response, to locate the workspace project guide for this workflow.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [tc-quality-standards.md](../../references/tc-quality-standards.md) — read while writing every TC row.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [session-closing.md](../../references/session-closing.md) — after the verify gate passes — artifact index, next workflow, handoff.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read at the start of every run; this workflow has many phases, so keep the todo list.

### At a phase

- [default-columns.md](../procedures/tc-api-prep-workflow/references/default-columns.md) — read at Phase B, before stating or asking about the column list.
- [delivery-options.md](../procedures/tc-api-prep-workflow/references/delivery-options.md) — read at Phase C and again before Phase G delivery (CSV, Excel, Jira, Confluence).
- [spec-coverage-review.md](../procedures/tc-api-prep-workflow/references/spec-coverage-review.md) — read before drafting; spec and Swagger coverage review.
- [coverage-delta-template.md](../../references/coverage-delta-template.md) — read after the coverage review, before the full draft.
- [api-tc-guidelines.md](../procedures/tc-api-prep-workflow/references/api-tc-guidelines.md) — read at Phase D and Phase E2, while designing and checking every row.
- [skill-rules-style.md](../../references/skill-rules-style.md) — when stopping for missing input, and for the fresh-eyes re-read of long drafts.
- [csv-export-rules.md](../../references/csv-export-rules.md) — read when exporting the CSV file(s).
- [csv-template-types.md](../../references/csv-template-types.md) — read before exporting a CSV.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — before posting a table that contains line breaks to Jira.
- [jira-fast-publish.md](../../references/jira-fast-publish.md) — read at Phase G2 before publishing to a Jira issue (ADF-direct patterns and error recovery).
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — read right after posting a Jira comment — full review checklist.

### Only if triggered (exact condition on each line)

- [swagger-diff-phase.md](../../references/swagger-diff-phase.md) — read when Swagger changed, a new API version shipped, or existing API TCs are being updated.
- [tc-api-chunked-scope.md](../../references/tc-api-chunked-scope.md) — read when more than 15 Swagger operations (method + path pairs) are in scope, or the user asks for a whole service.
- [test-md-format.md](../../references/test-md-format.md) — read only when the user picks Test.md as a delivery format at Phase C.
- [round-time-contract.md](../../references/round-time-contract.md) — read only when a round starts, and before reporting any time, duration or deadline to the user.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read only after G-verify passes, when writing the next-step suggestion in session closing.
- [skill-routing.md](../../references/skill-routing.md) — read only when the request turns out not to be API TC drafting and another skill may own it.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read only before invoking or switching to another skill.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read only when you are about to skip or shorten a step or gate; each excuse has its correct action.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a tool errors (fetch, export or publish).
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure (fetch, export or publish).

### Execution-only files (this workflow never triggers them)

This workflow writes test cases; it never runs tests, records verdicts or opens bugs (WORKFLOW § Out of scope). The shared files above link to the files below, so they stay one hop away, but do not load them during a TC API prep run. The TC **Priority** column follows [api-tc-guidelines.md](../procedures/tc-api-prep-workflow/references/api-tc-guidelines.md) § Priority, not the bug priority matrix.

- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without API spec + Swagger and delivery choices confirmed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) § *TC FE / TC API prep* (skip its tc-fe-prep-only final-report item). MUST NOT report done until G-verify and post-publish review pass.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Python 3 + `openpyxl` (xlsx only)
- Atlassian MCP
- Jira REST credentials (ADF-direct publish and the REST v3 fallback)
- `superpowers:systematic-debugging`
