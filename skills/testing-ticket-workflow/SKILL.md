---
name: testing-ticket-workflow
description: |
  Test one Jira ticket with Playwright after intake — show the intake summary and plan, wait for the user's confirmation, then run; compare every screen against the design (Figma), summarize results in chat, then optionally update an external results destination.
  Use when the user picks Testing ticket from Helix, says /testing-ticket, or asks to test, verify or QA a single Jira story/ticket on an environment — even without saying testing ticket ("เทส ticket นี้ให้หน่อย").
  Do NOT use for opening bug tickets (create-bug-workflow), retest-after-fix on a bug (retest-bug-workflow), or drafting manual TC tables (tc-fe-prep / tc-api-prep). Does not run full-app regression.
metadata:
  proactive_triggers:
    - /testing-ticket
    - testing ticket
    - Playwright ticket
    - test ticket
    - run playwright on ticket
---

# Testing Ticket (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/testing-ticket-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **testing-ticket-workflow** to test the ticket with Playwright.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the approach, no guessing an expected/spec, no blind retry loops. If that skill is not in the session's available-skills list, write the strategy inline (scope, order, done-when, risks) and say in chat that you did so ([dependencies.md](../../references/dependencies.md)).
3. **Design (Figma) comparison is mandatory on every UI scenario** — [figma-design-comparison.md](../../references/figma-design-comparison.md). A screen with no design reference is **reported back to the person or channel that assigned the run** and its visual points stay BLOCKED; never assume a label, order, or layout.
4. **Test deeply** — [customer-escape-prevention.md](../../references/customer-escape-prevention.md): cover the whole surface, run every in-scope width with overflow/overlap **measured**, use fixtures big enough to fail, evidence on passed rows too, and never PASSED over a "cannot verify" note.
5. **Run in parallel lanes by default** — [parallel-test-lanes.md](../../references/parallel-test-lanes.md): split the plan across subagents, **one leased account per lane** (never two lanes on one login), barrier for anything every lane sees; serial only with a named predicate.
6. **Login by command, never a login window** — when an account must log in or its session has expired, give the user ready-to-run commands as one combined `bash` block per step that loops over the accounts (each isolated, prints OK / FAILED with a log path): relink every needed account, then setup/mint only the FAILED ones. Then probe and report. Never collect or fill a password ([parallel-test-lanes.md](../../references/parallel-test-lanes.md) §3).
7. **Result quality gate before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md): all 20 layers on every case before a verdict is reported or written; the main thread re-runs it on the lanes' files.
8. **No-wait decision gate before any BLOCKED / "needs decision" / held post** — [no-wait-decision-gate.md](../../references/no-wait-decision-gate.md): all 20 layers — read every source, apply precedent, create missing data, decide and act; never park a case or a finished post waiting for someone.
9. 🔴 GATE: show the intake summary + plan and wait for the user's confirmation before the first Playwright run (WORKFLOW Phase C).
10. Read and follow [WORKFLOW.md](../procedures/testing-ticket-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/testing-ticket` → [commands/testing-ticket.md](../../commands/testing-ticket.md).

## Contents

The must-read files for this workflow, linked directly from here (references already linked above are not repeated; WORKFLOW.md links any further file at the step that uses it). Read the **Always** tier at the start; read each **On trigger** file only when its trigger is reached.

### Always (at the start of every run)

- [WORKFLOW.md](../procedures/testing-ticket-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.

### On trigger

- [execute-and-summarize.md](../procedures/testing-ticket-workflow/execute-and-summarize.md) — before Phase E — read and follow Phase E, the result quality gate and Phase F, end to end.
- [results-update.md](../procedures/testing-ticket-workflow/results-update.md) — before Phase G — read and follow it whenever results are updated outside this chat.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — whenever a Priority/Severity is named or judged.
- [defect-candidates.md](../../references/output-templates/defect-candidates.md) — before reporting any defect found in the round — follow this exact table and the fixed owner question; never file without the owner.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — for any verdict that is not a clean PASSED — what the write-up must contain.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — before recording any non-PASSED verdict.
- [playwright-preflight.md](../../references/playwright-preflight.md) — before starting the Playwright run — must end with Ready to run: YES.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — when results conflict with expectations, with dev claims, or look flaky.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read when recording or judging evidence clips and the AC/EC coverage gate.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — before calling any case FAILED or BLOCKED — investigate to a verified root cause.
- [round-time-contract.md](../../references/round-time-contract.md) — before logging in or reusing a session for the round.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [test-execution-plan-template.md](../../references/test-execution-plan-template.md) — when writing the test execution plan shown before the run.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — before executing any case — drive the real screen, never a backend shortcut.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — read after posting a Jira comment, before saying done.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — read before posting a Jira table with multi-line cells.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read at close-out, before naming the next workflow (e.g. `Next: create-bug for {ids}` when F3 lists a defect).
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [result-update-discipline.md](../procedures/testing-ticket-workflow/references/result-update-discipline.md) — read before updating a results destination.
- [session-intake.md](../procedures/testing-ticket-workflow/references/session-intake.md) — at Phase A — the six intake fields and the confirmation gate.
- [parallel-prep.md](../../references/parallel-prep.md) — at Phase B, when the Jira fetch and Confluence/Swagger reads are independent.
- [playwright-discipline.md](../procedures/testing-ticket-workflow/references/playwright-discipline.md) — before writing or running any Playwright step.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT run Playwright until intake is complete **and** the user has confirmed the intake summary + plan (WORKFLOW Phase C; the testing-ticket exception in round-time contract §2). After that confirmation there are no mid-run waits; later corrections land in the end decisions popup.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Testing ticket section). MUST NOT claim tests passed without fresh runner output, without a design node (or its BLOCKED-with-reason) on every UI row, or with passed rows that carry no evidence.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Playwright (in the project under test)
- Node.js + in-repo guard tools (`tools/lane-lease-check`, `tools/adoption-check`)
- Figma
- browser automation MCP
- QA capture and verify tools (`{QA_TOOLS_ROOT}`)
- Python 3
- ffmpeg / ffprobe
- curl + Jira REST credentials
- `engineering:testing-strategy`
- `superpowers:systematic-debugging`
