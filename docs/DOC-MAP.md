# Documentation map (single source of truth)

Use this map to avoid duplicating content across markdown files.

## User-facing

| Topic | Canonical file | Do not duplicate in |
|-------|----------------|---------------------|
| Install / update / auto-update | [README.md](../README.md) | AGENTS.md, wiki |
| Wiki home (mirror README update topics) | [docs/wiki/Home.md](wiki/Home.md) | Duplicate full README |
| Supported AI agents | [docs/supported-agents.md](supported-agents.md) | README (summary table only) |
| Per-agent start prompts | [references/agent-entry.md](../references/agent-entry.md) | — |
| Version number | [VERSION](../VERSION) + README line | Manual edits to plugin.json only via `sync-version.sh` |
| `/helix` menu text | [commands/helix.md](../commands/helix.md) | AGENTS.md (link only), README (summary table OK) |
| Slash command → skill | [commands/*.md](../commands/) | SKILL.md bodies |
| English-only chat | [references/user-communication.md](../references/user-communication.md) | Full rule text in every skill (link + 1 line) |
| Workspace guide discovery | [references/workspace-guide-discovery.md](../references/workspace-guide-discovery.md) | Per-workflow glob tables in skills |
| Intake one-pager | [references/intake-one-pager.md](../references/intake-one-pager.md) | Long workflows (API, ticket, bug, retest) |
| Session closing / handoff | [references/session-closing.md](../references/session-closing.md), [handoff-file-template.md](../references/handoff-file-template.md) | End of every workflow |
| Verify closing checklist | [references/verify-closing-checklist.md](../references/verify-closing-checklist.md) | Unified QA close |
| Coverage delta (post-review) | [references/coverage-delta-template.md](../references/coverage-delta-template.md) | TC FE + API prep |
| Swagger diff (optional) | [references/swagger-diff-phase.md](../references/swagger-diff-phase.md) | TC API when spec changes |
| Retest fix vs verify plan | [references/retest-fix-intake.md](../references/retest-fix-intake.md) | Before retest execution |
| Playwright pre-flight | [references/playwright-preflight.md](../references/playwright-preflight.md) | Testing ticket Phase D |
| Router intent (Thai/mixed) | [references/intent-shortcuts.md](../references/intent-shortcuts.md) | helix skill + commands/helix |
| Install health check | [scripts/helix-doctor.sh](../scripts/helix-doctor.sh) | README install section |
| Claude plugin (helix@helix) | [scripts/claude-plugin-sync.sh](../scripts/claude-plugin-sync.sh) | Legacy helix@local handling |
| Auto-update on session | [scripts/helix-auto-update.sh](../scripts/helix-auto-update.sh) | Manual git pull for daily use |
| Skill invocation / priority | [references/skill-invocation-discipline.md](../references/skill-invocation-discipline.md) | Full discipline in every skill |
| Session bootstrap (hooks) | [references/helix-session-bootstrap.md](../references/helix-session-bootstrap.md), [hooks/session-start](../hooks/session-start) | Dumping full SKILL.md in hook |
| QA evidence gates | [references/qa-evidence-gates.md](../references/qa-evidence-gates.md) | Ad-hoc “done” without proof |
| Agent rationalizations | [references/agent-rationalizations.md](../references/agent-rationalizations.md) | Long tables in skills |
| QA debug discipline | [references/qa-debug-discipline.md](../references/qa-debug-discipline.md) | Full debug flow in retest/ticket |
| TC API chunked scope | [references/tc-api-chunked-scope.md](../references/tc-api-chunked-scope.md) | tc-api Phase A body |
| Test execution plan | [references/test-execution-plan-template.md](../references/test-execution-plan-template.md) | testing-ticket Phase B |
| Subagent QA patterns | [references/subagent-qa-patterns.md](../references/subagent-qa-patterns.md) | — |
| Parallel prep | [references/parallel-prep.md](../references/parallel-prep.md) | — |
| Copilot / Codex tool maps | [references/copilot-tools.md](../references/copilot-tools.md), [codex-tools.md](../references/codex-tools.md) | agent-entry |
| Long workflow todos | [references/long-workflow-todos.md](../references/long-workflow-todos.md) | — |
| SessionStart hooks | [hooks/hooks.json](../hooks/hooks.json), [hooks/hooks-cursor.json](../hooks/hooks-cursor.json) | — |
| Skill authoring (Pluton-aligned) | [references/skill-rules-style.md](../references/skill-rules-style.md) | MUST/NEVER tables in every skill |
| Pluton 5 rules mapping | [references/pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md) | — |
| Pre-merge ship checklist | [docs/pluton-ship-checklist.md](pluton-ship-checklist.md) | — |
| Portable skills (no host/project lock-in) | [references/portable-content.md](../references/portable-content.md) | Machine paths, PD3, one-repo Playwright layout |
| CSV export | [references/csv-export-rules.md](../references/csv-export-rules.md) | tc-fe / tc-api skills (in-agent default) |
| TC quality (ISTQB / 29119-3) | [references/tc-quality-standards.md](../references/tc-quality-standards.md) | Full checklist duplicated in skills |
| FE AC/EC coverage review | [skills/tc-fe-prep-workflow/references/ac-ec-coverage-review.md](../skills/tc-fe-prep-workflow/references/ac-ec-coverage-review.md) | Step 4 body |
| API spec/Swagger review | [skills/tc-api-prep-workflow/references/spec-coverage-review.md](../skills/tc-api-prep-workflow/references/spec-coverage-review.md) | Phase E body |
| Skill routing / handoffs | [references/skill-routing.md](../references/skill-routing.md) | Per-skill Handoff tables |
| Session constraint recital | [references/helix-session-constraints.md](../references/helix-session-constraints.md) | Full block pasted in every skill |
| CI portable-content guard | [scripts/ci-check-portable-skills.sh](../scripts/ci-check-portable-skills.sh) | Ad-hoc grep in skills |
| New skill template | [docs/new-skill-template.md](new-skill-template.md) | `skills/retest-bug-workflow/references/new-skill-template.md` (stub only) |
| Markdown table → CSV | [scripts/export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py) | Inline CSV logic in tc-fe/tc-api skills |
| Domain glossary | [CONTEXT.md](../CONTEXT.md) | README, skills |
| Workflow steps | `skills/*/SKILL.md` | commands/*.md (read and follow) |

## Wiki (GitHub)

Mirror [docs/wiki/Home.md](wiki/Home.md) to the repo **Wiki** tab, or link users to `docs/wiki/` on `main`.

## Contributor-facing

| Topic | File |
|-------|------|
| Version bump / hooks / CI | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Claude Code plugin layout | [CLAUDE.md](../CLAUDE.md) |
| Agent entry (minimal) | [AGENTS.md](../AGENTS.md) |

## Per-skill references

Deep detail lives under `skills/<name>/references/`. The parent `SKILL.md` should **link** there, not copy long checklists.

| Skill | References |
|-------|------------|
| tc-fe-prep-workflow | prerequisites, jira-formatting, publish-options, gotchas, templates, worked-example |
| tc-api-prep-workflow | default-columns, api-tc-guidelines, delivery-options, markdown-template, worked-example, scripts/README |
| retest-bug-workflow | project-config-template, gotchas, debug-discipline, worked-example |
| testing-ticket-workflow | session-intake, playwright-discipline, result-update-discipline, worked-example |
| create-bug-workflow | bug-draft-template, posting-discipline, worked-example |

## Commands vs skills

- **commands/** — thin frontmatter: read and follow workflow SKILL.md, English only, 3–10 lines.
- **skills/** — full procedure and gates.
