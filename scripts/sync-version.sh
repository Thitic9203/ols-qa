#!/usr/bin/env bash
# Propagate VERSION file to plugin manifest, marketplace, and README.
# Usage: ./scripts/sync-version.sh [--check]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION_FILE="$ROOT/VERSION"
PLUGIN_JSON="$ROOT/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$ROOT/.claude-plugin/marketplace.json"
README="$ROOT/README.md"

if [ ! -f "$VERSION_FILE" ]; then
  echo "error: missing VERSION file at repo root" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: VERSION must be semver (got: $VERSION)" >&2
  exit 1
fi

read_version_from_json() {
  grep '"version"' "$1" | head -1 | sed 's/.*"\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)".*/\1/'
}

check_file() {
  local file="$1" label="$2"
  local found
  found="$(read_version_from_json "$file")"
  if [ "$found" != "$VERSION" ]; then
    echo "error: $label has $found, expected $VERSION (run ./scripts/sync-version.sh)" >&2
    return 1
  fi
}

check_readme() {
  if ! grep -q "^\*\*Version: ${VERSION}\*\*" "$README"; then
    echo "error: README.md missing **Version: ${VERSION}** line (run ./scripts/sync-version.sh)" >&2
    return 1
  fi
}

if [ "${1:-}" = "--check" ]; then
  err=0
  check_file "$PLUGIN_JSON" "plugin.json" || err=1
  check_file "$MARKETPLACE_JSON" "marketplace.json (metadata)" || err=1
  check_readme || err=1
  if [ "$err" -eq 0 ]; then
    echo "ok: all version markers match $VERSION"
  fi
  exit "$err"
fi

# Write plugin.json
if [ "$(uname)" = "Darwin" ]; then
  sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" "$PLUGIN_JSON"
  sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" "$MARKETPLACE_JSON"
else
  sed -i "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" "$PLUGIN_JSON"
  sed -i "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" "$MARKETPLACE_JSON"
fi

# README version line (replace existing or insert after first heading)
if grep -q '^\*\*Version: ' "$README"; then
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "s/^\*\*Version: .*\*\*/\*\*Version: ${VERSION}\*\*/" "$README"
  else
    sed -i "s/^\*\*Version: .*\*\*/\*\*Version: ${VERSION}\*\*/" "$README"
  fi
else
  if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "1a\\
\\
**Version: ${VERSION}** · [Releases](https://github.com/Thitic9203/helix/releases)\\
" "$README"
  else
    sed -i "1a\\n**Version: ${VERSION}** · [Releases](https://github.com/Thitic9203/helix/releases)\n" "$README"
  fi
fi

echo "synced version $VERSION -> plugin.json, marketplace.json, README.md"
