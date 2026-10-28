---
name: retest-bug-workflow
description: |
  Retest a Jira bug or task after a dev fix — read ticket, build the retest case list, compare every screen against the design (Figma), test API or UI, compare Swagger, draft evidence, post the comment with its case list (with approval), transition and assign back to dev.
  Use when the user says retest bug, retest task, verify fix, check if an issue is fixed, /retest-bug, or Retest bug from Helix — or when a ticket is Ready to Retest or the user asks whether a fix works, even without the word retest ("dev says it's done, check it", "แก้แล้วยัง").
  Do NOT use for writing new FE/API test case tables (tc-fe-prep / tc-api-prep), full ticket Playwright runs (testing-ticket-workflow), or opening new bugs (create-bug-workflow).
metadata:
  proactive_triggers:
    - /retest-bug
    - retest bug
    - retest task
    - verify fix
    - retest
    - check if bug is fixed
---

# Retest Bug (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **retest-bug-workflow** to retest the bug fix.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the retest approach, no guessing an expected/spec, no blind retry loops.
3. **Design (Figma) comparison is mandatory on every UI retest** — [figma-design-comparison.md](../../references/figma-design-comparison.md). A screen with no design reference is **reported back to the person or channel that assigned the retest** and its visual points stay BLOCKED; never assume a label, order, or layout.
4. **Retest deeply** — [customer-escape-prevention.md](../../references/customer-escape-prevention.md): cover the whole surface the fix touched, measure overflow/overlap at every in-scope width, evidence on passed rows too, and never PASSED over a "cannot verify" actual result.
5. **Run in parallel lanes by default** — [parallel-test-lanes.md](../../references/parallel-test-lanes.md): split the case list across subagents, **one leased account per lane** (never two lanes on one login), barrier for anything every lane sees; serial only with a named predicate.
5a. **Login by command, never a login window** — when an account must log in or its session has expired, give the user ready-to-run commands as one combined `bash` block per step that loops over the accounts (each isolated, prints OK / FAILED with a log path): relink every needed account, then setup/mint only the FAILED ones. Then probe and report. Never collect or fill a password ([parallel-test-lanes.md](../../references/parallel-test-lanes.md) §3).
6. **Result quality gate before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md): all 20 layers on every case before a verdict is reported or written; the main thread re-runs it on the lanes' files.
6a. **No-wait decision gate before any BLOCKED / "needs decision" / held post** — [no-wait-decision-gate.md](../../references/no-wait-decision-gate.md): all 20 layers — read every source, apply precedent, create missing data, decide and act; never park a case or a finished post waiting for someone.
7. Read and follow [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/retest-bug` → [commands/retest-bug.md](../../commands/retest-bug.md).

## Contents

Every file this workflow uses, linked directly from here. Only WORKFLOW.md is read up front; load each other file at the step or moment its line names. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [execute-and-evidence.md](../procedures/retest-bug-workflow/execute-and-evidence.md) — before Step 4 — read and follow Steps 4–5 and the result quality gate, end to end.
- [comment-and-post.md](../procedures/retest-bug-workflow/comment-and-post.md) — before drafting the comment — read and follow Steps 6–7, end to end.
- [closeout-and-notify.md](../procedures/retest-bug-workflow/closeout-and-notify.md) — right after the comment is posted — read and follow Steps 8–10, end to end.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — whenever a Priority/Severity is named or judged.
- [comment-template-v2.md](../procedures/retest-bug-workflow/references/comment-template-v2.md) — before drafting the v2 comment — render it from run.json per this template; never type the body.
- [defect-candidates.md](../../references/output-templates/defect-candidates.md) — before reporting any defect found in the round — follow this exact table and the fixed owner question; never file without the owner.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — for any verdict that is not a clean PASSED — what the write-up must contain.
- [intake-one-pager.md](../../references/intake-one-pager.md) — at intake, to show the one-page list of inputs the run needs.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — right after posting a Jira comment — full review checklist.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — before and after posting any Jira body (v2 wiki vs v3 ADF).
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — before recording any non-PASSED verdict.
- [portable-content.md](../../references/portable-content.md) — before writing any notify text or helper — no hardcoded webhooks, tokens, or machine paths.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — when results conflict with expectations, with dev claims, or look flaky.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read when recording or judging evidence clips and the AC/EC coverage gate.
- [retest-fix-intake.md](../../references/retest-fix-intake.md) — when building the retest plan, before executing tests.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — before calling any case FAILED or BLOCKED — investigate to a verified root cause.
- [round-time-contract.md](../../references/round-time-contract.md) — before logging in or reusing a session for the round.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — before executing any case — drive the real screen, never a backend shortcut.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — read before posting a Jira table with multi-line cells.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read before the round report, to suggest (never start) at most one follow-up Helix workflow.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [project-config-template.md](../procedures/retest-bug-workflow/references/project-config-template.md) — read when the project has no retest config yet.
- [worked-example.md](../procedures/retest-bug-workflow/references/worked-example.md) — read for a full worked retest.
- [debug-discipline.md](../procedures/retest-bug-workflow/references/debug-discipline.md) — read when a case is still failing, to triage FAILED vs BLOCKED.
- [gotchas.md](../procedures/retest-bug-workflow/references/gotchas.md) — read when a Jira body hits encoding or v2 rendering issues.
- [handoff-template.md](../procedures/retest-bug-workflow/references/handoff-template.md) — read when handing the session to another person or agent mid-round.
- [post-mortem-template.md](../procedures/retest-bug-workflow/references/post-mortem-template.md) — read when writing up a mistake made in the round.
- [jira-fast-publish.md](../../references/jira-fast-publish.md) — read at Step 7a when the comment has more than 3 table rows (ADF-direct publish and error recovery).
- [handoff-file-template.md](../../references/handoff-file-template.md) — read at Step 8 close-out when writing the round's `helix-handoff-{KEY}.md`.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without a Jira issue key/URL — a **Bug**, or a **Task / Story** whose fix is being re-verified — and reachable environment config.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Retest section). MUST NOT claim PASSED/FAILED without evidence in the comment, and MUST NOT post a retest comment — bug or task — without its **case list** — ONE table only, headed and filled per the **Table headers** and **Evidence per row** rules in [comment-and-post.md](../procedures/retest-bug-workflow/comment-and-post.md) (a row per ER/AC with its covering cases as `• TC_nn title (role)` inside the row; never a separate `Test cases run` table). No `Scope: FULL` line; multi-point header fields and cells as bullets; after posting set column widths and centre every clip/image with `tools/retest-guard/adf_colwidth.js`. The design reference goes on the header's `Design ref:` line, never as a per-row column.

**Before any comment draft is written to disk or shown as final** — including "draft only" requests — run `node tools/retest-guard/retest_guard.js --body <draft> --format v2 --bug-type FE` (for other bug types use the `--format`/`--bug-type` values the WORKFLOW comment step names) and keep fixing the draft until it exits 0. If the guard fails, return to the comment step in WORKFLOW.md; never hand over a draft the guard has not passed. When the workspace has no `tools/retest-guard/` ([dependencies.md](../../references/dependencies.md)), apply the same rules by hand from the comment step and state `guard not installed — checked by hand` with the draft; exit 2 (guard present but could not run) is not a pass — fix the run.

<a id="tool-not-available"></a>**Which tools count (every `tools/…` step in this workflow).** "The workspace" is the repository of the project being retested — the one its project guide lives in. A tool counts only when it is in that workspace **and** ran in this round. A copy found in any other checkout or repository on the machine is not this project's tool: never run it against this ticket and never cite it. An offline or mock run (the input says so) has no tools: apply each tool's checks by hand and write `<tool> not installed — checked by hand` beside the result. Report an exit code or "passed" only by quoting the real output line of a run made in this round; a missing tool is never a lighter standard.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Node.js + in-repo guard tools (`tools/retest-guard`, `tools/lane-lease-check`, `tools/run-time`, `tools/adoption-check`)
- curl + Jira REST credentials
- Atlassian MCP
- Figma
- browser automation MCP
- Playwright
- QA capture and verify tools (`{QA_TOOLS_ROOT}`)
- Python 3
- ffmpeg / ffprobe
- macOS-only tools (`sips`)
- notify channel webhook / bot
- `engineering:testing-strategy`
- `superpowers:systematic-debugging`
