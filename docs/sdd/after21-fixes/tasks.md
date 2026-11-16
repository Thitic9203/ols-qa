# after-21 fixes — tasks

| # | Task | Rule | Test that fails first | Done when |
|---|---|---|---|---|
| T1 | create-bug: move dependency check after Phase B, target rows only | R1, R6 | grep: SKILL.md says "after step 1, before step 2" | grep clean; WORKFLOW Phase B names the check |
| T2 | retest-bug: one start order in SKILL.md | R2 | grep: two lines claim "before any other tool call" / "before step 1" conflict | one order, same in all three lines |
| T3 | tc-api: start set vs at-step files | R3 | SKILL.md has both "at the start of every run" list and "only at its step" for the same files | one rule |
| T4 | tc-api: G1 per-answer outputs | R4 | G1 writes CSV with no condition | table/lines for CSV, Excel, both, comment only |
| T5 | tc-api: concrete failure exit | R5 | "best available workaround" present | replaced |
| T6 | token + rule-line checks | constraints | — | `token-measure.py` no rise; register entries listed |
| T7 | G1 regress_check on fix commit (3 skills × 3 scorings) | Done when | — | PASS all 3; tc-api ≥ 84.5 |
| T8 | PR to ols-qa main, Opus review, merge | — | — | merged |
| T9 | sync helix, PR, token-budget guard, release | — | — | tag + token-report pass |
| T10 | after-21 round (3 skills, frozen criteria, R7 clean host) + GATE.md | R7 | — | GATE.md written |
| T11 | judge; pass → sync team-pluton-skills + board 100%; fail → stop, report | — | — | board/DoD updated |
