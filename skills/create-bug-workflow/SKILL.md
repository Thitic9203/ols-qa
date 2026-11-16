---
name: create-bug-workflow
description: |-
  File bug reports on Jira or GitHub: collect target, format and details, check the board, falsify the defect, confirm before creating.
  Use when the user picks Create bug from Helix, says /create-bug, or wants a defect logged, even a test-run finding or without the word bug ("raise a ticket for this", "เปิดบั๊ก").
  Do NOT use for Playwright runs (testing-ticket), retest after a fix (retest-bug), TC tables (tc-fe-prep / tc-api-prep), or result-sheet updates.
---

# Create Bug (discovery stub)

Also triggers on: open bug; log defect.

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md).

When invoked:

1. First, before any other work, follow [session-start-context.md](../../references/session-start-context.md) (caveman lite + context-mode).
2. Announce once: `Using **create-bug-workflow** to file the bug report.`
3. Read [WORKFLOW.md](../procedures/create-bug-workflow/WORKFLOW.md) and run its progress checklist in order; open each phase or reference file at the step that names it, not before. Never skip a step or gate.

Claude Code shortcut: `/create-bug` → [commands/create-bug.md](../../commands/create-bug.md).

## Contents

Shared reference index with triggers (see also): [skill-reference-index.md](../../references/skill-reference-index.md).

At the start of every run: [shared-preamble.md](../../references/shared-preamble.md), [user-communication.md](../../references/user-communication.md), [long-workflow-todos.md](../../references/long-workflow-todos.md), then [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) and [intake-one-pager.md](../../references/intake-one-pager.md) on the first response (WORKFLOW Refusal-first).

Bug-filing gates, at the moment named:

- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read at Phase A3, before setting any Priority/Severity or a PWMI / FAILED verdict.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read when the expected side cites a design frame (Refusal-first, Phase B3).
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read at Phase C, before the first draft body; a run where every candidate is Dropped writes no draft; a Needs Review candidate is drafted and shown labelled "Needs Review — not filed".
- [bug-draft-template.md](../procedures/create-bug-workflow/references/bug-draft-template.md) — read when drafting; [posting-discipline.md](../procedures/create-bug-workflow/references/posting-discipline.md) — at Phase D, before posting.
- [shared-must-never.md](../../references/shared-must-never.md) — read at Phase D, before the first write (create call, attachment upload or comment).
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md), [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md), [jira-comment-post-review.md](../../references/jira-comment-post-review.md) (issue body: pre-post render check, §3, §4; Phase F's 2-round cap) — read when the target is Jira: before and after posting any body.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read at Phase B3, before any label or BLOCKED line; [result-quality-gate.md](../../references/result-quality-gate.md) is a test-round gate — when filing, apply its layer map in [B3](../procedures/create-bug-workflow/phase-b3-falsification.md#result-quality-gate-layer-map-filing).
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read at Phase F, before any completion claim, and at the end of a run that files nothing.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — read at QA closing, before reporting done, whether or not anything was filed; its cross-ticket conflict check is for testing-ticket and retest-bug only — this workflow's board check is Phase B2.
- Reproducing in a browser: never on its own (steps come only from the reporter); hand it to testing-ticket-workflow unless the user insists.

Also read each only when its trigger fires: [agent-rationalizations.md](../../references/agent-rationalizations.md) (skipping a gate), [helix-session-constraints.md](../../references/helix-session-constraints.md) (first reply), [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) (switching skills), [qa-debug-discipline.md](../../references/qa-debug-discipline.md) (tool error, env down), [root-cause-investigation.md](../../references/root-cause-investigation.md) (stating a cause); [B2](../procedures/create-bug-workflow/phase-b2-board-check.md), [B3](../procedures/create-bug-workflow/phase-b3-falsification.md), [C](../procedures/create-bug-workflow/phase-c-confirm.md), [D](../procedures/create-bug-workflow/phase-d-create.md), [F](../procedures/create-bug-workflow/phase-f-close.md) at their step; [session-closing.md](../../references/session-closing.md) (close-out), [skill-routing.md](../../references/skill-routing.md) (out-of-scope request), [skill-rules-style.md](../../references/skill-rules-style.md) (editing this skill), [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) (offering a next skill); [customer-escape-prevention.md](../../references/customer-escape-prevention.md) and [round-time-contract.md](../../references/round-time-contract.md) (test rounds only, not filing).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create issues before the Phase C **confirm**; MUST re-check the board first (Phase B2) — a defect an earlier ticket settled as intended is reported with its link, not filed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (Create bug section). MUST verify each created issue URL before reporting done.

## Dependencies

Run the check for each of these after step 1, before step 2 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- GitHub CLI `gh` (GitHub targets)
- Atlassian MCP or Jira REST credentials (Jira targets)
- macOS-only tools (`osascript`, browser fallback)
- Node.js + in-repo guard tools (`tools/retest-guard`) — only when the workspace carries them; when `tools/retest-guard/` is absent, apply the `img-width-param` rule by hand (embed every image bare, `!file.png!`) and say so
- `superpowers:systematic-debugging`
