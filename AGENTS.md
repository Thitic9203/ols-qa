# AGENTS.md

Entry point for AI coding agents (Cursor, Codex, Copilot, Claude, etc.).

## Primary skill

When the user wants to **prepare frontend manual test cases** from a Jira story, **draft a TC table comment**, or **export story AC/EC to CSV for QA**:

1. Read and follow **`skills/tc-fe-prep-workflow/SKILL.md`**
2. Respond in **English**
3. Do not post to Jira until the user approves the draft (unless they waive approval)
4. Comment only on the **issue key the user specified** (usually the story, not sub-tasks)

## Optional project config

Search the workspace for `references/*-tc-fe-prep-guide.md`. If missing, use `skills/tc-fe-prep-workflow/references/project-config-template.md` to interview the user and create one in **their** repo.

## Not in scope

- Automated test execution (use your project's E2E framework separately)
- Posting to issues other than the one the user named
- Hardcoded paths on the agent machine inside Jira comments
