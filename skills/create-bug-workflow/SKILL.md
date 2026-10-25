---
name: create-bug-workflow
description: |
  Draft and file bug reports on Jira or GitHub after collecting the target link, format template and bug details — re-checks the board for an earlier decision, falsifies the defect, and confirms with the user before anything is created.
  Use when the user chooses Create bug from Helix, invokes /create-bug, or wants a found defect recorded in a tracker — even without the word bug ("raise a ticket for this", "log this defect", "เปิดบั๊ก").
  Do NOT use for Playwright test runs (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), posting manual TC tables (tc-fe-prep / tc-api-prep), or updating test result sheets without filing bugs.
metadata:
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

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

**Read for every run** — every filing run uses these:

- [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [shared-preamble.md](../../references/shared-preamble.md) — read at the start of every run, before the first reply (preamble, constraints, tone).
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read on the first response, to locate the workspace project guide for this workflow.
- [intake-one-pager.md](../../references/intake-one-pager.md) — read at intake, to show the one-page list of inputs the run needs.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [bug-draft-template.md](../procedures/create-bug-workflow/references/bug-draft-template.md) — read when drafting the bug.
- [posting-discipline.md](../procedures/create-bug-workflow/references/posting-discipline.md) — read before posting the bug.
- [user-communication.md](../../references/user-communication.md) — read before the first message to the user (every run sends the intake message).
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before the Phase A intake message (every run asks for missing inputs there).
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read at the start of every run (the workflow always has many phases); keep the todo list.

**Read when the run reaches that phase** — mandatory at the moment named:

- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing the first draft body (Phase C), before the confirm block is shown; a run where every candidate is dropped or Needs Review writes no draft.
- [shared-must-never.md](../../references/shared-must-never.md) — read before the first write of the run: the first create call, attachment upload or comment in Phase D — rules shared by every workflow.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim — at Phase F before saying any issue is created or verified, and at the end of a run that files nothing.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — read before reporting done, whether or not anything was filed — shared QA closing gates, including the cross-ticket conflict check.

**Read when the trigger in the line fires** — a Jira target, a design comparison, a non-pass verdict, a stuck step or tool error, session start/end, a timed round:

- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read before you skip, shorten or reorder any phase or gate of WORKFLOW.md; each excuse has its correct action.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read when the expected side cites a design frame (Refusal-first, Phase E "Intentional design?" check).
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start, when this run is the first Helix workflow of the session.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — read after posting a Jira comment, before saying done.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — read before posting a Jira table with multi-line cells.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read when proposing a QA follow-up.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.

**Read only if the user asks you to reproduce the bug in a browser yourself** — create-bug never does this on its own (steps come only from the reporter); hand reproduction to testing-ticket-workflow unless the user insists:

- [playwright-preflight.md](../../references/playwright-preflight.md) — read before that Playwright run.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing its selectors.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing the action; no API shortcut for the action under test.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create issues until the user approves each draft. MUST re-check the tracker/board first (WORKFLOW Phase B2): a defect a prior/closed ticket already settled as intended behavior is not a bug — report it to the user with the reference link instead of filing.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section). MUST verify each created issue URL before reporting done.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- GitHub CLI `gh` (GitHub targets)
- Atlassian MCP or Jira REST credentials (Jira targets)
- macOS-only tools (`osascript`, browser fallback)
- Node.js + in-repo guard tools (`tools/retest-guard`) — only when the workspace carries them; when `tools/retest-guard/` is absent, apply the `img-width-param` rule by hand (embed every image bare, `!file.png!`) and say so
- `superpowers:systematic-debugging`
