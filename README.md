# Helix — AI QA assistant

**Version: 1.4.0** · [Releases](https://github.com/Thitic9203/helix/releases)

Portable skill pack for AI agents: **manual FE test-case prep**, **Playwright ticket testing**, **create bug**, and **Jira bug retests** — one entry command.

Works with **Claude Code**, **Cursor**, **Codex**, and any tool that reads `SKILL.md` or `AGENTS.md`.

## Why Helix

| Workflow | Summary |
|----------|---------|
| **TC FE Preparation** | Story AC/EC → manual FE TC table + CSV → Jira comment on the story you name |
| **TC API Preparation** | API spec + Swagger → API TC table → comment link or CSV/Excel download |
| **Retest bug** | Verify a fix — API/UI, Swagger, evidence, comment, transition |
| **Testing ticket** | Intake → Playwright → summary in chat → optional result update elsewhere |
| **Create bug** | Jira/GitHub target + format + details → confirm → file and verify |

## Quick install

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

Clones to `~/.helix/tc-fe-prep`, links skills for Claude/Cursor/Codex, registers the Claude plugin cache, and enables git hooks for version sync.

### Manual install

```bash
git clone https://github.com/Thitic9203/helix.git
cd helix
./scripts/setup.sh
./scripts/link-skills.sh
git config core.hooksPath scripts/hooks
```

## Usage

Run **`/helix`** for the English menu and routing ([commands/helix.md](commands/helix.md)).

| Shortcut | Skill |
|----------|--------|
| `/helix` | Router |
| `/tc-fe-prep ISSUE-123` | `tc-fe-prep-workflow` |
| `/tc-api-prep` | `tc-api-prep-workflow` |
| `/retest-bug ISSUE-456` | `retest-bug-workflow` |
| `/testing-ticket ISSUE-789` | `testing-ticket-workflow` |
| `/create-bug` | `create-bug-workflow` |

Other agents: read [AGENTS.md](AGENTS.md), then invoke the skill by name.

**Language:** English only for questions, menus, and confirmations — [references/user-communication.md](references/user-communication.md).

## Skills

| Skill | Description |
|-------|-------------|
| [tc-fe-prep-workflow](skills/tc-fe-prep-workflow/SKILL.md) | FE manual TC from story AC/EC |
| [tc-api-prep-workflow](skills/tc-api-prep-workflow/SKILL.md) | API manual TC from spec + Swagger |
| [retest-bug-workflow](skills/retest-bug-workflow/SKILL.md) | Bug retest with evidence |
| [testing-ticket-workflow](skills/testing-ticket-workflow/SKILL.md) | Playwright ticket test + optional result update |
| [create-bug-workflow](skills/create-bug-workflow/SKILL.md) | File bugs on Jira/GitHub |

## Prerequisites (human)

- Jira access to the issues you name
- Browser logged into Jira when posting large comments or UI retests
- Optional workspace guides: `references/*-tc-fe-prep-guide.md`, `*-retest-guide.md`, `*-testing-ticket-guide.md`

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/DOC-MAP.md](docs/DOC-MAP.md) | Where each topic lives (avoid duplicate md) |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Version bump, hooks, releases |
| [docs/wiki/Home.md](docs/wiki/Home.md) | Wiki entry (mirror to GitHub Wiki) |
| [CONTEXT.md](CONTEXT.md) | Domain glossary |

## Scripts

```bash
./scripts/install.sh
./scripts/bump-version.sh patch   # contributor: bump VERSION + sync
./scripts/sync-version.sh --check
./scripts/list-skills.sh
```

## Update

```bash
cd ~/.helix/tc-fe-prep && git pull
```

## License

MIT — [LICENSE](LICENSE)
