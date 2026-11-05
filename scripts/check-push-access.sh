#!/bin/bash
# check-push-access.sh — can the signed-in GitHub account push to this repo's origin?
#
# Run it before the test suite and before `git push`. git takes its HTTPS token from
# `gh auth git-credential`, so the account that pushes is whichever one `gh` is signed in as,
# not `git config user.name`. 2026-11-02: a push was prepared, tested and refused with 403
# because gh was signed in as an account with pull-only access.
#
#   bash scripts/check-push-access.sh [remote]     (default remote: origin)
#
# exit 0  PUSH-OK          <account> can push to <owner/repo>
# exit 1  NO-PUSH-ACCESS   <account> can only read — sign in to gh as an account that can write
# exit 2  UNCHECKABLE      gh missing / not signed in / remote not on github.com / API failed
#                          — not checked is not allowed
set -uo pipefail

REMOTE="${1:-origin}"

if ! command -v gh >/dev/null 2>&1; then
  echo "UNCHECKABLE  gh is not installed — cannot tell which account will push"; exit 2
fi

URL="$(git remote get-url "$REMOTE" 2>/dev/null)" || URL=""
case "$URL" in
  https://github.com/*) SLUG="${URL#https://github.com/}" ;;
  git@github.com:*)     SLUG="${URL#git@github.com:}" ;;
  ssh://git@github.com/*) SLUG="${URL#ssh://git@github.com/}" ;;
  *) echo "UNCHECKABLE  remote '$REMOTE' is not a github.com URL: ${URL:-<none>}"; exit 2 ;;
esac
SLUG="${SLUG%.git}"; SLUG="${SLUG%/}"

LOGIN="$(gh api user --jq .login 2>/dev/null)" || LOGIN=""
if [ -z "$LOGIN" ]; then
  echo "UNCHECKABLE  gh is not signed in (gh api user failed) — run: gh auth login"; exit 2
fi

PUSH="$(gh api "repos/$SLUG" --jq .permissions.push 2>/dev/null)" || PUSH=""
case "$PUSH" in
  true)  echo "PUSH-OK  $LOGIN can push to $SLUG"; exit 0 ;;
  false) echo "NO-PUSH-ACCESS  $LOGIN can only read $SLUG — sign in to gh as an account with write access (gh auth login / gh auth switch), or ask the owner for access"; exit 1 ;;
  *)     echo "UNCHECKABLE  could not read permissions for $SLUG as $LOGIN (got: ${PUSH:-<empty>})"; exit 2 ;;
esac
