---
name: helix
description: |
  Helix QA assistant menu — route to TC FE prep, TC API prep, retest bug, testing ticket, or create bug.
  Use when the user says Helix, /helix, QA assistant menu, or is unsure which QA workflow to run.
  Do NOT use when the user already chose a specific workflow (invoke tc-fe-prep-workflow, tc-api-prep-workflow, retest-bug-workflow, testing-ticket-workflow, or create-bug-workflow directly).
proactive_triggers:
  - Helix
  - /helix
  - QA assistant
  - Helix menu
  - what can Helix do
---

# Helix router

Show the menu and route to the correct workflow skill. Full text: [commands/helix.md](../../commands/helix.md).

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Refusal-first (precondition gate)

This skill only routes — it does not run tests or post to Jira.

If the user’s goal is already clear (e.g. “write FE TC for PROJ-123”), **skip the menu** and invoke the matching workflow skill directly — because an extra menu round wastes time.

## Intent shortcuts (Thai / mixed input)

When the user writes Thai or informal English, map intent using [intent-shortcuts.md](../../references/intent-shortcuts.md). Still respond in **English only**. Extract issue keys from the same message when present.

## Routing

| User choice | Invoke skill |
|-------------|----------------|
| 1, TC FE, FE test cases | `tc-fe-prep-workflow` |
| 2, TC API, Swagger API TC | `tc-api-prep-workflow` |
| 3, retest, verify fix | `retest-bug-workflow` |
| 4, testing ticket, Playwright | `testing-ticket-workflow` |
| 5, create bug, file bug | `create-bug-workflow` |
| 6, other | Clarify; suggest closest workflow |

Handoffs: [skill-routing.md](../../references/skill-routing.md).

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + router-specific:

- [ ] User selected a workflow (1–6 or named skill).
- [ ] Child workflow skill is loaded (not just described).
- [ ] No Jira post or issue create happened in this router skill.

If routing only, hint: `/tc-fe-prep`, `/retest-bug`, etc.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Router-specific:

| Rule | Because |
|------|---------|
| MUST show English menu from commands/helix.md | Consistent UX across agents |
| MUST NOT start a workflow without user picking 1–6 or naming one | Avoid wrong scope |
| MUST NOT post to Jira or create issues from this router | Side effects belong in child workflows |
