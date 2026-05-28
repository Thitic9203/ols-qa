# Intake one-pager (long workflows)

Show **once** at the start of intake (before detailed questions). English only. Adjust the checklist to the workflow.

## TC API prep

```text
━━━ What I need from you (TC API) ━━━
Required now:
  • API spec (link, file, or pasted scope)
  • Swagger/OpenAPI (URL or path)
After that I will ask:
  • Column changes (or "default")
  • Delivery: Jira comment link and/or CSV/Excel path
Optional: Jira story key for traceability only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Testing ticket

```text
━━━ What I need from you (Testing ticket) ━━━
Required:
  • Ticket (Jira key or URL)
  • Application URL
  • Login (user/password or "guest")
  • VPN: required or not
Optional:
  • Confluence page
  • Swagger URL
I will post a test plan — reply **confirm** before Playwright runs.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Create bug

```text
━━━ What I need from you (Create bug) ━━━
Required:
  • Where to file (Jira project URL/key or GitHub repo)
  • Format (template link, Helix default, or v2/v3 rule)
  • Bug details (title, steps, expected, severity, evidence)
You may reference findings from a prior testing-ticket run in this chat.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Retest bug

```text
━━━ What I need from you (Retest) ━━━
Required:
  • Bug key or URL
  • Reachable environment (from workspace *-retest-guide.md or your answers)
I will summarize what the dev claimed fixed vs what we will verify.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do not ask for fields already provided in the user’s first message — mark them done on the one-pager.
