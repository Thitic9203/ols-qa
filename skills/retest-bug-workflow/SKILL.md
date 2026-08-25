---
name: retest-bug-workflow
description: |
  Retest a Jira bug or task after a dev fix — read ticket, build the retest case list, compare every screen against the design (Figma), test API or UI, compare Swagger, draft evidence, post the comment with its case list (with approval), transition and assign back to dev.
  Use when the user says retest bug, retest task, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix.
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
proactive_triggers:
  - /retest-bug
  - retest bug
  - retest task
  - verify fix
  - retest
  - check if bug is fixed
---

# Retest Bug (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../deprecated/retest-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **retest-bug-workflow** to retest the bug fix.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the retest approach, no guessing an expected/spec, no blind retry loops.
3. **Design (Figma) comparison is mandatory on every UI retest** — [figma-design-comparison.md](../../references/figma-design-comparison.md). A screen with no design reference is **reported back to the person or channel that assigned the retest** and its visual points stay BLOCKED; never assume a label, order, or layout.
4. **Retest deeply** — [customer-escape-prevention.md](../../references/customer-escape-prevention.md): cover the whole surface the fix touched, measure overflow/overlap at every in-scope width, evidence on passed rows too, and never PASSED over a "cannot verify" actual result.
5. Read and follow [WORKFLOW.md](../deprecated/retest-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/retest-bug` → [commands/retest-bug.md](../../commands/retest-bug.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without a Jira issue key/URL — a **Bug**, or a **Task / Story** whose fix is being re-verified — and reachable environment config.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Retest section). MUST NOT claim PASSED/FAILED without evidence in the comment, and MUST NOT post a retest comment — bug or task — without its **case list** (`Test cases run` table: Case · Title · Covers · Status — the design reference goes on the header's `Design ref:` line, never as a per-row column).
