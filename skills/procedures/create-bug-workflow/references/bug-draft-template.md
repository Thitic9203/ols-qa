# Bug draft template (Helix default)

Use when the user selects **Helix default** format. Every block below is required by the MUST rows of
[defect-report-completeness.md](../../../../references/defect-report-completeness.md) (§1 five questions, §2 repro matrix, §4 resolution options, §5 dev-question gate); Priority and
Severity come only from the [Bug Priority & Severity Matrix](../../../../references/bug-priority-matrix.md).

## Contents

- [Draft layout](#draft-layout)
- [Block rules](#block-rules)
- [Title rules](#title-rules)
- [Field formatting](#field-formatting)

## Draft layout

```text
━━━ Bug #{n} ━━━
Title: [{Severity}] {Module} — {behavioral one line}

Priority: Lowest | Low | Medium | High | Highest — matrix bug-priority-matrix.md:<LINE> "<cheat-sheet row text, verbatim>"
Severity: Low | Medium | High | Urgent — the value the reporter gave at intake (A3), kept as given
Module: {area}
Confidence: Confirmed | Likely | Needs Review — not filed

What happens:
- {observable behavior, one fact per line}

What should happen:
- {expected behavior} — อิงจาก {AC_yy / EC_zz} จากทิคเกต {KEY} {ticket link}   (one line per AC/EC)
> "{the expected-result line from its source, copied character for character}"
- Source: {design frame / AC id / PRD section / PO decision} — {link}
- Latest source check: {later tickets on the same screen, read; which one is in force, and why}

Why failed: "{the expected-result line, copied character for character}" → {the exact deviation, one observable fact}

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

Resolution options (QA picks neither):
| Option | Decided by | What happens |
|---|---|---|
| The current behavior is what the design intends | spec owner ({PO / reporter}) | update the expected-result text to match; close with no code change |
| The quoted expected result stands | dev ({assignee}) | change `{exact surface / route}` to `{concrete target behavior}`; leave `{the parts that already pass}` untouched |

Fix status: new report — no fix delivered yet

Code reference (if known):
- File: path:line
- Root cause: {one sentence} — {Confirmed | Suspected | Unknown} (the cause label of root-cause-investigation.md §4, not the Confidence line)

Environment:
- URL:
- Role / account: {role tag — never a password}
- Browser / viewport:
- Date: YYYY-MM-DD

Evidence (all required — a missing MP4 or screenshot = no bug):
- MP4: {the recording of the failing run, attached to the issue + its shared-storage link in the evidence-link field the workspace project guide names}
- Screenshot: {the failing step, attached and shown inline in the actual result}
- Console / network: {snippet or none}
━━━━━━━━━━━━━━
```

## Block rules

- **Severity / Priority** — the one rule is WORKFLOW Phase A3 (Severity as the reporter gave it, also the title
  bracket; Priority from the matrix cell; anything the matrix cannot place is asked). Cite the cheat-sheet row as
  the matrix's own *Verdict line format* does: line number plus the row text copied character for character, never the file name alone.
- **What happens / What should happen** — keep both headings. The verbatim source quote and its link go
  *inside* What should happen, under the expected bullets; they never replace the section. Every link comes
  from the input or tool output — a missing one is the plain text `link pending from reporter` (no braces), never built from a domain and a key.
  A paraphrase, a feature name or a
  translation is not an expected side; with no quotable source the candidate is a question, not a bug
  (WORKFLOW Refusal-first).
- **Expected source, correct and latest** — every expected line names its AC/EC id and the ticket it comes
  from, with the ticket link, in the form `{expected} — อิงจาก AC_yy/EC_zz จากทิคเกต KEY {link}`. Before
  writing it, search the board for later tickets that changed the same screen or flow (improvements, tasks,
  follow-up stories) and read their AC/EC; cite the one in force and say why on the Latest source check line.
  Also link the bug to that story (`Relates`, or `Blocks` when the bug blocks it).
- **Evidence** — attach **both** the MP4 of the failing run and the screenshot of the failing step to the
  issue, put the MP4's shared-storage link in the evidence-link field the workspace project guide names, and show the screenshot inline in the
  actual result. Either one missing = the candidate is BLOCKED (no evidence), never filed without it.
- **Why failed** — the expected-result line quoted verbatim (the same line as in What should happen) and
  the exact deviation from it, as one observable fact.
- **Resolution options** — both rows, each with a named owner in Decided by; name the exact surface to
  change and the parts that must not change. Never pick an option yourself and never edit the ticket's
  expected-result field (contract §4).
- **Fix status** — a new report has no delivered fix; the line says so, which answers the §5 question
  "is the thing I fixed still broken?" for a new bug.
- **Repro matrix** — one row for **every** entry point that could reach the defect. Mark a path you
  did not try `not tested`; never claim the defect occurs via a path with no evidence row.
- **Steps to reproduce** — copy the steps from the reporter's input or evidence only. Never add, merge
  or "complete" a step yourself; a step that seems missing is a question to the reporter (ask in the A3
  follow-up), never an invented line.

## Title rules

- Lead with the Severity bracket (the reporter's intake value) for Jira/GitHub scanability — never a
  priority you derived.
- Behavioral description — not “Bug in login” alone.
- If the project uses a bracketed tag-prefix convention (e.g. `[Area][Feature][Role]`), put **exactly one
  space** after the closing `]` before the description — never run the text straight onto the bracket.
- Keep it concise **but** complete: enough to know the flow + symptom; drop details that already live in
  dedicated fields (they only duplicate).

## Field formatting

Match the target tracker's own convention when it has one.

- Write **What happens** (actual) as **bullet points — one fact per line**, not a single run-on
  paragraph. Reviewers scan bullets; they skip walls of prose. The source quote inside What should happen stays verbatim.
- **Write for a person, not a log.** Short plain-language sentences a PO or dev understands on first read;
  one fact per bullet; group the description under short headings (summary · cause · what dev must confirm ·
  fix options · code location · related). Use the tracker's emphasis so the key facts stand out —
  **bold** for the symptom and the key numbers, *italic* for quoted UI text and side notes, underline for the
  expected behavior (Jira wiki: `*bold*`, `_italic_`, `+underline+`, `{{code}}`). Keep code paths and raw
  responses in code style, never as the main sentence.
- **Jira rich-text custom fields**: write wiki markup through REST **v2** (or ADF media nodes through v3) so
  `!file.png!` and `!file.mp4!` become an inline image and an inline video player; a v3 plain-string write
  shows them as literal text. Read the rendered field back (`expand=renderedFields`) and confirm an `<img>`
  and the video player are present.
- **Embed the evidence screenshot inline in the actual-result field** when the tracker supports inline
  images (for a new bug create the issue first, attach, then update the body to reference it inline) — not only as a loose attachment — so the
  proof sits next to the claim. Re-render and confirm the image resolved (not a literal `!filename!`).
