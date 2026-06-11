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
DECISIONS
