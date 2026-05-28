# Contributing to Helix

## Versioning (automatic)

**Source of truth:** [VERSION](../VERSION) at repo root.

When you change any of these, the **pre-commit hook** bumps the **patch** version unless `VERSION` is already staged:

- `skills/*/SKILL.md`
- `commands/*.md`
- `references/*.md` (repo root only)

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

- **Pull requests:** CI fails if workflow files change without a `VERSION` bump.
- **Push to `main`:** CI verifies markers, then creates a GitHub **Release** `vx.y.z` if that tag does not exist yet.

Enable hooks after clone:

```bash
git config core.hooksPath scripts/hooks
```

The installer sets this automatically.

## Adding a skill

See [skills/retest-bug-workflow/references/new-skill-template.md](../skills/retest-bug-workflow/references/new-skill-template.md).

Register in `.claude-plugin/plugin.json` `skills` array and add a row to [docs/DOC-MAP.md](DOC-MAP.md).

## Documentation rules

- Follow [DOC-MAP.md](DOC-MAP.md) — no copy-paste of the `/helix` menu outside `commands/helix.md`.
- User-facing language: [references/user-communication.md](../references/user-communication.md).
- No real ticket IDs or machine paths in committed skills.
