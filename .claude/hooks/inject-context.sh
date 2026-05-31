#!/bin/bash
# Inject Helix dev context at session start
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

echo "=== Helix Dev Context ==="
echo "Branch: $(git branch --show-current 2>/dev/null)"
echo "Version: $(cat VERSION 2>/dev/null)"
echo "Last 3 commits:"
git log --oneline -3 2>/dev/null
echo ""
echo "Modified files:"
git status --short 2>/dev/null | head -10
echo ""

# Show WIP context if exists
if [ -f .claude/session-context.md ]; then
  cat .claude/session-context.md
fi
