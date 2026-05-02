#!/usr/bin/env bash
# Check 4: Skill map consistency
# Every skill directory must appear in commands/helix.md argument mapping
# Every mapping in commands/helix.md must have a matching skill directory

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMMANDS_FILE="$REPO_ROOT/commands/helix.md"
PASS=0; FAIL=0; ERRORS=()

echo "=== Check 4: Skill Map Consistency ==="

# --- Build list of skill directories ---
declare -a SKILL_DIRS=()
for d in "$REPO_ROOT"/skills/*/; do
  name="$(basename "$d")"
  SKILL_DIRS+=("$name")
done

# --- Build list of mapped skills from commands/helix.md ---
# Lines look like: - `skill-name` → `helix:skill-name`
declare -a MAPPED_SKILLS=()
while IFS= read -r line; do
  if [[ "$line" =~ ^\-[[:space:]]\`([a-z0-9\-]+)\`[[:space:]]→ ]]; then
    MAPPED_SKILLS+=("${BASH_REMATCH[1]}")
  fi
done < "$COMMANDS_FILE"

# --- Check: every skill dir is mapped in commands/helix.md ---
echo ""
echo "  Skill dirs → commands/helix.md:"
for skill in "${SKILL_DIRS[@]}"; do
  found=0
  for mapped in "${MAPPED_SKILLS[@]}"; do
    [[ "$mapped" == "$skill" ]] && { found=1; break; }
  done
  if [[ $found -eq 1 ]]; then
    ((PASS++))
  else
    ERRORS+=("NOT MAPPED: skills/$skill/ exists but '$skill' not in commands/helix.md")
    ((FAIL++))
  fi
done

# --- Check: every mapping has a real skill dir ---
echo "  commands/helix.md → skill dirs:"
for mapped in "${MAPPED_SKILLS[@]}"; do
  if [[ -d "$REPO_ROOT/skills/$mapped" ]]; then
    ((PASS++))
  else
    ERRORS+=("PHANTOM MAP: '$mapped' in commands/helix.md but skills/$mapped/ not found")
    ((FAIL++))
  fi
done

echo "  Checked: $((PASS + FAIL)) entries"
echo "  Passed:  $PASS"
echo "  Failed:  $FAIL"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  for e in "${ERRORS[@]}"; do echo "  ✗ $e"; done
  exit 1
fi

echo "  ✓ Skill map consistent"
