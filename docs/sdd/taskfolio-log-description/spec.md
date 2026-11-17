# Spec — taskfolio-log-description

- R1. `skills/taskfolio-log-workflow/SKILL.md` description MUST be ≤ 500 bytes (helix `docs/sdd/token-diet/spec.md` R10).
- R2. It MUST keep every trigger phrase (ลง taskfolio, ลง timesheet, ลงเวลางาน, fill taskfolio, log timesheet, /taskfolio-log), every
  "Do NOT use" case (leave, another person's timesheet, Submit week, Jira worklogs) and the evidence-only / confirm-before-save /
  re-read / never-submit behaviour. Wording only.
- R3. The file MUST be byte-identical to helix `skills/taskfolio-log-workflow/SKILL.md` after helix #62 (parity, ols-qa #214).

Out of scope: the workflow body, `commands/taskfolio-log.md`.

Done when: description 450 bytes; `cmp` with helix #62 head is clean; `scripts/run-test-suites.sh` passes.
