# GitHub Copilot — Helix tool mapping

Helix skills are **markdown procedures**. Copilot does not have Claude’s **Skill** tool — **load the matching `SKILL.md`** into context and follow it step by step.

| Helix skill | Copilot action |
|-------------|----------------|
| `helix` | Read `skills/helix/SKILL.md` + `commands/helix.md` |
| Workflows | Read `skills/{name}/SKILL.md` (stub loads `skills/deprecated/{name}/WORKFLOW.md`) or `commands/{name}.md` |
| Jira | Use Copilot **Atlassian** or **Jira** integration if configured; else user pastes ticket |
| Playwright | Run terminal commands from `testing-ticket-workflow`; user workspace owns config |
| Evidence | Apply [qa-evidence-gates.md](qa-evidence-gates.md) manually |

After install, expect **6 skills** under `~/.copilot/skills/` or project `.github/skills/`: `helix` + five `*-workflow` stubs.

**Announce:** `Using **{skill-name}** to {purpose}.` (same discipline as [skill-invocation-discipline.md](skill-invocation-discipline.md))

**Do not** invent Copilot-specific shortcuts that skip approval gates.
