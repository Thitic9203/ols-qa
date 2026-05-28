# How to start Helix on your agent

After [install](../README.md#install-one-time), use the path that matches your tool.

## Claude Code

```text
/helix
```

Or: `/tc-fe-prep`, `/tc-api-prep`, `/retest-bug`, `/testing-ticket`, `/create-bug`

## Cursor

```text
Use the helix skill and show the QA menu, then route to the workflow I choose.
```

Or invoke a workflow directly: `tc-fe-prep-workflow`, `tc-api-prep-workflow`, etc.

## GitHub Copilot (VS Code)

Ensure skills are linked (`~/.copilot/skills/` or project `.github/skills/`).

```text
Follow the helix skill: show the English QA menu from Helix, wait for my choice, then run the matching workflow skill.
```

Tool mapping: [copilot-tools.md](copilot-tools.md).

## Windsurf Cascade

```text
@helix
```

Or: “Use skill helix and show the menu.”

## Gemini CLI

```text
/skills list
```

Then ask to use skill `helix`, or name a workflow skill (e.g. `tc-fe-prep-workflow`).

## Cline

Enable skills in settings; skills under `~/.cline/skills/` or `.cline/skills/`.

```text
Use the helix skill — show the Helix QA menu in English and wait for my workflow choice.
```

## Codex CLI

Skills under `~/.codex/skills/`. Ask the agent to load `helix` or a specific `*-workflow` skill.

Tool mapping: [codex-tools.md](codex-tools.md).

## Any agent with `AGENTS.md`

Open [AGENTS.md](../AGENTS.md) in the Helix repo (or add a line in your project’s `AGENTS.md` pointing to it), then ask the agent to follow Helix routing.

## Direct workflow (skip menu)

| Goal | Skill folder name |
|------|-------------------|
| FE manual TC from story | `tc-fe-prep-workflow` |
| API manual TC | `tc-api-prep-workflow` |
| Retest bug | `retest-bug-workflow` |
| Playwright one ticket | `testing-ticket-workflow` |
| File bugs | `create-bug-workflow` |
