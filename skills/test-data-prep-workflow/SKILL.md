---
name: test-data-prep-workflow
description: |-
  Create, fix, or verify test data — content, courses, paths, covers, videos, PDFs, accounts — per the project's data-prep recipe, passing every gate first.
  Use when the user says /test-data-prep or asked to prepare / build / seed / fix test content or covers.
  Do NOT use for ticket testing (testing-ticket-workflow), bug retest (retest-bug-workflow), or TC tables (tc-fe-prep / tc-api-prep).
---

# Test data prep (discovery stub)

Also triggers on: prepare test data; create test data; build training content; make covers; seed media / course / learning path.

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/test-data-prep-workflow/WORKFLOW.md).

> **Maintainer note (user directive 2026-08-08):** when editing THIS skill, invoke **superpowers:writing-skills** first — match the guidance form to the failure and craft precise, well-fitted wording. Sharpness and completeness checks stay strict per the project's recipe; cover titles must never overflow the frame, break lines badly, or split a compound word. This skill is edited in Helix only and must carry no project's values.

When invoked:

1. **Find the project's recipe** — the workspace file `references/*-data-prep.md` (or `references/*-test-data-guide.md`) and every document it names. No recipe, or a slot marked "not configured" → ask once, save to the recipe, never guess (WORKFLOW.md → *Find the recipe*).
2. Announce once: `Using **test-data-prep-workflow** to build {PROJECT} test data per {recipe file}.`
3. Read and follow [WORKFLOW.md](../procedures/test-data-prep-workflow/WORKFLOW.md) **end-to-end** — every step and gate. Never invent a recipe, value, tool, or cover style.

Claude Code shortcut: `/test-data-prep` → [commands/test-data-prep.md](../../commands/test-data-prep.md).

## Contents

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/test-data-prep-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step; each excuse has its correct action.
- [bug-priority-matrix.md](../../references/bug-priority-matrix.md) — read before setting any priority or a PWMI / FAILED verdict.
- [customer-escape-prevention.md](../../references/customer-escape-prevention.md) — read before any QA run; the gates that stop shipped defects.
- [defect-report-completeness.md](../../references/defect-report-completeness.md) — read before writing up any defect or non-pass.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) — read before recording any result that is not PASSED.
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
- [test-through-real-steps.md](../../references/test-through-real-steps.md) — read before testing an action; no API shortcut for the action under test.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.
- [verify-closing-checklist.md](../../references/verify-closing-checklist.md) — read before reporting a verify or retest done.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read before *Find the recipe*, to locate the workspace project guide for this workflow.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT create / upload / seed until the recipe is read and the **full Gate 0 intake is confirmed** — asked in order via `AskUserQuestion` and all cleared before anything is built, every option list taken from the recipe: **0.1** env + account + spec URL (never pick an env yourself), **0.2** data type(s) as a checkbox / multi-select + exact target status, **0.3** style / content shape + quantity + purpose, **0.4** the relevant detail questions (reuse policy, owner, cover/video needed, delivery, lot, clash handling, sample approval). Restate the whole spec and wait for "go". If covers/videos are in scope and the recipe's tool is down, that work is BLOCKED (never fall back to a plain cover).

## QA closing (mandatory before "done")

All gates are in WORKFLOW.md: readback, the recipe's publish chain, and the cover gate when covers are in scope. Not-all-green = **not usable** — never upload, never test with it, never call it done. Get **sample approval before the real lot**, and use **real-user names/descriptions with no duplicates** (clash → stop and ask).

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- the project's data-prep recipe in the workspace `references/`
- whatever the recipe names: a private repo (`{EVIDENCE_REPO}`), a local image API, out-of-repo tools (`{QA_TOOLS_ROOT}`), a secrets folder
- `superpowers:writing-skills` (maintainers only)
- `superpowers:systematic-debugging`
