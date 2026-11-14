# Create bug — Phase B2

Part of [WORKFLOW.md](WORKFLOW.md), opened at Phase B2; every rule here is a full gate.

## 🔴 GATE: Phase B2 — steps

Gate scope and freedom level: [WORKFLOW.md § Phase B2](WORKFLOW.md#-gate-phase-b2--board-conflict-re-check-hard-gate-before-draftingconfirm-low-freedom).

**For every bug about to be filed, search the tracker/board first** — a defect the team already
discussed and concluded is *intended behavior* is not a bug, even if it looks wrong to you, and
re-filing it wastes a full file → retest → close-out round.

1. **Search the board** for existing or closed tickets covering the same **screen / field / message /
   behavior** as each candidate bug. On Jira use `searchJiraIssuesUsingJql`, or the same JQL through Jira REST (`/rest/api/3/search`) when the run posts by REST (Phase D accepts REST credentials) (search summaries **and**
   comment text — the deciding conclusion often lives in a comment, not the title); on GitHub search
   open **and** closed issues. Use the distinctive terms of the finding (the exact error text, the
   field label, the component) — not just the ticket type. No status filter, so resolved tickets are
   included. Examples:
   - Jira (`text ~` covers summary, description and comments):
     `project = <KEY> AND text ~ "\"<exact error text>\"" ORDER BY updated DESC` — then repeat with the
     field label or component name.
   - If the user pastes board-search results instead, accept the pasted results when they show the
     query terms, the open and closed state and a result per candidate; otherwise re-run the search
     yourself or ask the user for the missing part. If the paste does not state whether comments were
     searched, write `comment scope not stated` on the Phase C Board check line and ask once whether
     the search covered summary and comments; do not hold the draft. Phase D does not create that
     candidate until the user says comments were searched or the search is re-run over comments.
   - GitHub: `gh issue list --repo <owner/repo> --state all --search '"<exact error text>" in:title,body,comments'`.
2. **Read the conclusion of any match**, including resolved/closed ones. A closed ticket can still hold
   the authoritative decision.
3. **Decide per candidate:**
   - **Conflict — not a bug.** A resolved ticket records that the current behavior is correct (e.g. a
     discussion concluded the message must be exactly what the app now shows) → **drop this candidate,
     do not draft or file it.** Report to the user in chat: what you found, the ticket key, and the
     **direct link to the concluding comment** (`…/browse/KEY?focusedCommentId=<id>` or the GitHub
     comment anchor) so they can verify the reasoning themselves.
   - **Duplicate — already open.** The same defect is already filed and unresolved → do not open a
     second one; point the user at the existing ticket.
   - **No conflict.** No ticket settles it → proceed to Phase B3 for this candidate.
4. **Uncertain whether a match truly settles it?** Treat it as a **question to the user / PO, not a
   bug** — surface the ticket link and ask, rather than filing over a possible prior decision.
5. **The search itself cannot run** (no tracker read access, neither MCP nor REST reachable, search error) → **STOP.**
   Report the error verbatim, hold every candidate as **BLOCKED (board search not run)**, and do not
   move to Phase B3 or Phase C until a search has completed for each candidate.

Only candidates that clear this gate move on — to Phase B3, then Phase C. Note in the confirm block
that the board was checked (see Phase C).

(Root cause this prevents: re-filing a defect against a point the team already closed with an
agreed-upon expected value.)

**Go back:** A candidate that fails this gate (conflict or duplicate) leaves the batch here. If the user or PO answers an uncertain match with "still a bug", return to item 3 of this phase and decide that candidate again. After a blocked search (item 5), return to item 1 once access is restored.
