---
name: tc-fe-prep-workflow
description: |-
  Write Thai FE manual test cases from a Jira story's AC/EC with coverage + ISTQB review, HTML draft for approval, then one story comment with CSVs and a final review report.
  Use when asked for FE test cases, manual TC from AC/EC (even without "FE"), a TC comment on a story, /tc-fe-prep ("เขียนเทสเคส FE", "เตรียม TC FE").
  Do NOT use for API/Swagger TCs (tc-api-prep), Playwright runs (testing-ticket), retest (retest-bug), or bugs (create-bug).
---

# TC FE Prep (discovery stub)

Also triggers on: TC FE prep; manual test cases from story; acceptance criteria test cases.

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md).

When invoked:

0. First, before anything else, do the session-start step in [session-start-context.md](../../references/session-start-context.md).
1. Announce once: `Using **tc-fe-prep-workflow** to prepare FE manual test cases.`
2. Read [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) and work through its progress checklist in order. Open each phase or reference file at the step that names it, not up front; every gate and approval step in it stays binding.

Claude Code shortcut: `/tc-fe-prep` → [commands/tc-fe-prep.md](../../commands/tc-fe-prep.md).

## Contents

Every must-read file for this workflow, linked directly from here.

### Every run

Read these on every run.

- [WORKFLOW.md](../procedures/tc-fe-prep-workflow/WORKFLOW.md) — always: the procedure; open each file at the step its progress checklist names.
- [must-never.md](../procedures/tc-fe-prep-workflow/references/must-never.md) — read at the start of every run, before Step 0, and again before any write or post — the skill-specific MUST / NEVER table; every row binds drafting, review and publishing.
- [requirement-gates.md](../procedures/tc-fe-prep-workflow/requirement-gates.md) — at Step 2a, before Step 3 — Steps 2a, 2.5 and 2.6.
- [design-and-review.md](../procedures/tc-fe-prep-workflow/design-and-review.md) — at Step 3, before Step 5 — Steps 3, 4 and 4.5.
- [shared-preamble.md](../../references/shared-preamble.md) — at the start of every run, before the first reply (preamble, constraints, tone).
- [tc-quality-standards.md](../../references/tc-quality-standards.md) — while writing every TC row.
- [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) — read on the first response, to locate the workspace project guide for this workflow.
- [helix-session-constraints.md](../../references/helix-session-constraints.md) — read once at session start.
- [user-communication.md](../../references/user-communication.md) — read before any message to the user.

### At the step or trigger stated next to each file

Read each file below at the point written next to it, not up front. If that step or trigger does not happen in this run, the file is not read.

- [csv-export-rules.md](../../references/csv-export-rules.md) — read when exporting the CSV file(s).
- [jira-comment-adf-template.md](../procedures/tc-fe-prep-workflow/references/jira-comment-adf-template.md) — before building the Jira comment ADF, and always on a "draft only / do not post" request — write the .adf.json + preview per this template.
- [jira-comment-post-review.md](../../references/jira-comment-post-review.md) — right after posting a Jira comment — full review checklist.
- [jira-fast-publish.md](../../references/jira-fast-publish.md) — read when the fast-publish step returns an error.
- [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md) — before posting a table that contains line breaks to Jira.
- [publish-options.md (shared)](../../references/publish-options.md) — read when Step 7 has no browser tool or no signed-in Jira session — Option C manual handoff, comment Not posted.
- [jira-wiki-vs-markdown.md](../../references/jira-wiki-vs-markdown.md) — read when that manual handoff is prepared — which comment format to hand over.
- [qa-closing-shared.md](../../references/qa-closing-shared.md) — before reporting done — shared QA closing gates; its cross-ticket conflict check applies to testing-ticket and retest-bug only, not to TC prep.
- [session-closing.md](../../references/session-closing.md) — after the verify gate passes — artifact index, next workflow, handoff.
- [shared-must-never.md](../../references/shared-must-never.md) — before any write or post — rules shared by every workflow.
- [agent-rationalizations.md](../../references/agent-rationalizations.md) — read when tempted to skip a step.
- [coverage-delta-template.md](../../references/coverage-delta-template.md) — read after the coverage review, before the full draft.
- [csv-template-types.md](../../references/csv-template-types.md) — read before exporting a CSV.
- [figma-design-comparison.md](../../references/figma-design-comparison.md) — read before judging any UI or visual result against the design.
- [long-workflow-todos.md](../../references/long-workflow-todos.md) — read when the workflow has many steps; keep the todo list.
- [portable-content.md](../../references/portable-content.md) — read before writing any repo, path, ticket number or project value into the skill output; nothing project-specific is hardcoded.
- [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md) — read whenever a QA follow-up is a candidate, at any point in the run (including session close).
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — read before any completion claim.
- [round-time-contract.md](../../references/round-time-contract.md) — read only if this run executes tests (TC drafting never does; Step 4f review rounds are not test rounds).
- [qa-debug-discipline.md](../../references/qa-debug-discipline.md) — read when a tool or fetch errors.
- [root-cause-investigation.md](../../references/root-cause-investigation.md) — read before naming a cause for any error.
- [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md) — read before invoking or switching skills.
- [skill-routing.md](../../references/skill-routing.md) — read when choosing which skill handles a request.
- [skill-rules-style.md](../../references/skill-rules-style.md) — read before asking the user or stopping on a missing input.
- [tc-glossary.md](../../references/tc-glossary.md) — at Step 2.6 (glossary re-check).
- [html-pre-draft-review-template.md](../procedures/tc-fe-prep-workflow/references/html-pre-draft-review-template.md) — at Step 2.5d (HTML report).
- [html-draft-template.md](../procedures/tc-fe-prep-workflow/references/html-draft-template.md) — at Step 5 (HTML draft).
- [ac-ec-coverage-review.md](../procedures/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) — read before drafting; AC / EC coverage review.
- [jira-formatting.md](../procedures/tc-fe-prep-workflow/references/jira-formatting.md) — read before Step 0 (WORKFLOW § Prerequisites).
- [prerequisites.md](../procedures/tc-fe-prep-workflow/references/prerequisites.md) — read before Step 0.
- [publish-options.md](../procedures/tc-fe-prep-workflow/references/publish-options.md) — read when choosing how to publish.
- [qase-import-format.md](../procedures/tc-fe-prep-workflow/references/qase-import-format.md) — read before exporting the Qase CSV.
- [worked-example.md](../procedures/tc-fe-prep-workflow/references/worked-example.md) — read only when you need a format reference for the TC table or comment (a full anonymized worked example).

### Not part of this workflow

This workflow drafts test cases and never runs them, records verdicts or files defects. A request to run a case, record a result or file a bug is routed per [skill-routing.md](../../references/skill-routing.md) to testing-ticket, retest-bug or create-bug.

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start until the user provides a Jira story key or URL and required config is resolved.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md, [verify-closing-checklist.md](../../references/verify-closing-checklist.md) (TC FE section), and [tc-final-review-report.md](../procedures/tc-fe-prep-workflow/references/tc-final-review-report.md). MUST NOT report done until they pass.

## Dependencies

Check each before step 1 — commands and install hints: [dependencies.md](../../references/dependencies.md):

- curl
- Python 3 + `openpyxl` (xlsx only)
- Atlassian MCP (reading the story only; never to post TC tables)
- Jira REST credentials or a signed-in Jira session — publish uses only the session, checked at Step 7; a failed REST check is not a stop, no session → Step 7 failure branch
- Qase web UI access, or a suite list the user pastes (there is no Qase MCP)
- a browser for the HTML preview
- `superpowers:systematic-debugging`
