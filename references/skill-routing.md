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
| Unsure / multi-step | `helix` skill or `/helix` (Claude Code) | `/helix` or `@helix` |

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
| `retest-bug-workflow` | Draft new TC tables or file new bugs |
