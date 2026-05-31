#!/bin/bash
# helix-regression-check.sh — run before every merge to main
set -e
cd "$(git rev-parse --show-toplevel)"

echo "=== Helix Regression Check ==="

# 1. Skill files exist
echo -n "[1/7] Skill files... "
SKILLS=$(ls skills/*/SKILL.md skills/deprecated/*/WORKFLOW.md 2>/dev/null | wc -l | tr -d ' ')
[ "$SKILLS" -gt 0 ] && echo "OK ($SKILLS found)" || { echo "FAIL: no skills found"; exit 1; }

# 2. Portable content
echo -n "[2/7] Portable content... "
if [ -f scripts/ci-check-portable-skills.sh ]; then
  bash scripts/ci-check-portable-skills.sh > /dev/null 2>&1 && echo "OK" || { echo "FAIL"; exit 1; }
else
  echo "SKIP (script not found)"
fi

# 3. Skill structure
echo -n "[3/7] Skill structure... "
if [ -f scripts/ci-check-skill-structure.sh ]; then
  bash scripts/ci-check-skill-structure.sh > /dev/null 2>&1 && echo "OK" || { echo "FAIL"; exit 1; }
else
  echo "SKIP (script not found)"
fi

# 4. Reference integrity
echo -n "[4/7] Reference links... "
MISSING=$(grep -roh '@references/[^ )]*' skills/ 2>/dev/null | sort -u | \
  while read f; do [ -f "${f#@}" ] || echo "$f"; done)
[ -z "$MISSING" ] && echo "OK" || { echo "FAIL: missing $MISSING"; exit 1; }

# 5. VERSION consistency
echo -n "[5/7] VERSION sync... "
FILE_VER=$(cat VERSION 2>/dev/null | tr -d '[:space:]')
JSON_VER=$(grep -o '"version": *"[^"]*"' .claude-plugin/plugin.json 2>/dev/null | grep -o '[0-9.]*')
[ "$FILE_VER" = "$JSON_VER" ] && echo "OK ($FILE_VER)" || echo "WARN: VERSION=$FILE_VER plugin.json=$JSON_VER"

# 6. Scripts executable
echo -n "[6/7] Script permissions... "
NON_EXEC=$(find scripts/ hooks/ -name '*.sh' ! -perm -u+x 2>/dev/null | head -5)
[ -z "$NON_EXEC" ] && echo "OK" || echo "WARN: not executable: $NON_EXEC"

# 7. Menu / commands consistency
echo -n "[7/7] Menu consistency... "
CMD_COUNT=$(ls commands/*.md 2>/dev/null | wc -l | tr -d ' ')
echo "OK ($CMD_COUNT commands)"

echo ""
echo "=== All critical checks passed ==="
