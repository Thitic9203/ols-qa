---
name: create-bug-workflow
description: |
  Open bug reports on Jira or GitHub after collecting target link, format template, and bug details — confirm before creating.
  Use when the user chooses Create bug from Helix, invokes /create-bug, or wants issues filed from test findings.
  Do NOT use for Playwright test runs (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), posting manual TC tables (tc-fe-prep / tc-api-prep), or updating test result sheets without filing bugs.
proactive_triggers:
  - /create-bug
  - create bug
  - file bug
  - open bug
  - log defect
---

# Create Bug (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **create-bug-workflow** to file the bug report.`
2. Read and follow [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/create-bug` → [commands/create-bug.md](../../commands/create-bug.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.
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
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [bug-draft-template.md](../procedures/create-bug-workflow/references/bug-draft-template.md) — read when drafting the bug.
- [posting-discipline.md](../procedures/create-bug-workflow/references/posting-discipline.md) — read before posting the bug.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create issues until the user approves each draft. MUST re-check the tracker/board first (WORKFLOW Phase B2): a defect a prior/closed ticket already settled as intended behavior is not a bug — report it to the user with the reference link instead of filing.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section). MUST verify each created issue URL before reporting done.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- GitHub CLI `gh` (GitHub targets)
- Atlassian MCP or Jira REST credentials (Jira targets)
- macOS-only tools (`osascript`, browser fallback)
- Node.js + in-repo guard tools (`tools/retest-guard`)
- `superpowers:systematic-debugging`
