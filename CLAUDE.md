# Helix — contributor rules

## Version

- **Source of truth:** [VERSION](VERSION)
- Run `./scripts/sync-version.sh` after editing `VERSION`
- Changing `skills/*/SKILL.md`, `commands/*.md`, or `references/*.md` triggers **patch bump** via pre-commit (unless `VERSION` is already staged)
- CI creates a [GitHub Release](https://github.com/Thitic9203/helix/releases) when `VERSION` changes on `main`

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Layout

| Skill | Path |
|-------|------|
| TC FE prep | `skills/tc-fe-prep-workflow/` |
| TC API prep | `skills/tc-api-prep-workflow/` |
| Retest bug | `skills/retest-bug-workflow/` |
| Testing ticket | `skills/testing-ticket-workflow/` |
| Create bug | `skills/create-bug-workflow/` |

Commands: `commands/helix.md` (canonical menu), plus one file per workflow.

## Ship checklist (Rule 2)

Before merging a **new or renamed** workflow skill:

1. `skills/<name>/SKILL.md` + `references/` as needed
2. [README.md](README.md) — user-visible workflow list
3. [.claude-plugin/plugin.json](.claude-plugin/plugin.json) — `skills` entry
4. `commands/<name>.md` — slash command with trigger + negative case in `description`
5. [references/skill-routing.md](references/skill-routing.md) — one row in the routing table

WIP: `skills/in-progress/` only until the checklist passes.

## Quality bar

- Portable: [references/portable-content.md](references/portable-content.md) — no machine paths, no single-project coupling, no assumed Helix install cwd in skills.
- User chat: [references/user-communication.md](references/user-communication.md) — link from skills; do not paste the full rule in four places.
- Pluton-aligned skills: [references/skill-rules-style.md](references/skill-rules-style.md) — `proactive_triggers`, MUST/NEVER + reason, refusal-first, QA closing.
- Doc map: [docs/DOC-MAP.md](docs/DOC-MAP.md) — avoid duplicating README/helix menu in other md files.
- WIP/retired skills: `skills/in-progress/`, `skills/deprecated/` (excluded from `link-skills.sh`).

## New skill

[docs/new-skill-template.md](docs/new-skill-template.md)
