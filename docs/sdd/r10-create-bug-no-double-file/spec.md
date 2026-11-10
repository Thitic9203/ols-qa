# Spec — create-bug: no second issue after a failed create

## Source
- S1 after-6 static review (`evals/helix-skill-eval-2026-11-05-after6/baseline/create-bug-workflow.json`, P1 at `WORKFLOW.md:312`): "Before switching Jira path after any MCP/REST error or timeout, run searchJiraIssuesUsingJql on the approved title (no status filter) and treat the issue as created if found; add it to the 'MCP fails' branch."
- S2 Owner, 10/Nov/2026: every skill must pass the exit gate (P0 = 0 and P1 = 0).

## Rules
- R1 — When the create call fails with a non-field error (unreachable, auth, tool error, timeout), the agent must search Jira for the approved summary (no status filter) before it switches to another create path.
- R2 — When that search finds the issue, the agent must treat it as created: record its key, must not create it again, and continue at Phase F.
- R3 — When the search itself cannot run, the agent must not create on another path; it stops and asks the user to check the board first.
- R4 — A field-validation error (step 3) is unchanged: nothing was created, no search needed.

## Edge cases
- Two matches for the summary: show both keys to the user and ask which one is this run's issue; create nothing.

## Done when
- `skills/procedures/create-bug-workflow/WORKFLOW.md` step 4 carries R1–R3.
- `bash scripts/run-test-suites.sh` passes.
