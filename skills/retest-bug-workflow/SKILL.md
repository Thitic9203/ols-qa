---
name: retest-bug-workflow
description: |
  Retest a Jira bug after a dev fix — read ticket, test API or UI, compare Swagger, draft evidence, post comment (with approval), transition and assign back to dev.
  Use when the user says retest bug, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
proactive_triggers:
  - /retest-bug
  - retest bug
  - verify fix
  - retest
  - check if bug is fixed
---

# Retest Bug (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/retest-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **retest-bug-workflow** to retest the bug fix.`
2. Read and follow [WORKFLOW.md](../deprecated/retest-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/retest-bug` → [commands/retest-bug.md](../../commands/retest-bug.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without a Jira bug key/URL and reachable environment config.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Retest section). MUST NOT claim PASSED/FAILED without evidence in the comment.
