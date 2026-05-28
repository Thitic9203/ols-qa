# AGENTS.md

Minimal entry for any coding agent (Cursor, Copilot, Gemini CLI, Windsurf, Cline, Codex, …). Full matrix: [docs/supported-agents.md](docs/supported-agents.md).

## Router

Prefer loading skill **[helix](skills/helix/SKILL.md)** when the user says Helix or needs the menu.

Otherwise:

1. Introduce yourself as **Helix**, a QA assistant.
2. Show the **exact opening and menu** from [commands/helix.md](commands/helix.md) (English only), including the scope disclaimer.
3. Route to the skill for the user’s choice.

Platform-specific prompts: [references/agent-entry.md](references/agent-entry.md).

Do **not** paraphrase the menu in another language.

## Skills

Full routing and handoffs: [references/skill-routing.md](references/skill-routing.md).

| Skill | When |
|-------|------|
| [helix](skills/helix/SKILL.md) | Menu / routing (no `/helix` slash command) |
| [tc-fe-prep-workflow](skills/tc-fe-prep-workflow/SKILL.md) | FE manual TC from a Jira **story** |
| [tc-api-prep-workflow](skills/tc-api-prep-workflow/SKILL.md) | API manual TC from spec + **Swagger** |
| [retest-bug-workflow](skills/retest-bug-workflow/SKILL.md) | Retest a **bug** fix |
| [testing-ticket-workflow](skills/testing-ticket-workflow/SKILL.md) | Playwright test for a ticket |
| [create-bug-workflow](skills/create-bug-workflow/SKILL.md) | Open bug(s) on Jira/GitHub |

## Rules

- [references/user-communication.md](references/user-communication.md) — English only in chat and widgets.
- Work on the **issue key the user specifies**.
- **Do not post to Jira** until the user approves drafts (unless waived).
- Load project config from the user’s workspace `references/*-guide.md` when present.

## More

Install and version: [README.md](README.md) · Contributor: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
