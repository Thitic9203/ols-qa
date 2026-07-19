#!/usr/bin/env bash
# Activate ols-qa git hooks (post-commit → auto-sync shared skills to the helix plugin).
# Run once per clone:  bash scripts/setup-hooks.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
chmod +x "$ROOT"/scripts/hooks/* "$ROOT"/scripts/sync-skills-to-helix.sh 2>/dev/null || true
git -C "$ROOT" config core.hooksPath scripts/hooks
echo "✅ ols-qa hooks active (core.hooksPath=scripts/hooks). Shared skill edits now auto-sync+deploy to helix."
echo "   Disable a single commit with:  HELIX_SYNC=0 git commit …"
