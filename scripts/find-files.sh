#!/bin/bash
# Searches for files with the system find, and refuses to call an empty result "none found"
# unless a control path known to exist was found by the very same search.
#
# Why (report #0116): a shell hook rewrote `find` into a filter that rejected the predicates,
# printed nothing and exited 1. That empty output was reported as "0 files on disk" while the
# files were there. An empty result only means "absent" when the search is proven to have run.
#
#   scripts/find-files.sh --control <path-known-to-exist> <root> [-- <find predicates...>]
#
#   e.g. scripts/find-files.sh --control scripts/list-test-suites.sh scripts -- \
#          -name 'run-test-suites.sh' -not -path '*/node_modules/*'
#
# The control must live under <root>; it is matched with -path inside the same traversal.
# stdout: one absolute path per match, then `COUNT <n> (control found: <control>)`.
# exit 0 = at least 1 match · 1 = 0 matches and the control was found (verified absent) ·
#      2 = UNVERIFIABLE (bad usage, control missing or not reached, find failed). A 2 never
#      prints a COUNT line, so it can't be read as "0 found".
set -uo pipefail

FIND_BIN=/usr/bin/find   # absolute on purpose: never a `find` shim or a rewritten command

unverifiable() { echo "UNVERIFIABLE: $*" >&2; exit 2; }

CONTROL=""
ROOT_ARG=""
PRED=()
while [ $# -gt 0 ]; do
  case "$1" in
    --control) [ $# -ge 2 ] || unverifiable "--control needs a path"; CONTROL="$2"; shift 2 ;;
    --) shift; PRED=("$@"); break ;;
    *) [ -z "$ROOT_ARG" ] || unverifiable "unexpected argument: $1"; ROOT_ARG="$1"; shift ;;
  esac
done

[ -n "$CONTROL" ] || unverifiable "no --control given — a search without a known-present path cannot prove absence"
[ -n "$ROOT_ARG" ] || unverifiable "no search root given"
[ -x "$FIND_BIN" ] || unverifiable "$FIND_BIN is not executable"
[ -d "$ROOT_ARG" ] || unverifiable "root is not a directory: $ROOT_ARG"
[ -e "$CONTROL" ] || unverifiable "control does not exist: $CONTROL"

ROOT="$(cd "$ROOT_ARG" 2>/dev/null && pwd -P)" || unverifiable "cannot enter root: $ROOT_ARG"
CTRL_DIR="$(cd "$(dirname "$CONTROL")" 2>/dev/null && pwd -P)" || unverifiable "cannot resolve control: $CONTROL"
CTRL="$CTRL_DIR/$(basename "$CONTROL")"

# -path takes a glob; escape its metacharacters so the control is matched literally.
CTRL_PAT="$(printf '%s' "$CTRL" | sed 's/[][*?\\]/\\&/g')"

EXPR=( \( -path "$CTRL_PAT" -exec printf 'CONTROL\t%s\n' {} \; -false \) -o )
if [ ${#PRED[@]} -gt 0 ]; then
  EXPR+=( \( "${PRED[@]}" \) -print )
else
  EXPR+=( -print )
fi

ERR_FILE="$(mktemp)" || unverifiable "mktemp failed"
trap 'rm -f "$ERR_FILE"' EXIT
OUT="$("$FIND_BIN" "$ROOT" "${EXPR[@]}" 2>"$ERR_FILE")"
RC=$?
if [ "$RC" -ne 0 ]; then
  cat "$ERR_FILE" >&2
  unverifiable "find exited $RC — the search did not complete"
fi

control_found=0
count=0
while IFS= read -r line; do
  [ -n "$line" ] || continue
  case "$line" in
    "CONTROL	"*) control_found=1 ;;
    *) printf '%s\n' "$line"; count=$((count + 1)) ;;
  esac
done <<< "$OUT"

[ "$control_found" -eq 1 ] || unverifiable "control $CTRL was not found by the same search under $ROOT — an empty result here proves nothing"

echo "COUNT $count (control found: $CTRL)"
[ "$count" -gt 0 ] && exit 0
exit 1
