# Tasks: remove metadata.proactive_triggers (ols-qa)

| # | Task | Rules | Fails first | Done when |
|---|---|---|---|---|
| 1 | Remove the key from 12 SKILL.md, move uncovered phrases to `Also triggers on:` | R1, R2, R5 | `git grep proactive_triggers -- skills` lists 12 files | grep empty; every plan.md phrase found; description lines unchanged |
| 2 | Copy the three author docs from helix PR #45 | R3 | `git grep proactive_triggers -- 'docs/*.md'` hits the template and checklist | only the removal note remains; blob ids equal helix PR #45 |
| 2b | Checker rejects the key; tc-fe frontmatter test asserts the new text | R7 | the two test files fail on the tree after task 1 | both pass; 3 probe cases |
| 3 | Measure helix token budget before/after on the ols-qa tree | R4 | — | table in PR body, no rise |
| 4 | `regress_check.py` on each changed skill; Opus review | R4, R5, R6 | — | pass recorded in PR body |
| 5 | Sync the same diff to helix (PR #45 rebased) | R1–R3 | helix `git grep proactive_triggers -- skills` non-empty | helix PR CI green (pr-check, token-budget, token-budget-raise) |
