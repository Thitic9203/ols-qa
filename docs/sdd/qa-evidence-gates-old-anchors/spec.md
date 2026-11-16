# Spec: remove the qa-evidence-gates old-anchor table

Source: `docs/sdd/token-diet/spec.md` R3 ("every existing anchor link must resolve"), `references/qa-evidence-gates.md` § "Related: moved sections (old anchors)" (14 `<a id>` redirects, each naming the section's home in `qa-evidence-capture.md`, `qa-evidence-rerecord.md` or `qa-evidence-coverage.md`), and plan row 27 of the a20 finish map.

## Rules

- R1. When any file under `skills/`, `references/`, `commands/` or `docs/*.md` links to `qa-evidence-gates.md#<id>` and `<id>` is one of the 14 redirect anchors, the link must stop using the redirect anchor: it points at the section's home named in the table (same anchor) unless R1a applies, and its link text names the file it points at.
- R1a. Exception to R1, measured with `tools/skill-lint` (must-read-depth, max 1): a direct link to `qa-evidence-capture.md` from `references/result-quality-gate.md` (7 new violations) or from `skills/procedures/review-result-workflow/WORKFLOW.md` row G (6 new violations) makes that file a must-read at two hops. Both links must point at the core file's `#related-gates-split-into-their-own-files` section, which names the MP4 gate and its home — the same core-file-then-home path the redirect table gave, with no new must-read edge. No baseline entry is added.
- R1b. When a file names a moved section as plain text (`[qa-evidence-gates.md](qa-evidence-gates.md) § <moved section>`), the core file's "Related gates" list must name that section and its home, so the pointer still leads somewhere. Found by review: `references/bug-priority-matrix.md:120` (§ Story-testing evidence-completeness gate) → the capture bullet of "Related gates" gains "Story-testing evidence-completeness gate (5-step)". The pointer itself stays: repointing it at `qa-evidence-capture.md` was measured at 6 new skill-lint violations (same two-hop must-read as R1a).
- R2. When R1 holds, `references/qa-evidence-gates.md` must not contain the "Related: moved sections (old anchors)" section or its Contents entry. Every other line of the file stays, except the one "Related gates" bullet of R1b.
- R3. No MUST / NEVER / STOP / GATE / 🔴 line is removed or changed (`scripts/check-rule-lines.sh` in helix passes).
- R4. Every link to a `qa-evidence-*.md#<id>` in the tree resolves to a heading or `<a id>` in its target file.
- R5. The helix token budget must not rise; the core file's mandatory-read tokens fall.
- R6. Historical records (`rule-line-register.json` in helix, `docs/sdd/**`) keep their text.

## Done when

- R1: `git grep -E 'qa-evidence-gates\.md#(<14 ids>)'` is empty outside `docs/sdd`.
- R1a: `node tools/skill-lint/skill_lint.test.js` passes with `tools/skill-lint/baseline.json` unchanged.
- R2: `grep -c '<a id=' references/qa-evidence-gates.md` is 0; the diff of the file removes only that section and its Contents line.
- R3: `git diff origin/main | grep -E '^-.*(MUST|NEVER|STOP|GATE|🔴)'` is empty.
- R4: link check (plan.md) prints 0 broken.
- R5: before → after token table in the PR body, no rise.
