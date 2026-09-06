---
description: |
  Review already-recorded results and their evidence clips — one contact sheet per clip, judge every case against the ten criteria, close each as PASSED / FAILED / AWAITING RE-REVIEW, drive the live board, then group the fixes cheapest-first.
  Do NOT use for running the tests in the first place (testing-ticket), retesting one ticket after a dev fix (retest-bug), drafting TC tables (tc-fe-prep / tc-api-prep), or opening bugs (create-bug).
---

Read and follow [the review-result workflow](../skills/review-result-workflow/SKILL.md) end-to-end.

Pass arguments after `/review-result` as the review scope — a suite, a set of tabs, a list of case ids,
or a description such as "the integration clips recorded this round". If none, ask which recorded set to
review.

Do not start without the result sheet (or equivalent case list) naming each case's tab, role, steps and
expected results, **and** the recorded evidence for those cases reachable on disk. Reviewing clips with
no case list behind them produces an opinion, not a verdict.

Create the run's working directory before writing the first file — never a system temp directory, which
can be cleared and take the round's verdicts, contact sheets and board payloads with it.

Judge every case against all ten criteria; one failure is enough to fail the case. Close every case as
`PASSED`, `FAILED`, or `AWAITING RE-REVIEW` — never an interim status. Never rename an evidence file,
for any reason, including when moving a case between tabs.

Finish with the final review: sheet sequence numbers continuous, no clip filename changed, no case left
on an interim status, and board numbers regenerated from the recorded verdicts and read back live.

Follow [references/user-communication.md](../references/user-communication.md).
