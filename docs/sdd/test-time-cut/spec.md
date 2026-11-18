# Spec — test-time-cut (retest-bug + testing-ticket)

## Why
The owner asked on 18 Nov 2026 to cut the net time of `retest-bug-workflow` and `testing-ticket-workflow`. Every gate must stay
exactly as strict: only **how and when** steps run may change. Recent rounds were measured from session timestamps; the findings
are kept in the private evidence repo. Recurring costs:
- session repair: in 5 of 6 rounds, mean 30 min;
- recording plus verify: mean 27.3 min;
- probing plus execution: mean 18.3 min.

The gate inventory found that retest intake runs its reads one by one; `parallel-prep.md` is cited by testing-ticket only.
The owner decided:
- keep both owner-wait points and do independent work while waiting;
- check sessions in the background at intake;
- move reviewer-caught defects into a machine check. That check is a separate spec, `docs/sdd/test-time-cut-guard/`.

## Scope
`skills/procedures/retest-bug-workflow/*`, `skills/procedures/testing-ticket-workflow/WORKFLOW.md`, `references/parallel-prep.md`,
`references/qa-capture-tooling.md`, `references/qa-evidence-capture.md`. No gate is removed, merged or loosened.

## Rules
- **R1 — parallel intake (retest).** At Step 0–2 the retest workflow must start these independent reads together, then merge them
  into one intake:
  - the ticket fetch;
  - the project config;
  - the design reference;
  - a **background session check** of every account the round will lease, using the project guide's verify command.
- **R2 — dead session surfaces at minute one.** When the R1 session check finds a dead account, the workflow must give the user the
  ready-to-run relink/mint command for that account immediately, at intake, and keep preparing everything else. It never opens a
  login window and never types a password (existing rules unchanged).
- **R3 — work during owner waits.** While waiting at the testing-ticket Phase C confirmation or the retest Step 6d approval popup,
  the workflow must run the independent prep that does not need the answer:
  - the session check;
  - fixture/data existence checks;
  - notify-recipient and assignee lookup.
  It must not run anything the gate exists to hold: no Playwright run before Phase C, and no post or transition before 6d.
- **R4 — parallel-prep lists the retest pairs.** `references/parallel-prep.md` must name the retest intake pairs from R1 and the
  owner-wait prep from R3.
- **R5 — recorder is the screen-record skill.** Retest and the capture references must name the `manual-maker:screen-record` skill as
  the clip recorder, not the old QA-toolkit recorder script. Owner rule, 30 Oct 2026: recording is the screen-record skill only. The
  verifier and the 7-layer gate are unchanged.

## Done when
- R1–R5 text is present in the named files, and `bash scripts/run-test-suites.sh` is green.
- Shared files are synced to helix after merge, and `helix-parity` passes.
