# Helix — AI QA assistant

**Version: 1.5.7** · [Releases](https://github.com/Thitic9203/helix/releases)

Portable skill pack for AI agents: **FE/API manual test-case prep** (with coverage + quality review), **Playwright ticket testing**, **create bug**, and **Jira bug retests** — one entry menu across tools.

> **Scope & expectations**  
> Helix is built for QA work with **clear boundaries**—a defined ticket, environment, inputs, and what “done” looks like. When scope is vague or still in flux, you may need extra clarification rounds, and the output may require more review. Sharper scope upfront usually means stronger, faster results.

## Why Helix

| Workflow | Summary |
|----------|---------|
| **TC FE Preparation** | Story AC/EC → coverage review → manual FE TC table + CSV → Jira comment |
| **TC API Preparation** | API spec + Swagger → coverage review → API TC table → comment or CSV/Excel |
| **Retest bug** | Verify a fix — API/UI, Swagger, evidence, comment, transition |
| **Testing ticket** | Intake → Playwright → summary in chat → optional result update elsewhere |
| **Create bug** | Jira/GitHub target + format + details → confirm → file and verify |

TC prep workflows include **AC/EC or spec/Swagger alignment review** and **ISTQB / ISO/IEC/IEEE 29119-3–aligned** manual test-case quality checks (see skill references).

## Supported AI agents

Helix uses the open **[Agent Skills](https://agentskills.io)** format (`SKILL.md`). One install links skills for every path your machine supports.

| Agent / IDE | Supported | Global skills folder (after install) |
|-------------|-----------|--------------------------------------|
| **Claude Code** | Yes | `~/.claude/skills/` + plugin cache |
| **Cursor** | Yes | `~/.cursor/skills/` |
| **OpenAI Codex** | Yes | `~/.codex/skills/` |
| **GitHub Copilot** (VS Code) | Yes | `~/.copilot/skills/` |
| **Gemini CLI** | Yes | `~/.gemini/skills/` |
| **Windsurf Cascade** | Yes | `~/.codeium/windsurf/skills/` |
| **Cline** | Yes | `~/.cline/skills/` |
| **OpenCode** | Yes | `~/.config/opencode/skills/` |
| **Pi** | Yes | `~/.pi/agent/skills/` |
| **Other (Agent Skills)** | Yes | `~/.agents/skills/` (shared alias) |

**Team / repo scope (optional):** `.github/skills/`, `.agents/skills/`, `.windsurf/skills/`, `.cline/skills/`, `.gemini/skills/` when you run workspace linking (below).

Details: [docs/supported-agents.md](docs/supported-agents.md) · copy-paste prompts: [references/agent-entry.md](references/agent-entry.md)

Web-only chat without skill discovery is not supported — use an agent that loads `SKILL.md` folders.

## Install (one-time)

### Step 1 — Everyone (same command)

```bash
curl -sL https://raw.githubusercontent.com/Thitic9203/helix/main/scripts/install.sh | bash
```

This clones Helix to `~/.helix/tc-fe-prep`, symlinks all workflow skills into the global folders above (skips paths that do not exist on your OS yet), and registers the **Claude Code** plugin cache.

### Step 2 — By agent (what you do next)

| Agent / IDE | After the install script | Optional: skills in your git repo (team) |
|-------------|------------------------|------------------------------------------|
| **Claude Code** | Open the project → run `/helix` | `HELIX_LINK_WORKSPACE=$PWD ~/.helix/tc-fe-prep/scripts/link-skills.sh` |
| **Cursor** | Reload window → `@helix` or ask for skill **helix** | Same `HELIX_LINK_WORKSPACE=…` from repo root |
| **Codex** | Run Codex in a folder → skills auto-discovered | Same workspace command → `.agents/skills/` etc. |
| **GitHub Copilot** | VS Code: ensure Agent Skills enabled → skill **helix** in chat | **Recommended:** workspace link → `.github/skills/` |
| **Gemini CLI** | `gemini` → `/skills list` → use **helix** | Workspace link → `.gemini/skills/` or `.agents/skills/` |
| **Windsurf** | `@helix` in Cascade | Workspace link → `.windsurf/skills/` |
| **Cline** | Enable Skills → pick **helix** | Workspace link → `.cline/skills/` |
| **OpenCode / Pi** | Open project → skill list per tool docs | Workspace link → `.agents/skills/` |

**Workspace link (one line, from your project root):**

```bash
HELIX_LINK_WORKSPACE=$PWD ~/.helix/tc-fe-prep/scripts/link-skills.sh
```

Commit `.github/skills/` if your team uses Copilot on the same repository.

### Health check (`helix doctor`)

After install (or when skills do not appear):

```bash
bash ~/.helix/tc-fe-prep/scripts/helix-doctor.sh
# optional: also check project skill folders
HELIX_LINK_WORKSPACE=$PWD bash ~/.helix/tc-fe-prep/scripts/helix-doctor.sh
```

Reports Helix version, global skill symlinks per agent, and Claude plugin cache. **Works best with:** Jira (MCP or logged-in browser), Playwright in your app repo, optional `references/*-guide.md` in your project.

## Usage

**You do not have to start with `/helix`.** If you already know the workflow, call it directly — that skips the menu and is the recommended path. Use `/helix` (or skill **`helix`**) only when you want the menu or are unsure which workflow fits.

### Run a workflow directly (recommended when you know the goal)

| Goal | Claude Code | Other agents (skill name) |
|------|-------------|---------------------------|
| FE manual TC from story | `/tc-fe-prep` | `tc-fe-prep-workflow` |
| API manual TC from spec + Swagger | `/tc-api-prep` | `tc-api-prep-workflow` |
| Retest a bug after a fix | `/retest-bug` | `retest-bug-workflow` |
| Playwright test for one ticket | `/testing-ticket` | `testing-ticket-workflow` |
| File bugs on Jira or GitHub | `/create-bug` | `create-bug-workflow` |

Append a Jira key or URL when your tool supports it, e.g. `/tc-fe-prep PROJ-123` or “run `retest-bug-workflow` on PROJ-456”.

Full map: [references/skill-routing.md](references/skill-routing.md) · copy-paste prompts: [references/agent-entry.md](references/agent-entry.md)

### Open the Helix menu (optional — when unsure)

| Agent / IDE | How to open the menu |
|-------------|----------------------|
| **Claude Code** | `/helix` |
| **Cursor** | `@helix` or “use skill helix” |
| **Windsurf** | `@helix` |
| **GitHub Copilot** | “Follow the **helix** skill and show the QA menu” |
| **Gemini CLI** | `/skills list` then skill **helix** |
| **Cline** | Select skill **helix** |
| **Codex** | Ask to load skill **helix** |
| **OpenCode / Pi** | Invoke **helix** per tool’s skill UI |

The menu offers options 1–6 (TC FE, TC API, retest, testing ticket, create bug, other) and routes to the same workflows as the table above.

### First run tips

- Workflows auto-load **`references/*-guide.md`** in your repo when present ([workspace-guide-discovery.md](references/workspace-guide-discovery.md)) — fewer repeated questions.
- Long sessions may write **`references/helix-handoff-{KEY}.md`** so you can resume in a new chat ([session-closing.md](references/session-closing.md)).
- Menus and questions are **English only** — [references/user-communication.md](references/user-communication.md). Jira/Sheet content may follow your project language after you approve.
- Non–Claude Code agents: read [AGENTS.md](AGENTS.md) if the tool loads repo-level agent instructions.

## Update (when a new version ships)

Releases: [github.com/Thitic9203/helix/releases](https://github.com/Thitic9203/helix/releases) (automatic on every `main` push).

### Step 1 — Everyone

```bash
cd ~/.helix/tc-fe-prep && git pull
```

Symlinks point at this folder — **global skills update automatically** after pull. No need to re-run the curl installer unless you deleted the repo.

### Step 2 — By agent (if needed)

| Agent / IDE | Usually enough | Re-run only if… |
|-------------|----------------|-----------------|
| **Claude Code** | `git pull` | Plugin cache stale → run `~/.helix/tc-fe-prep/scripts/install.sh` again |
| **Cursor / Codex / Copilot / Gemini / Windsurf / Cline / Pi** | `git pull` | You removed `~/.*/skills/*` symlinks → `bash ~/.helix/tc-fe-prep/scripts/link-skills.sh` |
| **Team repo (`.github/skills/`)** | `git pull` in Helix + pull your project | New Helix skill added → `HELIX_LINK_WORKSPACE=$PWD ~/.helix/tc-fe-prep/scripts/link-skills.sh` |

You do **not** need to bump anything manually — check **README version** or [Releases](https://github.com/Thitic9203/helix/releases) for the current tag.

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
| [helix](skills/helix/SKILL.md) | Router menu (agents without `/helix`) |
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
| [docs/supported-agents.md](docs/supported-agents.md) | Paths, capabilities, limitations |
| [references/agent-entry.md](references/agent-entry.md) | Per-agent start prompts |
| [docs/DOC-MAP.md](docs/DOC-MAP.md) | Where each topic lives |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Version bump, hooks, releases |
| [docs/wiki/Home.md](docs/wiki/Home.md) | Wiki entry (mirror to GitHub Wiki) |
| [CONTEXT.md](CONTEXT.md) | Domain glossary |

## Scripts

```bash
./scripts/install.sh
./scripts/helix-doctor.sh          # verify symlinks + version
./scripts/link-skills.sh
./scripts/bump-version.sh patch   # contributor: bump VERSION + sync
./scripts/sync-version.sh --check
./scripts/list-skills.sh
```

## License

MIT — [LICENSE](LICENSE)
