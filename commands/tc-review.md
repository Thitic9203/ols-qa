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
quality; trace the ticket's business-rules / recheck-list sub-items as well as its AC list.

Report findings as Good vs Need Improve, each anchored to a TC/AC id or quoted source text — never an
unanchored impression. State plainly when a design source (Figma/PRD) could not be opened rather than
guessing what it shows.

Post the review in chat and get the user's go-ahead before sending it anywhere external. For an
external send: never invent a channel, thread, or mention id — ask for the exact one; read the response
back to confirm the destination and mentions before saying it is done; fix a wrong destination by
delete-and-resend, and wrong content (correct destination) by editing in place.

Follow [references/user-communication.md](../references/user-communication.md).
