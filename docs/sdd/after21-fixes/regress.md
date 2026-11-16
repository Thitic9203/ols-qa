# after-21 fixes — pre-merge regression check (G1)

Scored on the helix sync branch (helix PR #54): create-bug and retest-bug at `23e95d2`, tc-api-prep at `d868095` (R5b; the create-bug and retest-bug bundles are blob-identical across the two commits). Scoring on the ols-qa tree was rejected: it lacks helix `scripts/` and `hooks/`, so links break and scores are not comparable to after-20.
Tool: ols-qa-evidence `evals/helix-round-prep/regress_check.py`; prev `after-20/summary.json`; prompts = after-20 scoring prompts re-pointed (evidence `evals/helix-a21-g1`). One retest scoring-3 that did not read the bundle in full was rejected and re-run.

| skill | structural s1 / s2 / s3 | median total | floor | P1 on a changed line | verdict |
|---|---|---|---|---|---|
| create-bug-workflow | 65.1 / 66.7 / 68.5 | 87.4 | 82.7 | 0 | PASS |
| retest-bug-workflow | 62.7 / 65.7 / 62.7 | 82.2 | 80.3 | 0 (1 single-scorer P1 at comment-and-post.md:231) | PASS |
| tc-api-prep-workflow | 66.1 / 69.3 / 63.5 | 86.3 | 82.3 | 0 | PASS (≥ 84.5 frozen threshold) |
