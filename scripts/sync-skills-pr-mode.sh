#!/usr/bin/env bash
# sync-skills-pr-mode.sh — HELIX_SYNC_MODE=pr of sync-skills-to-helix.sh (sourced by it, never run alone).
# Spec: pluton-ai-agent docs/sdd/helix-auto-sync H1–H6, H9.
#
# Helix main is protected by ruleset 27092786 (required checks pr-check, token-budget, token-budget-raise),
# so a push to main is refused. This mode proposes the change as ONE pull request instead:
#   1. fetch helix origin/main and origin/sync/ols-qa-auto; never touch the helix checkout itself —
#      all work happens in a temporary detached worktree on helix origin/main;
#   2. a sync branch that carries a commit the sync did not make (no Synced-From trailer, e.g. the owner's
#      register entry) is never overwritten: the new file list goes to a PR comment and the run ends;
#   3. copy the files read from the ols-qa origin/main commit (SRC_COMMIT), secret guard, plugin.json,
#      one commit with "Synced-From: ols-qa@<sha>" (helix hooks run as usual), helix gates;
#   4. report only: check-rule-lines.sh origin/main HEAD ("removed" lines = rewords needing owner
#      approval), ci-token-budget.sh pr origin/main, helix-parity.sh — rule-line-register.json and
#      token-budget.json are never written (a staged change to either aborts the run);
#   5. push sync/ols-qa-auto with --force-with-lease (never main), then gh pr edit the open PR or
#      gh pr create one. Never gh pr merge.
#
# Inputs from the caller: OLSQA HELIX SRC_COMMIT SRC_DIR FILES SKIPPED_NEW SKIPPED_REF, functions
# register_new_skills and run_helix_gates. Env: HELIX_GH_REPO=<owner/repo> (default: helix origin URL).

SYNC_BRANCH="sync/ols-qa-auto"

# helix_slug: owner/repo of helix for gh, from HELIX_GH_REPO or helix's origin URL
helix_slug() {
  if [ -n "${HELIX_GH_REPO:-}" ]; then printf '%s\n' "$HELIX_GH_REPO"; return 0; fi
  local url
  url="$(git -C "$HELIX" remote get-url origin 2>/dev/null)" || return 1
  printf '%s\n' "$url" | sed -nE 's#^(https://github\.com/|git@github\.com:|ssh://git@github\.com/)([^/]+/[^/]+)$#\2#p' | sed 's/\.git$//' | grep .
}

# fenced <text>: a markdown text block, so helix lines never render as markup
fenced() { printf '```text\n%s\n```\n' "$1"; }

sync_pr_mode() {
  local slug open remote_br="" foreign wtbase wt short body rl_out rl_rc tb_out tb_rc parity_out removed f

  slug="$(helix_slug)" || { echo "sync: ❌ cannot tell which GitHub repo helix is (set HELIX_GH_REPO). NOTHING deployed."; return 1; }
  command -v gh >/dev/null 2>&1 || { echo "sync: ❌ gh CLI not found — cannot open the helix PR. NOTHING deployed."; return 1; }

  git -C "$HELIX" fetch --quiet origin "+refs/heads/main:refs/remotes/origin/main" \
    || { echo "sync: ❌ cannot fetch helix origin/main. NOTHING deployed."; return 1; }
  git -C "$HELIX" ls-remote --exit-code --heads origin "$SYNC_BRANCH" >/dev/null 2>&1
  case $? in
    0)
      git -C "$HELIX" fetch --quiet origin "+refs/heads/$SYNC_BRANCH:refs/remotes/origin/$SYNC_BRANCH" \
        || { echo "sync: ❌ cannot fetch helix $SYNC_BRANCH. NOTHING deployed."; return 1; }
      remote_br="$(git -C "$HELIX" rev-parse "refs/remotes/origin/$SYNC_BRANCH")" || return 1 ;;
    2) remote_br="" ;;
    *) echo "sync: ❌ cannot list helix branches (ls-remote failed). NOTHING deployed."; return 1 ;;
  esac

  open="$(gh pr list -R "$slug" --head "$SYNC_BRANCH" --base main --state open --json number --jq '.[0].number // empty')" \
    || { echo "sync: ❌ gh pr list failed for $slug. NOTHING deployed."; return 1; }
  open="$(printf '%s' "$open" | tr -d '[:space:]')"

  # --- a commit on the sync branch that the sync did not make is kept, never force-pushed away ---
  if [ -n "$remote_br" ]; then
    foreign=""
    while IFS= read -r c; do
      [ -n "$c" ] || continue
      if [ -z "$(git -C "$HELIX" log -1 --format='%(trailers:key=Synced-From,valueonly)' "$c" | tr -d '[:space:]')" ]; then
        foreign="$foreign $c"
      fi
    done <<EOF
$(git -C "$HELIX" rev-list --no-merges "refs/remotes/origin/main..$remote_br")
EOF
    if [ -n "$foreign" ]; then
      echo "sync: ⚠️ $SYNC_BRANCH carries commit(s) not made by the sync:${foreign} — leaving the branch as is."
      if [ -n "$open" ]; then
        body="$(mktemp)" || return 1
        {
          echo "The sync did not rebuild \`$SYNC_BRANCH\`: it carries commit(s) the sync did not make (${foreign# })."
          echo "These files changed on ols-qa \`main\` up to ols-qa@${SRC_COMMIT} and still need to reach helix:"
          printf -- '- `%s`\n' "${FILES[@]}"
        } > "$body"
        gh pr comment "$open" -R "$slug" --body-file "$body" || { rm -f "$body"; echo "sync: ❌ gh pr comment failed."; return 1; }
        rm -f "$body"
        echo "sync: listed the new files on helix PR #$open."
      fi
      return 0
    fi
  fi

  # --- temporary worktree on helix origin/main: the helix checkout is never written ---
  wtbase="$(mktemp -d)" || { echo "sync: ❌ cannot create a temp dir. NOTHING deployed."; return 1; }
  wt="$wtbase/helix"
  trap 'rm -rf "$SRC_DIR"; git -C "$HELIX" worktree remove --force "$wt" >/dev/null 2>&1; rm -rf "$wtbase"; git -C "$HELIX" worktree prune >/dev/null 2>&1' EXIT
  git -C "$HELIX" worktree add --quiet --detach "$wt" refs/remotes/origin/main \
    || { echo "sync: ❌ cannot create a helix worktree on origin/main. NOTHING deployed."; return 1; }
  cd "$wt" || return 1

  for f in "${FILES[@]}"; do
    mkdir -p "$(dirname "$f")"
    cp -f "$SRC_DIR/$f" "$f"
  done
  if ! ./scripts/check-no-secrets.sh "${FILES[@]}"; then
    echo "sync: ❌ OLS secret detected in files to sync — NOTHING pushed."
    return 1
  fi
  register_new_skills || { echo "sync: ❌ could not register new skill(s) in plugin.json — NOTHING pushed."; return 1; }
  git add -- "${FILES[@]}"
  if git diff --cached --quiet; then
    echo "sync: helix main already carries these files — nothing to propose"
    return 0
  fi
  if git diff --cached --name-only | grep -qxE 'rule-line-register\.json|token-budget\.json'; then
    echo "sync: ❌ the staged change touches rule-line-register.json or token-budget.json — only the owner edits those. NOTHING pushed."
    return 1
  fi

  short="$(git -C "$OLSQA" rev-parse --short "$SRC_COMMIT")"
  if ! git commit --quiet -m "chore(sync): shared skill updates from ols-qa@$short

$(printf -- '- %s\n' "${FILES[@]}")

Synced-From: ols-qa@$SRC_COMMIT
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"; then
    echo "sync: ❌ helix commit refused (secret guard, token budget or another helix hook, see above) — NOTHING pushed."
    return 1
  fi
  # the helix hooks run on the commit; whatever they stage must still leave the two owner files alone
  if git diff --name-only refs/remotes/origin/main HEAD | grep -qxE 'rule-line-register\.json|token-budget\.json'; then
    echo "sync: ❌ the sync commit touches rule-line-register.json or token-budget.json — NOTHING pushed."
    return 1
  fi
  GATE_FAILED=""
  if ! run_helix_gates; then
    echo "sync: ❌ $GATE_FAILED — NOTHING pushed."
    return 1
  fi

  # --- report only (H3, H4): the PR's own required checks stay the gate ---
  if [ -f scripts/check-rule-lines.sh ]; then
    rl_out="$(bash scripts/check-rule-lines.sh origin/main HEAD 2>&1)"; rl_rc=$?
  else
    rl_out="scripts/check-rule-lines.sh missing on helix main — could not check"; rl_rc=2
  fi
  if [ -f scripts/ci-token-budget.sh ]; then
    tb_out="$(bash scripts/ci-token-budget.sh pr origin/main 2>&1)"; tb_rc=$?
  else
    tb_out="scripts/ci-token-budget.sh missing on helix main — could not check"; tb_rc=2
  fi

  if ! git push --quiet --force-with-lease="refs/heads/$SYNC_BRANCH:$remote_br" origin "HEAD:refs/heads/$SYNC_BRANCH"; then
    echo "sync: ❌ push of $SYNC_BRANCH failed (another run moved it, or a helix pre-push hook refused) — no PR change."
    return 1
  fi
  echo "sync: pushed helix $SYNC_BRANCH (helix main untouched)."

  parity_out="$(HELIX_REPO="$HELIX" OLS_REPO="$OLSQA" bash "$OLSQA/scripts/helix-parity.sh" 2>&1)"

  removed="$(printf '%s\n' "$rl_out" | grep '^rule-lines: removed from ' | sed 's/^rule-lines: removed from /- /')"
  body="$wtbase/body.md"
  {
    echo "Automatic sync of shared skill files from ols-qa \`main\` (pluton-ai-agent \`docs/sdd/helix-auto-sync\` H1, H2)."
    echo "Opened by \`scripts/sync-skills-to-helix.sh\` (\`HELIX_SYNC_MODE=pr\`). The sync never merges this PR (H9)."
    echo
    echo "### Files (ols-qa@$short)"
    printf -- '- `%s`\n' "${FILES[@]}"
    if [ "${#SKIPPED_NEW[@]}" -gt 0 ] || [ "${#SKIPPED_REF[@]}" -gt 0 ]; then
      echo
      echo "### Not synced: new in ols-qa, absent in helix"
      [ "${#SKIPPED_NEW[@]}" -eq 0 ] || printf -- '- `%s`\n' "${SKIPPED_NEW[@]}"
      [ "${#SKIPPED_REF[@]}" -eq 0 ] || printf -- '- `%s` (references/: a shared file linking to it ships a dangling link)\n' "${SKIPPED_REF[@]}"
    fi
    echo
    echo "### Rule rewords — owner approval needed"
    if [ -n "$removed" ]; then
      echo "\`scripts/check-rule-lines.sh origin/main HEAD\` reports these rule lines removed or reworded. \`token-budget\` stays red until the owner adds each to \`rule-line-register.json\` in a \`[rule-reword]\` PR:"
      printf '%s\n' "$removed"
    elif [ "$rl_rc" -eq 0 ]; then
      echo "None (\`check-rule-lines.sh\` exit 0)."
    else
      echo "Could not check (\`check-rule-lines.sh\` exit $rl_rc):"
      fenced "$(printf '%s\n' "$rl_out" | tail -15)"
    fi
    echo "The sync never edits \`rule-line-register.json\` (H3)."
    echo
    echo "### Token budget"
    echo "\`scripts/ci-token-budget.sh pr origin/main\` exit $tb_rc:"
    fenced "$(printf '%s\n' "$tb_out" | tail -15)"
    echo "The sync never edits \`token-budget.json\` (H4)."
    echo
    echo "### Helix parity (reported, not synced)"
    fenced "$parity_out"
    echo
    echo "Synced-From: ols-qa@$SRC_COMMIT"
  } > "$body"

  local title="chore(sync): shared skill updates from ols-qa@$short"
  if [ -n "$open" ]; then
    gh pr edit "$open" -R "$slug" --title "$title" --body-file "$body" \
      || { echo "sync: ❌ branch pushed but gh pr edit #$open failed."; return 1; }
    echo "sync: ✅ updated helix PR #$open."
  else
    gh pr create -R "$slug" --base main --head "$SYNC_BRANCH" --title "$title" --body-file "$body" \
      || { echo "sync: ❌ branch pushed but gh pr create failed."; return 1; }
    echo "sync: ✅ opened the helix sync PR."
  fi
  return 0
}
