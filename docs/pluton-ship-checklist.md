# Pluton ship checklist (Helix)

Use before merging a **new or materially changed** workflow skill. Based on [claudeskill5rules.md](https://github.com/<ORG>/team-pluton-skills/blob/main/docs/claudeskill5rules.md) §3 and [pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md).

## Frontmatter

- [ ] `description` is a **trigger** (verb + scenario + edge cases)
- [ ] `description` includes **Do NOT use when** (negative cases / other Helix skills)
- [ ] `proactive_triggers` lists realistic user phrases

## Structure

- [ ] `SKILL.md` under 500 lines (split detail into `references/`)
- [ ] At least one [worked-example.md](../skills/tc-fe-prep-workflow/references/worked-example.md) under `references/` for non-trivial workflows
- [ ] `scripts/README.md` if the workflow mentions CSV export

## Content

- [ ] Safety gates use **MUST / NEVER + because** (not “should consider”)
- [ ] **Refusal-first** section when required inputs exist
- [ ] **Sign-off gate** before irreversible side effects (Jira post, issue create, external writes)
- [ ] **Fix-verify:** at least one re-read of destination after side effect (see skill-rules-style)
- [ ] **QA closing** section links to shared checklist anchors
- [ ] **Handoffs** point to [skill-routing.md](../references/skill-routing.md) (no duplicate routing tables)

## Repo registration (Helix Rule 2 — ship)

- [ ] Row in [README.md](../README.md) skills table
- [ ] Entry in [.claude-plugin/plugin.json](../.claude-plugin/plugin.json) `skills` array
- [ ] `commands/<workflow>.md` with multiline `description` + negative case
- [ ] Row in [skill-routing.md](../references/skill-routing.md)
- [ ] [DOC-MAP.md](DOC-MAP.md) updated
- [ ] Skill path **not** under `skills/in-progress/` or `skills/deprecated/` until ready

## Local / CI checks

```bash
./scripts/sync-version.sh --check
./scripts/ci-check-portable-skills.sh
./scripts/ci-check-skill-structure.sh
```
