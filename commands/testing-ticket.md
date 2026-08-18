---
description: |
  Test a Jira ticket with Playwright — collect Ticket, URL, credentials, VPN, Confluence, Swagger, design (Figma) reference, confirm, then run.
  Do NOT use for opening bugs (create-bug), retest-after-fix on a bug (retest-bug), or drafting manual TC tables (tc-fe-prep / tc-api-prep).
---

Read and follow [the testing-ticket workflow](../skills/testing-ticket-workflow/SKILL.md) end-to-end.

Pass any arguments after `/testing-ticket` as the Jira issue key or URL. If none were provided, start Phase A intake (all seven fields).

Every UI scenario is compared against its Figma node; a screen with no design reference is reported back to whoever asked for the run and its visual points stay BLOCKED.

Follow [references/user-communication.md](../references/user-communication.md). Do not run Playwright until the user confirms the intake summary. After tests, summarize in chat, then ask if results should be updated elsewhere (see skill Phase G). Do not open bugs — use create-bug-workflow.
