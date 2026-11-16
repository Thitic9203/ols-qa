# Spec: remove metadata.proactive_triggers (ols-qa)

Owner decision 13 Nov 2026 (answer to "tc-fe มี metadata.proactive_triggers ซ้ำกับ description (มีอยู่ใน 12 สกิล) จะลบออกไหมครับ?"): "ลบ + แก้ CI ด้วย". Same rules as helix `docs/sdd/remove-proactive-triggers/spec.md` R1, R2, R5, applied to the ols-qa source tree.
Source for "the field is not read at runtime": Claude Code routes skills from `description` only. The only ols-qa readers are two checks that require the key (`git grep -n proactive_triggers -- tools scripts .github` on main 52a6871b): `tools/skill-structure/check.js:21` (mirror of helix `scripts/ci-check-skill-structure.sh`) and `tools/tc-fe-prep-frontmatter/check.test.js:23`. The helix readers change in the helix PR.

## Rules

- R1. When an ols-qa `skills/*/SKILL.md` frontmatter is read, it must not contain `proactive_triggers` (under `metadata:` or top level), and an emptied `metadata:` block must be removed too. Covers the 11 shared skills and the ols-only `content-takedown-workflow`.
- R2. When a phrase of the removed list is not carried by that skill's `description` (case-insensitive substring), the phrase must still exist in the skill body as one line `Also triggers on: ...` under the H1. No phrase is dropped. `description` must not change (always-on budget).
- R3. When `docs/new-skill-template.md`, `docs/pluton-ship-checklist.md`, `docs/skill-rules-authoring.md` are read, they must not tell authors to add `proactive_triggers`; the three files must equal helix PR #45's versions (shared docs stay identical).
- R4. The helix token budget must not rise: helix `scripts/token-measure.py` on the ols-qa tree, before and after, shows no skill's `direct` or `routed` number higher.
- R5. No MUST / NEVER / STOP / GATE / 🔴 line is removed or changed.
- R6. Must not touch `.github/workflows/` or files outside the list in plan.md. Historical SDD folders (`docs/sdd/after17-*`, `helix-skill-quality`, `tc-fe-prep-thai-triggers`, `r6-*`, `taskfolio-log`) keep their text: they record past decisions.
- R7. When `tools/skill-structure/check.js` runs, it must not require `proactive_triggers`, and it must fail a shipped SKILL.md whose frontmatter has the key under `metadata:` or at top level (same rule as helix spec R3; stops reintroduction). Its other three checks stay unchanged. `tools/tc-fe-prep-frontmatter/check.test.js` R1 must assert the same intent with the new text (owner 13 Nov 2026: "แก้เทสต์ให้ตรงข้อความใหม่", never weaker): the `Use when` description line and the `Also triggers on:` body line exist, and the key is absent.

## Done when

- R1: `git grep proactive_triggers -- skills` is empty.
- R2: every phrase in plan.md "Moved phrases" is found in its SKILL.md body; `git diff origin/main -- skills | grep '^[-+]  Use when\|^[-+]description'` is empty.
- R3: `git grep proactive_triggers -- 'docs/*.md'` finds only the removal note in skill-rules-authoring.md; the three files' blob ids equal helix PR #45's.
- R4: before → after table in the PR body, no rise.
- R5: `git diff origin/main | grep -E '^-.*(MUST|NEVER|STOP|GATE|🔴)'` is empty.
- R6: `git diff --stat origin/main` lists only plan.md paths.
- R7: `node tools/skill-structure/check.test.js` and `node tools/tc-fe-prep-frontmatter/check.test.js` pass, with probe cases for the key under `metadata:`, at top level, and in the body (allowed).
