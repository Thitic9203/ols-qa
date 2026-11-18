# project-agnostic-mirror — spec

Mirrors Helix `docs/sdd/project-agnostic/spec.md` R3, R5, R6 and R7 (owner-approved 2026-11-18) for the shared
files that live in both repos. Helix commits: 74851c0 (T4), 4eec8b0 (T5), 60a426a (T4 follow-up).

## Rules

- **M1** These shared files must be byte-identical to Helix branch `docs/wayfinder-project-agnostic` at 60a426a:
  `references/{workspace-guide-discovery,skill-routing,menu-text,intent-shortcuts,result-quality-gate,skill-reference-index}.md`,
  `skills/procedures/retest-bug-workflow/{comment-and-post,execute-and-evidence}.md`,
  `skills/procedures/retest-bug-workflow/references/{comment-template-v2,worked-example}.md`,
  `skills/procedures/testing-ticket-workflow/results-update.md`. *Source:* Helix spec R8 ("the same edit lands in
  ols-qa in the same change").
- **M2** The usage marker `src=` takes the workspace name from the workspace guide (`helix` if none); the OLS guide
  `references/ols-project-guide.md` must state the workspace name `ols-qa`, so OLS markers stay `src=ols-qa`.
  *Source:* Helix spec R7, R11 (OLS must keep working).
- **M3** The local-only label in `skill-routing.md` is `(workspace only)`; `tools/skill-structure/check.js` and
  `tools/skill-routing/routing.test.js` must read that label, so content-takedown and smoke-test stay
  ols-qa-only and keep their exemption. *Source:* Helix spec R7 (menu/routing text names no product workspace).
- **M4** Tests that pinned the old OLS-only text must pin the new text instead, at the same strictness:
  `tools/a17-create-bug/check.test.js` (reference-index heading), `tools/retest-guard/workflow_template.test.js`
  (how to fill `src`). No test is removed or skipped. *Source:* Helix spec R7; owner rule "never skip tests".

## Edge cases

- `data-prep-recipe-template.md` is Helix-owned and not in ols-qa: discovery names it as a plain path, never a
  markdown link, so the link check stays green.

## Done when

- `bash scripts/run-test-suites.sh` green on the mirror branch.
- `cmp` of every M1 file against Helix 60a426a reports no difference.
- Mirror PR open to ols-qa main, not merged by a lane.
