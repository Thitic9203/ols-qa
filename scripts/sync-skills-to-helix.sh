#!/usr/bin/env bash
# sync-skills-to-helix.sh — propagate shared skill/reference/command edits from the
# ols-qa workspace into the helix plugin repo, then deploy a new helix version.
#
# Only files that ALSO exist in helix under skills/ | references/ | commands/ are synced
# (OLS-specific files like references/ols-project-guide.md never exist in helix -> never
# synced). NEW generic skills/ + commands/ files are NOT synced by default (they must be
# introduced to helix deliberately); set HELIX_SYNC_NEW=1 to include them — the secret
# guard still scans them, so an OLS file can never ride along.
#
# helix's own pre-commit hook (scripts/check-no-secrets.sh) is the HARD guard: if a copied
# file carries any OLS secret/credential the helix commit is BLOCKED, we revert the copy,
# and NOTHING is pushed. helix's pre-commit also auto-bumps the version = the deploy.
#
# Usage: sync-skills-to-helix.sh [FILE ...]   (no args = files changed in the last ols-qa commit)
# Env:   HELIX_REPO (default ~/GitHub/helix) ; HELIX_SYNC_PUSH=0 to skip push ;
#        HELIX_SYNC_NEW=1 to also create new generic skills/commands files in helix.

set -o pipefail
OLSQA="$(cd "$(dirname "$0")/.." && pwd)"
HELIX="${HELIX_REPO:-$HOME/GitHub/helix}"
PUSH="${HELIX_SYNC_PUSH:-1}"
SYNC_NEW="${HELIX_SYNC_NEW:-0}"

[ -d "$HELIX/.git" ] || { echo "sync: helix repo not found at $HELIX — skip"; exit 0; }
[ -x "$HELIX/scripts/check-no-secrets.sh" ] || { echo "sync: helix guard missing — ABORT (refuse to sync without the secret guard)"; exit 1; }

# --- changed files ---
if [ "$#" -gt 0 ]; then CHANGED="$(for a in "$@"; do printf '%s\n' "$a"; done)"
else CHANGED="$(cd "$OLSQA" && git diff --name-only HEAD~1 HEAD 2>/dev/null)"; fi

# --- keep only SHARED skill files (exist in both, under skills/|references/|commands/) ---
FILES=()          # to sync (relative paths)
SKIPPED_NEW=()    # generic-looking files not present in helix (new candidates)
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in skills/*|references/*|commands/*) ;; *) continue ;; esac
  [ -f "$OLSQA/$f" ] || continue     # skip deletions
  if [ -f "$HELIX/$f" ]; then
    FILES+=("$f")
  else
    # not in helix yet. references/* here holds OLS-only config -> never auto-create.
    case "$f" in
      skills/*|commands/*)
        if [ "$SYNC_NEW" = "1" ]; then FILES+=("$f"); else SKIPPED_NEW+=("$f"); fi ;;
    esac
  fi
done <<EOF
$CHANGED
EOF

if [ "${#SKIPPED_NEW[@]}" -gt 0 ]; then
  echo "sync: NOT syncing ${#SKIPPED_NEW[@]} new skills/commands file(s) absent from helix (set HELIX_SYNC_NEW=1 to include):"
  printf '  · %s\n' "${SKIPPED_NEW[@]}"
fi

[ "${#FILES[@]}" -gt 0 ] || { echo "sync: no shared skill files to sync — nothing to do"; exit 0; }

echo "sync: propagating to helix ($HELIX):"
printf '  · %s\n' "${FILES[@]}"

# --- LAYER: pre-scan the ols-qa SOURCE files BEFORE copying anything to helix ---
SRC_ABS=()
for f in "${FILES[@]}"; do SRC_ABS+=("$OLSQA/$f"); done
if ! "$HELIX/scripts/check-no-secrets.sh" "${SRC_ABS[@]}"; then
  echo "sync: ❌ OLS secret in ols-qa SOURCE file(s) — refusing to copy, NOTHING deployed."
  exit 1
fi

cd "$HELIX" || exit 1

# --- fail-closed: refuse to sync onto a dirty helix worktree (don't clobber WIP) ---
DIRTY=0
for f in "${FILES[@]}"; do
  if ! git diff --quiet -- "$f" 2>/dev/null || ! git diff --cached --quiet -- "$f" 2>/dev/null; then
    DIRTY=1; echo "sync: ⚠️ helix has uncommitted changes in $f"
  fi
done
if [ "$DIRTY" = "1" ]; then
  echo "sync: ❌ helix worktree dirty on target file(s) — ABORT (commit/stash helix first). NOTHING deployed."
  exit 1
fi

# --- pull helix latest (non-silent on failure), then copy files ---
if ! git pull --rebase --quiet origin main 2>/dev/null; then
  echo "sync: ⚠️ 'git pull --rebase origin main' failed (offline or diverged) — syncing onto local helix HEAD; push may need a manual pull/rebase."
fi
for f in "${FILES[@]}"; do
  mkdir -p "$HELIX/$(dirname "$f")"
  cp -f "$OLSQA/$f" "$HELIX/$f"
done

# --- EXPLICIT secret guard on the copied files (do not rely on the hook alone) ---
if ! ./scripts/check-no-secrets.sh "${FILES[@]}"; then
  echo "sync: ❌ OLS secret detected in files to sync — reverting copies, NOTHING deployed."
  git reset --quiet HEAD -- "${FILES[@]}" 2>/dev/null || true
  git checkout -- "${FILES[@]}" 2>/dev/null || true
  exit 1
fi

# --- stage + commit in helix (pre-commit hook re-guards on staged blobs + auto-bumps) ---
git add -- "${FILES[@]}"
if git diff --cached --quiet; then
  echo "sync: helix already up to date — nothing to commit"; exit 0
fi

COMMIT_BODY="$(printf '%s\n' "${FILES[@]}" | sed 's/^/- /')"
if git commit --quiet -m "chore(sync): pull shared skill updates from ols-qa

$COMMIT_BODY

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"; then
  echo "sync: committed to helix (version auto-bumped by pre-commit)."
  if [ "$PUSH" = "1" ]; then
    git push --quiet origin main && echo "sync: ✅ pushed helix (deployed)." || echo "sync: ⚠️ push failed — commit is local; push helix manually."
  else
    echo "sync: HELIX_SYNC_PUSH=0 — committed but not pushed."
  fi
else
  echo "sync: ❌ helix commit BLOCKED (secret guard or hook failed) — reverting, NOTHING deployed."
  git reset --quiet HEAD -- "${FILES[@]}" 2>/dev/null || true
  git checkout -- "${FILES[@]}" 2>/dev/null || true
  exit 1
fi
