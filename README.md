# Helix — AI QA assistant

Portable skill pack for AI agents: **manual FE test-case prep**, **Playwright ticket testing**, and **Jira bug retests**, with one entry command.

Works with **Claude Code**, **Cursor**, **Codex**, and any tool that reads `SKILL.md` or `AGENTS.md`.

## Why Helix

| Task | What Helix does |
|------|-----------------|
| **TC FE Preparation** | Story AC/EC → 9-column manual TC table + CSV → one Jira comment on the story you name |
| **Retest bug** | Login, test API/UI, Swagger check, evidence, comment, transition, assign |
| **Testing ticket** | Intake → Playwright → **summary in chat** → optional result update (link + columns) |
| **Create bug** | Target (Jira/GitHub) + format + details → confirm → file and verify |
| **Other** | Ask Helix; it routes or helps ad hoc |

## Quick install

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

This clones to `~/.helix/tc-fe-prep`, links **both** skills into `~/.claude/skills` and `~/.cursor/skills` when those folders exist, and registers the Claude Code plugin cache.

### Manual install

```bash
git clone https://github.com/Thitic9203/helix.git
cd helix
./scripts/link-skills.sh
```

## Usage

### Helix menu (recommended)

```text
/helix
```

Helix introduces itself and asks what you need:

1. TC FE Preparation  
2. Retest bug  
3. Testing ticket  
4. Create bug  
5. Other (describe)

You can also run shortcuts:

| Command | Skill |
|---------|--------|
| `/helix` | Router → choose workflow |
| `/tc-fe-prep ISSUE-123` | `tc-fe-prep-workflow` |
| `/retest-bug ISSUE-456` | `retest-bug-workflow` |
| `/testing-ticket ISSUE-789` | `testing-ticket-workflow` |
| `/create-bug` | `create-bug-workflow` |

### Any other agent

Read `AGENTS.md` or invoke:

- `tc-fe-prep-workflow`
- `retest-bug-workflow`
- `testing-ticket-workflow`
- `create-bug-workflow`

**User-facing replies:** **English only** (questions, menus, confirmations) — not Thai. See [references/user-communication.md](references/user-communication.md).

## Skills

| Skill | Description |
|-------|-------------|
| [tc-fe-prep-workflow](skills/tc-fe-prep-workflow/SKILL.md) | FE manual TC from story AC/EC, draft + CSV + Jira |
| [retest-bug-workflow](skills/retest-bug-workflow/SKILL.md) | Full bug retest with evidence and ticket hygiene |
| [testing-ticket-workflow](skills/testing-ticket-workflow/SKILL.md) | Playwright run, chat summary, optional result destination update |
| [create-bug-workflow](skills/create-bug-workflow/SKILL.md) | File bugs on Jira/GitHub with format + confirm |

## Prerequisites (human)

- Jira access to the issues you name
- Browser logged into Jira (for large comments / attachments / retest UI)
- Project guide files in your repo (optional; skills help create them):
  - `references/*-tc-fe-prep-guide.md`
  - `references/*-retest-guide.md`
  - `references/*-testing-ticket-guide.md` (optional non-secret defaults)

## Scripts

```bash
./scripts/install.sh      # One-command install
./scripts/setup.sh        # After manual clone
./scripts/link-skills.sh  # Symlink skills for Claude, Cursor, Codex, agents
./scripts/list-skills.sh  # List bundled skills
```

## Update

```bash
cd ~/.helix/tc-fe-prep && git pull
```

## Domain language

See [CONTEXT.md](CONTEXT.md).

## License

MIT — [LICENSE](LICENSE)
