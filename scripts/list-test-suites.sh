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

found=0
shopt -s nullglob
for t in tools/*/*.test.js; do
  [ -f "$t" ] || continue
  printf '%s\n' "$t"
  found=$((found + 1))
done
shopt -u nullglob

[ "$found" -gt 0 ] || exit 1
exit 0
