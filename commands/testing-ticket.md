---
description: Test a Jira ticket with Playwright — collect Ticket, URL, credentials, VPN, Confluence, Swagger, confirm, then run
---

Invoke the `testing-ticket-workflow` skill.

Pass any arguments after `/testing-ticket` as the Jira issue key or URL. If none were provided, start Phase A intake (all seven fields).

Respond in English. Do not run Playwright until the user confirms the intake summary. After tests, summarize in chat, then ask if results should be updated elsewhere (see skill Phase G). Do not open bugs — use create-bug-workflow.
