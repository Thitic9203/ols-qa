# Plan — smoke-unreleased-flag-gate

## Files touched

- `skills/smoke-test-workflow/SKILL.md` — new **Stage 3.5 — Unreleased-work check (production / training
  only)**, added to Contents and the progress checklist; one MUST line; the training NEVER line narrowed
  (R10); the Stage 8 notify carries the findings when there are any (R9).
- `commands/smoke-test.md` — one section pointing at Stage 3.5.
- `tools/smoke-guard/unreleased_flag_rule.test.js` — new wording test (R11). Picked up by
  `scripts/list-test-suites.sh` (any `*.test.js` under `tools/`).

## Data

- Jira versions: `GET /rest/api/2/project/<PROJECT>/versions` → `name`, `released`, `releaseDate`.
- Tickets: `GET /rest/api/3/search/jql?jql=project=<PROJECT> AND fixVersion in (<future versions>)&fields=summary,status,issuetype,fixVersions&nextPageToken=…` until `isLast`; cross-check `POST /rest/api/3/search/approximate-count`. (`/rest/api/2/search` returns HTTP 410 — measured 2026-11-18.)
- Round record: `<WORKDIR>/unreleased-check.md` (off-repo, permanent folder) — one line per ticket.

## Choices weighed

- **Where in the flow:** after Stage 3 (the run) and before the quality gate, so findings reach the
  summary and the notify. Before the run was rejected: it would delay the timed suite.
- **Future release test:** `releaseDate > test date` only (owner 2026-11-18). `released=false OR
  releaseDate > test date` was offered and declined. Versions with no date are named in the round
  record so the skip is visible, not silent.
- **Library:** none new; curl + the existing Jira token file. Free (global rule 3).

## What could break

- `tools/skill-structure` checks (Contents links, checklist) — the new stage heading must appear in both.
- The skill is ols-qa-only (`skill-routing.md`), so no helix sync.
