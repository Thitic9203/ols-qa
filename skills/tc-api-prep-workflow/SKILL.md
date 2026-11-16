---
name: tc-api-prep-workflow
description: |-
  Write API manual test cases from the API spec and Swagger with coverage + ISTQB review; confirm columns and delivery (Jira comment and/or CSV/Excel).
  Use when the user says /tc-api-prep or TC API prep, or wants manual TCs for REST endpoints, OpenAPI/Swagger or Postman — even if they do not say Swagger or TC ("เขียนเทสเคส API").
  Do NOT use for FE story AC/EC tables (tc-fe-prep), execution (testing-ticket), retest (retest-bug), or bugs (create-bug).
---

# TC API Prep (discovery stub)

Also triggers on: API test cases; Swagger test cases; OpenAPI test cases.

**Thin entry for agent skill discovery.** Full procedure: [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md).

When invoked:

1. First, before any other work, follow [session-start-context.md](../../references/session-start-context.md) (caveman lite + context-mode).
2. Announce once: `Using **tc-api-prep-workflow** to prepare API manual test cases.`
3. Read [WORKFLOW.md](../procedures/tc-api-prep-workflow/WORKFLOW.md) and run its progress checklist in order; open every other phase or reference file at the step that names it, not before. Never skip a step or gate.

Slash-command shortcut (runtimes that support commands): `/tc-api-prep` → [commands/tc-api-prep.md](../../commands/tc-api-prep.md).

## Contents

Shared reference index, with the trigger that opens each file (see also; open on demand only, never at the start): [skill-reference-index.md](../../references/skill-reference-index.md).

Read at start: [shared-preamble.md](../../references/shared-preamble.md), [user-communication.md](../../references/user-communication.md), [long-workflow-todos.md](../../references/long-workflow-todos.md), then [workspace-guide-discovery.md](../../references/workspace-guide-discovery.md) and [intake-one-pager.md](../../references/intake-one-pager.md) on the first response (WORKFLOW Refusal-first).

API-specific notes on shared files (apply when the step opens them):

- Open [tc-quality-standards.md](../../references/tc-quality-standards.md) at Phase E, on every TC row. API mapping: with no Test Steps column (the default set, [default-columns.md](../procedures/tc-api-prep-workflow/references/default-columns.md)), Test Data (method, path, headers, body) is the step and Expected Result leads with the status code.
- Open [csv-export-rules.md](../../references/csv-export-rules.md) at Phase G1, when exporting. API mapping: its `{OUT}` is `references/{SCOPE}_API_TC` (`.csv` / `.xlsx`, WORKFLOW G1).
- Open [swagger-diff-phase.md](../../references/swagger-diff-phase.md) when Swagger changed, a new API version shipped, or existing API TCs are being updated; open [tc-api-chunked-scope.md](../../references/tc-api-chunked-scope.md) when more than 15 Swagger operations are in scope or the user asks for a whole service.
- [csv-template-types.md](../../references/csv-template-types.md) — TC FE only, never opened here (an API export is one CSV); [test-md-format.md](../../references/test-md-format.md) — only when the user picks Test.md at Phase C.
- [qa-evidence-gates.md](../../references/qa-evidence-gates.md) — before any completion claim (Phase G-verify, QA closing).
- [skill-routing.md](../../references/skill-routing.md) — read only when the request turns out not to be API TC drafting and another skill owns it.
- Execution-only files (bug priority matrix, Playwright, non-pass and result gates) are never triggered here. The TC **Priority** column follows [api-tc-guidelines.md](../procedures/tc-api-prep-workflow/references/api-tc-guidelines.md) § Priority.

Also read each only when its trigger (in WORKFLOW.md or the index) fires:

- Read at Phases D–G: [phase-d-scope-design.md](../procedures/tc-api-prep-workflow/phase-d-scope-design.md), [phase-e-review.md](../procedures/tc-api-prep-workflow/phase-e-review.md), [phase-f-draft.md](../procedures/tc-api-prep-workflow/phase-f-draft.md), [phase-g-deliver.md](../procedures/tc-api-prep-workflow/phase-g-deliver.md), [spec-coverage-review.md](../procedures/tc-api-prep-workflow/references/spec-coverage-review.md), [delivery-options.md](../procedures/tc-api-prep-workflow/references/delivery-options.md).
- Read at Phase E3b: [coverage-delta-template.md](../../references/coverage-delta-template.md).
- Read at Phase G, Jira comment: [jira-linebreak-conversion.md](../../references/jira-linebreak-conversion.md), [jira-comment-post-review.md](../../references/jira-comment-post-review.md); before the first write: [shared-must-never.md](../../references/shared-must-never.md).
- Read at G3 and QA closing: [session-closing.md](../../references/session-closing.md), [qa-closing-shared.md](../../references/qa-closing-shared.md).
- Read only when the situation arises: [helix-session-constraints.md](../../references/helix-session-constraints.md), [skill-invocation-discipline.md](../../references/skill-invocation-discipline.md), [agent-rationalizations.md](../../references/agent-rationalizations.md), [skill-rules-style.md](../../references/skill-rules-style.md), [proactive-qa-triggers.md](../../references/proactive-qa-triggers.md), [root-cause-investigation.md](../../references/root-cause-investigation.md), [round-time-contract.md](../../references/round-time-contract.md), [qa-debug-discipline.md](../../references/qa-debug-discipline.md).

## Refusal-first (precondition gate)

All preconditions and refusal rules are in WORKFLOW.md. MUST NOT start without API spec + Swagger and delivery choices confirmed.

## QA closing (mandatory before "done")

All close-out gates are in WORKFLOW.md and [verify-closing-checklist.md](../../references/verify-closing-checklist.md) § *TC FE / TC API prep* (skip its tc-fe-prep-only final-report item, and skip its attachment item unless a file was generated and the delivery includes A). MUST NOT report done until G-verify and post-publish review pass.

## Dependencies

No row is checked at the start of the run: each is checked when Phase C records a delivery that uses it (WORKFLOW Phase C). Check commands: [dependencies.md](../../references/dependencies.md).

- Python 3 + `openpyxl` — Excel file chosen
- Atlassian MCP — Confluence destination only
- Jira REST credentials — only at the G2 step 4 REST fallback
- `superpowers:systematic-debugging` — delivery includes A (REST failure hand-off)
