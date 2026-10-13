# adoption-check

Answers one question from the tracker, never from memory: **is this ticket counted by the AI-skill
adoption dashboard?** Used at the close-out of retest-bug and testing-ticket, whose chat report
must say so in one line.

```bash
TRACKER_BASE_URL=https://{JIRA_DOMAIN} TRACKER_EMAIL=… TRACKER_API_TOKEN=… \
  node tools/adoption-check/check.js --key {ISSUE_KEY} [--cutoff <ISO date>] [--dashboard <url>]
node tools/adoption-check/check.test.js          # known-answer tests (injected fetch, no network)
node tools/adoption-check/workflow_docs.test.js  # both workflows + the project guide document it
```

## What it checks

1. `POST /rest/api/3/search/jql` with `key = {ISSUE_KEY} AND comment ~ "retestskillmarker"` — the
   dashboard's own search, scoped to the ticket. Not returned → not counted.
2. `GET /rest/api/2/issue/{ISSUE_KEY}/comment?orderBy=-created` — a comment whose **last line** carries
   the marker, and (with `--cutoff`) was created after the snapshot cutoff.

## Exit codes and output

`0` counted · `1` not counted (`reason` says why) · `2` cannot check (missing credentials, a key that is
not a tracker key — refused before any call, HTTP error, network error). Stdout is the JSON result
followed by the one chat line:

- `Counted in <ADOPTION_DASHBOARD_URL> — tab AI Skill Adoption Overview (dashboard refreshes every 5 minutes)`
- `NOT counted yet — <reason>` / `Could not check the adoption count — <reason>`

This repo is public: the dashboard URL, cutoff and credentials come from local secrets, never from here.
