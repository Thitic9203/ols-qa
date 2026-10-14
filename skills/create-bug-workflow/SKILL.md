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

## Contents (read on demand, 1 hop)

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create issues until the user approves each draft. MUST re-check the tracker/board first (WORKFLOW Phase B2): a defect a prior/closed ticket already settled as intended behavior is not a bug — report it to the user with the reference link instead of filing.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section). MUST verify each created issue URL before reporting done.
