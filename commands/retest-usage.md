---
description: |
  Report who used the retest skill — per poster, project, issuetype, entry point, agent and verdict — from the marker line on posted retest comments. Read-only toward Jira.
  Do NOT use for retesting a ticket (retest-bug), filing bugs (create-bug), or any Jira write.
---
<!-- ols-only: this command runs tools/retest-usage/, which only this workspace has, so it is
     not synced to the generic plugin. -->
# /retest-usage

On-demand usage report for the retest skill. Takes **no arguments**; ask the user only whether
they have a backfill snapshot CSV (and its marker ship date) for comments posted before the marker existed,
and whether to include the team Discord thread where every AI test run is announced (step 4).

## Steps

1. **Fetch** — Atlassian MCP `searchJiraIssuesUsingJql` with JQL `comment ~ "retestskillmarker"`,
   fields `issuetype`, `project`, `comment`. Paginate until the response reports no further page.
2. **Filter** — keep only comments whose body contains the anchor `retestskillmarker` (the JQL
   matches the issue, not the comment). Drop the rest.
3. **Write** a JSON array to a local file **outside this repository** (e.g. `~/retest-usage/comments.json`),
   one object per comment: `{issue_key, project, issuetype, author, created, body}` — `author` as the
   display name, `body` as a plain string (or the ADF document as returned), `created` as returned.
4. **Discord thread (optional)** — only when the user gives the thread link (`<DISCORD_THREAD_LINK>`).
   - Open it in a browser that is **already logged in**. Never log in, and never read cookies, tokens
     or local storage. If the thread does not open, report that and continue without `--discord`.
   - Scroll up to the **start** of the thread so every message is loaded, then extract per message:
     timestamp · ticket key from `Ticket <KEY>` · kind (`Retest of dev fix` → `retest`,
     `Tested all` → `tested`; skip messages with neither) · the runner **only if the post states it**.
     The QA Owner shown in a post is the reviewer, not the runner — keep it as `owner` or leave it out.
   - For keys with no marked comment or snapshot row, look up `project` and `issuetype` with a
     read-only `getJiraIssue`.
   - Write a JSON array **outside this repository** (e.g. `~/retest-usage/discord.json`):
     `[{"ts": "2026-10-02T10:30:00+07:00", "ticket": "DEMO-1", "kind": "retest", "project": "DEMO", "issuetype": "Bug"}]`.
5. **Aggregate**:

   ```bash
   node tools/retest-usage/aggregate.js --comments ~/retest-usage/comments.json
   # with a backfill snapshot (rows before the marker existed):
   node tools/retest-usage/aggregate.js --comments ~/retest-usage/comments.json \
     --snapshot ~/retest-usage/backfill.csv --cutoff <marker ship date, ISO>
   # plus the Discord thread:
   node tools/retest-usage/aggregate.js --comments ~/retest-usage/comments.json \
     --snapshot ~/retest-usage/backfill.csv --cutoff <marker ship date, ISO> \
     --discord ~/retest-usage/discord.json
   ```

   Snapshot header: `issue_key,project,issuetype,comment_id,poster,created,verdict,skill`. Rows whose
   `skill` starts with `manual` land in the separate "not via skill" table and are not counted as use.
   Without `--cutoff`, comments the snapshot already covers may be counted twice (the footer warns).

   Discord entries are deduplicated, not added blindly: an entry with the same ticket within 1 day
   of a marked comment or snapshot row counts once (as that record, shown in the `Discord` column);
   each record pairs with at most one entry, nearest date first. A matched snapshot row labelled
   `manual…` or `unknown…` is upgraded to `retest-bug-workflow` / `testing-ticket (AI confirmed by
   Discord)`. Unmatched entries count as new runs (`src = discord`). The cutoff does not apply to
   Discord entries. The footer lists entries read · matched · upgraded · added as new.
6. **Show** the markdown tables in chat. If `--out` is used, the file goes outside the repository too.

## Safety

- **This repository is public. Never commit the comments file, the snapshot, the Discord JSON or the
  report** — they hold real names, issue keys, thread links and counts. Keep every input and output outside the repo.
- **Read-only toward Jira and Discord**: search and read only. No comment, edit, transition, assignment
  or Discord message/reaction.
- Exit `2` from the aggregator means it could not run (missing/malformed input) — report that, never
  an empty table as a result.
