#!/bin/bash
# Whose change is this? — for a worktree that several sessions share.
#
#   bash scripts/whose-change.sh [file ...]      (no args = every modified tracked file)
#
#   STALE   <file>   its exact content already exists in this repo's history, at <commit>.
#                    Nobody authored it here; it is a leftover checkout. Safe to restore.
#   EDITED  <file>   its content appears nowhere in history — someone typed it. Leave it.
#
#   exit 0  every file classified   ·   exit 2  could not look (not a repo, unreadable, git failed)
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

# Paths from git are relative to the repo ROOT, and so are the `<commit>:<path>` lookups
# below. Running from a subdirectory therefore has to resolve against the root too — the
# first version mixed the two bases, so from `sub/` every file came back UNREADABLE and the
# tool exited 0 having classified nothing at all.
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "cannot find the repo root" >&2; exit 2; }
cd "$ROOT" || { echo "cannot enter the repo root: $ROOT" >&2; exit 2; }

FILES=("$@")
if [ "${#FILES[@]}" -eq 0 ]; then
  # A process substitution discards the command's exit status, so `git diff` failing looked
  # exactly like "nothing is modified" and this printed reassurance over a broken repo.
  # Capture first, check the status, then split.
  if ! LIST="$(git diff --name-only 2>&1)"; then
    echo "REFUSE: git could not list the modified files: $LIST" >&2
    exit 2
  fi
  while IFS= read -r f; do [ -n "$f" ] && FILES+=("$f"); done <<< "$LIST"
fi
[ "${#FILES[@]}" -gt 0 ] || { echo "no modified tracked files"; exit 0; }

unclassified=0
for f in "${FILES[@]}"; do
  if [ ! -r "$f" ]; then
    echo "UNREADABLE $f"
    unclassified=$((unclassified + 1))
    continue
  fi
  h="$(git hash-object -- "$f" 2>/dev/null)"
  if [ -z "$h" ]; then
    echo "UNREADABLE $f"
    unclassified=$((unclassified + 1))
    continue
  fi

  # Walk this file's own history — the blob either appeared in some commit or it did not.
  #
  # `--reflog` IS the point, not decoration. Plain `--all` walks only what a ref still
  # points at, and the leftover this tool exists for is written by a commit that `reset
  # --soft` or a re-checkout has just made unreachable. Measured 2026-09-06 by reproducing
  # report #0007's own shape: `--all` found 1 commit and called the leftover EDITED —
  # "somebody typed it, leave it" — while `--all --reflog` found the commit it came from
  # and the answer is STALE. A tool that misreads the case it was written for is worse than
  # no tool, because its answer is trusted.
  found=""
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    if [ "$(git rev-parse -q --verify "$c:$f" 2>/dev/null)" = "$h" ]; then found="$c"; break; fi
  done < <(git rev-list --all --reflog -- "$f" 2>/dev/null)

  if [ -n "$found" ]; then
    printf 'STALE  %s  (identical to %s — a leftover checkout, not authored here)\n' "$f" "${found:0:9}"
  else
    printf 'EDITED %s  (content exists nowhere in history — somebody typed it, leave it)\n' "$f"
  fi
done

# "Could not look at some of them" is not "classified all of them". The header above states
# 2 for that, and the previous version fell through to an unconditional `exit 0`, so a
# caller doing the right thing was told the opposite of the truth.
[ "$unclassified" -eq 0 ] || exit 2
exit 0
