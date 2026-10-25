---
name: tc-fe-prep-workflow
description: |
  Prepare frontend manual test cases (Thai, ราชบัณฑิตยสภา) from a Jira story (AC/EC) with mandatory AC/EC coverage review and ISTQB/29119-3 quality check, show an HTML draft for approval, then post one comment on that story only with the Draft_Jira and Import_Qase (plus per-Type) CSV attachments, and close with a four-axis final TC review report (AC/EC alignment, spelling, numbering, scope).
  Use when the user asks for FE test cases, manual TC from acceptance criteria or edge cases (even without saying FE), a TC comment on a Jira story, or TC FE Preparation from Helix (/tc-fe-prep).
  Do NOT use for API-only Swagger test cases (tc-api-prep-workflow), Playwright execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bug tickets (create-bug-workflow).
metadata:
  proactive_triggers:
    - /tc-fe-prep
    - TC FE prep
    - FE test cases
    - manual test cases from story
    - acceptance criteria test cases
---

# TC FE Prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **tc-fe-prep-workflow** to prepare FE manual test cases.`
2. Read and follow [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/tc-fe-prep` → [commands/tc-fe-prep.md](../../commands/tc-fe-prep.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

### Every run

- [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [must-never.md](../procedures/tc-fe-prep-workflow/references/must-never.md) — read at the start of every run, before Step 0, and again before any write or post — the skill-specific MUST / NEVER table; every row binds drafting, review and publishing.
- [requirement-gates.md](../procedures/tc-fe-prep-workflow/requirement-gates.md) — before Step 3 — read and follow Steps 2a, 2.5 and 2.6, end to end.
- [design-and-review.md](../procedures/tc-fe-prep-workflow/design-and-review.md) — before Step 5 — read and follow Steps 3, 4 and 4.5, end to end.
- [csv-export-rules.md](../../references/csv-export-rules.md) — when exporting the CSV file(s).
- [jira-comment-adf-template.md](../procedures/tc-fe-prep-workflow/references/jira-comment-adf-template.md) — before building the Jira comment ADF, and always on a "draft only / do not post" request — write the .adf.json + preview per this template.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — right after posting a Jira comment — full review checklist.
- [jira-fast-publish.md](../../references/jira-fast-publish.md) — read when the fast-publish step returns an error.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — before posting a table that contains line breaks to Jira.
- [publish-options.md (shared)](../../references/publish-options.md) — read when Step 7 has no browser tool or no signed-in Jira session — Option C manual handoff, comment Not posted.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — read when that manual handoff is prepared — which comment format to hand over.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [session-closing.md](../../references/session-closing.md) — after the verify gate passes — artifact index, next workflow, handoff.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [tc-quality-standards.md](../../references/tc-quality-standards.md) — while writing every TC row.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read on the first response, to locate the workspace project guide for this workflow.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [coverage-delta-template.md](../../references/coverage-delta-template.md) — read after the coverage review, before the full draft.
- [csv-template-types.md](../../references/csv-template-types.md) — read before exporting a CSV.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [portable-content.md](../../references/portable-content.md) — read before writing any repo, path, ticket number or project value into the skill output; nothing project-specific is hardcoded.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read when a QA follow-up could be suggested, at any point in the run (including session close).
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [test-md-format.md](../../references/test-md-format.md) — read when exporting Test.md.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [ac-ec-coverage-review.md](../procedures/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) — read before drafting; AC / EC coverage review.
- [jira-formatting.md](../procedures/tc-fe-prep-workflow/references/jira-formatting.md) — read before posting the Jira comment.
- [prerequisites.md](../procedures/tc-fe-prep-workflow/references/prerequisites.md) — read before step 1.
- [publish-options.md](../procedures/tc-fe-prep-workflow/references/publish-options.md) — read when choosing how to publish.
- [qase-import-format.md](../procedures/tc-fe-prep-workflow/references/qase-import-format.md) — read before exporting the Qase CSV.
- [worked-example.md](../procedures/tc-fe-prep-workflow/references/worked-example.md) — read for a full worked example.

### Only when the stated trigger occurs (outside manual TC drafting)

This workflow drafts test cases and never executes them or records verdicts. Read each file below only when its trigger actually happens in this run (for example the user asks to run a case, or a tool error needs a cause); it is not part of the every-run reading.

- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start until the user provides a Jira story key or URL and required config is resolved.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md, [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section), and [tc-final-review-report.md](../procedures/tc-fe-prep-workflow/references/tc-final-review-report.md). MUST NOT report done until they pass.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- curl
- Python 3 + `openpyxl` (xlsx only)
- Atlassian MCP
- Jira REST credentials (ADF-direct publish)
- Qase
- a browser for the HTML preview
- `superpowers:systematic-debugging`
