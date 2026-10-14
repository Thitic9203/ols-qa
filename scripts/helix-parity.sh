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
#
# Output uses repo-relative paths only.
#   exit 0  HELIX-PARITY OK 0 of <N> shared files differ
#   exit 1  one "DIFFERS <path>" line per file, then HELIX-PARITY DRIFT <k> of <N> shared files differ
#   exit 2  CANNOT-VERIFY <reason>     (missing repo, fetch failed, no shared files to compare)
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

for repo in "$OLS" "$HELIX"; do
  name="ols-qa"; [ "$repo" = "$HELIX" ] && name="helix"
  git -C "$repo" fetch --quiet origin "+refs/heads/main:refs/remotes/origin/main" >/dev/null 2>&1 \
    || cannot "fetch of ${name} origin/main failed"
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
