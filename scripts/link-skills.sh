#!/usr/bin/env bash
# Link shippable Helix skills into common agent skill directories.
#
# Global (default): symlinks under ~/.claude/skills, ~/.cursor/skills, etc.
# Project (optional): set HELIX_LINK_WORKSPACE=/path/to/repo to also link under
#   .github/skills, .agents/skills, .windsurf/skills, .cline/skills, .gemini/skills

set -euo pipefail

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

echo "=== Helix link-skills (repo: $REPO) ==="
echo ""

# --- Global user skill directories (Agent Skills interoperable paths) ---
GLOBAL_DESTS=(
  "$HOME/.claude/skills|claude"
  "$HOME/.cursor/skills|cursor"
  "$HOME/.codex/skills|codex"
  "$HOME/.copilot/skills|copilot"
  "$HOME/.gemini/skills|gemini"
  "$HOME/.agents/skills|agents"
  "$HOME/.codeium/windsurf/skills|windsurf"
  "$HOME/.cline/skills|cline"
  "$HOME/.config/opencode/skills|opencode"
  "$HOME/.pi/agent/skills|pi"
)

for entry in "${GLOBAL_DESTS[@]}"; do
  dest="${entry%%|*}"
  label="${entry##*|}"
  link_into "$dest" "$label"
done

# --- Optional project / workspace scope ---
if [ -n "${HELIX_LINK_WORKSPACE:-}" ]; then
  WS="$(cd "$HELIX_LINK_WORKSPACE" && pwd)"
  echo ""
  echo "=== Workspace: $WS ==="
  WORKSPACE_DESTS=(
    "$WS/.github/skills|github-copilot"
    "$WS/.agents/skills|agents-project"
    "$WS/.windsurf/skills|windsurf-project"
    "$WS/.cline/skills|cline-project"
    "$WS/.gemini/skills|gemini-project"
  )
  for entry in "${WORKSPACE_DESTS[@]}"; do
    dest="${entry%%|*}"
    label="${entry##*|}"
    link_into "$dest" "$label"
  done
fi

echo ""
echo "Done. Skills source: $REPO/skills/"
echo "Docs: docs/supported-agents.md · prompts: references/agent-entry.md"
