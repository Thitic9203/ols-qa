---
description: |
  Prepare FE manual test cases from a Jira story (AC/EC), draft comment + CSV, publish to the specified story.
  Do NOT use for API-only Swagger TC (tc-api-prep), retest-after-fix (retest-bug), or Playwright ticket runs (testing-ticket).
---

Invoke the `tc-fe-prep-workflow` skill.

Pass any arguments after `/tc-fe-prep` as the Jira issue key or URL. If none were provided, ask the user which story to use.

Follow [references/user-communication.md](../references/user-communication.md). Do not post to Jira until the user approves the draft.
