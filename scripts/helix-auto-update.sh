#!/usr/bin/env bash
# Best-effort silent update: align ~/.helix clone, skill symlinks, and helix@helix with GitHub main.
#
# Triggered from SessionStart hooks (Claude Code / Cursor) and optional cron.
# Opt out: HELIX_AUTO_UPDATE=0
#
# Usage:
#   bash ~/.helix/tc-fe-prep/scripts/helix-auto-update.sh
#   HELIX_AUTO_UPDATE_VERBOSE=1 bash scripts/helix-auto-update.sh

set -euo pipefail

REPO="${HELIX_REPO_DIR:-$HOME/.helix/tc-fe-prep}"
STATE_DIR="${HELIX_STATE_DIR:-$HOME/.helix}"
STAMP_FILE="$STATE_DIR/.last-auto-update-check"
LOG_FILE="$STATE_DIR/auto-update.log"
MIN_INTERVAL_SEC="${HELIX_AUTO_UPDATE_INTERVAL_SEC:-14400}"
REMOTE_VERSION_URL="${HELIX_VERSION_URL:-https://raw.githubusercontent.com/Thitic9203/helix/main/VERSION}"
MARKETPLACE_NAME="helix-dev"
PLUGIN_NAME="helix"
CACHE_BASE="$HOME/.claude/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME"

log() {
  if [ -n "${HELIX_AUTO_UPDATE_VERBOSE:-}" ]; then
    echo "[helix-auto-update] $*" | tee -a "$LOG_FILE"
  else
    echo "[helix-auto-update] $*" >>"$LOG_FILE" 2>/dev/null || true
  fi
}

auto_update_disabled() {
  case "${HELIX_AUTO_UPDATE:-1}" in
    0 | false | FALSE | no | NO | off | OFF) return 0 ;;
    *) return 1 ;;
  esac
}

should_run_check() {
  if [ -n "${HELIX_FORCE_UPDATE:-}" ]; then
    return 0
  fi
  if [ ! -f "$STAMP_FILE" ]; then
    return 0
  fi
  local now last
  now=$(date +%s)
  last=$(tr -d '[:space:]' <"$STAMP_FILE" 2>/dev/null || echo 0)
  [ $((now - last)) -ge "$MIN_INTERVAL_SEC" ]
}

mark_checked() {
  mkdir -p "$STATE_DIR"
  date +%s >"$STAMP_FILE"
}

remote_version_curl() {
  curl -fsSL --connect-timeout 5 --max-time 20 "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]'
}

local_version() {
  if [ -f "$REPO/VERSION" ]; then
    tr -d '[:space:]' <"$REPO/VERSION"
  else
    echo ""
  fi
}

refresh_cache_symlink() {
  local ver="$1"
  [ -n "$ver" ] || return 0
  [ -d "$REPO" ] || return 0
  mkdir -p "$CACHE_BASE"
  ln -sfn "$REPO" "$CACHE_BASE/$ver"
}

refresh_after_pull() {
  local ver="$1"
  refresh_cache_symlink "$ver"
  if [ -x "$REPO/scripts/link-skills.sh" ]; then
    HELIX_QUIET=1 bash "$REPO/scripts/link-skills.sh" >>"$LOG_FILE" 2>&1 || true
  fi
  if [ -x "$REPO/scripts/claude-plugin-sync.sh" ]; then
    HELIX_QUIET=1 HELIX_REPO_DIR="$REPO" bash "$REPO/scripts/claude-plugin-sync.sh" >>"$LOG_FILE" 2>&1 || true
  fi
}

update_git_clone() {
  local remote="$1"
  if [ ! -d "$REPO/.git" ]; then
    return 1
  fi
  log "fetching origin/main..."
  if ! git -C "$REPO" fetch origin main --quiet 2>>"$LOG_FILE"; then
    log "fetch failed (offline?)"
    return 1
  fi
  local origin_ver
  origin_ver=$(git -C "$REPO" show origin/main:VERSION 2>/dev/null | tr -d '[:space:]' || true)
  [ -n "$origin_ver" ] && remote="$origin_ver"
  local local_ver
  local_ver=$(local_version)
  if [ "$local_ver" = "$remote" ]; then
    log "clone already at $remote"
    refresh_cache_symlink "$remote"
    return 2
  fi
  log "pulling $local_ver -> $remote..."
  if ! git -C "$REPO" pull --ff-only origin main --quiet 2>>"$LOG_FILE"; then
    log "pull failed — local changes or offline"
    return 1
  fi
  refresh_after_pull "$remote"
  log "clone updated to $remote"
  return 0
}

update_marketplace_only() {
  local remote="$1"
  if ! command -v claude >/dev/null 2>&1; then
    log "no ~/.helix clone and no claude CLI — skip"
    return 0
  fi
  if [ -x "$REPO/scripts/claude-plugin-sync.sh" ]; then
    HELIX_QUIET=1 HELIX_REPO_DIR="$REPO" bash "$REPO/scripts/claude-plugin-sync.sh" >>"$LOG_FILE" 2>&1 || true
  fi
  if claude plugin list 2>/dev/null | grep -A3 "helix@helix" | grep -q "Version: $remote"; then
    log "helix@helix already at $remote"
  else
    log "helix@helix sync requested (target $remote)"
  fi
  return 0
}

# --- main ---
if auto_update_disabled; then
  exit 0
fi

mkdir -p "$STATE_DIR"
if ! should_run_check; then
  exit 0
fi
mark_checked

REMOTE="$(remote_version_curl || true)"
if [ -z "$REMOTE" ]; then
  log "could not read remote VERSION (skip)"
  exit 0
fi

UPDATED=0
if [ -d "$REPO/.git" ]; then
  update_git_clone "$REMOTE"
  pull_rc=$?
  if [ "$pull_rc" -eq 0 ]; then
    UPDATED=1
  fi
else
  update_marketplace_only "$REMOTE"
fi

# Export hint for session-start (optional one-line user notice)
if [ "$UPDATED" -eq 1 ] && [ -n "${HELIX_AUTO_UPDATE_NOTIFY:-}" ]; then
  echo "Helix updated to v$REMOTE (skills active; restart Claude Code once for plugin hooks if /helix looks old)." >&2
fi

exit 0
