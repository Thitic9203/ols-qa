# Retest handoff template

Use when the retest cannot finish in one session.

```markdown
# Retest handoff — {DATE}

## Tickets in progress

| Ticket | Status | Stuck at | Blocker |
|--------|--------|----------|---------|
| PROJ-123 | Step 4 | OTP | Need user token |

## Environment

- Portal URL: …
- Token valid until: …
- Browser: Jira tab on …

## Evidence collected

### PROJ-123

- cURL: yes / no
- Response bodies: yes / no
- Screenshots: uploaded / pending
- Swagger compared: yes / no

## Decisions

- Bug type: API / FE
- Comment format: v3 ADF / v2 wiki
- Retest result so far: PASSED / FAILED / blocked

## Next steps

1. …
2. …
```
