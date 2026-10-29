# Tasks — catch-ai-workflow: hedged conclusions

## T1 — Classify and dig (R1, R2, R4)

- Failing first: SKILL.md has no "hedged conclusion" class; step 7 lets `Suspected` close a defect.
- Do: Quick reference row, step 5 class, step 7 rule, new section "Hedged conclusions — dig to the deepest layer".
- Done when: `grep -n "hedged conclusion" skills/catch-ai-workflow/SKILL.md` hits Quick reference, step 5, step 7 and the new section.

## T2 — Own report hedge-free (R3, R5)

- Failing first: Red flags cover the Expected line only; QA closing has no hedge check.
- Do: Red flag, Rationalizations rows, QA closing item with grep command, MUST / NEVER row, report template note in reference.md.
- Done when: those sections name the rule; `bash scripts/run-test-suites.sh` passes.

## T3 — Ship (R6)

- Do: PR → merge → `verify-on-origin.sh` → sync to helix → `helix-parity.sh`.
- Done when: `ON-ORIGIN` printed for the merge; helix log shows the sync commit and version bump; parity passes.
