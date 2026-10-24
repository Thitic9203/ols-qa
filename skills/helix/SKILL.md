---
name: helix
description: |
  Helix QA assistant menu — routes to TC FE prep, TC API prep, retest bug, testing ticket, create bug, content takedown, TC review, review result, catch-ai, smoke test, or test data prep.
  Use when the user says Helix, /helix, QA assistant menu, or is unsure which QA workflow to run.
  Do NOT use for a request that already names a specific workflow — that goes straight to the matching command (/tc-fe-prep, /tc-api-prep, /retest-bug, /testing-ticket, /create-bug, /content-takedown, /tc-review, /review-result, /catch-ai, /smoke-test, /test-data-prep) directly.
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

- [Opening](#opening-always-unless-the-user-already-chose-a-mode) · [Discipline](#discipline) · [Refusal-first](#refusal-first-precondition-gate)
- [Proactive suggestion](#proactive-suggestion-suggest-only-opt-out) · [Routing](#routing) · [QA closing](#qa-closing-mandatory-before-done) · [MUST / NEVER](#must--never)
- [Must-read files](#must-read-files) · [Dependencies](#dependencies)

## Opening (always, unless the user already chose a mode)

Respond in **the user's language** (see [user-communication.md](../../references/user-communication.md)) — menus, questions, and replies follow the language the user writes in; keep technical terms, file names, and ticket keys as written. Be concise.

Show the menu from [menu-text.md](../../references/menu-text.md) (Opening block, in the user's language as that file says).

🔴 STOP — wait for the user's choice before starting a workflow.

If the user's message already names a workflow (Thai, informal, or mixed input included), map it via [intent-shortcuts.md](../../references/intent-shortcuts.md), extract any issue key or URL from the same message, and **skip this menu**. If the user invoked `/helix {ISSUE_KEY}` with no mode, infer only when obvious (e.g. "API test cases from Swagger" → 2); otherwise ask which option applies.

## Discipline

Follow [shared-preamble.md](../../references/shared-preamble.md).

## Refusal-first (precondition gate)

This skill only routes — it does not run tests or post to Jira. When the goal is already clear, the menu is skipped (see Opening) because an extra menu round wastes time.

## Proactive suggestion (suggest-only, opt-out)

When the session context already hints at a workflow (git branch, linked Jira ticket, defects mentioned in chat), you MAY offer **one** suggestion instead of the full menu — following [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md).

- **Suggest only — never auto-run** a workflow (Rule #5).
- Respect `HELIX_PROACTIVE=0` — if set, skip suggestions and show the normal menu.
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

Run the check for each of these before routing — check commands and install hints are in [dependencies.md](../../references/dependencies.md):

- Atlassian MCP (ticket lookup while routing) — optional; without it, ask the user to paste the ticket text (see Routing)
- each routed skill lists its own dependencies in its `## Dependencies` section
- `superpowers:systematic-debugging`
