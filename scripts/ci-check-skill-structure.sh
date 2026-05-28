#!/usr/bin/env bash
# Verify shipped skills match plugin.json and Pluton structural requirements.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

log_err() {
  echo "::error::$1" >&2
  FAIL=1
}

# --- plugin.json ↔ skills/ directories ---
PLUGIN_SKILLS=()
while IFS= read -r name; do
  [ -n "$name" ] && PLUGIN_SKILLS+=("$name")
done < <(python3 - <<'PY'
import json, pathlib
data = json.loads(pathlib.Path(".claude-plugin/plugin.json").read_text())
for s in data.get("skills", []):
    print(pathlib.Path(s).name)
PY
)

while IFS= read -r name; do
  [ -z "$name" ] && continue
  found=0
  for p in "${PLUGIN_SKILLS[@]}"; do
    if [ "$p" = "$name" ]; then found=1; break; fi
  done
  if [ "$found" -eq 0 ]; then
    log_err "skills/$name exists but is not in plugin.json skills array"
  fi
done < <(find skills -mindepth 1 -maxdepth 1 -type d \
  ! -name in-progress ! -name deprecated -exec basename {} \; | sort)

for name in "${PLUGIN_SKILLS[@]}"; do
  if [ ! -d "skills/$name" ]; then
    log_err "plugin.json lists skills/$name but directory missing"
  fi
  if ! grep -q "$name" README.md; then
    log_err "README.md does not mention skills/$name"
  fi
done

# --- per shipped SKILL.md structure ---
check_skill_file() {
  local f="$1"
  local base
  base="$(basename "$(dirname "$f")")"

  if ! grep -q '^proactive_triggers:' "$f"; then
    log_err "$base: missing proactive_triggers in frontmatter"
  fi

  if ! grep -q '## QA closing' "$f"; then
    log_err "$base: missing ## QA closing section"
  fi

  if ! grep -q 'Refusal-first' "$f"; then
    log_err "$base: missing Refusal-first section"
  fi

  if ! head -n 20 "$f" | grep -qi 'do not use'; then
    log_err "$base: description must include Do NOT use (negative case)"
  fi
}

while IFS= read -r f; do
  check_skill_file "$f"
done < <(find skills -name SKILL.md \
  -not -path '*/in-progress/*' \
  -not -path '*/deprecated/*')

if [ "$FAIL" -ne 0 ]; then
  echo "skill structure check failed"
  exit 1
fi

echo "ok: skill structure matches plugin.json and Pluton frontmatter requirements"
