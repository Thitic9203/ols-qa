# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at <ORG>.

Helix skills embedded directly — no separate install needed.

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend test cases from a story (AC/EC) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, add evidence, comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |

## OLS links

- **Jira board:** https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID>
- **Figma:** https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## Helix skills source

Skills originally from [Thitic9203/helix](https://github.com/Thitic9203/helix) — embedded as-is.
