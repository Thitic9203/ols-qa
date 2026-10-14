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

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **retest-bug-workflow** to retest the bug fix.`
2. **Settle and strategize first** — before any tool call, follow [settle-and-strategize.md](../../references/settle-and-strategize.md): invoke **`engineering:testing-strategy`** to plan the retest approach, no guessing an expected/spec, no blind retry loops.
3. **Design (Figma) comparison is mandatory on every UI retest** — [figma-design-comparison.md](../../references/figma-design-comparison.md). A screen with no design reference is **reported back to the person or channel that assigned the retest** and its visual points stay BLOCKED; never assume a label, order, or layout.
4. **Retest deeply** — [customer-escape-prevention.md](../../references/customer-escape-prevention.md): cover the whole surface the fix touched, measure overflow/overlap at every in-scope width, evidence on passed rows too, and never PASSED over a "cannot verify" actual result.
5. **Run in parallel lanes by default** — [parallel-test-lanes.md](../../references/parallel-test-lanes.md): split the case list across subagents, **one leased account per lane** (never two lanes on one login), barrier for anything every lane sees; serial only with a named predicate.
6. **Result quality gate before any verdict** — [result-quality-gate.md](../../references/result-quality-gate.md): all 20 layers on every case before a verdict is reported or written; the main thread re-runs it on the lanes' files.
6a. **No-wait decision gate before any BLOCKED / "needs decision" / held post** — [no-wait-decision-gate.md](../../references/no-wait-decision-gate.md): all 20 layers — read every source, apply precedent, create missing data, decide and act; never park a case or a finished post waiting for someone.
7. Read and follow [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/retest-bug` → [commands/retest-bug.md](../../commands/retest-bug.md).

## Contents (read on demand, 1 hop)

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/retest-bug-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
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
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — when recording or judging evidence clips and the AC/EC coverage gate.
- [retest-fix-intake.md](../../references/retest-fix-intake.md) — when building the retest plan, before executing tests.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — before calling any case FAILED or BLOCKED — investigate to a verified root cause.
- [round-time-contract.md](../../references/round-time-contract.md) — before logging in or reusing a session for the round.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — before executing any case — drive the real screen, never a backend shortcut.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without a Jira issue key/URL — a **Bug**, or a **Task / Story** whose fix is being re-verified — and reachable environment config.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Retest section). MUST NOT claim PASSED/FAILED without evidence in the comment, and MUST NOT post a retest comment — bug or task — without its **case list** — ONE table only (No. · ER/AC · Case (Role) · Expected Result · Actual Result · Evidence · Status, a row per ER/AC with its covering cases as `• TC_nn title (role)` inside the row; never a separate `Test cases run` table). No `Scope: FULL` line; multi-point header fields and cells as bullets; after posting set column widths and centre every clip/image with `tools/retest-guard/adf_colwidth.js`. The design reference goes on the header's `Design ref:` line, never as a per-row column.
