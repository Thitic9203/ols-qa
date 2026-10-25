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
2. **Settle and strategize first** — before any other tool call (the *Dependencies* check below runs right after this step, before Phase A), follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the approach, no guessing an expected/spec, no blind retry loops. If that skill is not in the session's available-skills list, write the strategy inline (scope, order, done-when, risks) and say in chat that you did so ([dependencies.md](../../references/dependencies.md)).
3. **Design (Figma) comparison on every UI scenario** — [figma-design-comparison.md](../../references/figma-design-comparison.md); rule stated once at WORKFLOW Phase B step 4 and E0.
4. **Test deeply** — follow [customer-escape-prevention.md](../../references/customer-escape-prevention.md); runs at WORKFLOW Phase B step 5, E0 and QA closing *Depth gates*.
5. **Parallel lanes by default, one leased account per lane** — [parallel-test-lanes.md](../../references/parallel-test-lanes.md); lane plan at WORKFLOW Phase B step 7, dispatch and lane failure in Phase E.
6. **Login by command, never a login window or a password** — when an account must log in or its session is dead, give the user ready-to-run commands as one combined `bash` block per step that loops over the accounts (each isolated, prints OK / FAILED with a log path): relink every needed account, then setup/mint only the FAILED ones; the user runs them, then probe the session and report. Never ask for, collect or fill a password. Full steps: WORKFLOW Phase D *Fresh login* ([parallel-test-lanes.md](../../references/parallel-test-lanes.md) §3).
7. **Result quality gate, all 20 layers on every case before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md); mechanical layers by checker, judgement layers by hand, gate time counted in the round line (execute-and-summarize *Result quality gate*).
8. **No-wait decision gate, all 20 layers before any BLOCKED / "needs decision" / held post** — [no-wait-decision-gate.md](../../references/no-wait-decision-gate.md); runs at E3 (execute-and-summarize); never park a case or a finished post waiting for someone.
9. 🔴 GATE: confirm before the first Playwright run — stated once at WORKFLOW Phase C (bot-run branch included).
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

Grouped by the phase that reaches the trigger; each line names its exact trigger.

#### Intake and plan (Phases A–C)

- [session-intake.md](../procedures/testing-ticket-workflow/references/session-intake.md) — at Phase A — the six intake fields and the confirmation gate.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [parallel-prep.md](../../references/parallel-prep.md) — at Phase B, when the Jira fetch and Confluence/Swagger reads are independent.
- [test-execution-plan-template.md](../../references/test-execution-plan-template.md) — when writing the test execution plan shown before the run.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.

#### Run (Phases D–E)

- [round-time-contract.md](../../references/round-time-contract.md) — before logging in or reusing a session for the round.
- [playwright-preflight.md](../../references/playwright-preflight.md) — before starting the Playwright run — must end with Ready to run: YES.
- [playwright-discipline.md](../procedures/testing-ticket-workflow/references/playwright-discipline.md) — before writing or running any Playwright step.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — before executing any case — drive the real screen, never a backend shortcut.
- [execute-and-summarize.md](../procedures/testing-ticket-workflow/execute-and-summarize.md) — before Phase E — read and follow Phase E, the result quality gate and Phase F, end to end.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read when recording or judging evidence clips and the AC/EC coverage gate.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — when results conflict with expectations, with dev claims, or look flaky.

#### Verdicts and defects (Phases E–F)

- [root-cause-investigation.md](../../references/root-cause-investigation.md) — before calling any case FAILED or BLOCKED — investigate to a verified root cause.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — before recording any non-PASSED verdict.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — whenever a Priority/Severity is named or judged.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — for any verdict that is not a clean PASSED — what the write-up must contain.
- [defect-candidates.md](../../references/output-templates/defect-candidates.md) — before reporting any defect found in the round — follow this exact table and the fixed owner question; never file without the owner.

#### Writes outside the chat (Phase G)

- [results-update.md](../procedures/testing-ticket-workflow/results-update.md) — before Phase G — read and follow it whenever results are updated outside this chat.
- [result-update-discipline.md](../procedures/testing-ticket-workflow/references/result-update-discipline.md) — read before updating a results destination.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — read before posting a Jira table with multi-line cells.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — read after posting a Jira comment, before saying done.

#### Close-out

- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read at close-out, before naming the next workflow (e.g. `Next: create-bug for {ids}` when F3 lists a defect).
- [session-closing.md](../../references/session-closing.md) — read at session end.

#### Any phase

- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT run Playwright until intake is complete **and** the WORKFLOW Phase C confirm gate has passed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Testing ticket section). MUST NOT claim tests passed without fresh runner output, without a design node (or its BLOCKED-with-reason) on every UI row, or with passed rows that carry no evidence.

## Dependencies

Run the check for each of these after step 2 (strategy) and before Phase A — one order: strategize, then this check, then intake; check commands and install hints are in [dependencies.md](../../references/dependencies.md):

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
