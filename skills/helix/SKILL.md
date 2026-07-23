---
name: helix
description: |
  Helix QA assistant menu — route to TC FE prep, TC API prep, retest bug, testing ticket, or create bug.
  Use when the user says Helix, /helix, QA assistant menu, or is unsure which QA workflow to run.
  Do NOT use when the user already chose a specific workflow — use the matching command (/tc-fe-prep, /tc-api-prep, /retest-bug, /testing-ticket, /create-bug) directly.
proactive_triggers:
  - Helix
  - /helix
  - QA assistant
  - Helix menu
  - what can Helix do
---

# Helix router

Show the menu and route to the correct workflow skill. Full text: [commands/helix.md](../../commands/helix.md).

## Opening (always, unless the user already chose a mode)

Respond in **English only** — never Thai in menus, questions, or replies, even if the user writes Thai. Be concise.

Show the menu from [menu-text.md](../../references/menu-text.md) (Opening block — copy verbatim).

Wait for the user's choice before starting a workflow.

If the user's message already names a workflow (including Thai phrases), map via [intent-shortcuts.md](../../references/intent-shortcuts.md) and **skip this menu** — read and follow that workflow directly.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Refusal-first (precondition gate)

This skill only routes — it does not run tests or post to Jira.

If the user’s goal is already clear (e.g. “write FE TC for PROJ-123”), **skip the menu** and load the matching workflow stub (`skills/{name}/SKILL.md`) — because an extra menu round wastes time.

## Intent shortcuts (Thai / mixed input)

When the user writes Thai or informal English, map intent using [intent-shortcuts.md](../../references/intent-shortcuts.md). Still respond in **English only**. Extract issue keys from the same message when present.

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
