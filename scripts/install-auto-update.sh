#!/usr/bin/env bash
# Opt in to release-gated skill auto-update in every Claude Code session, not only in sessions
# opened inside this folder.
#
#   bash scripts/install-auto-update.sh              # add the user-level SessionStart hook
#   bash scripts/install-auto-update.sh --uninstall  # remove it again
#
# Adds ONE command hook to $HOME/.claude/settings.json that runs
#   bash "<this clone>/scripts/ols-qa-auto-update.sh"
# The clone path is resolved when you install, so re-run this after moving the clone.
#
# Safe to re-run: the entry is identified by that script path, so installing twice leaves one
# entry. Merges into the existing file and never touches other hooks or settings; a timestamped
# backup of settings.json is written before every change. Requires jq.
set -euo pipefail

MODE=install
case "${1:-}" in
  "") ;;
  --uninstall) MODE=uninstall ;;
  -h | --help) sed -n '2,14p' "$0"; exit 0 ;;
  *) echo "usage: $0 [--uninstall]" >&2; exit 2 ;;
esac

command -v jq >/dev/null 2>&1 || { echo "[ols-qa] jq is required (macOS: brew install jq)" >&2; exit 1; }

CLONE="$(cd "$(dirname "$0")/.." && pwd -P)"
SCRIPT="$CLONE/scripts/ols-qa-auto-update.sh"
[ -f "$SCRIPT" ] || { echo "[ols-qa] not found: $SCRIPT" >&2; exit 1; }
CMD="bash \"$SCRIPT\""

SETTINGS_DIR="$HOME/.claude"
SETTINGS="$SETTINGS_DIR/settings.json"

if [ -f "$SETTINGS" ]; then
  if ! jq -e 'type == "object"' "$SETTINGS" >/dev/null 2>&1; then
    echo "[ols-qa] $SETTINGS is not a JSON object - left untouched, fix it first" >&2
    exit 1
  fi
else
  if [ "$MODE" = uninstall ]; then
    echo "[ols-qa] no $SETTINGS - nothing to remove"
    exit 0
  fi
  mkdir -p "$SETTINGS_DIR"
  printf '{}\n' >"$SETTINGS"
fi

# Drop every hook whose command runs this clone's update script, then drop groups left empty.
# shellcheck disable=SC2016
STRIP='
  if (.hooks.SessionStart | type) == "array" then
    .hooks.SessionStart |= (
      map(if (.hooks | type) == "array"
          then .hooks |= map(select(((.command // "") | contains($script)) | not))
          else . end)
      | map(select((.hooks | type) != "array" or (.hooks | length) > 0))
    )
  else . end'

if [ "$MODE" = install ]; then
  # shellcheck disable=SC2016
  FILTER="$STRIP"' | .hooks.SessionStart = ((.hooks.SessionStart // []) + [{"hooks": [{"type": "command", "command": $cmd}]}])'
else
  FILTER="$STRIP"
fi

TMP="$(mktemp "$SETTINGS_DIR/.settings.json.XXXXXX")"
trap 'rm -f "$TMP"' EXIT
jq --arg script "$SCRIPT" --arg cmd "$CMD" "$FILTER" "$SETTINGS" >"$TMP"

if cmp -s "$TMP" "$SETTINGS"; then
  echo "[ols-qa] $SETTINGS already up to date ($MODE)"
  exit 0
fi

BACKUP="$SETTINGS.bak.$(date +%Y%m%d%H%M%S)"
cp -p "$SETTINGS" "$BACKUP"
mv "$TMP" "$SETTINGS"
trap - EXIT

if [ "$MODE" = install ]; then
  echo "[ols-qa] auto-update hook installed in $SETTINGS (backup: $BACKUP)"
  echo "         runs: $CMD   opt out per session: OLS_QA_AUTO_UPDATE=0"
else
  echo "[ols-qa] auto-update hook removed from $SETTINGS (backup: $BACKUP)"
fi
