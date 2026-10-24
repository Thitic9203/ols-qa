---
name: content-takedown-workflow
description: |
  Take a set of published content items out of public view — inventory the set, prove the items are otherwise healthy, pick the least damaging mechanism the available accounts can actually use, execute, then prove with guest-side evidence that every item is gone and nothing else moved.
  Use when the user says hide this content, take these down, remove from the public catalogue, unpublish this batch, ซ่อนสื่อ, นำออกจากคลัง, or /content-takedown.
  Do NOT use for deleting content permanently, for renaming or fixing item metadata (name-guard fixers), or for retesting a bug fix (retest-bug-workflow).
metadata:
  proactive_triggers:
    - /content-takedown
    - hide this content
    - take these down
    - remove from the public catalogue
    - unpublish this batch
    - ซ่อนสื่อ
    - นำออกจากคลัง
---

<!-- ols-only: this file is not synced to the generic plugin, so it may link to other
     workspace-only references. -->
# Content takedown (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/content-takedown-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **content-takedown-workflow** to take the named set out of public view.`
2. **Confirm the environment and the account set first** — one message, then wait. Never pick an
   environment yourself; see the intake gate in [ols-project-guide.md](../../references/ols-project-guide.md).
3. **Show the batch before touching it** — titles and count, plus the rule buckets when the batch is
   defined by a quality judgement (run `tools/name-guard/name_rules.js`, not your own taste).
4. **Work down the mechanism ladder** in WORKFLOW.md Step 3 and stop at the first rung a real call
   proves available: owner unpublish → platform team → administrative action → user report at a
   hiding severity. The last rung writes a permanent accusation against a named person and needs the
   user's informed approval, restated after hearing what it says about them.
5. Read and follow [WORKFLOW.md](../procedures/content-takedown-workflow/WORKFLOW.md) **end-to-end** —
   every step, gate and trap.

Claude Code shortcut: `/content-takedown` → [commands/content-takedown.md](../../commands/content-takedown.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/content-takedown-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
- [ols-project-guide.md](../../references/ols-project-guide.md) — read when working on OLS; grep the section you need.
- [playwright-preflight.md](../../references/playwright-preflight.md) — read before any Playwright run.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read when a QA follow-up could be suggested.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — read before saying done; shared closing checklist.
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a test is flaky or a tool errors.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [resilient-selectors.md](../../references/resilient-selectors.md) — read when writing or fixing Playwright selectors.
- [result-quality-gate.md](../../references/result-quality-gate.md) — read before any verdict leaves the round.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any failure.
- [round-time-contract.md](../../references/round-time-contract.md) — read when a round starts and before reporting times.
- [session-closing.md](../../references/session-closing.md) — read at session end.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [tc-glossary.md](../../references/tc-glossary.md) — read when choosing test-case terms.
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [verify-closing-checklist.md](../../references/verify-closing-checklist.md) — read before reporting a verify or retest done.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read at the start; find the workspace project guide.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without an explicit
instruction naming the set, a confirmed environment, accounts whose roles were verified live, and a
stated scope boundary. MUST refuse on a hands-off environment.

## The two traps that decide whether this works

- **One report per (account, item), first one binding** — a low-severity report filed first
  permanently spends that account's only chance to hide that item, and still answers `201`. Decide
  severity before the first call.
- **Severity, not count, controls visibility** — only the HIGH tier opens a case in the state that
  hides; every other tier opens a queue entry that changes nothing. Read severity from an
  authoritative source, never from the label's tone.

## QA closing (mandatory before "done")

Five-layer guest-side verification in WORKFLOW.md Step 6 — write responses, public list `total 0`,
**every** item id refused, whole-catalogue count down by exactly the batch size, and a guest
screenshot sent in chat. MUST NOT claim done from write responses alone or from a sampled subset,
and MUST state the rollback call with the ids needed to run it.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Node.js
- Python 3 + `requests`
- ffmpeg / ffprobe
- Playwright
- macOS-only tools (`scutil`)
- browser automation MCP or `superpowers-chrome:browsing`
- secrets folder
- `superpowers:systematic-debugging`
