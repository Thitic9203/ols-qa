# Contributing to Helix

## Dev environment — fewer agent questions (two layers)

To reduce how often the AI agent asks you to confirm things while working on Helix:

**Layer 1 — automatic, zero setup (committed `.claude/settings.json`).**
When you clone this repo and open it in Claude Code (and trust the folder), you
automatically get: read-only Bash allowlist (git status/diff/log, ls, cat, rg…) +
two context hooks (SessionStart injects branch/version/WIP; PreCompact preserves key
decisions across auto-compaction). Ships and updates via git — no manual steps.
Intentionally conservative because this is a public repo: no `acceptEdits`, no code
execution is auto-approved.

**Layer 2 — opt-in, one command (`scripts/helix-setup-devenv.sh`).**
For the fuller productivity config that touches your **global** `~/.claude/`:
`defaultMode: acceptEdits`, a wider safe Bash allowlist (node/python/gh-read/…), and
"bias toward action" + "memory discipline" rules in `~/.claude/CLAUDE.md`.

```bash
bash scripts/helix-setup-devenv.sh            # install (idempotent, backs up first)
bash scripts/helix-setup-devenv.sh --uninstall # revert (keeps your own rules)
```

It merges (never clobbers), is safe to re-run, and once opted in,
`helix-auto-update.sh` keeps it in sync on future updates. Requires `jq`.
The narrowed git/`gh` allowlist deliberately leaves destructive/outward verbs
(`git push --force`, `git reset --hard`, `gh pr merge`, `gh repo delete`) to prompt.

See the full rationale: [docs/plan/action-items-reduce-ai-questions.html](plan/action-items-reduce-ai-questions.html).

## Versioning (automatic)

**Source of truth:** [VERSION](../VERSION) at repo root.

When you change any of these, the **pre-commit hook** bumps the **patch** version unless `VERSION` is already staged:

- `skills/*/SKILL.md`
- `commands/*.md`
- `references/*.md` (repo root only)
- `scripts/export-markdown-table-to-csv.py` (when skill docs change)

Manual bump:

```bash
./scripts/bump-version.sh patch   # default
./scripts/bump-version.sh minor
./scripts/bump-version.sh major
```

Sync without bumping (after editing `VERSION` by hand):

```bash
./scripts/sync-version.sh
```

Check consistency:

```bash
./scripts/sync-version.sh --check
```

### What gets updated

| File | Field |
|------|--------|
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `metadata.version`, plugin `version` |
| `README.md` | `**Version: x.y.z**` line under the title |

### CI / releases (fully automatic)

**You do not run** `gh release create`, `workflow_dispatch`, or manual git tags.

On every **push to `main`**, the `publish` job in [.github/workflows/version.yml](../.github/workflows/version.yml):

1. Bumps **patch** in `VERSION` (+ syncs plugin.json / README) if skill/command/workflow files changed without a `VERSION` edit in that push
2. Pushes that bump commit (if any) in the **same** run
3. Verifies version markers
4. Creates [GitHub Release](https://github.com/Thitic9203/helix/releases) `vX.Y.Z` when the tag does not exist yet

**Pull requests:** CI only verifies sync and warns if merge will trigger a patch bump.

Optional local pre-commit hook still bumps patch before you commit; CI covers merges even if you skip the hook.

Workflow path patterns (same as pre-commit):

- `skills/*/SKILL.md`
- `skills/*/references/**`
- `commands/*.md`
- `references/*.md` (repo root)

Enable hooks after clone:

```bash
git config core.hooksPath scripts/hooks
```

The installer sets this automatically.

## Adding a skill

1. Copy [docs/new-skill-template.md](new-skill-template.md) → `skills/<name>/SKILL.md`
2. Follow [references/skill-rules-style.md](../references/skill-rules-style.md) and [references/pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md)
3. WIP: `skills/in-progress/<name>/` (excluded from `link-skills.sh` until promoted)
4. Complete [pluton-ship-checklist.md](pluton-ship-checklist.md) before merge

Repeated exports (CSV from markdown tables): use [scripts/export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py).

## Skill pressure tests (before shipping workflow changes)

Helix adapts **agent-workflow discipline** for QA — not a copy of external skill libraries. Before merging substantive skill edits, run a quick **pressure test** (manual or with a second agent):

1. **Scenario** — One realistic user message (include Thai/mixed input if the skill uses [intent-shortcuts.md](../references/intent-shortcuts.md)).
2. **Expected** — Which skill loads, first gate refused or passed, one `Using **{skill}**` announcement.
3. **Rationalization trap** — Agent tries to skip Jira approval or claim “posted” without re-read → must hit [agent-rationalizations.md](../references/agent-rationalizations.md) / [qa-evidence-gates.md](../references/qa-evidence-gates.md).
4. **Evidence** — Verdict block includes counts or paths, not “done” alone.

Record failures in the PR description; fix the skill reference, not the test scenario, unless the scenario was wrong.

## Documentation rules

- Follow [DOC-MAP.md](DOC-MAP.md) — no copy-paste of the `/helix` menu outside `commands/helix.md`.
- When **install**, **update**, or **Claude plugin** behaviour changes, update [README.md](../README.md) and [docs/wiki/Home.md](wiki/Home.md) (GitHub Wiki mirror).
- User-facing language: [references/user-communication.md](../references/user-communication.md).
- Portable skills: [references/portable-content.md](../references/portable-content.md) — no real ticket IDs, no `/Users/...`, no `~/.helix` in `skills/` or `commands/`, no one-product env/commands (e.g. `pd3`, customer Playwright paths).

Quick check before commit (same as CI):

```bash
chmod +x scripts/ci-check-portable-skills.sh scripts/ci-check-skill-structure.sh
./scripts/ci-check-portable-skills.sh
./scripts/ci-check-skill-structure.sh
```

(README/install scripts may mention `~/.helix` for humans only — not in `skills/` or `commands/`.)
