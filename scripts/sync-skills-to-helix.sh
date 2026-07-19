#!/usr/bin/env bash
# sync-skills-to-helix.sh — propagate shared skill/reference/command edits from the
# ols-qa workspace into the helix plugin repo, then deploy a new helix version.
#
# Only files that ALSO exist in helix under skills/ | references/ | commands/ are synced
# (OLS-specific files like references/ols-project-guide.md never exist in helix -> never synced).
# helix's own pre-commit hook (scripts/check-no-secrets.sh) is the HARD guard: if a copied
# file carries any OLS secret/credential the helix commit is BLOCKED, we revert the copy,
# and NOTHING is pushed. helix's pre-commit also auto-bumps the version = the deploy.
#
# Usage: sync-skills-to-helix.sh [FILE ...]   (no args = files changed in the last ols-qa commit)
# Env:   HELIX_REPO (default ~/GitHub/helix) ; HELIX_SYNC_PUSH=0 to skip push.

set -o pipefail
OLSQA="$(cd "$(dirname "$0")/.." && pwd)"
HELIX="${HELIX_REPO:-$HOME/GitHub/helix}"
PUSH="${HELIX_SYNC_PUSH:-1}"

[ -d "$HELIX/.git" ] || { echo "sync: helix repo not found at $HELIX — skip"; exit 0; }
[ -x "$HELIX/scripts/check-no-secrets.sh" ] || { echo "sync: helix guard missing — ABORT (refuse to sync without the secret guard)"; exit 1; }

# --- changed files ---
if [ "$#" -gt 0 ]; then CHANGED="$(for a in "$@"; do echo "$a"; done)"
else CHANGED="$(cd "$OLSQA" && git diff --name-only HEAD~1 HEAD 2>/dev/null)"; fi

# --- keep only SHARED skill files (exist in both, under skills/|references/|commands/) ---
FILES=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in skills/*|references/*|commands/*) ;; *) continue ;; esac
  [ -f "$OLSQA/$f" ] || continue     # skip deletions
  [ -f "$HELIX/$f" ] || continue     # only files present in helix (generic/shared)
  FILES="$FILES$f
"
done <<EOF
$CHANGED
EOF

FILES="$(printf '%s' "$FILES" | sed '/^$/d')"
[ -n "$FILES" ] || { echo "sync: no shared skill files changed — nothing to do"; exit 0; }

echo "sync: propagating to helix ($HELIX):"
printf '%s\n' "$FILES" | sed 's/^/  · /'

# --- LAYER: pre-scan the ols-qa SOURCE files BEFORE copying anything to helix ---
SRC_ABS=""
for f in $FILES; do [ -n "$f" ] && SRC_ABS="$SRC_ABS $OLSQA/$f"; done
# shellcheck disable=SC2086
if ! "$HELIX/scripts/check-no-secrets.sh" $SRC_ABS; then
  echo "sync: ❌ OLS secret in ols-qa SOURCE file(s) — refusing to copy, NOTHING deployed."
  exit 1
fi

# --- pull helix latest, copy files ---
( cd "$HELIX" && git pull --rebase --quiet origin main 2>/dev/null ) || true
printf '%s\n' "$FILES" | while IFS= read -r f; do
  [ -n "$f" ] || continue
  mkdir -p "$HELIX/$(dirname "$f")"
  cp -f "$OLSQA/$f" "$HELIX/$f"
done

cd "$HELIX" || exit 1

# --- EXPLICIT secret guard on the copied files (do not rely on the hook alone) ---
# shellcheck disable=SC2086
if ! ./scripts/check-no-secrets.sh $FILES; then
  echo "sync: ❌ OLS secret detected in files to sync — reverting copies, NOTHING deployed."
  # shellcheck disable=SC2086
  git checkout -- $FILES 2>/dev/null || true
  exit 1
fi

# --- stage + commit in helix (pre-commit hook also re-guards + auto-bumps version) ---
# shellcheck disable=SC2086
git add $(printf '%s ' $FILES)
if git diff --cached --quiet; then
  echo "sync: helix already up to date — nothing to commit"; exit 0
fi

if git commit --quiet -m "chore(sync): pull shared skill updates from ols-qa

$(printf '%s\n' $FILES | sed 's/^/- /')

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"; then
  echo "sync: committed to helix (version auto-bumped by pre-commit)."
  if [ "$PUSH" = "1" ]; then
    git push --quiet origin main && echo "sync: ✅ pushed helix (deployed)." || echo "sync: ⚠️ push failed — commit is local; push helix manually."
  else
    echo "sync: HELIX_SYNC_PUSH=0 — committed but not pushed."
  fi
else
  echo "sync: ❌ helix commit BLOCKED (secret guard or hook failed) — reverting copied files, NOTHING deployed."
  # shellcheck disable=SC2086
  git checkout -- $(printf '%s ' $FILES) 2>/dev/null || true
  git reset --quiet HEAD $(printf '%s ' $FILES) 2>/dev/null || true
  exit 1
fi
