# Helix skill authoring rules (contributor reference)

Rules for **writing and shipping** Helix skills. Runtime rules → [references/skill-rules-style.md](../references/skill-rules-style.md).

**External reference:** [SkillLane claudeskill5rules](https://github.com/SkillLane/team-pluton-skills/blob/main/docs/claudeskill5rules.md) — see [references/pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md) for rule-by-rule mapping.

**Pre-merge:** [docs/pluton-ship-checklist.md](pluton-ship-checklist.md).

**Portable content:** MUST follow [references/portable-content.md](../references/portable-content.md).

**Routing:** [references/skill-routing.md](../references/skill-routing.md) — link instead of duplicating.

## Rule 1 — `description` = trigger instruction

- **Verb + scenario + edge cases** in `description`.
- **Negative case** in the same field: `Do NOT use when …`
- **`proactive_triggers`**: short phrases in frontmatter (array).

## Rule 2 — Ship registration

A skill is **shipped** only when all are true:

- [ ] `skills/<name>/SKILL.md` exists and passes portable-content rules
- [ ] Listed in [README.md](../README.md)
- [ ] Registered in [.claude-plugin/plugin.json](../.claude-plugin/plugin.json) `skills` array
- [ ] Has a `commands/<workflow>.md` entry (except router-only `helix.md`)
- [ ] `scripts/link-skills.sh` will link it (not under `in-progress/` or `deprecated/`)

## File layout

| Path | Purpose |
|------|---------|
| `skills/<name>/SKILL.md` | Index + gates + steps (target < 500 lines) |
| `skills/<name>/references/` | Templates, gotchas, worked examples |
| `skills/in-progress/` | WIP skills — excluded from `link-skills.sh` |
| `skills/deprecated/` | Retired skills — excluded from linking |

New skills: start from [docs/new-skill-template.md](new-skill-template.md).
