# Pluton 5 rules → Helix mapping

Canonical external doc: [claudeskill5rules.md](https://github.com/<ORG>/team-pluton-skills/blob/main/docs/claudeskill5rules.md).

Helix is a **portable QA skill pack**, not a full `engineering/` / `productivity/` monorepo. This table shows how each Pluton rule maps here and where we intentionally differ.

| Pluton rule | Meaning in Pluton | Helix implementation | Notes |
|-------------|-------------------|----------------------|--------|
| **กฎ 1** | `description` = trigger (verb + scenario + negative) | Every shipped `SKILL.md` + `commands/*.md` | See [skill-rules-style.md](skill-rules-style.md) Rule 1 |
| **กฎ 2** | `SKILL.md` = index; detail in `references/` | `skills/<name>/SKILL.md` + `references/` | Target &lt; 500 lines per skill |
| **กฎ 3** | MUST/NEVER + reason | Gates in skills + summary tables | No soft-only safety gates |
| **กฎ 4** | Repeatable actions → `scripts/` | Repo `scripts/export-markdown-table-to-csv.py`; in-agent CSV default | **Deviation:** skills do not assume Helix install cwd; script only if user gives `HELIX_INSTALL_ROOT` — see [csv-export-rules.md](csv-export-rules.md) |
| **กฎ 5** | Assume problems; fix-verify; QA closing | [skill-rules-style.md#qa-closing-doubt-and-fix-verify](skill-rules-style.md#qa-closing-doubt-and-fix-verify) | Fresh-eyes **MUST** when artifact size exceeds thresholds |

## Helix-only conventions (not separate Pluton rules)

| Helix topic | File |
|-------------|------|
| Ship registration (README + plugin.json + command) | [skill-rules-style.md](skill-rules-style.md) — Helix “Rule 2” naming |
| Portable content (no host/project lock-in) | [portable-content.md](portable-content.md) |
| Skill routing / handoffs | [skill-routing.md](skill-routing.md) |
| Session constraint recital | [helix-session-constraints.md](helix-session-constraints.md) |
| Pre-merge checklist | [docs/pluton-ship-checklist.md](../docs/pluton-ship-checklist.md) |

## Explicitly out of scope for Helix

- 9arm folder taxonomy (`engineering/`, `productivity/`, …)
- Non-QA skills (`debug-mantra`, `post-mortem`, `scrutinize`, `management-talk` as shipped skills)
- Hardcoded install paths inside `skills/` or `commands/`
