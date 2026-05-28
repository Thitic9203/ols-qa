# New Helix skill template

Copy to `skills/<your-skill-name>/SKILL.md`. Register in `.claude-plugin/plugin.json` and [DOC-MAP.md](DOC-MAP.md).

Authoring rules: [references/skill-rules-style.md](../references/skill-rules-style.md).

```markdown
---
name: your-skill-name
description: |
  {Verb} {primary outcome} when {scenario}.
  Use when the user {trigger phrases}.
  Do NOT use when {negative case 1}; {negative case 2}; or {other Helix skill name}.
proactive_triggers:
  - phrase users might say
  - /slash-command-if-any
  - Helix menu label
---

# Your skill title

{One paragraph: what this skill does and what it does not do.}

## Communication (mandatory)

Follow [user-communication.md](../../references/user-communication.md).

Follow [skill-rules-style.md](../../references/skill-rules-style.md) and [portable-content.md](../../references/portable-content.md) for MUST/NEVER, refusal-first, QA closing, and no host/project lock-in.

## Refusal-first (precondition gate)

MUST refuse to start until the user provides:

| Input | Required | Because |
|-------|----------|---------|
| … | Yes | … |

If anything is missing, stop with the refusal template from skill-rules-style.md.

---

## Step 0 — …

**Wait for an answer** before Step 1.

---

## Step N — Draft (approval gate)

**MUST NOT** {side effect} until the user approves the draft — because {reason}.

---

## QA closing (mandatory before "done")

1. Assume defects in the first draft; run 1–2 fix-verify rounds.
2. Skill-specific checklist:
   - [ ] …
3. Shared checklist: [skill-rules-style.md](../../references/skill-rules-style.md).
4. NEVER say complete without verifying the destination.

---

## Out of scope

- … → `other-skill-name`

---

## References

| File | Use |
|------|-----|
| [worked-example.md](references/worked-example.md) | Anonymized end-to-end sample (add when skill is non-trivial) |
```

## Scripts

Helpers live in the Helix repo `scripts/` for install/CI. In **skills**, use in-agent steps by default; only reference a script when the **user provides** `HELIX_INSTALL_ROOT` — see [csv-export-rules.md](../references/csv-export-rules.md).

## Lifecycle

- **WIP:** `skills/in-progress/<name>/` — not linked by `link-skills.sh`
- **Retired:** move to `skills/deprecated/<name>/` — not linked
