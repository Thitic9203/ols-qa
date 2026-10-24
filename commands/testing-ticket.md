---
description: |
  Test a Jira ticket with Playwright — collect Ticket, URL, test account (no password), VPN, Confluence, Swagger, design (Figma) reference, confirm, then run.
  Do NOT use for opening bugs (create-bug), retest-after-fix on a bug (retest-bug), or drafting manual TC tables (tc-fe-prep / tc-api-prep).
---

Read and follow [the testing-ticket workflow](../skills/testing-ticket-workflow/SKILL.md) end-to-end.

Pass any arguments after `/testing-ticket` as the Jira issue key or URL. If none were provided, start Phase A intake (all six fields).

Every UI scenario is compared against its Figma node; a screen with no design reference is reported back to whoever asked for the run and its visual points stay BLOCKED.

Follow [references/user-communication.md](../references/user-communication.md). 🔴 GATE: show the intake summary and test plan, and do not run Playwright until the user confirms them (WORKFLOW Phase C). After tests, summarize in chat; every external write (Jira comment, results destination, notify) goes in the single end-of-round approval popup (WORKFLOW *Gates*, Phase G). Do not open bugs — use create-bug-workflow.
