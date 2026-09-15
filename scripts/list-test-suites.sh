#!/bin/bash
# Where the test suites live — the ONE place that answers it.
#
#   bash scripts/list-test-suites.sh <dir>
#
#   exit 0  one path per line on stdout, at least one
#   exit 1  the tree contains no suite at all  ("none ran" is never "all passed")
#   exit 2  could not look                     (no dir given, missing, unreadable)
#
# Before this file the pattern was written out twice: once in .github/workflows/tests.yml and
# once in scripts/hooks/pre-push. The CI copy carried a count and refused zero; the hook copy
# did not, so a tree with no suites made the push gate print a tick over a commit it had never
# measured (report #0006). The two were meant to do the same job and nothing kept them equal.
#
# Callers must check the exit status. Printing nothing and printing "no suites" are the same
# byte stream, and only the status separates "there are none" from "I could not look".
set -uo pipefail

DIR="${1:-}"
[ -n "$DIR" ] || { echo "usage: $0 <dir>" >&2; exit 2; }
[ -d "$DIR" ] || { echo "not a directory: $DIR" >&2; exit 2; }
[ -r "$DIR" ] || { echo "unreadable: $DIR" >&2; exit 2; }

cd "$DIR" 2>/dev/null || { echo "cannot enter: $DIR" >&2; exit 2; }

# Every depth under tools/, not just `tools/<dir>/<file>.test.js`.
#
# The glob was exactly two levels deep, and because ONE match anywhere satisfied the
# counter, a suite at any other depth was dropped while this still exited 0 and both gates
# printed a green tick over files nobody ran. Measured 2026-09-06 on a tree holding
# `tools/alpha/a.test.js`, `tools/beta/nested/deep.test.js` and `scripts/root.test.js`:
# only the first was listed, exit 0. Latent — all 30 suites sit at depth 2 today — but this
# file is now the single source both the push gate and CI ask, and its contract could only
# tell "none at all" from "some", never "fewer than the tree holds". That is report #0002's
# rule (a filter inside a checker is a claim that what it drops does not matter) arriving in
# the file written to close #0006.
#
# A nested git worktree carries its own full copy of every suite in tools/, and `find`
# cannot tell that copy from the real one — CLAUDE.md's own rule 6 (this repo's shared
# worktree convention) and the Claude Code app's own per-agent worktrees both create these
# under `$DIR` routinely, so an abandoned or even a live one is not an edge case here, it is
# the normal state. Left unexcluded, the listed count balloons with duplicates and
# pre_push.test.js's own regression guard (every path matches `tools/<dir>/<file>.test.js`)
# fails on the worktree's path prefix — report #0055 traced a real 4-day-stale example of
# exactly this. Computed fresh from `git worktree list` every run, never hardcoded to
# `.worktrees/`/`.claude/worktrees/` alone, because a worktree can be created at any path
# (report #0012 — closing one path is not closing the class). Best-effort: no git, no
# worktree info, or a path that no longer resolves just means nothing extra is excluded —
# never a reason to fail this script's own contract of "did I find suites in $DIR".
FIND_ARGS=(. -type f -name '*.test.js' -not -path './.git/*' -not -path './node_modules/*')
HERE="$(pwd -P)"
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  while IFS= read -r wt; do
    [ -n "$wt" ] || continue
    wt_real="$(cd "$wt" 2>/dev/null && pwd -P)" || continue
    [ "$wt_real" = "$HERE" ] && continue
    case "$wt_real" in
      "$HERE"/*) FIND_ARGS+=(-not -path "./${wt_real#"$HERE"/}/*") ;;
    esac
  done < <(git worktree list --porcelain 2>/dev/null | awk '/^worktree /{print substr($0,10)}')
fi

# `find` is used rather than a glob so depth is not a property of the pattern, and the
# output is sorted so the two callers, and two runs, agree on the order.
found=0
while IFS= read -r t; do
  [ -n "$t" ] || continue
  printf '%s\n' "${t#./}"
  found=$((found + 1))
done < <(find "${FIND_ARGS[@]}" 2>/dev/null | LC_ALL=C sort)

[ "$found" -gt 0 ] || exit 1
exit 0
