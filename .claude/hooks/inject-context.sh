#!/bin/bash
# Inject OLS QA workspace context at session start
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

echo "=== OLS QA Workspace ==="
echo "Jira:       https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog"
echo "Confluence: https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID>"
echo "Figma:      https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file"
echo ""
echo "Helix commands: /helix  /tc-fe-prep  /tc-api-prep  /retest-bug  /testing-ticket  /create-bug"
echo ""

# Show WIP context if exists
if [ -f .claude/session-context.md ]; then
  echo "=== WIP Context ==="
  cat .claude/session-context.md
fi
