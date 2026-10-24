---
description: |
  Review a test case document that already exists — against the AC/EC and business rules on its
  governing ticket. Build a traceability matrix, judge coverage and row quality, report Good vs Need
  Improve, each finding anchored to a quoted source.
  Do NOT use for drafting new TC tables (tc-fe-prep / tc-api-prep), running a ticket's Playwright pass
  (testing-ticket), reviewing already-recorded execution evidence (review-result), or retesting a bug
  after a dev fix (retest-bug).
---

Read and follow [the TC review workflow](../skills/tc-review-workflow/SKILL.md) end-to-end.

Pass arguments after `/tc-review` as the TC document and the ticket to check it against — a sheet/CSV/
file link plus a Jira key or URL. If either is missing, ask for it before starting.

All review rules — the refusal-first gate, traceability matrix, struck-through AC/EC, business-rule
conflicts, Good vs Need Improve with a sourced "→ Suggest:" line, design-source honesty, and the Step 5
notify on every run — live only in the workflow's SKILL.md. Follow it end-to-end; do not work from a
summary here.

Follow [references/user-communication.md](../references/user-communication.md).
