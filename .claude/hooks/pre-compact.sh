#!/bin/bash
# Inject key decisions back into context before auto-compaction
cat <<'DECISIONS'
=== OLS QA Session Decisions (auto-injected) ===
- Project: OLS (Jira key OLS, project 10791, board 818)
- Domain: <ORG>.atlassian.net
- Skill content language: English only
- Chat language: Thai OK
- QA lifecycle: READY TO TEST → TESTING → Done / BLOCKED
- Workspace guide: references/ols-project-guide.md (read before asking OLS config)
- .md edits in skills/references/commands/ are safe, do without asking
- ทุกความผิดพลาดของ AI ต้องจบด้วย post-mortem ใน docs/post-mortem/ และห้ามผิดซ้ำ
DECISIONS

# Layer 6: compaction must not eat an unpaid debt. Carried through here so the summarised
# context still knows a report is owed.
bash "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/postmortem-debt.sh" 2>/dev/null || true
