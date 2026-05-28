# Helix skill invocation discipline

Helix workflows are **skills** (`SKILL.md`), not informal chat habits. This document adapts proven agent-discipline patterns for QA — it is not a separate product name; the router skill remains **`helix`**.

## Instruction priority

1. **User explicit instructions** (AGENTS.md, CLAUDE.md, direct chat) — highest  
2. **Helix workflow skills** — override default agent behavior for QA tasks  
3. **Default system behavior** — lowest  

If the user says “skip Jira post,” that overrides a skill’s default gate.

## When to invoke a skill

If there is even a **small chance** a Helix workflow applies (TC prep, retest, Playwright ticket, create bug, or menu via **`helix`**):

1. **Load the workflow** — Claude Code: use the slash-command (`/retest-bug`, etc.) or invoke the **`helix`** skill and let it route. Each command reads and follows the matching workflow SKILL.md.  
2. **Announce once:** `Using **{workflow}** to {purpose}.`  
3. Follow the workflow’s gates and references.

| Situation | Command |
|-----------|---------|
| Unsure which QA task | `/helix` |
| FE manual TC | `/tc-fe-prep` |
| API manual TC | `/tc-api-prep` |
| Retest bug | `/retest-bug` |
| Playwright ticket | `/testing-ticket` |
| File bugs | `/create-bug` |

## Red flags

If tempted to skip a workflow skill (“I can draft TC without it”, “quick retest”), stop and invoke — review gates are mandatory. More: [agent-rationalizations.md](agent-rationalizations.md).

## Long workflows and todos

When a skill lists **5+ mandatory checklist items** or multi-phase gates, create todos per major phase ([long-workflow-todos.md](long-workflow-todos.md)) if the platform supports it — so the user sees progress.

## Subagents and parallel work

Use only when the skill or [subagent-qa-patterns.md](subagent-qa-patterns.md) / [parallel-prep.md](parallel-prep.md) says so — not by default.
