# Helix skill routing

The single routing source for the [helix router](../skills/helix/SKILL.md), [commands/helix.md](../commands/helix.md), and [AGENTS.md](../AGENTS.md). Do not duplicate this table elsewhere — link here. Menu wording lives in [menu-text.md](menu-text.md); Thai and informal phrasings map through [intent-shortcuts.md](intent-shortcuts.md).

## Primary menu

`#` is the number the user replies with; **Option** is the bold name in [menu-text.md](menu-text.md) for the same number. Rows 8–11 are not shipped in helix: outside the ols-qa workspace, say so and offer only the fallback named on that row.

| # | Option | Route to | Command | User intent · what to pass on |
|---|--------|----------|---------|-------------------------------|
| 1 | TC FE Preparation | [`tc-fe-prep-workflow`](../skills/tc-fe-prep-workflow/SKILL.md) | `/tc-fe-prep` | FE manual TC from story AC/EC. Pass any issue key/URL from the message. |
| 2 | TC API Preparation | [`tc-api-prep-workflow`](../skills/tc-api-prep-workflow/SKILL.md) | `/tc-api-prep` | API manual TC from spec + Swagger. Run its Phase A–C intake if spec, Swagger, or delivery is missing. |
| 3 | Retest Bug | [`retest-bug-workflow`](../skills/retest-bug-workflow/SKILL.md) | `/retest-bug` | Retest a bug after a dev fix. Pass any bug key/URL from the message. |
| 4 | Testing Ticket | [`testing-ticket-workflow`](../skills/testing-ticket-workflow/SKILL.md) | `/testing-ticket` | Playwright test for one ticket. Pass any issue key/URL; its Phase A intake collects missing fields. |
| 5 | Create Bug | [`create-bug-workflow`](../skills/create-bug-workflow/SKILL.md) | `/create-bug` | File bug(s) on Jira/GitHub. Reuse bug evidence from the same chat if present. |
| 6 | Catch AI | [`catch-ai-workflow`](../skills/catch-ai-workflow/SKILL.md) | `/catch-ai` | Audit finished work against its governing sources. Pass the audit target from the message. |
| 7 | TC Review | [`tc-review-workflow`](../skills/tc-review-workflow/SKILL.md) | `/tc-review` | Review an existing TC document against a ticket's AC/EC. Pass the TC document and the ticket key/URL. |
| 8 | Content Takedown | `content-takedown-workflow` (ols-qa workspace only) | `/content-takedown` | Hide a set of published content from public view. Fallback outside ols-qa: none — no shipped workflow hides content; ask what the user needs. |
| 9 | Review Result | `review-result-workflow` (ols-qa workspace only) | `/review-result` | Review already-recorded results and their evidence clips. Fallback outside ols-qa: offer 6 (`catch-ai-workflow`), which audits finished work. |
| 10 | Smoke Test | `smoke-test-workflow` (ols-qa workspace only) | `/smoke-test` | Smoke test a deployed build on a named environment. Fallback outside ols-qa: offer 4 (`testing-ticket-workflow`), which tests one ticket, not a whole build. |
| 11 | Test Data Prep | `test-data-prep-workflow` (ols-qa workspace only) | `/test-data-prep` | Create, fix, or verify test data (content, covers, accounts). Fallback outside ols-qa: none — ask what the user needs. |
| 12 | Other | — | — | Ask one clarifying question in the user's language, then route by this table or [intent-shortcuts.md](intent-shortcuts.md); if nothing fits, say so. |

Unsure / multi-step: the `helix` skill or `/helix` (Claude Code), `@helix` elsewhere.

## Jira issue type → skill (unattended and bot runs)

When a runner tests a ticket without a human picking the workflow, the ticket's Jira issue type picks the skill. Owner-confirmed mapping:

| Issue type | Skill |
|------------|-------|
| Story | `testing-ticket-workflow` |
| Bug | `retest-bug-workflow` |

Other issue types (Task, Epic, Sub-task) have no confirmed mapping yet: a runner keeps its current routing, records which skill it used, and never invents a mapping. The two skill files must stay at `skills/procedures/testing-ticket-workflow/WORKFLOW.md` and `skills/procedures/retest-bug-workflow/WORKFLOW.md`; in the ols-qa source repo, `tools/skill-routing-guard/skill_routing_map.test.js` fails the suite if either moves or this table changes (the guard is not shipped in helix).

## Proactive suggestion (suggest-only)

From context (branch, linked ticket, defects in chat) the router MAY **suggest** one workflow instead of showing the full menu — rules in [proactive-qa-triggers.md](proactive-qa-triggers.md). Suggestion only, never auto-run (Rule #5); honor `HELIX_PROACTIVE=0`.

## Handoffs (after a workflow ends)

| User says next | Route to |
|----------------|----------|
| File / log / open a bug | `create-bug-workflow` |
| Retest after fix | `retest-bug-workflow` |
| Write FE TC table | `tc-fe-prep-workflow` |
| Write API TC table | `tc-api-prep-workflow` |
| Run Playwright on a ticket | `testing-ticket-workflow` |
| Update test results sheet/Jira (already tested) | `testing-ticket-workflow` Phase G only if same session; otherwise new `/testing-ticket` |

## Do not cross-use

| From skill | Do not |
|------------|--------|
| `testing-ticket-workflow` | Open bugs (→ create-bug) |
| `create-bug-workflow` | Run full Playwright pass (→ testing-ticket) |
| `tc-fe-prep-workflow` | API-only Swagger TC (→ tc-api-prep) |
| `tc-api-prep-workflow` | Story AC/EC FE table (→ tc-fe-prep) |
| `tc-review-workflow` | Design or edit test cases, run them, or decide the product's pass/fail verdict |
| `retest-bug-workflow` | Draft new TC tables or file new bugs |
| `content-takedown-workflow` | Delete content permanently, rename items, or hide an item whose defect has not been surfaced first |
| `review-result-workflow` | Run the tests being reviewed, retest a ticket after a dev fix, or rename an evidence file |
| `catch-ai-workflow` | File the bug it confirms (→ create-bug), retest a ticket after a dev fix (→ retest-bug), or rewrite the audited work |
| `smoke-test-workflow` | Test a single ticket (→ testing-ticket), retest after a fix (→ retest-bug), or run a full regression |
| `test-data-prep-workflow` | Run tests on a ticket (→ testing-ticket), retest a bug (→ retest-bug), or draft TC tables (→ tc-fe-prep / tc-api-prep) |
