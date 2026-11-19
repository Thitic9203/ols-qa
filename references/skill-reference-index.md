# Skill reference index (open on demand)

One line per reference: link — when to open it. **Do not read this file at start.** Open it only when a step needs a reference the skill did not name, then open just that one file. Files marked *(workspace-only)* are plain paths: only some workspaces ship them.

## Contents
- [Session start and routing](#session-start-and-routing)
- [Intake and workspace](#intake-and-workspace)
- [Test case design and quality](#test-case-design-and-quality)
- [Test execution](#test-execution)
- [Evidence and verdicts](#evidence-and-verdicts)
- [Jira publish and export](#jira-publish-and-export)
- [Closing and handoff](#closing-and-handoff)
- [Authoring (contributors)](#authoring-contributors)
- [Per-skill: tc-fe-prep](#per-skill-tc-fe-prep)
- [Per-skill: tc-api-prep](#per-skill-tc-api-prep)
- [Per-skill: testing-ticket](#per-skill-testing-ticket)
- [Per-skill: retest-bug](#per-skill-retest-bug)
- [Per-skill: create-bug](#per-skill-create-bug)

## Session start and routing
- [session-start-context.md](session-start-context.md) — first thing when any Helix skill starts.
- [helix-session-bootstrap.md](helix-session-bootstrap.md) — SessionStart hook context; rarely opened by hand.
- [helix-session-constraints.md](helix-session-constraints.md) — reciting constraints in the first workflow reply.
- [shared-preamble.md](shared-preamble.md) — which shared rules every skill follows.
- [shared-must-never.md](shared-must-never.md) — checking a shared MUST/NEVER rule.
- [skill-invocation-discipline.md](skill-invocation-discipline.md) — deciding skill priority or when a skill must load.
- [skill-routing.md](skill-routing.md) — routing a menu choice or handing off between skills.
- [intent-shortcuts.md](intent-shortcuts.md) — mapping Thai/informal/mixed intent to a workflow.
- [menu-text.md](menu-text.md) — printing the `/helix` menu.
- [proactive-qa-triggers.md](proactive-qa-triggers.md) — offering a workflow from branch/ticket context.
- [agent-entry.md](agent-entry.md) — starting Helix on a given agent host.
- [codex-tools.md](codex-tools.md) — running on Codex (tool mapping).
- [copilot-tools.md](copilot-tools.md) — running on Copilot (tool mapping).
- [dependencies.md](dependencies.md) — a skill's Dependencies check (before step 1, or where the skill says).
- [user-communication.md](user-communication.md) — choosing chat language and tone.
- [settle-and-strategize.md](settle-and-strategize.md) — before the first test action (no guessing, no blind loops).

## Intake and workspace
- [workspace-guide-discovery.md](workspace-guide-discovery.md) — finding the project guide at workflow start.
- [intake-one-pager.md](intake-one-pager.md) — showing the intake checklist once for long workflows.
- [parallel-prep.md](parallel-prep.md) — running independent read-only fetches together.
- [long-workflow-todos.md](long-workflow-todos.md) — creating the phase todo list.
- [retest-fix-intake.md](retest-fix-intake.md) — retest: after fetching the ticket, before testing.

## Test case design and quality
- [tc-quality-standards.md](tc-quality-standards.md) — ISTQB/29119-3 row-quality review.
- [tc-glossary.md](tc-glossary.md) — choosing Thai wording inside TC content.
- [coverage-delta-template.md](coverage-delta-template.md) — posting the coverage delta after review.
- [tc-api-chunked-scope.md](tc-api-chunked-scope.md) — Swagger/API spec too large for one pass.
- [swagger-diff-phase.md](swagger-diff-phase.md) — Swagger changed / old vs new spec.
- [figma-design-comparison.md](figma-design-comparison.md) — any UI check judged against Figma.

## Test execution
- [test-execution-plan-template.md](test-execution-plan-template.md) — testing ticket: plan before Playwright.
- [playwright-preflight.md](playwright-preflight.md) — testing ticket Phase D pre-flight.
- [parallel-test-lanes.md](parallel-test-lanes.md) — splitting the confirmed plan into lanes/accounts.
- [round-time-contract.md](round-time-contract.md) — round cap and end-of-round order (retest/ticket/smoke).
- [test-through-real-steps.md](test-through-real-steps.md) — executing the action under test (no API shortcut).
- [resilient-selectors.md](resilient-selectors.md) — picking or repairing a Playwright selector.
- [session-renewal-resilience.md](session-renewal-resilience.md) — keepalive/token-refresh jobs for saved sessions.

## Evidence and verdicts
- [qa-evidence-gates.md](qa-evidence-gates.md) — before any pass/post/done claim.
- [qa-evidence-capture.md](qa-evidence-capture.md) — capturing screenshots/MP4 evidence and its 7-layer check.
- [qa-evidence-rerecord.md](qa-evidence-rerecord.md) — evidence failed a check and must be re-recorded.
- [qa-evidence-coverage.md](qa-evidence-coverage.md) — checking every case has its evidence.
- [result-quality-gate.md](result-quality-gate.md) — between execution and any verdict leaving the round.
- [non-pass-challenge-gate.md](non-pass-challenge-gate.md) — about to record a non-PASS.
- [no-wait-decision-gate.md](no-wait-decision-gate.md) — non-PASS because of an open question.
- [root-cause-investigation.md](root-cause-investigation.md) — any non-PASS or any sentence stating a cause.
- [qa-debug-discipline.md](qa-debug-discipline.md) — flaky run, result disagrees with dev, env unreachable.
- [customer-escape-prevention.md](customer-escape-prevention.md) — scoping tests beyond the ticket's own AC.
- [bug-priority-matrix.md](bug-priority-matrix.md) — setting a bug's Priority/Severity.
- [defect-report-completeness.md](defect-report-completeness.md) — writing any defect report.
- [agent-rationalizations.md](agent-rationalizations.md) — catching yourself skipping a gate.

## Jira publish and export
- [publish-options.md](publish-options.md) — choosing how to post a Jira comment + CSV.
- [jira-fast-publish.md](jira-fast-publish.md) — single-JS Jira comment + upload.
- [jira-wiki-vs-markdown.md](jira-wiki-vs-markdown.md) — any body sent to Jira (syntax).
- [jira-linebreak-conversion.md](jira-linebreak-conversion.md) — table cells with `<br>` before posting.
- [jira-comment-post-review.md](jira-comment-post-review.md) — after posting, before saying done.
- [csv-export-rules.md](csv-export-rules.md) — writing CSV/Excel from a markdown table.
- [csv-template-types.md](csv-template-types.md) — choosing the TC FE CSV type (Unit/Integration/System).
- [test-md-format.md](test-md-format.md) — exporting Test.md.
- [output-templates/defect-candidates.md](output-templates/defect-candidates.md) — listing defect candidates.

## Closing and handoff
- [qa-closing-shared.md](qa-closing-shared.md) — every skill's QA closing section.
- [verify-closing-checklist.md](verify-closing-checklist.md) — unified verify close.
- [session-closing.md](session-closing.md) — end of every workflow.
- [handoff-file-template.md](handoff-file-template.md) — writing the round/session handoff file.
- [subagent-qa-patterns.md](subagent-qa-patterns.md) — delegating read-only analysis.

## Authoring (contributors)
- [skill-rules-style.md](skill-rules-style.md) — writing MUST/NEVER rules.
- [pluton-5rules-mapping.md](pluton-5rules-mapping.md) — Pluton rule mapping.
- [portable-content.md](portable-content.md) — what may not appear in skills/commands.

## Per-skill: tc-fe-prep
- [prerequisites.md](../skills/procedures/tc-fe-prep-workflow/references/prerequisites.md) — before Step 0.
- [project-config-template.md](../skills/procedures/tc-fe-prep-workflow/references/project-config-template.md) — no project guide yet.
- [must-never.md](../skills/procedures/tc-fe-prep-workflow/references/must-never.md) — checking a tc-fe rule.
- [html-pre-draft-review-template.md](../skills/procedures/tc-fe-prep-workflow/references/html-pre-draft-review-template.md) — Step 2a/2.5 review page.
- [markdown-template.md](../skills/procedures/tc-fe-prep-workflow/references/markdown-template.md) — TC table shape.
- [ac-ec-coverage-review.md](../skills/procedures/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) — after Step 3, before Step 5.
- [html-draft-template.md](../skills/procedures/tc-fe-prep-workflow/references/html-draft-template.md) — Step 5 HTML draft.
- [jira-formatting.md](../skills/procedures/tc-fe-prep-workflow/references/jira-formatting.md) — Step 7 comment structure.
- [jira-comment-adf-template.md](../skills/procedures/tc-fe-prep-workflow/references/jira-comment-adf-template.md) — Step 7 ADF body or draft-only files.
- [qase-import-format.md](../skills/procedures/tc-fe-prep-workflow/references/qase-import-format.md) — Qase import CSV.
- [publish-options.md](../skills/procedures/tc-fe-prep-workflow/references/publish-options.md) — redirect to shared publish options.
- [tc-final-review-report.md](../skills/procedures/tc-fe-prep-workflow/references/tc-final-review-report.md) — close-out after Step 7.
- [gotchas.md](../skills/procedures/tc-fe-prep-workflow/references/gotchas.md) — something looks wrong (wrong issue, etc.).
- [worked-example.md](../skills/procedures/tc-fe-prep-workflow/references/worked-example.md) — unsure what good output looks like.

## Per-skill: tc-api-prep
- [api-tc-guidelines.md](../skills/procedures/tc-api-prep-workflow/references/api-tc-guidelines.md) — designing per-endpoint coverage.
- [default-columns.md](../skills/procedures/tc-api-prep-workflow/references/default-columns.md) — filling TC columns.
- [markdown-template.md](../skills/procedures/tc-api-prep-workflow/references/markdown-template.md) — draft table shape.
- [spec-coverage-review.md](../skills/procedures/tc-api-prep-workflow/references/spec-coverage-review.md) — after Phase D, before Phase F.
- [delivery-options.md](../skills/procedures/tc-api-prep-workflow/references/delivery-options.md) — delivering CSV/comment.
- [worked-example.md](../skills/procedures/tc-api-prep-workflow/references/worked-example.md) — unsure what good output looks like.

## Per-skill: testing-ticket
- [session-intake.md](../skills/procedures/testing-ticket-workflow/references/session-intake.md) — intake before any Playwright run.
- [workspace-guide-template.md](../skills/procedures/testing-ticket-workflow/references/workspace-guide-template.md) — saving project defaults.
- [playwright-discipline.md](../skills/procedures/testing-ticket-workflow/references/playwright-discipline.md) — Phase E execution.
- [result-update-discipline.md](../skills/procedures/testing-ticket-workflow/references/result-update-discipline.md) — Phase G result update.
- [worked-example.md](../skills/procedures/testing-ticket-workflow/references/worked-example.md) — unsure what good output looks like.

## Per-skill: retest-bug
- [project-config-template.md](../skills/procedures/retest-bug-workflow/references/project-config-template.md) — no retest guide yet.
- [comment-template-v2.md](../skills/procedures/retest-bug-workflow/references/comment-template-v2.md) — rendering a FE retest comment.
- [debug-discipline.md](../skills/procedures/retest-bug-workflow/references/debug-discipline.md) — fix still fails after retest.
- [gotchas.md](../skills/procedures/retest-bug-workflow/references/gotchas.md) — browser/page oddities during retest.
- [post-mortem-template.md](../skills/procedures/retest-bug-workflow/references/post-mortem-template.md) — retest wasted time or repeated a mistake.
- [post-mortem-log.md](../skills/procedures/retest-bug-workflow/references/post-mortem-log.md) — reading past lessons.
- [new-skill-template.md](../skills/procedures/retest-bug-workflow/references/new-skill-template.md) — stub pointing to the skill template.
- [worked-example.md](../skills/procedures/retest-bug-workflow/references/worked-example.md) — unsure what good output looks like.

## Per-skill: create-bug
- [bug-draft-template.md](../skills/procedures/create-bug-workflow/references/bug-draft-template.md) — user picked Helix default format.
- [posting-discipline.md](../skills/procedures/create-bug-workflow/references/posting-discipline.md) — creating the Jira/GitHub issue.
- [worked-example.md](../skills/procedures/create-bug-workflow/references/worked-example.md) — unsure what good output looks like.

## Workspace-specific *(workspace-only)*
- the workspace guide ([discovery](workspace-guide-discovery.md)) — project config and where its capture tool contracts live.
