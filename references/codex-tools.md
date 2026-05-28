# OpenAI Codex — Helix tool mapping

Treat Helix like any **AGENTS.md**-driven repo: read skills from disk, execute shell steps the user approves.

| Need | Codex approach |
|------|----------------|
| Router | Read `skills/helix/SKILL.md` or `AGENTS.md` |
| Workflow | Read full `skills/{workflow}/SKILL.md` + linked `references/` |
| Jira | MCP or API if user configured; else draft in chat |
| Playwright | `npx playwright test` per user project — never assume Credit-Port paths |
| Long tasks | Split phases; optional todos per [long-workflow-todos.md](long-workflow-todos.md) |

**Priority:** user message > Helix `SKILL.md` > default Codex behavior.

**Evidence:** [qa-evidence-gates.md](qa-evidence-gates.md) before claiming pass/post.
