---
name: helix
description: |
  Helix QA assistant menu — route to TC FE prep, TC API prep, retest bug, testing ticket, create bug, content takedown, TC review, review result, catch-ai, smoke test, or test data prep.
  Use when the user says Helix, /helix, QA assistant menu, or is unsure which QA workflow to run.
  Do NOT use when the user already chose a specific workflow — use the matching command (/tc-fe-prep, /tc-api-prep, /retest-bug, /testing-ticket, /create-bug, /content-takedown, /tc-review, /review-result, /catch-ai, /smoke-test, /test-data-prep) directly.
proactive_triggers:
  - Helix
  - /helix
  - QA assistant
  - Helix menu
  - what can Helix do
---

# Helix router

Show the menu and route to the correct workflow skill. Full text: [commands/helix.md](../../commands/helix.md).

## Contents

- [Opening](#opening-always-unless-the-user-already-chose-a-mode) · [Discipline](#discipline) · [Refusal-first](#refusal-first-precondition-gate) · [Intent shortcuts](#intent-shortcuts-thai--mixed-input)
- [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out) · [Routing](#routing) · [QA closing](#qa-closing-mandatory-before-done) · [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files) · [Dependencies](#dependencies)

## Opening (always, unless the user already chose a mode)

Respond in **the user's language** (see [user-communication.md](../../references/user-communication.md)) — menus, questions, and replies follow the language the user writes in; keep technical terms, file names, and ticket keys as written. Be concise.

Show the menu from [menu-text.md](../../references/menu-text.md) (Opening block — copy verbatim).

Wait for the user's choice before starting a workflow.

If the user's message already names a workflow (including Thai phrases), map via [intent-shortcuts.md](../../references/intent-shortcuts.md) and **skip this menu** — read and follow that workflow directly.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Refusal-first (precondition gate)

This skill only routes — it does not run tests or post to Jira.

If the user’s goal is already clear (e.g. “write FE TC for PROJ-123”), **skip the menu** and load the matching workflow stub (`skills/{name}/SKILL.md`) — because an extra menu round wastes time.

## Intent shortcuts (Thai / mixed input)

When the user writes Thai or informal English, map intent using [intent-shortcuts.md](../../references/intent-shortcuts.md). Respond in the language the user wrote in. Extract issue keys from the same message when present.

## Proactive suggestion (suggest-only, opt-out)

When the session context already hints at a workflow (git branch, linked Jira ticket, defects mentioned in chat), you MAY offer **one** suggestion instead of the full menu — following [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md).

- **Suggest only — never auto-run** a workflow (Rule #5).
- Respect `HELIX_PROACTIVE=0` — if set, skip suggestions and show the normal menu.
- One suggestion per turn, then wait for the user to pick (number/name) before loading anything.
- No Jira MCP? Infer from branch + last commit and say so, so the user can correct.

```text
Based on branch {branch} and {linked ticket or commit}, you may want **{workflow}** (`/{command}`).
Say the number/name to start, or ignore. (Set HELIX_PROACTIVE=0 to silence.)
```

## Routing

| User choice | Action |
|-------------|--------|
| 1, TC FE, FE test cases | Read and follow [tc-fe-prep-workflow](../tc-fe-prep-workflow/SKILL.md) |
| 2, TC API, Swagger API TC | Read and follow [tc-api-prep-workflow](../tc-api-prep-workflow/SKILL.md) |
| 3, retest, verify fix | Read and follow [retest-bug-workflow](../retest-bug-workflow/SKILL.md) |
| 4, testing ticket, Playwright | Read and follow [testing-ticket-workflow](../testing-ticket-workflow/SKILL.md) |
| 5, create bug, file bug | Read and follow [create-bug-workflow](../create-bug-workflow/SKILL.md) |
| 6, catch ai, audit, review my work | Read and follow [catch-ai-workflow](../catch-ai-workflow/SKILL.md) |
| 7, tc review, review test cases | Read and follow [tc-review-workflow](../tc-review-workflow/SKILL.md) |
| 8, other | Clarify; suggest closest workflow |

Handoffs: [skill-routing.md](../../references/skill-routing.md).

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + router-specific:

- [ ] User selected a workflow (1–8 or named skill).
- [ ] Child workflow skill is loaded (not just described).
- [ ] No Jira post or issue create happened in this router skill.

If routing only, hint: `/tc-fe-prep`, `/retest-bug`, etc.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Router-specific:

| Rule | Because |
|------|---------|
| MUST show English menu from commands/helix.md | Consistent UX across agents |
| MUST NOT start a workflow without user picking 1–8 or naming one | Avoid wrong scope |
| MUST NOT post to Jira or create issues from this router | Side effects belong in child workflows |

## Must-read files

Every file this skill's procedure requires, one hop from here. Read each at the point its line names.

- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step; each excuse has its correct action.
- Read [bug-priority-matrix.md](../../references/bug-priority-matrix.md) before setting any priority or a PWMI / FAILED verdict.
- Read [customer-escape-prevention.md](../../references/customer-escape-prevention.md) before any QA run; the gates that stop shipped defects.
- Read [defect-report-completeness.md](../../references/defect-report-completeness.md) before writing up any defect or non-pass.
- Read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging any UI or visual result against the design.
- Read [helix-session-constraints.md](../../references/helix-session-constraints.md) once at session start.
- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) after posting a Jira comment, before saying done.
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) before posting a Jira table with multi-line cells.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) when the workflow has many steps; keep the todo list.
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) before recording any result that is not PASSED.
- Read [playwright-preflight.md](../../references/playwright-preflight.md) before any Playwright run.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when a QA follow-up could be suggested.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) before any completion claim.
- Read [resilient-selectors.md](../../references/resilient-selectors.md) when writing or fixing Playwright selectors.
- Read [result-quality-gate.md](../../references/result-quality-gate.md) before any verdict leaves the round.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when a round starts and before reporting times.
- Read [session-closing.md](../../references/session-closing.md) at session end.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [skill-routing.md](../../references/skill-routing.md) when choosing which skill handles a request.
- Read [skill-rules-style.md](../../references/skill-rules-style.md) before asking the user or stopping on a missing input.
- Read [test-through-real-steps.md](../../references/test-through-real-steps.md) before testing an action; no API shortcut for the action under test.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) before reporting a verify or retest done.

## Dependencies

Run the check for each of these before step 1 — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP (ticket lookup while routing)
- each routed skill lists its own dependencies in its `## Dependencies` section
- `superpowers:systematic-debugging`
