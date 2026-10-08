---
description: |
  Report who used the retest skill — per poster, project, issuetype, entry point, agent and verdict — from the marker line on posted retest comments. Read-only toward Jira.
  Do NOT use for retesting a ticket (retest-bug), filing bugs (create-bug), or any Jira write.
---
<!-- ols-only: this command runs tools/retest-usage/, which only this workspace has, so it is
     not synced to the generic plugin. -->
# /retest-usage

On-demand usage report for the retest skill. Takes **no arguments**; ask the user only whether
they have a backfill snapshot CSV (and its marker ship date) for comments posted before the marker existed.

## Steps

1. **Fetch** — Atlassian MCP `searchJiraIssuesUsingJql` with JQL `comment ~ "retestskillmarker"`,
   fields `issuetype`, `project`, `comment`. Paginate until the response reports no further page.
2. **Filter** — keep only comments whose body contains the anchor `retestskillmarker` (the JQL
   matches the issue, not the comment). Drop the rest.
3. **Write** a JSON array to a local file **outside this repository** (e.g. `~/retest-usage/comments.json`),
   one object per comment: `{issue_key, project, issuetype, author, created, body}` — `author` as the
   display name, `body` as a plain string (or the ADF document as returned), `created` as returned.
4. **Aggregate**:

   ```bash
   node tools/retest-usage/aggregate.js --comments ~/retest-usage/comments.json
   # with a backfill snapshot (rows before the marker existed):
   node tools/retest-usage/aggregate.js --comments ~/retest-usage/comments.json \
     --snapshot ~/retest-usage/backfill.csv --cutoff <marker ship date, ISO>
   ```

   Snapshot header: `issue_key,project,issuetype,comment_id,poster,created,verdict,skill`. Rows whose
   `skill` starts with `manual` land in the separate "not via skill" table and are not counted as use.
   Without `--cutoff`, comments the snapshot already covers may be counted twice (the footer warns).
5. **Show** the markdown tables in chat. If `--out` is used, the file goes outside the repository too.

## Safety

- **This repository is public. Never commit the comments file, the snapshot or the report** — they
  hold real names, issue keys and counts. Keep every input and output outside the repo.
- **Read-only toward Jira**: search only. No comment, edit, transition or assignment.
- Exit `2` from the aggregator means it could not run (missing/malformed input) — report that, never
  an empty table as a result.
