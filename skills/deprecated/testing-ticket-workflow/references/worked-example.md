# Worked example (anonymized) — Testing ticket

**Ticket:** `PROJ-501` — Login form validation  
**Outcome:** 3 scenarios run; summary in chat; user skipped external result update

## Inputs

- Ticket: `PROJ-501`
- URL: `https://app.staging.example.com`
- User / password: test role (session-only)
- VPN: Not required
- Confluence / Swagger: none

## Repro — agent steps (abbreviated)

1. **Phase A:** Recited [helix-session-constraints.md](../../../../references/helix-session-constraints.md) testing-ticket block.
2. **Phase C:** User replied `confirm` on 3-scenario plan.
3. **Phase E:** TC1 login happy PASSED; TC2 empty password FAILED (toast shown); TC3 locked account BLOCKED (no seed user).
4. **Phase F:** Posted F1–F3 in chat; listed defect in F3 without filing Jira issue.
5. **Phase G:** User replied `skip` → session complete.

## Output snippet (F2 table)

```text
| # | Scenario | Result | Notes |
| 1 | Valid login | PASSED | dashboard.png |
| 2 | Empty password | FAILED | validation-toast.png |
| 3 | Locked account | BLOCKED | need QA to unlock user |
```

## Lessons

- F3 defects → user must choose **Create bug** separately; this workflow does not file tickets.
- NEVER mark PASSED without screenshot or network evidence.
