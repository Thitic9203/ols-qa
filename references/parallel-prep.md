# Parallel prep (independent reads)

Use at workflow **start** when two or more **read-only** fetches do not depend on each other.

## Safe parallel pairs

| A | B | Then |
|---|---|------|
| Jira story fetch | Workspace `fe-guide.md` / `api-guide.md` discovery | Merge into one-pager |
| Swagger URL load | Jira acceptance criteria | Phase scope lock |
| Confluence link from ticket | Issue description | Single intake summary |
| Retest ticket fetch | Project config + design reference | Retest intake (retest Step 2) |
| Session check of every account the round leases (background) | Ticket fetch / case list | Dead account reported at intake with its relink/mint command |

## While waiting at an owner gate

At the testing-ticket Phase C confirmation and the retest Step 6d approval, run only the prep the answer does not change:
- the session check;
- fixture/data existence checks;
- the notify-recipient and assignee lookup.

Never run what the gate holds: no Playwright before Phase C, and no post, transition or notify before 6d.

## Not parallel

- Draft TC table **before** coverage review YES  
- Playwright run **before** execution plan approval  
- Jira post **before** user approves comment  

## Procedure

1. List fetches needed for intake or context load (testing-ticket: Phase B).  
2. Run independent fetches in parallel (subagents or parallel tool calls if available).  
3. **Single** merged [intake-one-pager.md](intake-one-pager.md) — resolve conflicts explicitly (e.g. AC in Jira vs Confluence).

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST NOT parallelize two writes to same Jira issue | Race and duplicate comments |
| MUST cite which source won on conflict | Traceability |
