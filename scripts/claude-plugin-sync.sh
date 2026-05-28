#!/usr/bin/env bash
# Keep Claude Code on the canonical Helix plugin (helix@helix), not legacy helix@local.
#
# Called from install.sh, helix-doctor (HELIX_DOCTOR_FIX=1), and post-merge hook.
#
# Usage:
#   bash ~/.helix/tc-fe-prep/scripts/claude-plugin-sync.sh
#   HELIX_QUIET=1 bash scripts/claude-plugin-sync.sh

set -euo pipefail

REPO="${HELIX_REPO_DIR:-$HOME/.helix/tc-fe-prep}"
CANONICAL="helix@helix"
LEGACY="helix@local"
MARKETPLACE="helix"

log() {
  if [ -z "${HELIX_QUIET:-}" ]; then
    echo "$@"
  fi
}

if ! command -v claude >/dev/null 2>&1; then
  log "[claude] skipped — Claude CLI not on PATH (skills still work via ~/.claude/skills)"
  exit 0
fi

if [ -f "$REPO/VERSION" ]; then
  WANT_VER="$(tr -d '[:space:]' < "$REPO/VERSION")"
else
  WANT_VER=""
fi

plugin_list() {
  claude plugin list 2>/dev/null || true
}

has_plugin() {
  plugin_list | grep -qF "$1"
}

# Ensure GitHub marketplace is registered (idempotent).
if ! claude plugin marketplace list 2>/dev/null | grep -qF "$MARKETPLACE"; then
  log "[claude] adding marketplace $MARKETPLACE (Thitic9203/helix)..."
  claude plugin marketplace add "Thitic9203/helix" 2>/dev/null || true
fi

log "[claude] updating marketplace $MARKETPLACE..."
claude plugin marketplace update "$MARKETPLACE" 2>/dev/null || true

if has_plugin "$CANONICAL"; then
  log "[claude] updating $CANONICAL..."
  if ! claude plugin update "$CANONICAL" 2>&1; then
    log "[claude] warn: update $CANONICAL failed — try: claude plugin install $CANONICAL"
  fi
else
  log "[claude] installing $CANONICAL..."
  claude plugin install "$CANONICAL"
fi

log "[claude] enabling $CANONICAL..."
claude plugin enable "$CANONICAL" 2>/dev/null || true

# Retire confusing legacy id (old local cache installs).
# Do NOT `plugin uninstall helix@local` — Claude CLI may remove the shared "helix" plugin.
if has_plugin "$LEGACY"; then
  log "[claude] disabling legacy $LEGACY (use $CANONICAL only)..."
  claude plugin disable "$LEGACY" 2>/dev/null || true
fi

STALE_CACHE="$HOME/.claude/plugins/cache/local/helix"
if [ -d "$STALE_CACHE" ]; then
  log "[claude] removing stale cache $STALE_CACHE"
  rm -rf "$STALE_CACHE"
fi

# Optional version check for doctor callers
if [ -n "$WANT_VER" ] && plugin_list | grep -A3 "$CANONICAL" | grep -q "Version: $WANT_VER"; then
  log "[claude] $CANONICAL is at $WANT_VER"
elif [ -n "$WANT_VER" ]; then
  log "[claude] note: restart Claude Code to apply plugin changes (want $WANT_VER)"
else
  log "[claude] done — restart Claude Code if /helix looks outdated"
fi

exit 0
