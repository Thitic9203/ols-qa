#!/bin/bash
# Post-clone setup (skip if you used install.sh)

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "Error: run from inside the repo"
  exit 1
fi

cd "$REPO_ROOT"

MARKETPLACE_NAME="helix-dev"
PLUGIN_NAME="helix"
CACHE_BASE="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME"

VERSION=$(grep '"version"' .claude-plugin/plugin.json | head -1 | sed 's/.*"\([0-9]*\.[0-9]*\.[0-9]*\)".*/\1/')
if [ -z "$VERSION" ]; then
  echo "Error: cannot read version"
  exit 1
fi

mkdir -p "$CACHE_BASE"
for OLD_ENTRY in "$CACHE_BASE"/*/; do
  [ -e "$OLD_ENTRY" ] || continue
  rm -rf "$OLD_ENTRY"
done
ln -sfn "$REPO_ROOT" "$CACHE_BASE/$VERSION"

git config core.hooksPath scripts/hooks
bash "$REPO_ROOT/scripts/link-skills.sh"

echo "Setup complete (v$VERSION)"
