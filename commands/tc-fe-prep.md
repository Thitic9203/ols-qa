---
description: |
  Prepare FE manual test cases (Thai) from a Jira story (AC/EC), draft comment + two CSV attachments (Draft_Jira_{ISSUE_KEY}.csv and Import_Qase_{ISSUE_KEY}.csv), publish to the specified story.
  Do NOT use for API-only Swagger TC (tc-api-prep), retest-after-fix (retest-bug), or Playwright ticket runs (testing-ticket).
---

Read and follow [the TC FE prep workflow](../skills/tc-fe-prep-workflow/SKILL.md) end-to-end.

Pass any arguments after `/tc-fe-prep` as the Jira issue key or URL. If none were provided, ask the user which story to use.

Follow [references/user-communication.md](../references/user-communication.md). Do not post to Jira until the user approves the draft.
