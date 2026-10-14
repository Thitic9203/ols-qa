#!/bin/bash
# verify-on-origin.sh — the only accepted evidence for "pushed" / "on main" (report #0190).
#
#   bash scripts/verify-on-origin.sh <sha|branch> [remote-branch]     (remote-branch default: main)
#
# Fetches origin/<remote-branch> fresh, then asks git whether the commit is an ancestor of it.
# `git log` without a remote name reads the local branch, which already holds the commit the
# moment it is made, so it looks the same whether the push landed or was rejected (#0190: a
# `git push -q` was rejected non-fast-forward and the local log was reported as "on main").
#
# Always prints exactly one line on stdout. There is no quiet mode.
#   exit 0  ON-ORIGIN <sha> origin/<branch>
#   exit 1  NOT-ON-ORIGIN <sha> origin/<branch>
#   exit 2  CANNOT-VERIFY <reason>     (bad arguments, unknown rev, fetch failed, git error)
# "Could not verify" is never reported as either answer.
set -uo pipefail

cannot() { echo "CANNOT-VERIFY $*"; exit 2; }

REV="${1:-}"
BRANCH="${2:-main}"
[ -n "$REV" ] || cannot "usage: verify-on-origin.sh <sha|branch> [remote-branch]"
[ "$#" -le 2 ] || cannot "too many arguments (expected <sha|branch> [remote-branch])"
git check-ref-format --branch "$BRANCH" >/dev/null 2>&1 || cannot "invalid branch name: $BRANCH"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || cannot "not inside a git work tree"

SHA="$(git rev-parse --verify --quiet "${REV}^{commit}" 2>/dev/null)" || cannot "unknown commit: $REV"
[ -n "$SHA" ] || cannot "unknown commit: $REV"

# Explicit refspec: updates origin/<branch> even when the clone's fetch refspec is narrowed.
if ! git fetch --quiet origin "+refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}" >/dev/null 2>&1; then
  cannot "fetch of origin/${BRANCH} failed — ${SHA} unverified"
fi

git merge-base --is-ancestor "$SHA" "refs/remotes/origin/${BRANCH}" >/dev/null 2>&1
rc=$?
case "$rc" in
  0) echo "ON-ORIGIN ${SHA} origin/${BRANCH}"; exit 0 ;;
  1) echo "NOT-ON-ORIGIN ${SHA} origin/${BRANCH}"; exit 1 ;;
  *) cannot "git merge-base exited ${rc} for ${SHA} against origin/${BRANCH}" ;;
esac
