---
name: tc-fe-prep-workflow
description: |
  Prepare frontend manual test cases (Thai, ราชบัณฑิตยสภา) from a Jira story (AC/EC) with mandatory AC/EC coverage review and ISTQB/29119-3 quality check, then draft table in chat, export a Qase-import CSV (Import_Qase_{ISSUE_KEY}.csv) attached to one comment on that story only, and close with a four-axis final TC review report (AC/EC alignment, spelling, numbering, scope).
  Use when the user asks for FE test cases, manual TC from acceptance criteria, draft TC comment on Jira, or TC FE Preparation from Helix (/tc-fe-prep).
  Do NOT use for API-only Swagger test cases (tc-api-prep-workflow), Playwright execution (testing-ticket-workflow), retest-after-fix (retest-bug-workflow), or opening bug tickets (create-bug-workflow).
proactive_triggers:
  - /tc-fe-prep
  - TC FE prep
  - FE test cases
  - manual test cases from story
  - acceptance criteria test cases
---

# TC FE Prep (discovery stub)

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md).

When invoked:

1. Announce once: `Using **tc-fe-prep-workflow** to prepare FE manual test cases.`
2. Read and follow [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) **end-to-end** — every step, gate, and reference.

Claude Code shortcut: `/tc-fe-prep` → [commands/tc-fe-prep.md](../../commands/tc-fe-prep.md).

## Contents (read on demand, 1 hop)

Every must-read file for this workflow, linked directly from here. References already linked above are not repeated.

- [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) — always: the full procedure, read end to end.
- [csv-export-rules.md](../../references/csv-export-rules.md) — when exporting the CSV file(s).
- [jira-comment-adf-template.md](../procedures/tc-fe-prep-workflow/references/jira-comment-adf-template.md) — before building the Jira comment ADF, and always on a "draft only / do not post" request — write the .adf.json + preview per this template.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — right after posting a Jira comment — full review checklist.
- [jira-fast-publish.md](../../references/jira-fast-publish.md) — when the fast-publish step returns an error.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — before posting a table that contains line breaks to Jira.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates, including the cross-ticket conflict check.
- [session-closing.md](../../references/session-closing.md) — after the verify gate passes — artifact index, next workflow, handoff.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [tc-quality-standards.md](../../references/tc-quality-standards.md) — while writing every TC row.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — on the first response, to locate the workspace project guide for this workflow.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start until the user provides a Jira story key or URL and required config is resolved.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md, [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section), and [tc-final-review-report.md](../procedures/tc-fe-prep-workflow/references/tc-final-review-report.md). MUST NOT report done until they pass.
