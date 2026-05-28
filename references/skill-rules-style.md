# Helix skill authoring rules (Pluton-aligned)

All Helix skills MUST follow these patterns. Link this file from every `SKILL.md` instead of copying the full text.

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

## Rule 5 — Bug-hunt / fix-verify mindset

1. **Assume the first output is wrong** until a checklist passes.
2. Run a **closing QA** section at the end of the workflow (skill-specific items + shared items below).
3. After any fix, **re-read the destination** (Jira issue, file, Sheet) before saying done.
4. Optional: ask for a **fresh-eyes** pass (subagent or second read) on long Jira comments or large TC tables.

### Shared closing checklist (every workflow)

- [ ] User-facing text is **English only** ([user-communication.md](user-communication.md)).
- [ ] No success claim without **tool output** and **destination verification**.
- [ ] Gates were not skipped (approval / confirm / refuse when inputs missing).
- [ ] Handoff states what was done, what was blocked, and where artifacts live.

## Refusal-first (precondition gates)

When required inputs are missing, **stop in one message** — do not guess or partially run:

```text
I cannot start {workflow name} yet. Missing:
- {item 1}
- {item 2}

Please provide these, then I will continue.
```

## Scripts (Rule 4)

If an action repeats **more than three times** across sessions (CSV export, version sync), prefer a repo script under `scripts/` or `skills/<name>/scripts/` and document the exact command in the skill.

## File layout

| Path | Purpose |
|------|---------|
| `skills/<name>/SKILL.md` | Index + gates + steps (target &lt; 500 lines) |
| `skills/<name>/references/` | Templates, gotchas, worked examples |
| `skills/in-progress/` | WIP skills — excluded from `link-skills.sh` |
| `skills/deprecated/` | Retired skills — excluded from linking |

New skills: start from [docs/new-skill-template.md](../docs/new-skill-template.md).
