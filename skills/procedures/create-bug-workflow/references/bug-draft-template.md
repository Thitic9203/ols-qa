# Bug draft template (Helix default)

Use when the user selects **Helix default** format. Every block below is required by the MUST rows of
[defect-report-completeness.md](../../../../references/defect-report-completeness.md); Priority and
Severity come only from the [Bug Priority & Severity Matrix](../../../../references/bug-priority-matrix.md).

```text
━━━ Bug #{n} ━━━
Title: [{Priority}] {Module} — {behavioral one line}

Priority: Lowest | Low | Medium | High | Highest — matrix bug-priority-matrix.md:<LINE> "<cheat-sheet row text, verbatim>"
Severity: Low | Medium | High | Urgent — the matrix row of that same cell
Module: {area}
Confidence: Confirmed | Likely

What happens:
- {observable behavior, one fact per line}

Expected — verbatim source line + link:
> "{the expected-result line, copied character for character}"
- Source: {design frame / AC id / PRD section / PO decision} — {link}

User impact:
{who is affected}

Repro matrix (entry point × result, untried = not tested):
| Entry point | Result |
|---|---|
| {entry point 1} | reproduced — {evidence ref} |
| {entry point 2} | not reproduced — {evidence ref} |
| {entry point 3} | not tested |

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

Block rules:

- **Priority** — cite the cheat-sheet row as the matrix's own *Verdict line format* does: line number
  plus the row text copied character for character, never the file name alone. No matching row →
  show the closest rows to the user and ask; never invent a level and never use any other scale.
- **Expected** — quote the source line verbatim and link it. A paraphrase, a feature name or a
  translation is not an expected side; with no quotable source the candidate is a question, not a bug
  (WORKFLOW Refusal-first).
- **Repro matrix** — one row for **every** entry point that could reach the defect. Mark a path you
  did not try `not tested`; never claim the defect occurs via a path with no evidence row.

Title rules:

- Lead with the Priority bracket for Jira/GitHub scanability.
- Behavioral description — not “Bug in login” alone.
- If the project uses a bracketed tag-prefix convention (e.g. `[Area][Feature][Role]`), put **exactly one
  space** after the closing `]` before the description — never run the text straight onto the bracket.
- Keep it concise **but** complete: enough to know the flow + symptom; drop details that already live in
  dedicated fields (they only duplicate).

Field formatting (match the target tracker's own convention when it has one):

- Write **What happens** (actual) as **bullet points — one fact per line**, not a single run-on
  paragraph. Reviewers scan bullets; they skip walls of prose. The Expected block stays a verbatim quote.
- **Embed the evidence screenshot inline in the actual-result field** when the tracker supports inline
  images (attach to the issue first, then reference it inline) — not only as a loose attachment — so the
  proof sits next to the claim. Re-render and confirm the image resolved (not a literal `!filename!`).
