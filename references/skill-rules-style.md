# Helix skill authoring rules (Pluton-aligned)

All Helix skills MUST follow these patterns. Link this file from every `SKILL.md` instead of copying the full text.

**External reference:** [SkillLane claudeskill5rules](https://github.com/SkillLane/team-pluton-skills/blob/main/docs/claudeskill5rules.md) — see [pluton-5rules-mapping.md](pluton-5rules-mapping.md) for rule-by-rule mapping and intentional deviations.

**Pre-merge:** [docs/pluton-ship-checklist.md](../docs/pluton-ship-checklist.md).

**Portable content:** MUST follow [portable-content.md](portable-content.md) — no machine paths, no single-customer project coupling in committed skills.

**Routing:** [skill-routing.md](skill-routing.md) — canonical handoff table; link instead of duplicating in each skill.

## Rule 1 — `description` = trigger instruction

- **Verb + scenario + edge cases** in `description`.
- **Negative case** in the same field: `Do NOT use when …` (or a dedicated sentence).
- **`proactive_triggers`**: short phrases in frontmatter (array) for discovery when the user did not name the skill.

## Rule 3 — MUST / NEVER + reason

| Pattern | Example |
|---------|---------|
| MUST refuse | MUST refuse to post until the user approves the draft — because premature posts cannot be recalled cleanly. |
| NEVER | NEVER claim Jira post success without re-opening the issue in the UI — because MCP can return OK while the body is truncated. |

Avoid soft-only wording (`should consider`, `might want to`) for safety gates.

## Rule 2 — Ship registration

A skill is **shipped** only when all are true:

- [ ] `skills/<name>/SKILL.md` exists and passes portable-content rules
- [ ] Listed in [README.md](../README.md) (skills table or workflow list)
- [ ] Registered in [.claude-plugin/plugin.json](../.claude-plugin/plugin.json) `skills` array
- [ ] Has a `commands/<workflow>.md` entry (except router-only `helix.md`)
- [ ] `scripts/link-skills.sh` will link it (not under `in-progress/` or `deprecated/`)

## Rule 5 — Bug-hunt / fix-verify mindset (Pluton กฎที่ 5)

1. **Assume the first output is wrong** until a checklist passes.
2. Run a **closing QA** section at the end of the workflow (skill-specific items + shared items below).
3. **MUST complete at least one fix-verify round** after any **side effect** (Jira comment/post, issue create, CSV write, Sheet/Confluence update): re-read the destination → if mismatch, fix → re-read again. **Maximum 2 rounds** — then report what remains blocked. NEVER declare complete without this round — because the first publish is almost never fully correct.
4. **Fresh-eyes review** (second read or subagent):
   - **MUST** before publish when: TC table or result table **> 15 rows**, OR Jira comment body **> 80 lines** / large embedded tables.
   - **SHOULD** for any approved draft the user will paste to executives.

<a id="qa-closing-doubt-and-fix-verify"></a>

### QA closing — doubt and fix-verify (copy into every skill)

Every `SKILL.md` MUST end with a **QA closing** section that:

1. States: **Assume the first draft/output is wrong** — name which phase exists to catch that.
2. Lists **skill-specific** checkboxes (3–5 items).
3. Points to [verify-closing-checklist.md](verify-closing-checklist.md) and [session-closing.md](session-closing.md) (artifact index, next workflow, handoff).
4. Apply **fresh-eyes** per Rule 5 thresholds (MUST when >15 rows or long Jira comment).

**Verdict line:** close with a fenced block that includes `Verdict:` or `Verified:` and counts (e.g. `CREATED 2/2`, `Posted and verified`) — never “done” without destination proof.

<a id="shared-closing-checklist-every-workflow"></a>

### Shared closing checklist (every workflow)

- [ ] User-facing text is **English only** ([user-communication.md](user-communication.md)).
- [ ] No success claim without **tool output** and **destination verification**.
- [ ] Gates were not skipped (approval / confirm / refuse when inputs missing).
- [ ] [session-closing.md](session-closing.md) completed (artifacts, one-line next step, `Verdict:`).

## Refusal-first (precondition gates)

When required inputs are missing, **stop in one message** — do not guess or partially run:

```text
I cannot start {workflow name} yet. Missing:
- {item 1}
- {item 2}

Please provide these, then I will continue.
```

## Scripts (Rule 4)

Helix ships helpers under the **Helix repository** `scripts/` (for install/CI). Skills MUST NOT assume that directory is the current working directory.

- **CSV export:** [csv-export-rules.md](csv-export-rules.md) — in-agent by default; script only if the user provides `HELIX_INSTALL_ROOT`.
- **Per-skill pointer:** `skills/<name>/scripts/README.md` when a workflow uses CSV — documents the shared helper without hardcoding install paths.
- **Version sync / install:** contributor docs only — not workflow steps inside skills.

## File layout

| Path | Purpose |
|------|---------|
| `skills/<name>/SKILL.md` | Index + gates + steps (target &lt; 500 lines) |
| `skills/<name>/references/` | Templates, gotchas, worked examples |
| `skills/in-progress/` | WIP skills — excluded from `link-skills.sh` |
| `skills/deprecated/` | Retired skills — excluded from linking |

New skills: start from [docs/new-skill-template.md](../docs/new-skill-template.md).
