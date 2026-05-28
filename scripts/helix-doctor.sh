#!/usr/bin/env bash
# Helix install health check — symlinks, version, optional workspace link hint.
#
# Usage:
#   bash ~/.helix/tc-fe-prep/scripts/helix-doctor.sh
#   HELIX_REPO_DIR=/path/to/helix bash scripts/helix-doctor.sh
#   HELIX_LINK_WORKSPACE=$PWD bash scripts/helix-doctor.sh  # also check project skills

set -euo pipefail

REPO="${HELIX_REPO_DIR:-$HOME/.helix/tc-fe-prep}"
FAIL=0
WARN=0

ok() { echo "  OK   $*"; }
warn() { echo "  WARN $*"; WARN=$((WARN + 1)); }
bad() { echo "  FAIL $*"; FAIL=$((FAIL + 1)); }

echo "=== Helix doctor ==="
echo ""

# --- Repo ---
if [ ! -d "$REPO/.git" ]; then
  bad "Helix repo not found at $REPO — run: curl -sL .../install.sh | bash"
  echo ""
  echo "Result: FAIL (install required)"
  exit 1
fi

if [ -f "$REPO/VERSION" ]; then
  VER="$(tr -d '[:space:]' < "$REPO/VERSION")"
  ok "Version $VER at $REPO"
else
  bad "Missing VERSION in $REPO"
fi

if [ -d "$REPO/skills/helix" ]; then
  ok "Router skill present"
else
  bad "Missing skills/helix"
fi

EXPECTED_SKILLS=(helix tc-fe-prep-workflow tc-api-prep-workflow retest-bug-workflow testing-ticket-workflow create-bug-workflow)
for s in "${EXPECTED_SKILLS[@]}"; do
  if [ -f "$REPO/skills/$s/SKILL.md" ]; then
    ok "Skill $s"
  else
    bad "Missing skills/$s/SKILL.md"
  fi
done

echo ""
echo "--- Global skill links (expect helix + 5 workflows) ---"

check_dest() {
  local dest="$1"
  local label="$2"
  if [ ! -d "$(dirname "$dest")" ]; then
    warn "$label: parent missing ($(dirname "$dest")) — agent may not be installed"
    return
  fi
  if [ ! -d "$dest" ]; then
    warn "$label: $dest not found — run: bash $REPO/scripts/link-skills.sh"
    return
  fi
  local missing=0
  for s in "${EXPECTED_SKILLS[@]}"; do
    if [ -L "$dest/$s" ] || [ -d "$dest/$s" ]; then
      :
    else
      missing=$((missing + 1))
    fi
  done
  if [ "$missing" -eq 0 ]; then
    ok "$label: all ${#EXPECTED_SKILLS[@]} skills linked"
  else
    warn "$label: $missing skill(s) missing under $dest"
  fi
}

GLOBAL_DESTS=(
  "$HOME/.claude/skills|Claude Code"
  "$HOME/.cursor/skills|Cursor"
  "$HOME/.codex/skills|Codex"
  "$HOME/.copilot/skills|GitHub Copilot"
  "$HOME/.gemini/skills|Gemini CLI"
  "$HOME/.agents/skills|Agent Skills (~/.agents)"
  "$HOME/.codeium/windsurf/skills|Windsurf"
  "$HOME/.cline/skills|Cline"
  "$HOME/.config/opencode/skills|OpenCode"
  "$HOME/.pi/agent/skills|Pi"
)

for entry in "${GLOBAL_DESTS[@]}"; do
  dest="${entry%%|*}"
  label="${entry##*|}"
  check_dest "$dest" "$label"
done

echo ""
echo "--- Claude plugin cache ---"
CACHE_BASE="$HOME/.claude/plugins/cache/helix-dev/helix"
if [ -n "${VER:-}" ] && [ -L "$CACHE_BASE/$VER" ]; then
  ok "Plugin cache symlink $CACHE_BASE/$VER"
elif [ -d "$CACHE_BASE" ]; then
  warn "Plugin cache dir exists but version symlink missing — re-run install.sh"
else
  warn "Claude plugin cache not found (Claude Code only)"
fi

echo ""
echo "--- Claude Code marketplace plugin ---"
if command -v claude >/dev/null 2>&1; then
  PLIST="$(claude plugin list 2>/dev/null || true)"
  if echo "$PLIST" | grep -qF "helix@helix"; then
    if echo "$PLIST" | grep -A4 "helix@helix" | grep -q "Status: ✔ enabled"; then
      ok "helix@helix enabled"
    else
      warn "helix@helix installed but not enabled — run: bash $REPO/scripts/claude-plugin-sync.sh"
    fi
    if [ -n "${VER:-}" ] && echo "$PLIST" | grep -A3 "helix@helix" | grep -q "Version: $VER"; then
      ok "helix@helix version matches repo ($VER)"
    elif [ -n "${VER:-}" ]; then
      warn "helix@helix version may be stale (repo $VER) — run: bash $REPO/scripts/claude-plugin-sync.sh"
    fi
  else
    warn "helix@helix not installed — run: bash $REPO/scripts/claude-plugin-sync.sh"
  fi
  if echo "$PLIST" | grep -A4 "helix@local" | grep -q "Status: ✔ enabled"; then
    bad "Legacy helix@local is still enabled — run: bash $REPO/scripts/claude-plugin-sync.sh"
  elif echo "$PLIST" | grep -qF "helix@local"; then
    warn "Legacy helix@local still listed (should be disabled) — run: bash $REPO/scripts/claude-plugin-sync.sh"
  fi
else
  warn "Claude CLI not on PATH — skip marketplace plugin check"
fi

if [ -n "${HELIX_DOCTOR_FIX:-}" ]; then
  echo ""
  echo "--- Auto-fix (HELIX_DOCTOR_FIX) ---"
  bash "$REPO/scripts/claude-plugin-sync.sh" || warn "claude-plugin-sync failed"
  bash "$REPO/scripts/link-skills.sh" 2>/dev/null || true
  if [ -n "${HELIX_LINK_WORKSPACE:-}" ]; then
    export HELIX_LINK_WORKSPACE
    bash "$REPO/scripts/link-skills.sh" 2>/dev/null || true
  fi
fi

if [ -n "${HELIX_LINK_WORKSPACE:-}" ]; then
  echo ""
  echo "--- Workspace: $HELIX_LINK_WORKSPACE ---"
  WS="$(cd "$HELIX_LINK_WORKSPACE" && pwd)"
  for sub in .github/skills .agents/skills .windsurf/skills .cline/skills .gemini/skills; do
    check_dest "$WS/$sub" "${sub}"
  done
fi

echo ""
echo "--- Works best with ---"
echo "  • Jira (MCP or browser logged in)"
echo "  • Playwright installed in the project you test"
echo "  • Optional: references/*-guide.md in your app repo"
echo ""
echo "Docs:  $REPO/docs/supported-agents.md"
echo "Start: /helix (Claude) · @helix / skill helix (others)"
echo "Direct: /tc-fe-prep /tc-api-prep /retest-bug /testing-ticket /create-bug"
echo "Auto-update: HELIX_AUTO_UPDATE=1 (default) — see scripts/helix-auto-update.sh · log ~/.helix/auto-update.log"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Result: FAIL ($FAIL error(s), $WARN warning(s))"
  exit 1
fi
if [ "$WARN" -gt 0 ]; then
  echo "Result: OK with warnings ($WARN) — install or link-skills may help"
  exit 0
fi
echo "Result: OK"
exit 0
