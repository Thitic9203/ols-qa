---
name: tc-fe-prep-workflow
description: |
  Prepare frontend manual test cases from a Jira story (AC/EC) with mandatory AC/EC coverage review and ISTQB/29119-3 quality check, then draft table in chat, export CSV/Excel, publish one comment on that story only, and close with a four-axis final TC review report (AC/EC alignment, spelling, numbering, scope).
  Use when the user asks for FE test cases, manual TC from acceptance criteria, draft TC comment on Jira, or TC FE Preparation from Helix (/tc-fe-prep).
  Do NOT use for API-only Swagger test cases (tc-api-prep-workflow), Playwright execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bug tickets (create-bug-workflow).
proactive_triggers:
  - /tc-fe-prep
  - TC FE prep
  - FE test cases
  - manual test cases from story
  - acceptance criteria test cases
---

# TC FE Prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/tc-fe-prep-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **tc-fe-prep-workflow** to prepare FE manual test cases.`
2. Read and follow [WORKFLOW.md](../deprecated/tc-fe-prep-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/tc-fe-prep` → [commands/tc-fe-prep.md](../../commands/tc-fe-prep.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start until the user provides a Jira story key or URL and required config is resolved.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md, [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section), and [tc-final-review-report.md](../deprecated/tc-fe-prep-workflow/references/tc-final-review-report.md). MUST NOT report done until they pass.
