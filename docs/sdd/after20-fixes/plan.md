# after-20 fixes — plan

Files: `skills/procedures/retest-bug-workflow/references/worked-example.md` (R1); `skills/procedures/tc-fe-prep-workflow/references/jira-comment-adf-template.md` (R2); `references/no-wait-decision-gate.md` (R3); `skills/procedures/retest-bug-workflow/comment-and-post.md` (R4).

Shared readers: `no-wait-decision-gate.md` is in the retest and testing-ticket bundles — only testing-ticket's line changes. The other three files belong to one skill each. Changed skills = retest-bug-workflow, tc-fe-prep-workflow, testing-ticket-workflow.

Measure: helix `token-measure.py measure` on a `git archive` of HEAD before and after (scratch dir, never the helix repo). Added words are offset inside the same file where the file is a mandatory read.

Regression check (G1): scratch clone of ols-qa at the fix commit; bundle files for the 3 skills regenerated with the after-19 rows and the fix commit's blobs (the after-19 rows equal ols-qa main blobs for these skills); 3 scorings per skill with the after-19 scoring prompt, re-pointed at the clone, bundle and a scratch output folder; `regress_check.py --prev after-19 summary.json --avg-target runs/helix-quality-2026-11-05-r7/board/avg-target.json` (feat/after20-prep, `score_allowance` 1.9) `--changed` from `git diff -U0`. Results committed under `docs/sdd/after20-fixes/regress/`.

Merge order: the SDD folder lands on main first (sdd-gate needs spec/plan/tasks on base for the `fix:` commit), then the fix PR.

Risk: a scorer raises P1 on a changed line (blocks; reported, not re-rolled). No library, no cost, no other repo written.
