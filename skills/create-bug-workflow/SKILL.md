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

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/create-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **create-bug-workflow** to file the bug report.`
2. Read and follow [WORKFLOW.md](../deprecated/create-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/create-bug` → [commands/create-bug.md](../../commands/create-bug.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create issues until the user approves each draft.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section). MUST verify each created issue URL before reporting done.
