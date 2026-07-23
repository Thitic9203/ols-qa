---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake and confirmation — summarize results in chat, then optionally update an external results destination.
  Use for Testing ticket from Helix, /testing-ticket, or when the user wants automated UI/API checks for a single ticket.
  Do NOT use for opening bug tickets (create-bug-workflow), retest-after-fix on a bug (retest-bug-workflow), or drafting manual TC tables (tc-fe-prep / tc-api-prep). Does not run full-app regression.
proactive_triggers:
  - /testing-ticket
  - testing ticket
  - Playwright ticket
  - test ticket
  - run playwright on ticket
---

# Testing Ticket (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/testing-ticket-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **testing-ticket-workflow** to test the ticket with Playwright.`
2. Read and follow [WORKFLOW.md](../deprecated/testing-ticket-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/testing-ticket` → [commands/testing-ticket.md](../../commands/testing-ticket.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT run Playwright until intake is complete and the user confirms the test plan.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Testing ticket section). MUST NOT claim tests passed without fresh runner output.
