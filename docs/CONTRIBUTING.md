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

### CI / releases

- **Push to `main`:** If workflow files change without a `VERSION` bump, the **auto-bump** job runs `./scripts/ci-auto-bump-commit.sh`, commits `chore(ci): bump version … [automated]`, and pushes to `main` (skips when the commit message already contains `[automated]`).
- **Pull requests:** CI warns if `VERSION` was not bumped; merging to `main` still triggers auto-bump when needed.
- **Release:** After verify, creates GitHub **Release** `vx.y.z` when that tag is missing.

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
2. Follow [references/skill-rules-style.md](../references/skill-rules-style.md) (`description`, `proactive_triggers`, MUST/NEVER, QA closing)
3. WIP: `skills/in-progress/<name>/` (excluded from `link-skills.sh` until promoted)
4. Register in `.claude-plugin/plugin.json` `skills` array and add a row to [docs/DOC-MAP.md](DOC-MAP.md)

Repeated exports (CSV from markdown tables): use [scripts/export-markdown-table-to-csv.py](../scripts/export-markdown-table-to-csv.py).

## Documentation rules

- Follow [DOC-MAP.md](DOC-MAP.md) — no copy-paste of the `/helix` menu outside `commands/helix.md`.
- User-facing language: [references/user-communication.md](../references/user-communication.md).
- Portable skills: [references/portable-content.md](../references/portable-content.md) — no real ticket IDs, no `/Users/...`, no `~/.helix` in `skills/` or `commands/`, no one-product env/commands (e.g. `pd3`, customer Playwright paths).

Quick check before commit:

```bash
rg -n '/Users/|~/.helix|~/.cursor|pd3-|pw:login:pd3|CP-[0-9]{3,}|mycreditport' skills commands references/portable-content.md || true
```

(README/install scripts may mention `~/.helix` for humans only.)
