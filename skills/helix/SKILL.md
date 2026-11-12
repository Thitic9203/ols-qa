---
name: helix
description: |-
  Helix QA assistant — routes to the right workflow (TC FE/API prep, retest bug, testing ticket, create bug, catch-ai, TC review, TC change format, review result, test data).
  Use when the user says Helix, /helix, Helix menu, QA menu or "what can Helix do" with no workflow named, asks which fits, or wants QA help ("ช่วยดูงาน QA นี้ให้หน่อย").
  Do NOT use when a workflow is named, even as "Helix → {workflow}" — run that workflow.
metadata:
  proactive_triggers:
    - Helix
    - /helix
    - QA assistant
    - Helix menu
    - what can Helix do
---

# Helix router

**Start, in this order:** (1) follow [session-start-context.md](../../references/session-start-context.md); (2) run the [Dependencies](#dependencies) check; (3) go to [Opening](#opening-always-unless-the-user-already-chose-a-mode).

Show the menu and route to the correct workflow skill. The command [commands/helix.md](../../commands/helix.md) loads this skill; the rules live here only.

## Contents

- [Dependencies](#dependencies) · [Opening](#opening-always-unless-the-user-already-chose-a-mode) · [Discipline](#discipline) · [Refusal-first](#refusal-first-precondition-gate)
- [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out) · [Routing](#routing) · [QA closing](#qa-closing-mandatory-before-done) · [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files)

## Dependencies

Check these before routing — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP (ticket lookup while routing) — optional; without it, ask the user to paste the ticket text (see Routing)
- each routed skill lists its own dependencies in its `## Dependencies` section and re-checks them when it starts

If a check fails, do not stop routing: name the failed dependency in one line, give its install hint or fallback from the dependencies.md row, and still show the menu (or route a named workflow). The routed skill re-checks its own dependencies and stops there if a missing one is required.

## Opening (always, unless the user already chose a mode)

Respond in **the user's language** (see [user-communication.md](../../references/user-communication.md)) — menus, questions, and replies follow the language the user writes in; keep technical terms, file names, and ticket keys as written. Be concise.

Decide what to show in this order — the first step that applies wins:

1. **Named workflow.** If the user's message already names a workflow (Thai, informal, or mixed input included), map it via [intent-shortcuts.md](../../references/intent-shortcuts.md), extract any issue key or URL from the same message, skip the menu, and go to Routing.
2. **Issue key with no mode** (`/helix {ISSUE_KEY}`). Infer the workflow only when the same message also contains a phrase from intent-shortcuts.md (e.g. `{ISSUE_KEY} API test cases from Swagger` → 2). A bare key or URL alone never picks a workflow: show the menu and ask which option applies to that key.
3. **Proactive suggestion.** Otherwise apply [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out); if it yields one suggestion, show that instead of the menu.
4. **Menu.** Otherwise show the menu from [menu-text.md](../../references/menu-text.md) (Opening block, in the user's language as that file says).

🔴 STOP — wait for the user's choice before starting a workflow.

🔴 When the router itself must ask (which option, which of two matching workflows), ask exactly one question, and that question asks for one item. Leave every other missing item (URL, account, browser, design node) to the routed workflow's own intake, which asks one at a time — never fold a second item into the same question, and never a numbered list of asks from the router.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Refusal-first (precondition gate)

This skill only routes — it does not run tests or post to Jira (see MUST / NEVER). When the goal is already clear, the menu is skipped (Opening step 1) because an extra menu round wastes time.

Refuse, say why in one line, and route instead when:

| Request to the router | Do |
|-----------------------|-----|
| Post a Jira comment, transition a ticket, or create an issue directly from `/helix` | Refuse the action here; route to the workflow that owns it (create-bug, retest-bug, testing-ticket) via Routing — that workflow keeps its own approval gate. |
| Run tests or Playwright directly from `/helix` | Refuse; route to testing-ticket or retest-bug via Routing. |
| A request that is not QA work (no row in skill-routing.md or intent-shortcuts.md matches) | Say it is outside Helix's scope; show the menu once, then treat it as 14 (Other). |

## Proactive suggestion (suggest-only, opt-out)

Apply the trigger table in [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) to the session context (git branch, linked Jira ticket, defects mentioned in chat):

- If `HELIX_PROACTIVE=0` is set, or no trigger row matches, make no suggestion — show the menu.
- If one row matches, offer exactly **one** suggestion instead of the menu. When more than one row matches, apply that file's only tie-break — ticket type wins over branch; if rows still tie, the signal is ambiguous, so follow its last row and show the menu.
- **Suggest only — never auto-run** a workflow: the user did not ask for it, so starting one is an unrequested side effect ([proactive-qa-triggers.md § Hard guardrails](../../references/proactive-qa-triggers.md#hard-guardrails)).
- 🔴 STOP — one suggestion per turn, then wait for the user to pick (number/name) before loading anything.
- No Jira MCP? Infer from branch + last commit and say so, so the user can correct.
- Wording: use [proactive-qa-triggers.md § Suggestion wording](../../references/proactive-qa-triggers.md#suggestion-wording-one-line-then-wait) exactly — it is the only copy.

## Routing

Route by the single table in [skill-routing.md § Primary menu](../../references/skill-routing.md#primary-menu): the user's number, option name, or intent-shortcuts phrase picks one row. Do not keep a routing table anywhere else.

The first routed response does these three things in this order, once each:

1. **Announce the route.** Before loading anything, tell the user in one line, in their language, which workflow you are routing to: the menu number, option name, skill, and command — e.g. `Routing to 3 · Retest Bug → retest-bug-workflow (/retest-bug) for {ISSUE_KEY}.` No workflow starts without this line. This is the router's own line; it does not replace the shared announce in step 3.
2. **Recite the constraints:** [helix-session-constraints.md](../../references/helix-session-constraints.md) once (All Helix block; add the Testing ticket block when routing to 4). The router owns this recital; the child workflow does not recite it again in the same session.
3. **Load and follow** that row's `skills/{name}/SKILL.md` completely, opening with the shared announce `Using **{skill}** to {purpose}.` once ([shared-must-never.md](../../references/shared-must-never.md), [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md)), and passing on what the row says (issue key, URL, TC document, audit target).

When routing cannot proceed:

| Situation | Do |
|-----------|-----|
| Reply is not 1–14, an option name, or an intent-shortcuts phrase | Re-show the menu once; if still unclear, treat it as 14 (Other). |
| User ignores or declines a proactive suggestion (replies about something else, or says no) | Do not start that workflow. Show the menu once; do not repeat the same suggestion in this session. |
| Row 8 or 10 chosen and its `skills/{name}/SKILL.md` is not in the loaded skill set | Say it is not shipped in helix, then offer only that row's named fallback. |
| The routed `SKILL.md` is missing or cannot be loaded | Say which file is missing, do not imitate the workflow from memory, and show the menu again. |
| menu-text.md, skill-routing.md or helix-session-constraints.md cannot be read | Name the file; do not route or show a menu from memory; stop. If intent-shortcuts.md or proactive-qa-triggers.md cannot be read instead, name it, skip Opening step 1 or 3, and show the menu. |
| One message names workflow A, then workflow B only if A's result calls for it (e.g. retest, then file a bug if still broken) | Route to A; record B as the handoff per [skill-routing.md § Handoffs](../../references/skill-routing.md#handoffs-after-a-workflow-ends); do not ask a clarifying question. Two workflows both matching one goal is a different case — ask one question per intent-shortcuts.md. |
| Ticket lookup is unavailable (no Atlassian MCP or token) | Route anyway and ask the user to paste the ticket text or link; the child workflow handles its own intake. |

Handoffs after a workflow ends: [skill-routing.md § Handoffs](../../references/skill-routing.md#handoffs-after-a-workflow-ends).

## QA closing (mandatory before "done")

Follow [qa-closing-shared.md](../../references/qa-closing-shared.md) + router-specific:

- [ ] User selected a workflow (1–14 or named skill).
- [ ] Child workflow skill is loaded (not just described) — or, when no child was loaded (declined, fallback none, out of scope), the reply says 'not routed' and why.
- [ ] No Jira post or issue create happened in this router skill.

If routing only, hint the command from the Command column of [skill-routing.md § Primary menu](../../references/skill-routing.md#primary-menu) for the chosen row.

## MUST / NEVER

Shared rules: [shared-must-never.md](../../references/shared-must-never.md). Router-specific:

| Rule | Because |
|------|---------|
| MUST show the menu from references/menu-text.md in the user's language | Same numbers and option names at every entry point; user-communication.md |
| MUST state the workflow it routes to before loading it | The user can correct a wrong route before any work starts |
| MUST NOT start a workflow without user picking 1–14 or naming one | Avoid wrong scope |
| MUST NOT post to Jira or create issues from this router | Side effects belong in child workflows |

## Must-read files

The router reads only what it needs to pick and hand off a workflow. Every gate a workflow runs (evidence, escape prevention, result quality, priority, defect write-up, Playwright, Jira posting, closing) is loaded by that workflow at the step that uses it — never by the router. See also [skill-reference-index.md](../../references/skill-reference-index.md) — optional lookup list of every shared reference; a step names the file to use.

**Router reads** (open each at the step named):
- Read [agent-rationalizations.md](../../references/agent-rationalizations.md) when tempted to skip a step; each excuse has its correct action.
- Read [helix-session-constraints.md](../../references/helix-session-constraints.md) once at session start.
- Read [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) at Opening step 3, before showing the menu.
- Read [session-closing.md](../../references/session-closing.md) at session end.
- Read [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) before invoking or switching skills.
- Read [skill-routing.md](../../references/skill-routing.md) when choosing which skill handles a request.
- Read [skill-rules-style.md](../../references/skill-rules-style.md) for refusal wording only; its multi-item Missing list never overrides the one-item rule in Opening.

**Not opened by the router** — the routed workflow reads each at the step named; listed only because the shared rules above MUST-link them (skill-lint must-read-depth):
- Read [jira-comment-post-review.md](../../references/jira-comment-post-review.md) after posting a Jira comment, before saying done.
- Read [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) before posting a Jira table with multi-line cells.
- Read [long-workflow-todos.md](../../references/long-workflow-todos.md) when the workflow has many steps; keep the todo list.
- Read [qa-debug-discipline.md](../../references/qa-debug-discipline.md) when a test is flaky or a tool errors.
- Read [qa-evidence-gates.md](../../references/qa-evidence-gates.md) when the workflow reaches a completion claim.
- Read [root-cause-investigation.md](../../references/root-cause-investigation.md) before naming a cause for any failure.
- Read [round-time-contract.md](../../references/round-time-contract.md) when a round starts and before reporting times.
- Read [verify-closing-checklist.md](../../references/verify-closing-checklist.md) before reporting a verify or retest done.
