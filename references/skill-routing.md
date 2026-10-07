# Helix skill routing

Canonical map for `/helix`, [commands/helix.md](../commands/helix.md), and [AGENTS.md](../AGENTS.md). Do not duplicate this table elsewhere — link here.

## Primary menu

| User intent | Skill | Command |
|-------------|-------|---------|
| FE manual TC from story AC/EC | `tc-fe-prep-workflow` | `/tc-fe-prep` |
| API manual TC from spec + Swagger | `tc-api-prep-workflow` | `/tc-api-prep` |
| Retest a bug after dev fix | `retest-bug-workflow` | `/retest-bug` |
| Playwright test for one ticket | `testing-ticket-workflow` | `/testing-ticket` |
| File bug(s) on Jira/GitHub | `create-bug-workflow` | `/create-bug` |
| Hide a set of published content from public view | `content-takedown-workflow` | `/content-takedown` |
| Review an existing TC document against a ticket's AC/EC | `tc-review-workflow` | `/tc-review` |
| Review already-recorded results and their evidence clips | `review-result-workflow` | `/review-result` |
| Audit finished work against its governing sources | `catch-ai-workflow` | `/catch-ai` |
| Unsure / multi-step | `helix` skill or `/helix` (Claude Code) | `/helix` or `@helix` |

## Jira issue type → skill (unattended and bot runs)

When a runner tests a ticket without a human picking the workflow, the ticket's Jira issue type picks the skill. Owner-confirmed mapping:

| Issue type | Skill |
|------------|-------|
| Story | `testing-ticket-workflow` |
| Bug | `retest-bug-workflow` |

Other issue types (Task, Epic, Sub-task) have no confirmed mapping yet: a runner keeps its current routing, records which skill it used, and never invents a mapping. The two skill files must stay at `skills/deprecated/testing-ticket-workflow/WORKFLOW.md` and `skills/deprecated/retest-bug-workflow/WORKFLOW.md`; `tools/skill-routing-guard/skill_routing_map.test.js` fails the suite if either moves or this table changes.

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
