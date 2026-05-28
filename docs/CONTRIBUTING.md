# Contributing to Helix

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
2. Follow [references/skill-rules-style.md](../references/skill-rules-style.md) — aligned with [<ORG> claudeskill5rules](https://github.com/<ORG>/team-pluton-skills/blob/main/docs/claudeskill5rules.md) where applicable (`description`, `proactive_triggers`, MUST/NEVER, QA closing)
3. WIP: `skills/in-progress/<name>/` (excluded from `link-skills.sh` until promoted)
4. **Ship checklist (Rule 2):** README workflow list + `.claude-plugin/plugin.json` + `commands/<name>.md` + row in [references/skill-routing.md](../references/skill-routing.md) + [docs/DOC-MAP.md](DOC-MAP.md)

Repeated exports (CSV from markdown tables): use [scripts/export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py).

## Documentation rules

- Follow [DOC-MAP.md](DOC-MAP.md) — no copy-paste of the `/helix` menu outside `commands/helix.md`.
- User-facing language: [references/user-communication.md](../references/user-communication.md).
- Portable skills: [references/portable-content.md](../references/portable-content.md) — no real ticket IDs, no `/Users/...`, no `~/.helix` in `skills/` or `commands/`, no one-product env/commands (e.g. `pd3`, customer Playwright paths).

Quick check before commit (same as CI):

```bash
chmod +x scripts/ci-check-portable-skills.sh
./scripts/ci-check-portable-skills.sh
```

(README/install scripts may mention `~/.helix` for humans only — not in `skills/` or `commands/`.)
