# Helix Wiki

> **Canonical docs:** [README](https://github.com/Thitic9203/helix/blob/main/README.md) on `main`. Update this wiki when README changes.

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

| Agent | Global folder after install |
|-------|-----------------------------|
| Claude Code | `~/.claude/skills/` |
| Cursor | `~/.cursor/skills/` |
| Codex | `~/.codex/skills/` |
| GitHub Copilot | `~/.copilot/skills/` |
| Gemini CLI | `~/.gemini/skills/` |
| Windsurf | `~/.codeium/windsurf/skills/` |
| Cline | `~/.cline/skills/` |
| OpenCode | `~/.config/opencode/skills/` |
| Pi | `~/.pi/agent/skills/` |
| Cross-agent | `~/.agents/skills/` |

---

## Install (one-time)

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

| Agent | What to do after install |
|-------|---------------------------|
| Claude Code | `/helix` |
| Cursor / Windsurf | `@helix` |
| Copilot / Cline / Gemini / Codex | Use skill **helix** — [agent-entry.md](https://github.com/Thitic9203/helix/blob/main/references/agent-entry.md) |

**Team repo (optional):**

```bash
HELIX_LINK_WORKSPACE=$PWD ~/.helix/tc-fe-prep/scripts/link-skills.sh
```

---

## Usage

| Goal | Claude Code | Other agents |
|------|-------------|--------------|
| Open menu | `/helix` | skill **helix** |
| FE test cases | `/tc-fe-prep` | `tc-fe-prep-workflow` |
| API test cases | `/tc-api-prep` | `tc-api-prep-workflow` |
| Retest bug | `/retest-bug` | `retest-bug-workflow` |
| Test ticket | `/testing-ticket` | `testing-ticket-workflow` |
| Create bug | `/create-bug` | `create-bug-workflow` |

Menu text: [commands/helix.md](https://github.com/Thitic9203/helix/blob/main/commands/helix.md) · Router skill: [skills/helix/SKILL.md](https://github.com/Thitic9203/helix/blob/main/skills/helix/SKILL.md)

---

## Update

```bash
cd ~/.helix/tc-fe-prep && git pull
```

Symlinks pick up changes automatically. Re-run [link-skills.sh](https://github.com/Thitic9203/helix/blob/main/scripts/link-skills.sh) only if you deleted skill folders or added a new Helix skill and use workspace `.github/skills/`.

---

## Workflow docs

| Workflow | SKILL.md |
|----------|----------|
| Router | [helix](https://github.com/Thitic9203/helix/blob/main/skills/helix/SKILL.md) |
| TC FE | [tc-fe-prep-workflow](https://github.com/Thitic9203/helix/blob/main/skills/tc-fe-prep-workflow/SKILL.md) |
| TC API | [tc-api-prep-workflow](https://github.com/Thitic9203/helix/blob/main/skills/tc-api-prep-workflow/SKILL.md) |
| Retest | [retest-bug-workflow](https://github.com/Thitic9203/helix/blob/main/skills/retest-bug-workflow/SKILL.md) |
| Testing ticket | [testing-ticket-workflow](https://github.com/Thitic9203/helix/blob/main/skills/testing-ticket-workflow/SKILL.md) |
| Create bug | [create-bug-workflow](https://github.com/Thitic9203/helix/blob/main/skills/create-bug-workflow/SKILL.md) |

---

## More links

- [Documentation map](https://github.com/Thitic9203/helix/blob/main/docs/DOC-MAP.md)
- [Contributing / versioning](https://github.com/Thitic9203/helix/blob/main/docs/CONTRIBUTING.md)
- [Domain glossary (CONTEXT)](https://github.com/Thitic9203/helix/blob/main/CONTEXT.md)
- [AGENTS.md](https://github.com/Thitic9203/helix/blob/main/AGENTS.md) — entry for generic agents
