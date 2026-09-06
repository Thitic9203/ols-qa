#!/bin/bash
# Whose change is this? — for a worktree that several sessions share.
#
#   bash scripts/whose-change.sh [file ...]      (no args = every modified tracked file)
#
#   STALE   <file>   its exact content already exists in this repo's history, at <commit>.
#                    Nobody authored it here; it is a leftover checkout. Safe to restore.
#   EDITED  <file>   its content appears nowhere in history — someone typed it. Leave it.
#
#   exit 0  every file classified   ·   exit 2  could not look (not a repo, unreadable)
#
# `git status` says a file is modified. It never says modified BY WHOM, and in this repo
# the standing rule is that other sessions work in the same worktree — so an unexplained
# ` M` reads as "someone else's work" unless something checks. On 2026-09-06 that guess was
# reported to the owner three times about README.md, which was really a leftover from the
# SessionStart hook's own `pull --ff-only` (reflog 00:49:54), byte-identical to commit
# fc65ef3. It blocked `git pull` for every session for about an hour while being described
# as untouchable. Report #0007.
#
# The measurement that settles it is one hash comparison, and it was always available.
set -uo pipefail

git rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git repository" >&2; exit 2; }

FILES=("$@")
if [ "${#FILES[@]}" -eq 0 ]; then
  while IFS= read -r f; do [ -n "$f" ] && FILES+=("$f"); done < <(git diff --name-only)
fi
[ "${#FILES[@]}" -gt 0 ] || { echo "no modified tracked files"; exit 0; }

for f in "${FILES[@]}"; do
  if [ ! -r "$f" ]; then
    echo "UNREADABLE $f"
    continue
  fi
  h="$(git hash-object -- "$f" 2>/dev/null)"
  if [ -z "$h" ]; then
    echo "UNREADABLE $f"
    continue
  fi

  # Walk this file's own history — the blob either appeared in some commit or it did not.
  found=""
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    if [ "$(git rev-parse -q --verify "$c:$f" 2>/dev/null)" = "$h" ]; then found="$c"; break; fi
  done < <(git rev-list --all -- "$f" 2>/dev/null)

  if [ -n "$found" ]; then
    printf 'STALE  %s  (identical to %s — a leftover checkout, not authored here)\n' "$f" "${found:0:9}"
  else
    printf 'EDITED %s  (content exists nowhere in history — somebody typed it, leave it)\n' "$f"
  fi
done
exit 0
