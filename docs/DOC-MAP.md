# Documentation map (single source of truth)

Use this map to avoid duplicating content across markdown files.

## User-facing

| Topic | Canonical file | Do not duplicate in |
|-------|----------------|---------------------|
| Install / update | [README.md](../README.md) | AGENTS.md, wiki |
| Version number | [VERSION](../VERSION) + README line | Manual edits to plugin.json only via `sync-version.sh` |
| `/helix` menu text | [commands/helix.md](../commands/helix.md) | AGENTS.md (link only), README (summary table OK) |
| Slash command → skill | [commands/*.md](../commands/) | SKILL.md bodies |
| English-only chat | [references/user-communication.md](../references/user-communication.md) | Full rule text in every skill (link + 1 line) |
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
| Workflow steps | `skills/*/SKILL.md` | commands/*.md (invoke only) |

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

- **commands/** — thin frontmatter: invoke skill X, English only, 3–10 lines.
- **skills/** — full procedure and gates.
