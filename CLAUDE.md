# helix — contributor rules

## Skill layout

- Shippable skills live under `skills/<skill-name>/SKILL.md`
- Details go in `skills/<skill-name>/references/` (progressive disclosure)
- Keep `SKILL.md` under ~500 lines

## Portability rules

- **No absolute paths** on a developer machine (`/Users/...`, `C:\...`)
- **No private repo names** or real ticket numbers in committed files
- Use placeholders and workspace-relative paths in examples (`references/{ISSUE_KEY}_FE_TC.md`)
- User-facing agent responses for this plugin: **English**

## Version sync

- Bump `version` in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` together

## Adding skills

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`)
2. Add path to `plugin.json` → `skills` array
3. Link in `README.md`
4. Optional: `commands/<command>.md` for Claude Code slash commands
