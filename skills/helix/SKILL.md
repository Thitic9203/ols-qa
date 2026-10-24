---
name: helix
description: |
  Helix QA assistant menu — routes the user to the right QA workflow: TC FE prep, TC API prep, retest bug, testing ticket, create bug, catch-ai or TC review (content takedown, review result, smoke test and test data prep exist only in the ols-qa workspace).
  Use when the user says Helix, /helix or QA assistant menu, asks which QA workflow fits, or wants help with QA work without naming a workflow (e.g. "help me test this ticket", "ช่วยดูงาน QA นี้ให้หน่อย").
  Do NOT use for a request that already names a specific workflow — that goes straight to the matching command (listed in references/skill-routing.md).
metadata:
  proactive_triggers:
    - Helix
    - /helix
    - QA assistant
    - Helix menu
    - what can Helix do
---

# Helix router

Show the menu and route to the correct workflow skill. The command [commands/helix.md](../../commands/helix.md) loads this skill; the rules live here only.

## Contents

- [Opening](#opening-always-unless-the-user-already-chose-a-mode) · [Discipline](#discipline) · [Scope](#scope)
- [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out) · [Routing](#routing) · [QA closing](#qa-closing-mandatory-before-done) · [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files) · [Dependencies](#dependencies)

## Opening (always, unless the user already chose a mode)

Respond in **the user's language** (see [user-communication.md](../../references/user-communication.md)) — menus, questions, and replies follow the language the user writes in; keep technical terms, file names, and ticket keys as written. Be concise.

Decide what to show in this order — the first step that applies wins:

1. **Named workflow.** If the user's message already names a workflow (Thai, informal, or mixed input included), map it via [intent-shortcuts.md](../../references/intent-shortcuts.md), extract any issue key or URL from the same message, skip the menu, and go to Routing.
2. **Issue key with no mode** (`/helix {ISSUE_KEY}`). Infer the workflow only when the same message also contains a phrase from intent-shortcuts.md (e.g. `{ISSUE_KEY} API test cases from Swagger` → 2). A bare key or URL alone never picks a workflow: show the menu and ask which option applies to that key.
3. **Proactive suggestion.** Otherwise apply [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out); if it yields one suggestion, show that instead of the menu.
4. **Menu.** Otherwise show the menu from [menu-text.md](../../references/menu-text.md) (Opening block, in the user's language as that file says).

🔴 STOP — wait for the user's choice before starting a workflow.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Scope

This skill only routes — it does not run tests or post to Jira (see MUST / NEVER). When the goal is already clear, the menu is skipped (Opening step 1) because an extra menu round wastes time.

## Proactive suggestion (suggest-only, opt-out)

Apply the trigger table in [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) to the session context (git branch, linked Jira ticket, defects mentioned in chat):

- If `HELIX_PROACTIVE=0` is set, or no trigger row matches, make no suggestion — show the menu.
- If a row matches, offer exactly **one** suggestion (the strongest signal, as that file ranks them) instead of the menu.
- **Suggest only — never auto-run** a workflow (Rule #5).
- 🔴 STOP — one suggestion per turn, then wait for the user to pick (number/name) before loading anything.
- No Jira MCP? Infer from branch + last commit and say so, so the user can correct.

```text
Based on branch {branch} and {linked ticket or commit}, you may want **{workflow}** (`/{command}`).
Say the number/name to start, or ignore. (Set HELIX_PROACTIVE=0 to silence.)
```

## Routing

Route by the single table in [skill-routing.md § Primary menu](../../references/skill-routing.md#primary-menu): the user's number, option name, or intent-shortcuts phrase picks one row. Do not keep a routing table anywhere else.

1. **Announce before acting.** Before loading anything, tell the user in one line, in their language, which workflow you are routing to: the menu number, option name, skill, and command — e.g. `Routing to 3 · Retest Bug → retest-bug-workflow (/retest-bug) for {ISSUE_KEY}.` No workflow starts without this line.
2. **Load and follow** that row's `skills/{name}/SKILL.md` completely, passing on what the row says (issue key, URL, TC document, audit target).
3. **First routed response:** recite [helix-session-constraints.md](../../references/helix-session-constraints.md) once (All Helix block; add the Testing ticket block when routing to 4).

When routing cannot proceed:

| Situation | Do |
|-----------|-----|
| Reply is not 1–12, an option name, or an intent-shortcuts phrase | Re-show the menu once; if still unclear, treat it as 12 (Other). |
| Row 8–11 chosen outside the ols-qa workspace | Say it is not shipped in helix, then offer only that row's named fallback. |
| The routed `SKILL.md` is missing or cannot be loaded | Say which file is missing, do not imitate the workflow from memory, and show the menu again. |
| Ticket lookup is unavailable (no Atlassian MCP or token) | Route anyway and ask the user to paste the ticket text or link; the child workflow handles its own intake. |

Handoffs after a workflow ends: [skill-routing.md § Handoffs](../../references/skill-routing.md#handoffs-after-a-workflow-ends).

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + router-specific:

- [ ] User selected a workflow (1–12 or named skill).
- [ ] Child workflow skill is loaded (not just described).
- [ ] No Jira post or issue create happened in this router skill.

If routing only, hint: `/tc-fe-prep`, `/retest-bug`, etc.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Router-specific:

| Rule | Because |
|------|---------|
| MUST show the menu from references/menu-text.md in the user's language | Same numbers and option names at every entry point; user-communication.md |
| MUST state the workflow it routes to before loading it | The user can correct a wrong route before any work starts |
| MUST NOT start a workflow without user picking 1–12 or naming one | Avoid wrong scope |
| MUST NOT post to Jira or create issues from this router | Side effects belong in child workflows |

## Must-read files

The router itself reads only the first group. The second group is required by the shared rules this skill follows ([shared-preamble.md](../../references/shared-preamble.md), [qa-closing-shared.md](../../references/qa-closing-shared.md), [shared-must-never.md](../../references/shared-must-never.md)); the router never reaches those steps — the routed workflow reads each one at the point its line names. Both groups stay one hop from here so no required rule is two links away.

Read while routing:

- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step; each excuse has its correct action.
- Read [helix-session-constraints.md](../../references/helix-session-constraints.md) once at session start.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) when a QA follow-up could be suggested.
- Read [session-closing.md](../../references/session-closing.md) at session end.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [skill-routing.md](../../references/skill-routing.md) when choosing which skill handles a request.
- Read [skill-rules-style.md](../../references/skill-rules-style.md) before asking the user or stopping on a missing input.

Read only when the routed workflow reaches that step:

- Read [bug-priority-matrix.md](../../references/bug-priority-matrix.md) before setting any priority or a PWMI / FAILED verdict.
- Read [customer-escape-prevention.md](../../references/customer-escape-prevention.md) before any QA run; the gates that stop shipped defects.
- Read [defect-report-completeness.md](../../references/defect-report-completeness.md) before writing up any defect or non-pass.
- Read [figma-design-comparison.md](../../references/figma-design-comparison.md) before judging any UI or visual result against the design.
- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) after posting a Jira comment, before saying done.
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) before posting a Jira table with multi-line cells.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) when the workflow has many steps; keep the todo list.
- Read [non-pass-challenge-gate.md](../../references/non-pass-challenge-gate.md) before recording any result that is not PASSED.
- Read [playwright-preflight.md](../../references/playwright-preflight.md) before any Playwright run.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) before any completion claim.
- Read [resilient-selectors.md](../../references/resilient-selectors.md) when writing or fixing Playwright selectors.
- Read [result-quality-gate.md](../../references/result-quality-gate.md) before any verdict leaves the round.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when a round starts and before reporting times.
- Read [test-through-real-steps.md](../../references/test-through-real-steps.md) before testing an action; no API shortcut for the action under test.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) before reporting a verify or retest done.

## Dependencies

Check these before routing — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP (ticket lookup while routing) — optional; without it, ask the user to paste the ticket text (see Routing)
- `superpowers:systematic-debugging`
- each routed skill lists its own dependencies in its `## Dependencies` section and re-checks them when it starts

If a check fails, do not stop routing: name the failed dependency in one line, give its install hint or fallback from the dependencies.md row, and still show the menu (or route a named workflow). The routed skill re-checks its own dependencies and stops there if a missing one is required.
