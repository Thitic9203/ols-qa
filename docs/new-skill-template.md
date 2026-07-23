# New Helix skill template

Copy to `skills/<your-skill-name>/SKILL.md`. Complete [pluton-ship-checklist.md](pluton-ship-checklist.md) before merge.

Authoring rules: [references/skill-rules-style.md](../references/skill-rules-style.md) · Mapping: [references/pluton-5rules-mapping.md](../references/pluton-5rules-mapping.md).

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

Follow [skill-rules-style.md](../../references/skill-rules-style.md) and [portable-content.md](../../references/portable-content.md) for MUST/NEVER, refusal-first, QA closing, fix-verify, and no host/project lock-in.

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

## Step N+1 — Fix-verify (mandatory after side effect)

After {post / create / write}:

1. Re-read the destination (Jira UI, file, Sheet, issue URL).
2. Checklist: {skill-specific checks}
3. If mismatch → fix → re-read. **Max 2 rounds** — then report blockers.

NEVER say complete without at least one successful fix-verify round — see [skill-rules-style.md](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

---

## QA closing (mandatory before "done")

Follow [skill-rules-style.md — doubt and fix-verify](../../references/skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume** the first draft/output is wrong — {which phase catches it}.
2. Skill-specific:
   - [ ] …
   - [ ] Close-out includes `Verdict:` or `Verified:` with counts.
3. Shared checklist: [skill-rules-style.md#shared-closing-checklist-every-workflow](../../references/skill-rules-style.md#shared-closing-checklist-every-workflow).
4. Fresh-eyes: **MUST** per Rule 5 if table >15 rows or Jira comment >80 lines; otherwise SHOULD before publish.

---

## Out of scope

- … (name other Helix skill)

## Next workflows

Handoffs: [skill-routing.md](../../references/skill-routing.md).

---

## References

| File | Use |
|------|-----|
| [worked-example.md](references/worked-example.md) | Anonymized end-to-end sample (required for non-trivial skills) |
```

## Scripts

Helpers live in the Helix repo `scripts/` for install/CI. In **skills**, use in-agent steps by default; only reference a script when the **user provides** `HELIX_INSTALL_ROOT` — see [csv-export-rules.md](../references/csv-export-rules.md).

Optional: `skills/<name>/scripts/README.md` pointing at shared helpers (no install path in the skill body).
