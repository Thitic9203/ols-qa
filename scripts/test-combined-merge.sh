#!/usr/bin/env bash
# Run the test suites on several branches merged together — and prove which tree was tested.
#
#   bash scripts/test-combined-merge.sh <branch> [<branch> ...]
#
# Merges origin/<branch> for each branch onto a fresh origin/main worktree, checks that every
# branch is an ancestor of the merged HEAD, prints one `in-test <branch> <sha>` line per branch and
# `combined HEAD <sha> in <worktree>`, then runs scripts/run-test-suites.sh INSIDE that worktree.
# The worktree is the tool's own and is removed when it finishes.
#
# exit 0 suites green · 1 suites red · 2 usage · 3 merge failed (conflict / missing branch)
# exit 4 worktree path already exists (never reused, never deleted) · 5 setup failed · 6 proof failed
#
# Why (post-mortem #0198, docs/sdd/combined-merge-test): a hand-written chain joined the test step
# with `;`, `git worktree add` failed on a stale folder, and the suites ran on main and printed green.
set -euo pipefail

[ "$#" -ge 1 ] || { echo "usage: $0 <branch> [<branch> ...]" >&2; exit 2; }
R="${COMBINED_REPO:-$(cd "$(dirname "$0")/.." && pwd)}"
R="$(cd "$R" && pwd -P)"
T="$R/.worktrees/combined-merge-test"

if [ -e "$T" ]; then
  echo "STOP: $T already exists — another run, or a leftover. Not reused, not deleted." >&2
  exit 4
fi

git -C "$R" fetch -q origin || { echo "STOP: git fetch failed" >&2; exit 5; }
git -C "$R" worktree add -q --detach "$T" origin/main || { echo "STOP: could not create $T" >&2; exit 5; }
cleanup() { git -C "$R" worktree remove --force "$T" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cd "$T"
[ "$(git rev-parse --show-toplevel)" = "$T" ] || { echo "STOP: not inside $T" >&2; exit 5; }

for b in "$@"; do
  if ! git merge -q --no-edit "origin/$b" >/dev/null 2>&1; then
    echo "CONFLICT $b (or origin/$b does not exist) — merge aborted, suites not run" >&2
    git merge --abort >/dev/null 2>&1 || true
    exit 3
  fi
done

for b in "$@"; do
  git merge-base --is-ancestor "origin/$b" HEAD || { echo "STOP: $b is not in the merged HEAD" >&2; exit 6; }
  echo "in-test $b $(git rev-parse --short "origin/$b")"
done
echo "combined HEAD $(git rev-parse --short HEAD) in $(git rev-parse --show-toplevel)"

set +e
bash scripts/run-test-suites.sh
rc=$?
set -e
echo "rc=$rc"
[ "$rc" -eq 0 ] || exit 1
exit 0
