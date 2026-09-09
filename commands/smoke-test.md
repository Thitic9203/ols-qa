# /smoke-test

Run a post-deployment smoke test of the OLS core features, triage every non-passing case to a
verified root cause, produce the two deliverables, and post the result to the QA release channel.

Load **[skills/smoke-test-workflow/SKILL.md](../skills/smoke-test-workflow/SKILL.md)** and follow it
in order. Also load the shared rules it depends on:

- [references/shared-preamble.md](../references/shared-preamble.md)
- [references/shared-must-never.md](../references/shared-must-never.md)
- [references/qa-evidence-gates.md](../references/qa-evidence-gates.md)
- [references/bug-priority-matrix.md](../references/bug-priority-matrix.md)

## What this command is for

Answering one question: **is the version now on this environment safe to promote to the next one.**

It grades main features across all user roles, read-only. It is not ticket-by-ticket verification —
that is `/testing-ticket`.

## Arguments

| Form | Meaning |
|---|---|
| `/smoke-test` | ask the owner which environment, then run |
| `/smoke-test dev` | run against dev (still confirm if the owner has not said so this session) |
| `/smoke-test dev --pass-only` | after triage, re-run with the non-passing cases excluded so the report shows passing cases only |
| `/smoke-test dev --no-notify` | produce the files, do not post to Discord |

## Output

1. `YYYYMMDD-Smoke-Test-Summary.pdf` — one page, A4 landscape
2. `YYYYMMDD-Playwright-Test-Report.html` — per-case results
3. A Discord post in the QA release channel, files attached, owner mentioned

Everything is written to `~/ols-qa-testing-bot/out/<env>-smoke-<YYYY-MM-DD>/`, which is permanent —
never `/tmp`.

## Finishing in one run

The workflow's Stage 2.5 exists so this command does **not** turn into eleven runs the way
2026-09-09 did. The three things that make it one:

1. Build `--grep-invert` from the exclusion registry at
   `~/ols-qa-testing-bot/smoke/excluded-cases.json` before the first run. Verified 2026-09-09 on
   dev: the remaining **111 cases pass clean in 4.9 minutes**, zero flaky, zero skipped.
2. Ask the owner once, up front, whether the report covers every case or only the clean passes.
   Deciding after seeing the numbers is what causes the re-runs.
3. Start the VPN watchdog with the run. A dropped tunnel produces failures that look like the
   product; that round is thrown away, not triaged.

## Before it will run

- The owner has named the environment.
- VPN is up and the host answers `200`.
- `docs/post-mortem/PENDING.md` has no `OPEN` row (an open row blocks the commits this workflow makes).

## The line that matters most

Every case that does not pass ends at a **verified** root cause — a Done ticket, a source line, or a
spec read this round. A caveat in the deliverable that you could have resolved yourself is not a
caveat; it is unfinished work.
