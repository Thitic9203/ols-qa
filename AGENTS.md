# AGENTS.md

Minimal entry for any coding agent (Cursor, Copilot, Gemini CLI, Windsurf, Cline, Codex, …).

## Instruction priority

1. **User** — explicit chat instructions and the project’s `AGENTS.md` / `CLAUDE.md`  
2. **Helix** — workflow skill files and `references/` gates  
3. **Default agent behavior** — lowest  

When a Helix workflow might apply, **load and follow that skill**; announce once: `Using **{skill-name}** to {purpose}.` Details: [references/skill-invocation-discipline.md](references/skill-invocation-discipline.md).

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
| [tc-fe-prep-workflow](skills/procedures/tc-fe-prep-workflow/WORKFLOW.md) | FE manual TC from a Jira **story** |
| [tc-api-prep-workflow](skills/procedures/tc-api-prep-workflow/WORKFLOW.md) | API manual TC from spec + **Swagger** |
| [retest-bug-workflow](skills/procedures/retest-bug-workflow/WORKFLOW.md) | Retest a **bug** fix |
| [testing-ticket-workflow](skills/procedures/testing-ticket-workflow/WORKFLOW.md) | Playwright test for a ticket |
| [create-bug-workflow](skills/procedures/create-bug-workflow/WORKFLOW.md) | Open bug(s) on Jira/GitHub |

## Rules

- [references/user-communication.md](references/user-communication.md) — English only in chat and widgets.
- Work on the **issue key the user specifies**.
- **Do not post to Jira** until the user approves drafts (unless waived).
- Load project config from the user’s workspace `references/*-guide.md` when present.

## Retest skill source of truth

- Changes to `retest-bug-workflow` land in **ols-qa first**. Its renderer and the template test (`tools/retest-guard/`) exist only in ols-qa.
- On commit, ols-qa's post-commit hook (`scripts/hooks/post-commit` → `scripts/sync-skills-to-helix.sh`) copies the shared skill, reference and command files to helix. A push to helix main then releases automatically, and teammates receive the change at their next session start.
- If a retest fix has to land in helix first, backport it to ols-qa the same day. Otherwise the next sync overwrites it.

## More

Install and version: [README.md](README.md)
