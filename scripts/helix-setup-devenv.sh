#!/usr/bin/env bash
# helix-setup-devenv.sh — opt-in: configure your GLOBAL Claude Code environment to
# reduce how often the agent asks you questions while developing Helix.
#
# What it does (idempotent, non-destructive, reversible):
#   1. Merges a safe Bash allowlist + defaultMode:acceptEdits into ~/.claude/settings.json
#   2. Injects "Bias toward action" + "Memory discipline" rules into ~/.claude/CLAUDE.md
#      inside a managed marker block
#   3. Backs up both files before touching them
#   4. Records opt-in so `helix-auto-update.sh` can keep them in sync on future updates
#
# Run once:        bash scripts/helix-setup-devenv.sh
# Re-sync:         bash scripts/helix-setup-devenv.sh        (safe to re-run anytime)
# Remove:          bash scripts/helix-setup-devenv.sh --uninstall
#
# This is OPT-IN on purpose: it changes your global permission posture (acceptEdits +
# Bash allowlist). It is NOT run automatically without your consent.

set -uo pipefail

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"
STATE_DIR="${HELIX_STATE_DIR:-$HOME/.helix}"
OPTIN_MARKER="$STATE_DIR/.devenv-opted-in"
MARK_START="<!-- HELIX-DEVENV:START (managed by scripts/helix-setup-devenv.sh — do not edit inside) -->"
MARK_END="<!-- HELIX-DEVENV:END -->"

ALLOW_RULES='[
  "Bash(git status)","Bash(git status *)","Bash(git diff *)","Bash(git log *)",
  "Bash(git show *)","Bash(git add *)","Bash(git commit *)","Bash(git branch)",
  "Bash(git branch *)","Bash(git checkout -b *)","Bash(git stash *)",
  "Bash(git fetch *)","Bash(git pull --rebase *)",
  "Bash(rtk *)","Bash(ls *)","Bash(cat *)","Bash(find *)","Bash(grep *)","Bash(rg *)",
  "Bash(which *)","Bash(node *)","Bash(npx *)","Bash(npm run *)","Bash(python3 *)",
  "Bash(wc *)","Bash(head *)","Bash(tail *)","Bash(sort *)","Bash(diff *)",
  "Bash(mkdir *)","Bash(basename *)","Bash(dirname *)","Bash(realpath *)",
  "Bash(stat *)","Bash(chmod +x *)",
  "Bash(gh pr view *)","Bash(gh pr list *)","Bash(gh pr diff *)",
  "Bash(gh issue view *)","Bash(gh issue list *)","Bash(gh run view *)",
  "Bash(gh run list *)","Bash(gh repo view *)","Bash(gh api *)",
  "Bash(bash scripts/*)"
]'

read -r -d '' RULES_BLOCK <<'RULES'
## Bias toward action — do, ask less (managed by Helix devenv)

If the instruction is clear → do it, do not re-ask. If 2+ good approaches are
close → pick the better one and say which (do not ask).

Ask only when ALL three are true:
1. There is more than one genuinely different approach (not just style)
2. There is production / user / cost / security impact
3. No default decision in CLAUDE.md already answers it

When you do ask: ask once, bundled, with a recommendation + reason.

## Memory discipline — remember what was asked

- When the user answers a preference/approach question → save it as a feedback memory.
- Before asking, check memory for a prior answer; if found, reuse it (do not re-ask).
RULES

log() { echo "[helix-devenv] $*"; }

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    log "ERROR: jq is required to safely edit settings.json. Install jq, then re-run."
    log "  macOS: brew install jq"
    exit 1
  fi
}

backup() {
  local f="$1"
  [ -f "$f" ] || return 0
  local b="$f.helix-bak.$(date +%Y%m%d%H%M%S)"
  cp "$f" "$b" && log "backed up $f -> $b"
}

merge_settings() {
  require_jq
  mkdir -p "$CLAUDE_DIR"
  [ -f "$SETTINGS" ] || echo '{}' > "$SETTINGS"
  backup "$SETTINGS"
  local tmp
  tmp=$(mktemp)
  jq --argjson rules "$ALLOW_RULES" '
    .permissions = (.permissions // {})
    | .permissions.defaultMode = (.permissions.defaultMode // "acceptEdits")
    | .permissions.allow = ((.permissions.allow // []) + $rules | unique)
  ' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  log "merged allowlist + defaultMode into $SETTINGS"
}

unmerge_settings() {
  require_jq
  [ -f "$SETTINGS" ] || return 0
  backup "$SETTINGS"
  local tmp
  tmp=$(mktemp)
  # Remove only the rules we added; leave user's own rules and other settings intact.
  jq --argjson rules "$ALLOW_RULES" '
    .permissions.allow = ((.permissions.allow // []) - $rules)
  ' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  log "removed Helix allowlist from $SETTINGS (defaultMode left as-is)"
}

write_claude_md() {
  mkdir -p "$CLAUDE_DIR"
  [ -f "$CLAUDE_MD" ] || touch "$CLAUDE_MD"
  backup "$CLAUDE_MD"
  local tmp rules
  tmp=$(mktemp)
  rules=$(mktemp)
  printf '%s\n' "$RULES_BLOCK" > "$rules"
  # Robust insert-or-replace via python3 (idempotent on the marker block)
  python3 - "$CLAUDE_MD" "$MARK_START" "$MARK_END" "$rules" > "$tmp" <<'PY'
import sys
path, mark_s, mark_e, rules_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
text = open(path).read()
rules = open(rules_path).read().rstrip("\n")
block = f"{mark_s}\n{rules}\n{mark_e}"
if mark_s in text and mark_e in text:
    pre = text[:text.index(mark_s)]
    post = text[text.index(mark_e)+len(mark_e):]
    out = pre + block + post
else:
    sep = "" if text == "" else ("\n" if text.endswith("\n") else "\n\n")
    out = text + sep + "\n" + block + "\n"
sys.stdout.write(out)
PY
  mv "$tmp" "$CLAUDE_MD"
  rm -f "$rules" 2>/dev/null || true
  log "wrote managed rules block into $CLAUDE_MD"
}

remove_claude_md() {
  [ -f "$CLAUDE_MD" ] || return 0
  grep -qF "$MARK_START" "$CLAUDE_MD" || { log "no Helix block in $CLAUDE_MD"; return 0; }
  backup "$CLAUDE_MD"
  local tmp
  tmp=$(mktemp)
  python3 - "$CLAUDE_MD" "$MARK_START" "$MARK_END" > "$tmp" <<'PY'
import sys
path, mark_s, mark_e = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(path).read()
if mark_s in text and mark_e in text:
    pre = text[:text.index(mark_s)].rstrip("\n")
    post = text[text.index(mark_e)+len(mark_e):].lstrip("\n")
    out = (pre + "\n" + post).strip("\n") + "\n"
else:
    out = text
sys.stdout.write(out)
PY
  mv "$tmp" "$CLAUDE_MD"
  log "removed managed rules block from $CLAUDE_MD"
}

case "${1:-}" in
  --uninstall)
    log "uninstalling Helix devenv config..."
    unmerge_settings
    remove_claude_md
    rm -f "$OPTIN_MARKER"
    log "done. (backups kept; defaultMode not reverted to avoid surprising you)"
    ;;
  *)
    log "configuring global Claude Code devenv (opt-in)..."
    merge_settings
    write_claude_md
    mkdir -p "$STATE_DIR" && date +%s > "$OPTIN_MARKER"
    log "done. Restart Claude Code for settings to take effect."
    log "Opted in — helix-auto-update.sh will keep this in sync on future updates."
    log "To remove: bash scripts/helix-setup-devenv.sh --uninstall"
    ;;
esac
