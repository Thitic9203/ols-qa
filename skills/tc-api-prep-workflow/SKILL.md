---
name: tc-api-prep-workflow
description: |
  Prepare API manual test cases from API spec and Swagger with mandatory spec/Swagger coverage review and ISTQB/29119-3 quality check — confirm columns and delivery (Jira comment link and/or CSV/Excel in workspace).
  Use when the user chooses TC API Preparation from Helix, invokes /tc-api-prep, or asks for API test cases from Swagger/OpenAPI.
  Do NOT use for frontend story AC/EC tables (tc-fe-prep-workflow), Playwright or test execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bugs (create-bug-workflow).
proactive_triggers:
  - /tc-api-prep
  - TC API prep
  - API test cases
  - Swagger test cases
  - OpenAPI test cases
---

# TC API Prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/tc-api-prep-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **tc-api-prep-workflow** to prepare API manual test cases.`
2. Read and follow [WORKFLOW.md](../deprecated/tc-api-prep-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/tc-api-prep` → [commands/tc-api-prep.md](../../commands/tc-api-prep.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without API spec + Swagger and delivery choices confirmed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC API section). MUST NOT report done until G-verify and post-publish review pass.
