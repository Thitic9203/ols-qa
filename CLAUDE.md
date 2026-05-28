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

## Quality bar

- Portable: no machine paths, no real ticket IDs in committed skills.
- User chat: [references/user-communication.md](references/user-communication.md) — link from skills; do not paste the full rule in four places.
- Doc map: [docs/DOC-MAP.md](docs/DOC-MAP.md) — avoid duplicating README/helix menu in other md files.

## New skill

[skills/retest-bug-workflow/references/new-skill-template.md](skills/retest-bug-workflow/references/new-skill-template.md)
