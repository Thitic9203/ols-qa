# Supported AI agents

Helix is a **portable skill pack** ([Agent Skills](https://agentskills.io) / `SKILL.md`). It does not depend on one vendor’s API.

## Install

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

Optional — also link skills into the **current project** (for Copilot, team repos, Windsurf workspace skills):

```bash
cd /path/to/your/project
HELIX_LINK_WORKSPACE=$PWD bash ~/.helix/tc-fe-prep/scripts/link-skills.sh
```

## Global skill directories (auto-linked by `link-skills.sh`)

| Agent / IDE | Global path | Menu entry |
|-------------|-------------|------------|
| **Claude Code** | `~/.claude/skills/` | `/helix` + plugin; or skill `helix` |
| **Cursor** | `~/.cursor/skills/` | `@helix` or ask to run `helix` skill |
| **OpenAI Codex** | `~/.codex/skills/` | Skill discovery per Codex CLI |
| **GitHub Copilot** (VS Code) | `~/.copilot/skills/` | Agent picks skill from description |
| **Gemini CLI** | `~/.gemini/skills/` | `/skills list` · skill `helix` |
| **Windsurf Cascade** | `~/.codeium/windsurf/skills/` | `@helix` |
| **Cline** | `~/.cline/skills/` | Skill list in Cline UI |
| **OpenCode** | `~/.config/opencode/skills/` | Per OpenCode docs |
| **Pi** | `~/.pi/agent/skills/` | Per Pi coding agent |
| **Cross-agent alias** | `~/.agents/skills/` | Shared by Gemini, Windsurf, Copilot, others |

Only directories that exist on your machine are linked (installer skips missing parents).

## Project / team directories (`HELIX_LINK_WORKSPACE=1`)

| Location | Typical agent |
|----------|----------------|
| `.github/skills/` | GitHub Copilot (recommended for teams) |
| `.agents/skills/` | Copilot, Gemini, Windsurf (interop alias) |
| `.windsurf/skills/` | Windsurf Cascade |
| `.cline/skills/` | Cline |
| `.gemini/skills/` | Gemini CLI workspace tier |

Commit `.github/skills/` (symlinks) if your team uses Copilot in the same repo.

## Slash commands vs skills

| Platform | Helix menu | Workflows |
|----------|------------|-----------|
| Claude Code | `/helix`, `/tc-fe-prep`, … in `commands/` | Same + skills |
| Others | No native `/helix` | Invoke skill **`helix`** or workflow skill by name |

See [references/agent-entry.md](../references/agent-entry.md) for copy-paste prompts per platform.

## Capabilities (all agents)

Helix skills assume the agent can:

- Read files in the **user’s workspace**
- Use browser and/or Jira MCP or REST when the user has access
- Run Playwright in the user’s project (`testing-ticket-workflow`)

If a tool is missing, the skill stops and reports — it does not require a specific LLM.

## Not supported as first-class (manual fallback)

Web-only chat without skill folders, or agents that cannot read `SKILL.md`, need a copy-paste prompt from [agent-entry.md](../references/agent-entry.md). No vendor-specific API keys are stored in Helix.
