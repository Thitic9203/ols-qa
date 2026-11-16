# after-21 fixes — spec

Source: ols-qa-evidence `evals/helix-skill-eval-2026-11-15-after20/GATE.md` (4 failing items), scorings `baseline/<skill>[-s2|-s3].json`, `data/after-20/summary.json`; map `docs/helix-quality/wayfinder-dod-pass/map.md`. Owner decisions 16/Nov/2026 (popup): re-run only create-bug, retest-bug, tc-api-prep with the frozen after-20 criteria; fix only the 4 failing items; if after-21 fails, stop and report, no further loop.

## Factor assessment (measured, after-20)

| Item | Measured | Gate | Cause found | Kind |
|---|---|---|---|---|
| create-bug P1 `SKILL.md:52-54` (was :59) | raised by 2/3 scorers, CONFIRMED | P1 = 0 | Dependencies run "after step 1, before step 2", but the rows are per target (`gh` for GitHub, Jira for Jira) and the target is settled only in WORKFLOW Phase A/B; `dependencies.md:4` makes a failed check a stop | real defect |
| create-bug time | median 73 s (58, 75, 77, 68, 71, 84) | ≤ 70 s | same skill: after-19 65 s, after-18 67.5 s, after-17 51.5 s; turns 12.2 avg vs 10.3 in after-18; after-20 had board builds on the host during timed waves R8–R10 (RISK R-07 note) | mixed: noise + host load + extra turns |
| retest-bug P1 `SKILL.md:17-19, :94` (was :25, :100) | raised by 2/3, CONFIRMED | P1 = 0 | three "first" rules: step 0 session-start "before step 1", step 2 settle-and-strategize "right after step 0, before any other tool call", Dependencies "before step 1" | real defect |
| tc-api-prep score | median 84.2 (84.2 / 86.9 / 84.2) | ≥ 84.5 | 2 of 3 scorers took dim 2 (workflow clarity) 9 → 8: s1 `SKILL.md:24` opens 5 shared files "at the start of every run" while also saying open each file only at its step; s3 `phase-g-deliver.md:15` G1 writes CSV unconditionally while xlsx only when asked (Excel-only undefined). Dim 5: s1 `phase-d-scope-design.md:22` "best available workaround" vague | real, small |

Items already passing and that must not regress: expected items 8/8, mean ≥ 83.7, the 5 skills judged by after-20.

## Rules

- **R1 create-bug dependency order.** The dependency check must run after the target is settled (after WORKFLOW Phase B parse target), checking only the rows for that target; the SKILL.md Dependencies line must name that point and must not say "after step 1, before step 2".
- **R2 retest-bug one start order.** retest-bug SKILL.md must state one start order: session-start → dependency check → settle-and-strategize → step 1, and each of the three lines must use that same order (no two rules both claim "before any other tool call").
- **R3 tc-api start reads.** tc-api-prep SKILL.md must not both require shared files "at the start of every run" and forbid opening files before their step: files read at start are named as the start set, every other file opens at its step.
- **R4 tc-api delivery formats.** phase-g-deliver G1 must define the written files for each Phase C answer: CSV only, Excel only, both, comment only. No format is written that the user did not choose.
- **R5 tc-api failure exits.** Dropped (16/Nov/2026, during implementation): the "best available workaround" lines sit in phase-g-deliver G-verify, which an existing test pins byte-identical to origin/main (a prior spec's R5). R5 was cited by one scorer only (s1 dim 5); the score target rests on R3/R4 (dim 2, raised by 2 of 3 scorers).
- **R5b tc-api default priority rule.** The default Priority rule in `api-tc-guidelines.md:26` must assign every row a priority (401/403 of reads, 404 of writes, any other status, repeat-call rows), because G1 scoring 1 and after-19 s1 deducted dim 5 for unassigned rows.
- **R2b retest dead-session relink (added 16/Nov/2026 after after-21).** retest SKILL.md 5a must point to the parallel-test-lanes §3 relink/mint blocks on a dead session at any step, not only step 4: after-21 p2 runs 1 and 2 hit the dead session before step 4, never opened §3, and asked "Can I run it?" instead of giving the relink loop (GATE.md, expected item fails 2 of 3). Owner 16/Nov/2026: "ทำต่อตามแพลนให้จบ ไม่ต้องถาม".
- **R2c retest MUST/NEVER table (added 16/Nov/2026 after after-21b).** The retest WORKFLOW MUST/NEVER table must not restate rules that already have a single home: the 10 rows that said "rule stated once at …" fold into one pointer row (helix rule-line register entries, owner "ทำดิรอไร"). Source: after-21b GATE.md P1 `WORKFLOW.md:412`, raised by 2 of 3 scorers, confirmed.
- **R6 create-bug turns.** create-bug must not add tool calls: R1 must remove the up-front check of rows for the other target (net fewer checks), and no new file read is added to the start set.
- **R7 clean timing.** The after-21 timed waves must run with nothing else on the host (no board build, test, push); this is a run rule, not a skill change.

## Constraints

- Scope (G2): only the files cited above plus same-topic lines found by grep, listed in the PR body. No shared `references/` file changes (they feed the 5 skills that passed).
- helix token budget: `scripts/token-measure.py` before/after; no skill's `direct` or `routed` number rises.
- Every MUST / NEVER / STOP / GATE / 🔴 line changed is listed old → new for the helix rule-line register; none dropped.
- Frozen judging inputs unchanged (`frozen-criteria-after20.json`, speed ceiling, avg target).

## Done when

- R1–R6 text in the named files; R7 written in the after-21 RUN.md.
- `bash scripts/run-test-suites.sh` green; `node tools/sdd-gate/check.js` ok.
- G1 pre-merge check (`regress_check.py`): 3 static scorings each for create-bug, retest-bug, tc-api-prep on the fix commit; median ≥ after-20 − `score_allowance`; no P0/P1 on a changed line; tc-api median ≥ 84.5.
- after-21 GATE.md: the 3 skills pass every row; mean of 8 (5 from after-20 + 3 from after-21) ≥ 83.7.
