# Shared QA closing checklist (all Helix workflows)

Every skill's QA closing section MUST include these items **plus** skill-specific checks.

## Doubt and fix-verify

Follow [skill-rules-style.md — doubt and fix-verify](skill-rules-style.md#qa-closing-doubt-and-fix-verify).

1. **Assume the first draft/output is wrong** — name which phase catches it.
2. Complete **skill-specific** checkboxes (3–5 items in each SKILL.md).
3. [verify-closing-checklist.md](verify-closing-checklist.md) — workflow-specific section.
4. [session-closing.md](session-closing.md) — artifact index, next workflow, handoff, `Verdict:`.

## Shared checklist

- [ ] User-facing text is **English only**.
- [ ] No success claim without **tool output** and **destination verification**.
- [ ] Gates were not skipped (approval / confirm / refuse when inputs missing).
- [ ] `Verdict:` or `Verified:` line with counts in close-out block.
