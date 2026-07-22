# WIP — TC review/draft batch, 16 RTT tickets (2026-07-23)

Ran a **sheet-only** variant of `tc-fe-prep-workflow` (user: no Jira comment) on all Summary-tab
stories with **Status = READY TO TEST** + **Ticket Detail Status = Details Provided** + **TC Status
∈ {TO DO, IN PROGRESS}**: OLS-33, 35, 36, 37, 46, 58, 78, 83, 87, 88, 205, 206, 207, 211, 218, 225.

**Status: DONE.** All 16 tabs reviewed for AC/EC coverage + ISTQB format, written to their Sheet tab
(OLS-44 16-col canonical), TC Status flipped to `QA REVIEWED` in **both** stores — Summary!TC Status
(Sheet) and Jira `customfield_12128` (field edit, not a comment). Mechanical re-check across all 16
passed clean (header, TC_id sequence, Type/Priority enums, Unit→Integration→System ordering, full
AC/EC coverage, no stray markup).

## Method used (repeat for future batches — see also `references/ols-project-guide.md`)

1. Scan Summary tab for eligible tickets (see filter above).
2. Fetch each ticket's Jira description+comments via REST API; dump the tab's current rows via
   Sheets API `values.get`.
3. **Deterministic format-normalize pass first** (regex, no LLM): AC label → `AC_nn`/`EC_nn` only,
   Services Impacted → Thai, comma-separated (no `/`, no Jira `**n.**` bold-numbering, no embedded
   newlines), TC_id → `TC_01…` continuous after sorting Unit→Integration→System / AC-then-EC
   ascending, QA Owner ← Summary's owner, Test Status → `NOT STARTED`. This alone fixed most of the
   format violations without touching content.
4. **Content review** per ticket: verify every AC/EC's full Expected Result is asserted, Types match
   the layer actually being tested (a case still needs full browser navigation even when "Unit" —
   don't flag that; DO flag two rows that are literal duplicates of the same assertion under two
   Type labels), nothing invented beyond the ticket's AC/EC. Caught: exact-duplicate rows in OLS-33/
   OLS-46, a mistyped cache-expiry case in OLS-83, incomplete coverage in OLS-35/78/205, a from-
   scratch draft for OLS-37 (no prior tab, 18 criteria).
   ⚠️ **Parallel background subagents hit the account session limit when ~16 were launched at once**
   — half failed mid-run with no output. Fall back to doing the content review inline (sequentially,
   no subagent) rather than re-dispatching a large parallel batch; it's slower but doesn't lose work.
5. Write via a `write_tab.py`-style script with a 3-layer guard: refuse if any **live** row is
   QA-owned (Actual Result / Linked Bug filled, or Test Status not blank/NOT STARTED) before
   clearing+rewriting that tab.
6. Flip **both** TC Status stores to `QA REVIEWED` — Sheet Summary!TC Status AND Jira
   `customfield_12128` (`PUT /rest/api/3/issue/{key}` with
   `{"fields":{"customfield_12128":{"value":"QA REVIEWED"}}}`, HTTP 204). These are independent
   fields; flipping one does not flip the other.

## Gotcha found + documented in `references/ols-project-guide.md`

Every per-ticket tab is a **Google Sheets Table object**, not a plain range — classic
`setDataValidation` on the QA Owner column 400s (`"not allowed on cells in typed columns"`); use
`updateTable` with `columnProperties[{"columnIndex":10,"columnType":"DROPDOWN",...}]` instead. The
dropdown's real option list uses short aliases (`QA Owner A`, `QA Owner B`, `QA Owner C`, `QA Owner D`), not
the full `"Name (Nick, ไทย)"` form the Summary tab uses — write the alias, not the full name.

## Findings flagged to QA Owner (Remark column, not blocking)

OLS-211: AC_01 says "4 รายการ" but AC_02/03 say "2 รายการ" — genuine spec contradiction, needs PO.
OLS-46: most Jira comments belong to a different (media) ticket, cross-posted into this thread —
ignore them for OLS-46's actual AC/EC. OLS-58: Business Rules say Register/ThaID e-KYC is entirely
NDLP's responsibility, yet AC_01-03/05/06 + all 5 ECs describe exactly those features — scope
conflict, needs PO confirmation before running these TCs for real.
