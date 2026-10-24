# Bug draft template (Helix default)

Use when the user selects **Helix default** format. Every block below is required by the MUST rows of
[defect-report-completeness.md](../../../../references/defect-report-completeness.md); Priority and
Severity come only from the [Bug Priority & Severity Matrix](../../../../references/bug-priority-matrix.md).

```text
━━━ Bug #{n} ━━━
Title: [{Severity}] {Module} — {behavioral one line}

Priority: Lowest | Low | Medium | High | Highest — matrix bug-priority-matrix.md:<LINE> "<cheat-sheet row text, verbatim>"
Severity: Low | Medium | High | Urgent — the value the reporter gave at intake (A3), kept as given
Module: {area}
Confidence: Confirmed | Likely

What happens:
- {observable behavior, one fact per line}

What should happen:
- {expected behavior, one fact per line}
> "{the expected-result line from its source, copied character for character}"
- Source: {design frame / AC id / PRD section / PO decision} — {link}

User impact:
{who is affected}

Repro matrix (entry point × result, untried = not tested):
| Entry point | Result |
|---|---|
| {entry point 1} | reproduced — {evidence ref} |
| {entry point 2} | not reproduced — {evidence ref} |
| {entry point 3} | not tested |

Steps to reproduce (only steps from the reporter's input or evidence):
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

- **Severity** — the value the reporter gave at intake, unchanged; it is also the title bracket. Never
  replace a reporter-given severity with your own reading. If none was given, or the matrix has no cell
  where that Severity row meets the cited Priority column, show the matching matrix row and ask (WORKFLOW
  A3) — never fill it with a guess.
- **Priority** — its own field, derived from the matrix: the Severity row × the Priority column whose
  description fits the defect; cite the cheat-sheet row as the matrix's own *Verdict line format* does: line number
  plus the row text copied character for character, never the file name alone. No matching row →
  show the closest rows to the user and ask; never invent a level and never use any other scale.
- **What happens / What should happen** — keep both headings. The verbatim source quote and its link go
  *inside* What should happen, under the expected bullets; they never replace the section.
  Quote the source line verbatim and link it. A paraphrase, a feature name or a
  translation is not an expected side; with no quotable source the candidate is a question, not a bug
  (WORKFLOW Refusal-first).
- **Repro matrix** — one row for **every** entry point that could reach the defect. Mark a path you
  did not try `not tested`; never claim the defect occurs via a path with no evidence row.
- **Steps to reproduce** — copy the steps from the reporter's input or evidence only. Never add, merge
  or "complete" a step yourself; a step that seems missing is a question to the reporter (ask in the A3
  follow-up), never an invented line.

Title rules:

- Lead with the Severity bracket (the reporter's intake value) for Jira/GitHub scanability — never a
  priority you derived.
- Behavioral description — not “Bug in login” alone.
- If the project uses a bracketed tag-prefix convention (e.g. `[Area][Feature][Role]`), put **exactly one
  space** after the closing `]` before the description — never run the text straight onto the bracket.
- Keep it concise **but** complete: enough to know the flow + symptom; drop details that already live in
  dedicated fields (they only duplicate).

Field formatting (match the target tracker's own convention when it has one):

- Write **What happens** (actual) as **bullet points — one fact per line**, not a single run-on
  paragraph. Reviewers scan bullets; they skip walls of prose. The source quote inside What should happen stays verbatim.
- **Embed the evidence screenshot inline in the actual-result field** when the tracker supports inline
  images (attach to the issue first, then reference it inline) — not only as a loose attachment — so the
  proof sits next to the claim. Re-render and confirm the image resolved (not a literal `!filename!`).
