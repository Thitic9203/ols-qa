# helix — TC FE Prep

Portable skill pack for AI agents: turn a Jira **story** (AC/EC) into **frontend manual test cases**, get approval in chat, then publish one Jira comment with a 9-column table and matching CSV.

Works with **Claude Code**, **Cursor**, **Codex**, and any tool that loads `SKILL.md` or `AGENTS.md`.

## Why use this

| Without skill | With skill |
|---------------|------------|
| Reread story, invent table format, miss EC coverage | Repeatable AC/EC mapping and structure |
| Ambiguous "Shared" preconditions | Shared prep block + clear per-case preconditions |
| Broken Jira tables / truncated comments | Formatting rules + verify-on-Jira discipline |
| CSV out of sync with comment | Single markdown source → CSV export |

## Quick install

### One command (recommended)

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

This will:

1. Clone or update the repo under `~/.helix/tc-fe-prep`
2. Register the Claude Code plugin cache symlink (if you use Claude Code)
3. Link the skill into `~/.claude/skills/` and `~/.cursor/skills/` when those folders exist

### Manual install (any agent)

```bash
git clone https://github.com/Thitic9203/helix.git
cd helix
./scripts/link-skills.sh
```

Then point your agent at:

- **Skill file:** `skills/tc-fe-prep-workflow/SKILL.md`
- **Or root:** `AGENTS.md` (entry point for agents that read repo root)

### Cursor

After `install.sh` or `link-skills.sh`, the skill appears as `tc-fe-prep-workflow` under your Cursor skills directory. Invoke by asking to prepare FE test cases for a Jira story.

### Claude Code plugin

```bash
# After install.sh — add marketplace from your clone path, or use:
/plugin marketplace add ~/.helix/tc-fe-prep
/plugin install helix@helix-dev
```

Then run:

```text
/tc-fe-prep PROJ-123
```

### Update

```bash
cd ~/.helix/tc-fe-prep && git pull
```

Symlinks point at the repo — no reinstall needed.

## Prerequisites (human)

- Jira access to the target story
- Browser logged into Jira (if using large-comment / CSV upload flows)
- VPN or network access to test environments (if your project requires it)

## Skill

| Skill | Purpose |
|-------|---------|
| [tc-fe-prep-workflow](skills/tc-fe-prep-workflow/SKILL.md) | Full flow: story → draft → approve → artifacts → Jira |

## References

| File | Purpose |
|------|---------|
| [prerequisites.md](skills/tc-fe-prep-workflow/references/prerequisites.md) | Pre-flight checklist |
| [jira-formatting.md](skills/tc-fe-prep-workflow/references/jira-formatting.md) | Tables, `<br>`, CSV footer |
| [gotchas.md](skills/tc-fe-prep-workflow/references/gotchas.md) | Common failures |
| [markdown-template.md](skills/tc-fe-prep-workflow/references/markdown-template.md) | Skeleton table |
| [project-config-template.md](skills/tc-fe-prep-workflow/references/project-config-template.md) | First-time project setup |
| [publish-options.md](skills/tc-fe-prep-workflow/references/publish-options.md) | How to post without truncation |

## Scripts

```bash
./scripts/install.sh      # Clone + symlinks (Claude + Cursor)
./scripts/setup.sh        # Setup after manual git clone
./scripts/link-skills.sh  # Link skill into agent skill folders
./scripts/list-skills.sh  # List bundled skills
```

## Domain language

See [CONTEXT.md](CONTEXT.md).

## License

MIT — see [LICENSE](LICENSE).
