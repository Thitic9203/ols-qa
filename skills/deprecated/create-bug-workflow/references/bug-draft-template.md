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
- If the project uses a bracketed tag-prefix convention (e.g. `[Area][Feature][Role]`), put **exactly one
  space** after the closing `]` before the description — never run the text straight onto the bracket.
- Keep it concise **but** complete: enough to know the flow + symptom; drop details that already live in
  dedicated fields (they only duplicate).

Field formatting (match the target tracker's own convention when it has one):

- Write **What happens** (actual) and **What should happen** (expected) as **bullet points — one fact per
  line**, not a single run-on paragraph. Reviewers scan bullets; they skip walls of prose.
- **Embed the evidence screenshot inline in the actual-result field** when the tracker supports inline
  images (attach to the issue first, then reference it inline) — not only as a loose attachment — so the
  proof sits next to the claim. Re-render and confirm the image resolved (not a literal `!filename!`).
