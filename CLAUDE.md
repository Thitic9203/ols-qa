# Helix — contributor rules

## Skills

| Skill | Path |
|-------|------|
| TC FE prep | `skills/tc-fe-prep-workflow/` |
| Retest bug | `skills/retest-bug-workflow/` |

Both must stay **portable**: no machine-specific paths, no real ticket IDs in committed files.

## Commands

| Command | File |
|---------|------|
| `/helix` | `commands/helix.md` — router |
| `/tc-fe-prep` | `commands/tc-fe-prep.md` |
| `/retest-bug` | `commands/retest-bug.md` |

## User language

Helix speaks **concise English** to users (defined in `commands/helix.md` and both skills).

## Version

Bump `version` in `.claude-plugin/plugin.json` and `marketplace.json` together.

## Adding skills

See `skills/retest-bug-workflow/references/new-skill-template.md`.
