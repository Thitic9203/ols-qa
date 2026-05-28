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
| tc-fe-prep-workflow | prerequisites, jira-formatting, publish-options, gotchas, templates |
| retest-bug-workflow | project-config-template, gotchas, debug-discipline |
| testing-ticket-workflow | session-intake, playwright-discipline, result-update-discipline |
| create-bug-workflow | bug-draft-template, posting-discipline |

## Commands vs skills

- **commands/** — thin frontmatter: invoke skill X, English only, 3–10 lines.
- **skills/** — full procedure and gates.
