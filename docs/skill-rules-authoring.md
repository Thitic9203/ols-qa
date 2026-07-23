# Helix skill authoring rules (contributor reference)

Rules for **writing and shipping** Helix skills. Runtime rules → [references/skill-rules-style.md](../references/skill-rules-style.md).

**External reference:** [<ORG> claudeskill5rules](https://github.com/<ORG>/team-pluton-skills/blob/main/docs/claudeskill5rules.md) — see [references/pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md) for rule-by-rule mapping.

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
| `skills/<name>/SKILL.md` | Discovery stub (linked by `link-skills.sh`) or full skill for router |
| `skills/deprecated/<name>/WORKFLOW.md` | Canonical workflow procedure (loaded by stub) |
| `skills/deprecated/<name>/references/` | Templates, gotchas, worked examples |
| `skills/in-progress/` | WIP — excluded from `link-skills.sh` |

**Workflow pattern:** Ship a thin stub at `skills/{name}-workflow/SKILL.md` that points to `skills/deprecated/{name}-workflow/WORKFLOW.md`. Register both stub path in `plugin.json`.

New skills: start from [docs/new-skill-template.md](new-skill-template.md).
