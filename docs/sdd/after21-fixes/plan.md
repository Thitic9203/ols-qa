# after-21 fixes — plan

## Files

- `skills/create-bug-workflow/SKILL.md` (Dependencies line) and the WORKFLOW Phase B line that runs the check (R1, R6)
- `skills/retest-bug-workflow/SKILL.md` lines 17–19 and the Dependencies line (R2)
- `skills/tc-api-prep-workflow/SKILL.md` start-read line (R3)
- `skills/procedures/tc-api-prep-workflow/phase-g-deliver.md` G1 (R4)
- `skills/procedures/tc-api-prep-workflow/phase-d-scope-design.md:22` (R5)
- ols-qa-evidence: after-21 round folder copied from after-20 with only the 3 skills; RUN.md adds R7

## Approach

Edit text only; no new files, no new start reads. Each rule changes the fewest lines that remove the contradiction. Then G1 rescoring before merge, sync to helix (`sync_skills.py`, OLS_QA main), helix PR + token-budget guard + release, then after-21.

## Options weighed

- Fix create-bug time by cutting content: rejected — risks score/P1 regressions; time data shows mostly noise and host load, so R6 + R7 first.
- Rescore tc-api only (treat as noise): rejected — 2 of 3 scorers cite the same real contradiction class (dim 2).
- Edit shared `references/workspace-guide-discovery.md:52` (s3 dim 2 note): rejected — feeds the 5 passing skills (regression risk, guard scope).

## What may break

- R1 moves the check later: a run may draft before learning `gh` is missing. Mitigation: check stays before Phase C confirm, so nothing is created.
- create-bug time may still miss 70 s by noise (SD high: 58–84 s). Owner rule: no further loop; report.
- Cost: no new paid service; uses existing Claude subscription runs (18 timed runs, 9 scorings, 3 grades, verify, G1 9 scorings).
