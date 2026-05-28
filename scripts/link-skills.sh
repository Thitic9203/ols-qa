#!/usr/bin/env bash
set -euo pipefail

# Link shippable skills into common agent skill directories.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

link_into() {
  local DEST="$1"
  local LABEL="$2"

  [ -d "$(dirname "$DEST")" ] || return 0

  if [ -L "$DEST" ]; then
    local resolved
    resolved="$(readlink -f "$DEST" 2>/dev/null || readlink "$DEST")"
    case "$resolved" in
      "$REPO"|"$REPO"/*)
        echo "skip $LABEL: $DEST is already part of this repo"
        return 0
        ;;
    esac
  fi

  mkdir -p "$DEST"

  find "$REPO/skills" -name SKILL.md \
    -not -path '*/in-progress/*' \
    -not -path '*/deprecated/*' \
    -print0 |
  while IFS= read -r -d '' skill_md; do
    local src name target
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    target="$DEST/$name"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    echo "linked ($LABEL) $name"
  done
}

link_into "$HOME/.claude/skills" "claude"
link_into "$HOME/.cursor/skills" "cursor"
link_into "$HOME/.codex/skills" "codex"
link_into "$HOME/.agents/skills" "agents"

echo "Done. Skill source: $REPO/skills/tc-fe-prep-workflow"
