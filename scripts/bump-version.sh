#!/usr/bin/env bash
# Bump VERSION (semver), sync manifests, optionally stage files.
# Usage: ./scripts/bump-version.sh [patch|minor|major]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PART="${1:-patch}"
VERSION_FILE="$ROOT/VERSION"

current="$(tr -d '[:space:]' < "$VERSION_FILE")"
IFS='.' read -r major minor patch <<< "$current"

case "$PART" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
  *)
    echo "usage: $0 [patch|minor|major]" >&2
    exit 1
    ;;
esac

new="${major}.${minor}.${patch}"
echo "$new" > "$VERSION_FILE"
"$ROOT/scripts/sync-version.sh"
echo "bumped: $current -> $new"

if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  git -C "$ROOT" add VERSION .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md 2>/dev/null || true
fi
