# test-data-prep-mirror — spec

Owner 2026-11-19 (chat): "ดึงสกิล Helix กลับมาใส่ ols-qa เลย".

## Why

Helix main 3ab9228 and 025560c (2026-11-18, Helix `docs/sdd/project-agnostic` T3) made test-data-prep generic: the
skill reads the project's own recipe and carries no project values. ols-qa still has the OLS-specific text, so:

- the pluton-ai-agent OLS tick holds every Flow order (`skills-sync.mjs` S9 needs `SKILL.md` and `WORKFLOW.md` of each
  named skill identical in ols-qa and Helix at origin/main; VM tick log since 2026-11-18 14:03: "skills out of sync (2),
  no Flow order this tick");
- the ols-qa → Helix sync cannot close it: Helix's `scripts/ci-check-portable-skills.sh` refuses the OLS text
  ("project-specific token" at `skills/test-data-prep-workflow/SKILL.md:4,5,19`), so nothing is pushed.

These files are Helix-owned (`helix-owned-files.txt` in Helix), so Helix is the source and ols-qa copies them.

## Rules

- **D1** The four Helix-owned test-data-prep files must be byte-identical to Helix origin/main 025560c:
  `skills/test-data-prep-workflow/SKILL.md`, `skills/procedures/test-data-prep-workflow/WORKFLOW.md`,
  `commands/test-data-prep.md`, `references/data-prep-recipe-template.md`. *Source:* owner 2026-11-19 (above); Helix
  `helix-owned-files.txt`; pluton-ai-agent `scripts/ols/lib/skills-sync.mjs` S9.
- **D2** No OLS value is lost: the OLS values stay in the recipe the generic skill finds by its discovery glob
  `references/*-data-prep.md`, which is `references/ols-data-prep.md` (pointer to `{EVIDENCE_REPO}/docs/ols-data-prep.md`
  Appendix H, #295). This change edits neither file. *Source:* Helix `docs/sdd/project-agnostic` R4, R6, R11; ols-qa #295.
- **D3** A test that pinned the old OLS text pins the new text instead, at the same strictness. No test is removed or
  skipped. *Source:* project-agnostic-mirror M4; owner rule "never skip tests".
- **D4** Only test-data-prep is copied. `content-takedown-workflow` and `smoke-test-workflow` exist only in ols-qa
  (`(workspace only)`, project-agnostic-mirror M3) and keep their ols-qa text. *Source:* Helix origin/main has no such
  skill; copying "from Helix" would delete newer ols-qa work (smoke-test a48942e, 2026-11-18).

## Edge cases

- Helix moves on before this merges: copy from the Helix origin/main of the day, and name its sha in the PR.
- A skill-structure or routing check reads a value that the generic text no longer has: re-pin per D3, never relax.

## Done when

- `cmp` clean for the four files against Helix origin/main.
- ols-qa `tests.yml` green on the PR (node-tests, sdd-gate).
- After merge, the VM tick log no longer says "skills out of sync" for test-data-prep, and a Flow order is written.
