---
description: |
  Review a test case document that already exists — against the AC/EC and business rules on its
  governing ticket. Build a traceability matrix, judge coverage and row quality, report Good vs Need
  Improve, each finding anchored to a quoted source.
  Do NOT use for drafting new TC tables (tc-fe-prep / tc-api-prep), running a ticket's Playwright pass
  (testing-ticket), reviewing already-recorded execution evidence (review-result), or retesting a bug
  after a dev fix (retest-bug).
---

Read and follow [the TC review workflow](../skills/tc-review-workflow/SKILL.md) end-to-end.

Pass arguments after `/tc-review` as the TC document and the ticket to check it against — a sheet/CSV/
file link plus a Jira key or URL. If either is missing, ask for it before starting.

Do not start without both the TC document (reachable and readable this session) and the ticket's own
AC/EC (fetched from the ticket itself, not assumed). Build the traceability matrix before judging row
quality. Skip struck-through AC/EC entirely. Raise a business rule or comment only when it conflicts with
an AC/EC.

Report findings as Good vs Need Improve, each anchored to a TC/AC id or quoted source text — never an
unanchored impression. Every Need Improve item carries a "→ Suggest:" fix, sourced from the row's own
data or the AC/EC wording, or marked "confirm with dev/PO". Never put an invented value in a suggestion. State plainly when a design source (Figma/PRD) could not be opened rather than
guessing what it shows.

Post the review in chat, then notify it to the ticket project's TC-review channel on every run — run
Step 5 of the workflow exactly as written there (it is the single source for the notify rules).

Follow [references/user-communication.md](../references/user-communication.md).
