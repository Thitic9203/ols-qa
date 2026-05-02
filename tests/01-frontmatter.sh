#!/usr/bin/env bash
# Check 1: YAML frontmatter validation (pure bash — no external parser needed)
# Validates: block exists, name field, description field, name format, description length

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0
ERRORS=()

add_pass() { PASS=$((PASS + 1)); }
add_fail() { FAIL=$((FAIL + 1)); ERRORS+=("$1"); }

check_frontmatter() {
  local file="$1"
  local rel="${file#$REPO_ROOT/}"

  # Must start with ---
  local first_line
  first_line=$(head -1 "$file")
  if [[ "$first_line" != "---" ]]; then
    add_fail "MISSING FRONTMATTER: $rel (does not start with ---)"; return
  fi

  # Find closing ---
  local closing_line
  closing_line=$(awk 'NR>1 && /^---$/{print NR; exit}' "$file")
  if [[ -z "$closing_line" ]]; then
    add_fail "UNCLOSED FRONTMATTER: $rel (no closing ---)"; return
  fi

  # Extract frontmatter content (lines 2 to closing-1)
  local fm
  fm=$(sed -n "2,$((closing_line - 1))p" "$file")

  # Check name field exists
  local name_val
  name_val=$(echo "$fm" | grep -E '^name:' | sed 's/^name:[[:space:]]*//' | tr -d '"' || true)
  if [[ -z "$name_val" ]]; then
    add_fail "MISSING name: $rel"; return
  fi

  # Check name has only valid chars (letters, numbers, hyphens)
  if [[ ! "$name_val" =~ ^[a-zA-Z0-9-]+$ ]]; then
    add_fail "INVALID name '$name_val': $rel (only letters, numbers, hyphens allowed)"; return
  fi

  # Check description field exists
  local desc_line
  desc_line=$(echo "$fm" | grep -E '^description:' || true)
  if [[ -z "$desc_line" ]]; then
    add_fail "MISSING description: $rel"; return
  fi

  # Check description length (strip field name and quotes)
  local desc_val
  desc_val=$(echo "$desc_line" | sed 's/^description:[[:space:]]*//' | tr -d '"')
  local desc_len=${#desc_val}
  if [[ $desc_len -gt 1024 ]]; then
    add_fail "DESCRIPTION TOO LONG ($desc_len chars, max 1024): $rel"; return
  fi

  add_pass
}

echo "=== Check 1: YAML Frontmatter ==="

for skill_file in "$REPO_ROOT"/skills/*/SKILL.md; do
  check_frontmatter "$skill_file"
done

echo "  Checked: $((PASS + FAIL)) files"
echo "  Passed:  $PASS"
echo "  Failed:  $FAIL"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  for e in "${ERRORS[@]}"; do echo "  ✗ $e"; done
  exit 1
fi

echo "  ✓ All frontmatter valid"
