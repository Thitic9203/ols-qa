# WIP — Regression Lot2 non-PASSED retest (planned 2026-07-24, not yet executed)

**Active plan:** `continue/ols-lot2-nonpassed-retest-24jul.md` in the **private** `ols-qa-evidence`
repo. Read it before touching any Lot2 ticket — it is both the plan and the living results table.

- **Scope:** the 22 tickets tagged `Regression Lot2` in the Test Progress tab, filtered to Jira status
  `READY TO TEST` or `TESTING` ⇒ **15 tickets / 174 non-PASSED cases**. 7 tickets (85 cases) are excluded
  and each one's real next action is recorded — they are not a coverage gap.
- **Env: Dev only** (user decision 2026-07-24, no exception). Pre-prod evidence from the 125-case
  customer-UAT regression run **cannot** close a case in this plan.
- **Run order is LOCKED** — §3.1 FINAL RUN QUEUE, 11 groups ordered by estimated minutes per case
  *including each group's own gate cost*. Walk it top to bottom; only two reorder triggers are allowed.
- **Sheet write happens at the END of every group**, not once at the end of the batch (user rule). That
  is why the two heavy tickets are split across several groups — 11 write checkpoints.
- **Write scope:** Google Sheet per-ticket tabs + Drive only. Jira is read-only apart from the
  `READY TO TEST → TESTING` transition. No Jira comment, no bug opened, no Discord notify.
- **Still open:** the named-row override grant for **24 human-owned rows** (rows a QA person already
  filled). It does not block the queue — those cases are run and their row objects parked in
  `pending-grant/<TICKET>.rows.json`, written at the first checkpoint after the grant lands.

## Traps already found — do not re-derive

- **6 of the 15 tickets still have Jira `TC Status = TO DO`** (69 cases; they were not in the 2026-07-23
  review batch below) ⇒ a TC review pass is a gate on those groups. Cost is folded into the group
  estimate, not treated as a separate phase.
- **One ticket's 16 BLOCKED rows were blocked on a *different env*** (a Mica preprod host). Those reasons
  are out of env and must be re-probed on dev before any of them keeps a BLOCKED verdict.
- **Sheet Summary status and Jira status disagree on 2 tickets.** Jira wins; check it live per session.
- **One FAILED row's linked bug is still `To Do`** ⇒ expect a FAILED re-confirm, never argue it to PASSED.
- Evidence rule splits by row: **MP4 for the 149 first-run cases** (story testing), **screenshots only
  for the 25 re-verified rows** (retest). BLOCKED rows are exempt from MP4.

## Previous WIP (finished — kept as a pointer)

TC review/draft batch across 16 READY-TO-TEST tickets: **DONE** (2026-07-23). Method is recorded in
`references/ols-project-guide.md` and agent memory `feedback_ols-tc-autodraft-method`; the Sheets
"Table object" dropdown gotcha is in the project guide.
