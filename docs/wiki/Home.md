# Helix Wiki

> **Canonical docs:** [README](https://github.com/Thitic9203/helix/blob/main/README.md) on `main`. **Keep this wiki in sync** when install/update/plugin behaviour changes.

**Version:** [VERSION](https://github.com/Thitic9203/helix/blob/main/VERSION) · **Releases:** [releases](https://github.com/Thitic9203/helix/releases)

---

## What is Helix?

Portable **QA skill pack** for AI coding agents ([Agent Skills](https://agentskills.io) / `SKILL.md`):

- **TC FE prep** — manual test cases from Jira story AC/EC (coverage + ISTQB/29119-3–aligned quality review)
- **TC API prep** — manual test cases from API spec + Swagger (spec coverage + quality review)
- **Testing ticket** — Playwright on one Jira ticket
- **Retest bug** — verify fix, post evidence, transition
- **Create bug** — file issues on Jira or GitHub

**Not tied to one vendor** — same skills in Claude Code, Cursor, Copilot, Gemini CLI, Windsurf, Cline, Codex, and more.

Full agent list: [supported-agents.md](https://github.com/Thitic9203/helix/blob/main/docs/supported-agents.md)

---

## Supported AI agents (summary)

| Agent | Global folder after install | Start Helix |
|-------|-----------------------------|-------------|
| Claude Code | `~/.claude/skills/` + plugin **`helix@helix`** | `/helix` or `/tc-fe-prep`, … |
| Cursor | `~/.cursor/skills/` | `@helix` or skill **helix** |
| Codex | `~/.codex/skills/` | skill **helix** |
| GitHub Copilot | `~/.copilot/skills/` | skill **helix** in chat |
| Gemini CLI | `~/.gemini/skills/` | `/skills list` → **helix** |
| Windsurf | `~/.codeium/windsurf/skills/` | `@helix` |
| Cline | `~/.cline/skills/` | skill **helix** |
| OpenCode | `~/.config/opencode/skills/` | per tool docs |
| Pi | `~/.pi/agent/skills/` | per tool docs |
| Cross-agent | `~/.agents/skills/` | shared alias |

Prompts: [agent-entry.md](https://github.com/Thitic9203/helix/blob/main/references/agent-entry.md)

---

## Install (one-time)

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

**Installer does:**

- Clone/update `~/.helix/tc-fe-prep`
- Symlink all workflow skills into global agent folders
- Enable Claude marketplace plugin **`helix@helix`** (disable legacy **`helix@local`**)
- Register **SessionStart** hooks (bootstrap + **auto-update**)

| Agent | After install |
|-------|----------------|
| Claude Code | New session → `/helix` |
| Cursor | **Reload Window** → `@helix` |
| Copilot / Cline / Gemini / Codex | skill **helix** |

**Health check:**

```bash
bash ~/.helix/tc-fe-prep/scripts/helix-doctor.sh
HELIX_DOCTOR_FIX=1 bash ~/.helix/tc-fe-prep/scripts/helix-doctor.sh   # repair symlinks + plugin
```

**Team repo (optional):**

```bash
HELIX_LINK_WORKSPACE=$PWD ~/.helix/tc-fe-prep/scripts/link-skills.sh
```

Commit `.github/skills/` if the team uses Copilot in the same repository.

---

## Usage

**You do not have to start with `/helix`.** Call a workflow directly when you know the goal; use `/helix` or skill **helix** only for the menu.

| Goal | Claude Code | Other agents |
|------|-------------|--------------|
| FE test cases | `/tc-fe-prep` | `tc-fe-prep-workflow` |
| API test cases | `/tc-api-prep` | `tc-api-prep-workflow` |
| Retest bug | `/retest-bug` | `retest-bug-workflow` |
| Test ticket | `/testing-ticket` | `testing-ticket-workflow` |
| Create bug | `/create-bug` | `create-bug-workflow` |
| Menu (optional) | `/helix` | skill **helix** |

Menu: [commands/helix.md](https://github.com/Thitic9203/helix/blob/main/commands/helix.md) · Routing: [skill-routing.md](https://github.com/Thitic9203/helix/blob/main/references/skill-routing.md)

---

## Update — auto-update (default)

**You usually do not need to run `git pull`.** After install, Helix checks GitHub `main` for a newer [VERSION](https://github.com/Thitic9203/helix/blob/main/VERSION) when you start a new session (at most every **4 hours** per machine).

| Trigger | Action |
|---------|--------|
| New Claude Code / Cursor session | [helix-auto-update.sh](https://github.com/Thitic9203/helix/blob/main/scripts/helix-auto-update.sh) |
| `git pull` in `~/.helix/tc-fe-prep` | post-merge hook → sync plugin + symlinks |

**When an update is found:**

1. `git pull` in `~/.helix/tc-fe-prep`
2. Refresh skill symlinks (`link-skills.sh`)
3. `claude plugin update helix@helix` (Claude Code)

| Setting | Meaning |
|---------|---------|
| `HELIX_AUTO_UPDATE=0` | Turn off auto-update |
| `HELIX_FORCE_UPDATE=1` | Run check immediately |
| `HELIX_AUTO_UPDATE_INTERVAL_SEC` | Min seconds between checks (default `14400`) |
| `HELIX_AUTO_UPDATE_VERBOSE=1` | Print to terminal |
| Log | `~/.helix/auto-update.log` |

**Manual fallback:**

```bash
HELIX_FORCE_UPDATE=1 bash ~/.helix/tc-fe-prep/scripts/helix-auto-update.sh
# or
cd ~/.helix/tc-fe-prep && git pull
bash ~/.helix/tc-fe-prep/scripts/claude-plugin-sync.sh
```

**Claude plugin:** use **`helix@helix` only** — not `helix@local` (legacy, auto-disabled).

**After update:** Cursor → Reload Window; Claude Code → new session if `/helix` still looks old.

Full detail: [README — Update](https://github.com/Thitic9203/helix/blob/main/README.md#update-when-a-new-version-ships)

---

## Workflow docs

| Workflow | Source |
|----------|----------|
| Router | [helix](https://github.com/Thitic9203/helix/blob/main/skills/helix/SKILL.md) |
| TC FE | [tc-fe-prep-workflow](https://github.com/Thitic9203/helix/blob/main/skills/deprecated/tc-fe-prep-workflow/WORKFLOW.md) |
| TC API | [tc-api-prep-workflow](https://github.com/Thitic9203/helix/blob/main/skills/deprecated/tc-api-prep-workflow/WORKFLOW.md) |
| Retest | [retest-bug-workflow](https://github.com/Thitic9203/helix/blob/main/skills/deprecated/retest-bug-workflow/WORKFLOW.md) |
| Testing ticket | [testing-ticket-workflow](https://github.com/Thitic9203/helix/blob/main/skills/deprecated/testing-ticket-workflow/WORKFLOW.md) |
| Create bug | [create-bug-workflow](https://github.com/Thitic9203/helix/blob/main/skills/deprecated/create-bug-workflow/WORKFLOW.md) |

---

## Maintainer scripts

| Script | Role |
|--------|------|
| [install.sh](https://github.com/Thitic9203/helix/blob/main/scripts/install.sh) | Full setup |
| [helix-auto-update.sh](https://github.com/Thitic9203/helix/blob/main/scripts/helix-auto-update.sh) | Session / manual version sync |
| [claude-plugin-sync.sh](https://github.com/Thitic9203/helix/blob/main/scripts/claude-plugin-sync.sh) | `helix@helix` marketplace sync |
| [helix-doctor.sh](https://github.com/Thitic9203/helix/blob/main/scripts/helix-doctor.sh) | Verify install |
| [link-skills.sh](https://github.com/Thitic9203/helix/blob/main/scripts/link-skills.sh) | Refresh symlinks |
| [helix-regression-check.sh](https://github.com/Thitic9203/helix/blob/main/scripts/helix-regression-check.sh) | Contributor: pre-merge regression gate (`/helix-check`) |
| [helix-setup-devenv.sh](https://github.com/Thitic9203/helix/blob/main/scripts/helix-setup-devenv.sh) | Contributor opt-in: fewer agent questions ([CONTRIBUTING](https://github.com/Thitic9203/helix/blob/main/docs/CONTRIBUTING.md#dev-environment--fewer-agent-questions-two-layers)) |

---

## More links

- [Documentation map](https://github.com/Thitic9203/helix/blob/main/docs/DOC-MAP.md)
- [Contributing / versioning](https://github.com/Thitic9203/helix/blob/main/docs/CONTRIBUTING.md)
- [Domain glossary (CONTEXT)](https://github.com/Thitic9203/helix/blob/main/CONTEXT.md)
- [AGENTS.md](https://github.com/Thitic9203/helix/blob/main/AGENTS.md) — entry for generic agents
