#!/bin/bash
# One-command install: clone + symlinks for Claude Code and Cursor skills
#
# Usage:
#   curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash

set -e

REPO_URL="https://github.com/Thitic9203/helix.git"
REPO_DIR="${HELIX_REPO_DIR:-$HOME/.helix/tc-fe-prep}"
MARKETPLACE_NAME="helix-dev"
PLUGIN_NAME="helix"
CACHE_BASE="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME"

echo "=== Helix QA assistant installer ==="
echo ""

# 1. Clone or pull
if [ -d "$REPO_DIR/.git" ]; then
  echo "[1/4] Repo exists — pulling latest..."
  git -C "$REPO_DIR" pull origin main --quiet
else
  echo "[1/4] Cloning repo..."
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone "$REPO_URL" "$REPO_DIR" --quiet
fi

cd "$REPO_DIR"

# 2. Claude Code plugin cache symlink
if [ -f VERSION ]; then
  VERSION="$(tr -d '[:space:]' < VERSION)"
else
  echo "Error: missing VERSION file"
  exit 1
fi
bash "$REPO_DIR/scripts/sync-version.sh" --check 2>/dev/null || bash "$REPO_DIR/scripts/sync-version.sh"

echo "[2/4] Claude plugin cache symlink (v$VERSION)..."
mkdir -p "$CACHE_BASE"
for OLD_ENTRY in "$CACHE_BASE"/*/; do
  [ -e "$OLD_ENTRY" ] || continue
  rm -rf "$OLD_ENTRY"
done
ln -sfn "$REPO_DIR" "$CACHE_BASE/$VERSION"

# 3. Link skills for Claude + Cursor
echo "[3/4] Linking skills..."
bash "$REPO_DIR/scripts/link-skills.sh"

# 4. Git hooks for cache rename on pull
echo "[4/4] Enabling auto-update hooks..."
git config core.hooksPath scripts/hooks

echo ""
echo "=== Install complete ==="
echo "Repo:    $REPO_DIR"
echo "Plugin:  $CACHE_BASE/$VERSION -> $REPO_DIR"
echo ""
echo "Version:     $VERSION"
echo "Claude Code:  /helix  |  /tc-fe-prep  |  /retest-bug  |  /testing-ticket  |  /create-bug"
echo "Cursor:       all skills under ~/.cursor/skills (symlinked)"
echo "Any agent:    AGENTS.md"
echo ""
echo "Update: cd $REPO_DIR && git pull"
