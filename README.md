# Helix — AI QA assistant

**Version: 1.5.2** · [Releases](https://github.com/Thitic9203/helix/releases)

Portable skill pack for AI agents: **manual FE test-case prep**, **Playwright ticket testing**, **create bug**, and **Jira bug retests** — one entry command.

Works with **Claude Code**, **Cursor**, **Codex**, and any tool that reads `SKILL.md` or `AGENTS.md`.

> **Scope & expectations**  
> Helix is built for QA work with **clear boundaries**—a defined ticket, environment, inputs, and what “done” looks like. When scope is vague or still in flux, you may need extra clarification rounds, and the output may require more review. Sharper scope upfront usually means stronger, faster results.

## Why Helix

| Workflow | Summary |
|----------|---------|
| **TC FE Preparation** | Story AC/EC → manual FE TC table + CSV → Jira comment on the story you name |
| **TC API Preparation** | API spec + Swagger → API TC table → comment link or CSV/Excel download |
| **Retest bug** | Verify a fix — API/UI, Swagger, evidence, comment, transition |
| **Testing ticket** | Intake → Playwright → summary in chat → optional result update elsewhere |
| **Create bug** | Jira/GitHub target + format + details → confirm → file and verify |

## Install (one-time)

Open a terminal and run:

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

This clones Helix to `~/.helix/tc-fe-prep`, links skills for Claude / Cursor / Codex, and registers the Claude plugin cache.

## Usage

Open **Claude Code** (or your agent) and run:

```text
/helix
```

Pick a workflow from the English menu ([commands/helix.md](commands/helix.md)).

| Shortcut | What it does |
|----------|----------------|
| `/helix` | Menu + routing |
| `/tc-fe-prep` | FE manual test cases from a Jira story |
| `/tc-api-prep` | API manual test cases from spec + Swagger |
| `/retest-bug` | Retest a bug after a dev fix |
| `/testing-ticket` | Playwright test for one ticket |
| `/create-bug` | File bugs on Jira or GitHub |

**First run:** many workflows ask for project details once (Jira domain, URLs, credentials) and can save a guide under `references/` in your repo — answer step by step when prompted.

**Other agents:** read [AGENTS.md](AGENTS.md) and invoke the skill by name.

**Language:** English only for questions, menus, and confirmations — [references/user-communication.md](references/user-communication.md).

## Update (when a new version ships)

Open a terminal and run:

```bash
cd ~/.helix/tc-fe-prep && git pull
```

That is enough — no need to re-run the install script or any other commands.

<details>
<summary>Manual install (contributors)</summary>

```bash
git clone https://github.com/Thitic9203/helix.git
cd helix
./scripts/setup.sh
git config core.hooksPath scripts/hooks
```

</details>

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

## License

MIT — [LICENSE](LICENSE)
