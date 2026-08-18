---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake and confirmation — compare every screen against the design (Figma), summarize results in chat, then optionally update an external results destination.
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
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the approach, no guessing an expected/spec, no blind retry loops.
3. **Design (Figma) comparison is mandatory on every UI scenario** — [figma-design-comparison.md](../../references/figma-design-comparison.md). A screen with no design reference is **reported back to the person or channel that assigned the run** and its visual points stay BLOCKED; never assume a label, order, or layout.
4. **Test deeply** — [customer-escape-prevention.md](../../references/customer-escape-prevention.md): cover the whole surface, run every in-scope width with overflow/overlap **measured**, use fixtures big enough to fail, evidence on passed rows too, and never PASSED over a "cannot verify" note.
5. Read and follow [WORKFLOW.md](../deprecated/testing-ticket-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/testing-ticket` → [commands/testing-ticket.md](../../commands/testing-ticket.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT run Playwright until intake is complete and the user confirms the test plan.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Testing ticket section). MUST NOT claim tests passed without fresh runner output, without a design node (or its BLOCKED-with-reason) on every UI row, or with passed rows that carry no evidence.
