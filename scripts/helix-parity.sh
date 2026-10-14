#!/bin/bash
# helix-parity.sh — does helix main carry anything that ols-qa main does not? (report #0191, P4)
#
#   bash scripts/helix-parity.sh
#
# Compares every SHARED file — a path under skills/ references/ commands/ present in BOTH
# helix origin/main and ols-qa origin/main — by blob id (a content hash, so it compares across
# repositories). Working trees and local branches are never read: only what is on each origin.
# This makes drift visible both ways: unmerged branch content that reached helix (#0191,
# ca7903b), and merged content that never got synced after PR #24 moved sync to main-only.
#
# Env: HELIX_REPO (default: the directory beside this clone's main checkout, i.e. ../helix)
#      OLS_REPO   (default: the clone this script lives in)
#      HELIX_PARITY_FETCH_TIMEOUT  seconds each fetch may take before it is killed (default 120)
#
# Output uses repo-relative paths only.
#   exit 0  HELIX-PARITY OK 0 of <N> shared files differ
#   exit 1  one "DIFFERS <path>" line per file, then HELIX-PARITY DRIFT <k> of <N> shared files differ
#   exit 2  CANNOT-VERIFY <reason>     (missing repo, fetch failed or timed out, no shared files to compare)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=git-env-clean.sh
. "$HERE/git-env-clean.sh"
git_env_clean 2>/dev/null || true

cannot() { echo "CANNOT-VERIFY $*"; exit 2; }

OLS="$(git -C "${OLS_REPO:-$HERE}" rev-parse --show-toplevel 2>/dev/null)" || cannot "ols-qa is not a git work tree"
# The main checkout, not a linked worktree: ../helix sits beside the main clone.
COMMON="$(git -C "$OLS" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || cannot "cannot locate ols-qa git dir"
MAIN_CHECKOUT="$(dirname "$COMMON")"
HELIX="${HELIX_REPO:-$MAIN_CHECKOUT/../helix}"
git -C "$HELIX" rev-parse --is-inside-work-tree >/dev/null 2>&1 || cannot "helix repo not found (set HELIX_REPO)"

# A fetch must end. Measured 14/Oct/2026: GitHub traffic rides an L2TP VPN, and `ssh -G github.com`
# resolved to ConnectTimeout none / ServerAliveInterval 0 / BatchMode no — a tunnel that drops
# mid-fetch leaves an ESTABLISHED socket that carries nothing, ssh waits on it forever, and the
# exit-2 path below is never reached (one run hung >3 min, the rerun printed OK). So:
#  1. the transports detect a dead path and never prompt (ssh keepalive + BatchMode, https
#     low-speed abort, no terminal prompt) — a user's own GIT_SSH_COMMAND/core.sshCommand wins;
#  2. a wall-clock bound kills the whole fetch process tree (git and its ssh child, which would
#     otherwise be orphaned still holding the socket) and reports CANNOT-VERIFY, never OK.
FETCH_TIMEOUT="${HELIX_PARITY_FETCH_TIMEOUT:-120}"
case "$FETCH_TIMEOUT" in ''|*[!0-9]*|0) cannot "HELIX_PARITY_FETCH_TIMEOUT must be a positive whole number of seconds" ;; esac
export GIT_TERMINAL_PROMPT=0

# Children are collected before the parent dies, or they are reparented and escape.
kill_tree() {
  local kid
  for kid in $(pgrep -P "$1" 2>/dev/null); do kill_tree "$kid"; done
  kill -TERM "$1" 2>/dev/null
}

# fetch_bounded <repo>: 0 fetched · 124 timed out · other = git's own failure status
fetch_bounded() {
  local repo="$1" pid dog rc ssh_cmd=()
  if [ -z "${GIT_SSH_COMMAND:-}" ] && [ -z "$(git -C "$repo" config core.sshCommand 2>/dev/null)" ]; then
    ssh_cmd=(-c "core.sshCommand=ssh -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3")
  fi
  # ${a[@]+...}: macOS /bin/bash 3.2 treats an empty array as unbound under set -u.
  git ${ssh_cmd[@]+"${ssh_cmd[@]}"} -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=30 -C "$repo" \
    fetch --quiet origin "+refs/heads/main:refs/remotes/origin/main" >/dev/null 2>&1 &
  pid=$!
  ( sleep "$FETCH_TIMEOUT"; kill_tree "$pid"; exit 124 ) 2>/dev/null &
  dog=$!
  wait "$pid" 2>/dev/null; rc=$?   # quiet: bash reports a killed job as "Terminated: 15"
  if kill -0 "$dog" 2>/dev/null; then
    kill_tree "$dog"; wait "$dog" 2>/dev/null
    # The dog may still be unwinding after it TERMed git: 143 here is its kill, not git's failure.
    [ "$rc" -eq 143 ] && return 124
    return "$rc"
  fi
  wait "$dog"; [ $? -eq 124 ] && return 124
  return "$rc"
}

for repo in "$OLS" "$HELIX"; do
  name="ols-qa"; [ "$repo" = "$HELIX" ] && name="helix"
  fetch_bounded "$repo"; rc=$?
  [ "$rc" -eq 124 ] && cannot "fetch of ${name} origin/main timed out after ${FETCH_TIMEOUT}s (process tree killed)"
  [ "$rc" -eq 0 ] || cannot "fetch of ${name} origin/main failed"
done

# "<blob> <path>" for every file under the shared roots on origin/main.
list() {
  git -C "$1" ls-tree -r --full-tree refs/remotes/origin/main -- skills references commands 2>/dev/null \
    | awk -F'\t' '{ split($1, m, " "); if (m[2] == "blob") print m[3] " " $2 }'
}
OLS_LIST="$(list "$OLS")" || cannot "cannot list ols-qa origin/main"
HELIX_LIST="$(list "$HELIX")" || cannot "cannot list helix origin/main"

RESULT="$(awk '
  NF == 0 { next }
  NR == FNR { p = $0; sub(/^[^ ]+ /, "", p); ols[p] = $1; next }
  { p = $0; sub(/^[^ ]+ /, "", p); if (p in ols) { shared++; if (ols[p] != $1) print "DIFFERS " p } }
  END { print "SHARED " shared + 0 }
' <(printf '%s\n' "$OLS_LIST") <(printf '%s\n' "$HELIX_LIST"))" || cannot "comparison failed"

SHARED="$(printf '%s\n' "$RESULT" | awk '/^SHARED /{print $2}')"
DIFFS="$(printf '%s\n' "$RESULT" | grep '^DIFFERS ' | LC_ALL=C sort)"
[ "${SHARED:-0}" -gt 0 ] || cannot "no shared files between helix and ols-qa origin/main — nothing measured"

if [ -z "$DIFFS" ]; then
  echo "HELIX-PARITY OK 0 of ${SHARED} shared files differ"
  exit 0
fi
COUNT="$(printf '%s\n' "$DIFFS" | wc -l | tr -d ' ')"
printf '%s\n' "$DIFFS"
echo "HELIX-PARITY DRIFT ${COUNT} of ${SHARED} shared files differ"
exit 1
