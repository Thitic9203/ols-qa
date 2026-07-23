# OpenAI Codex — Helix tool mapping

Treat Helix like any **AGENTS.md**-driven repo: read skills from disk, execute shell steps the user approves.

| Need | Codex approach |
|------|----------------|
| Router | Read `skills/helix/SKILL.md` or `AGENTS.md` |
| Workflow | Read `skills/{name}/SKILL.md` (stub → `skills/deprecated/{name}/WORKFLOW.md`) or `commands/{workflow}.md` |
| Jira | MCP or API if user configured; else draft in chat |
| Playwright | `npx playwright test` per user project — never assume project-specific paths |
| Long tasks | Split phases; optional todos per [long-workflow-todos.md](long-workflow-todos.md) |

After install, `~/.codex/skills/` should contain **helix + 5 workflow stubs**.

**Priority:** user message > Helix `SKILL.md` > default Codex behavior.

**Evidence:** [qa-evidence-gates.md](qa-evidence-gates.md) before claiming pass/post.
