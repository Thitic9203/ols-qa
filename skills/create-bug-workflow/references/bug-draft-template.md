# Bug draft template (Helix default)

Use when the user selects **Helix default** format.

```text
━━━ Bug #{n} ━━━
Title: [{Severity}] {Module} — {behavioral one line}

Severity: Critical | High | Medium | Low
Module: {area}
Confidence: Confirmed | Likely

What happens:
{observable behavior}

What should happen:
{expected behavior}

User impact:
{who is affected}

Steps to reproduce:
1. ...
2. ...
3. ...

Code reference (if known):
- File: path:line
- Root cause: ...

Environment:
- URL:
- Browser / viewport:
- Date: YYYY-MM-DD

Evidence:
- Screenshot: {path or none}
- Console / network: {snippet or none}
━━━━━━━━━━━━━━
```

Title rules:

- Lead with severity bracket for Jira/GitHub scanability.
- Behavioral description — not “Bug in login” alone.
