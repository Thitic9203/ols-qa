#!/usr/bin/env bash
# Release-gated, silent auto-update of this OLS QA workspace clone.
#
# Moves the clone only to the newest published release tag (vX.Y.Z), never to an unreleased
# main. auto-version.yml creates a tag only after the `tests` workflow passed on that commit,
# so a red main never reaches anyone's skills.
#
# Called from .claude/hooks/inject-context.sh (project SessionStart) and, once opted in with
# scripts/install-auto-update.sh, from a user-level SessionStart hook so the skills stay current
# even in sessions opened outside this folder.
#
# Every session costs one `git ls-remote` of the release tags; the full fetch runs only when that
# names a release newer than the local one, or when the interval (default 4h) has passed.
#
# Never moves the clone when:
#   - HEAD is not on branch main (a contributor's feature branch or a worktree)
#   - tracked files are modified (dirty) or local main has commits the release lacks (diverged)
#   - HEAD already contains the release (never moves backwards)
# The dirty and diverged cases are recorded in $STATE_DIR/last-update-error for the session hook.
#
# Environment:
#   OLS_QA_AUTO_UPDATE=0             opt out (also: false, no, off)
#   OLS_QA_FORCE_UPDATE=1            full fetch now, ignore the interval
#   OLS_QA_REPO_DIR                  clone to update (default: the clone containing this script)
#   OLS_QA_STATE_DIR                 stamp, log, lock and error files (default: $HOME/.ols-qa)
#   OLS_QA_AUTO_UPDATE_INTERVAL_SEC  full-fetch fallback interval (default 14400)
#
# Output: one line `=== ols-qa skills updated to vX.Y.Z ===` on stdout when the clone moved,
# nothing otherwise. Always exits 0 — a session must never fail because of an update.
# Compatible with bash 3.2 and BSD tools.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd -P)" || exit 0
REPO="${OLS_QA_REPO_DIR:-$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd -P)}"
STATE_DIR="${OLS_QA_STATE_DIR:-$HOME/.ols-qa}"
STAMP_FILE="$STATE_DIR/.last-auto-update-check"
LOG_FILE="$STATE_DIR/auto-update.log"
ERR_FILE="$STATE_DIR/last-update-error"
LOCK_DIR="$STATE_DIR/.auto-update.lock"
MIN_INTERVAL_SEC="${OLS_QA_AUTO_UPDATE_INTERVAL_SEC:-14400}"
ERRORS_THIS_RUN=0
TARGET_VERSION=""

# A SessionStart hook can be started from inside a git hook's environment; GIT_DIR and friends
# would then point every git call below at the wrong repository (report #0063).
if [ -f "$SCRIPT_DIR/git-env-clean.sh" ]; then
  # shellcheck source=/dev/null
  . "$SCRIPT_DIR/git-env-clean.sh"
  git_env_clean >/dev/null 2>&1 || true
fi
# Never block a session on a credential prompt or a dead network.
export GIT_TERMINAL_PROMPT=0
: "${GIT_SSH_COMMAND:=ssh -o BatchMode=yes -o ConnectTimeout=10}"
export GIT_SSH_COMMAND

g() { git -C "$REPO" -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 "$@"; }

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >>"$LOG_FILE" 2>/dev/null || true; }

note_error() {
  ERRORS_THIS_RUN=$((ERRORS_THIS_RUN + 1))
  log "ERROR: $*"
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >>"$ERR_FILE" 2>/dev/null || true
}

auto_update_disabled() {
  case "${OLS_QA_AUTO_UPDATE:-1}" in
    0 | false | FALSE | no | NO | off | OFF) return 0 ;;
    *) return 1 ;;
  esac
}

# Numeric semver order: v1.49.0 is newer than v1.9.2, which a lexical sort gets wrong.
semver_sort() { sort -t. -k1,1n -k2,2n -k3,3n; }

version_gt() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | semver_sort | tail -1)" = "$1" ]
}

# The released version this checkout carries: the README header the release job bumps.
local_version() {
  sed -n 's/.*OLS Workspace version: v\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/p' \
    "$REPO/README.md" 2>/dev/null | head -1
}

newest_remote_release() {
  g ls-remote --tags --refs origin 'v*' 2>/dev/null \
    | sed -n 's#.*refs/tags/v\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)$#\1#p' \
    | semver_sort | tail -1
}

newest_local_release() {
  g tag -l 'v*' 2>/dev/null \
    | sed -n 's#^v\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)$#\1#p' \
    | semver_sort | tail -1
}

release_newer_than_local() {
  local remote
  remote="$(newest_remote_release)"
  [ -n "$remote" ] && version_gt "$remote" "$(local_version)"
}

should_run_check() {
  [ -n "${OLS_QA_FORCE_UPDATE:-}" ] && return 0
  [ -f "$STAMP_FILE" ] || return 0
  local now last
  now="$(date +%s)"
  last="$(tr -cd '0-9' <"$STAMP_FILE" 2>/dev/null)"
  [ -n "$last" ] || return 0
  [ $((now - last)) -ge "$MIN_INTERVAL_SEC" ] && return 0
  # Inside the interval a release published since the last check must still reach this session.
  release_newer_than_local
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then return 0; fi
  # A lock left by a killed run must not disable updates forever.
  if [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +10 2>/dev/null)" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
    mkdir "$LOCK_DIR" 2>/dev/null && return 0
  fi
  return 1
}

update_clone() {
  log "fetching origin/main and release tags..."
  # Release tags on origin are authoritative: force-update local tags so a stale local tag
  # cannot make the fetch refuse with "would clobber existing tag".
  if ! g fetch --quiet origin '+refs/heads/main:refs/remotes/origin/main' '+refs/tags/v*:refs/tags/v*' 2>>"$LOG_FILE"; then
    note_error "git fetch from origin failed in $REPO (offline, proxy or TLS) - no update this session"
    return 1
  fi
  local target tag local_ver branch
  target="$(newest_local_release)"
  if [ -z "$target" ]; then
    log "no release tag found - skip (never pull unreleased main)"
    return 2
  fi
  tag="v$target"
  if ! g merge-base --is-ancestor "$tag" origin/main 2>/dev/null; then
    log "release $tag is not on origin/main - skip"
    return 2
  fi
  local_ver="$(local_version)"
  if g merge-base --is-ancestor "$tag" HEAD 2>/dev/null; then
    log "clone ($local_ver) already contains release $target - nothing to do"
    return 2
  fi
  branch="$(g symbolic-ref --quiet --short HEAD 2>/dev/null)"
  if [ "$branch" != "main" ]; then
    log "clone is on '${branch:-detached HEAD}', not main - release $target left for the owner to merge"
    return 2
  fi
  if [ -n "$(g status --porcelain --untracked-files=no 2>/dev/null)" ]; then
    note_error "release $tag not applied: tracked files are modified in $REPO (commit or stash them)"
    return 1
  fi
  if ! g merge --ff-only --quiet "$tag" >>"$LOG_FILE" 2>&1; then
    note_error "fast-forward to $tag failed: local main has diverged from the release in $REPO"
    return 1
  fi
  TARGET_VERSION="$target"
  log "clone updated $local_ver -> release $target"
  return 0
}

main() {
  auto_update_disabled && return 0
  g rev-parse --git-dir >/dev/null 2>&1 || return 0
  mkdir -p "$STATE_DIR" 2>/dev/null || return 0
  # The project hook and the user-level hook can start together; one run is enough.
  acquire_lock || return 0
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT
  should_run_check || return 0
  date +%s >"$STAMP_FILE" 2>/dev/null || true
  local rc=0
  update_clone || rc=$?
  # A run that finished without a failure clears the previous error notice.
  if [ "$ERRORS_THIS_RUN" -eq 0 ]; then
    rm -f "$ERR_FILE" 2>/dev/null || true
  fi
  if [ "$rc" -eq 0 ] && [ -n "$TARGET_VERSION" ]; then
    echo "=== ols-qa skills updated to v$TARGET_VERSION ==="
  fi
  return 0
}

main "$@" || true
exit 0
