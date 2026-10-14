# Defect candidates — NOT filed (output template)

The one shape for reporting defects a round found **without filing them**. Used by
testing-ticket (Phase F3), retest-bug (result quality gate) and review-result. The rules that decide
*which* rows qualify live in [result-quality-gate.md](../result-quality-gate.md) § *Required output
when the round finds defects*; this file is only the output shape.

## Template

Copy as-is. One row per ER point. Never bullets, never prose.

```text
**Defect candidates — NOT filed**   (Thai report heading: **ผลที่อาจเป็นบั๊ก — ยังไม่ได้เปิดบั๊ก**)
| Ticket | TC / ER point | Actual | Expected (what correct looks like) | Requirement reference (char-exact) | Evidence | Root cause | Confidence | Priority | Status |
|---|---|---|---|---|---|---|---|---|---|
| {ISSUE_KEY} | TC_nn · ER_n | <what the screen showed> | <correct behaviour> | <SOURCE_ID>: "<verbatim quote>" | <still>.png + <clip>.mp4 (verify ✔) + <clip>.capture.json | <PATH>:<LINE> | <Confirmed / Suspected / Unknown — not investigated> | <Lowest…Highest> — bug-priority-matrix.md:<LINE> | Not filed yet |

**Needs PO decision**   (spec conflict, or expected side not confirmed — the case stays BLOCKED)
| Ticket | TC / ER point | Source A (char-exact) | Source B (char-exact) | Observed | Question for PO |
|---|---|---|---|---|---|

Open bugs for the <N> candidate(s) above? (Yes → create-bug for all · Choose rows · No)
```

## Rules

- Every cell is filled, or holds `—` plus the reason it is empty.
- One row is one physical line — no line break inside a cell.
- **Status** is always `Not filed yet` (Thai report: `ยังไม่ได้เปิดบั๊ก`) until the owner says to file.
- **Confidence** describes the root cause (the E2 label), not how sure you feel about the defect.
- **Priority** comes only from [bug-priority-matrix.md](../bug-priority-matrix.md): the cheat-sheet
  row's line number plus its text.
- A row whose expected side carries a hedge, or whose source was not opened, goes to **Needs PO
  decision** — never to the candidate table.
- **The owner question is fixed wording**, always the last line of the report, and only when the
  candidate table has at least one row. Filing starts only after a live "Yes" or a chosen set of rows
  from the owner; then it goes through the bug-filing workflow.
- An empty candidate table is not printed; write `Defect candidates — NOT filed: none` instead and
  skip the question.

## Example

Input (one result line plus the sources already opened):

```text
TC_05 ER_2 FAILED · observed h1 = "<LABEL_B>" · AC_02 says "<LABEL_A>" · design node <NODE_ID> text "<LABEL_A>" · clip TC_05.mp4 verify ✔ · cause <PATH>:<LINE> (Confirmed) · matrix row "cosmetic / typo / UI misalignment" (bug-priority-matrix.md:52)
```

Output:

```text
**Defect candidates — NOT filed**
| Ticket | TC / ER point | Actual | Expected (what correct looks like) | Requirement reference (char-exact) | Evidence | Root cause | Confidence | Priority | Status |
|---|---|---|---|---|---|---|---|---|---|
| {ISSUE_KEY} | TC_05 · ER_2 | Heading shows "<LABEL_B>" | Heading shows "<LABEL_A>" | AC_02: "<LABEL_A>" · node <NODE_ID>: "<LABEL_A>" | TC_05_er2.png + TC_05.mp4 (verify ✔) + TC_05.capture.json | <PATH>:<LINE> | Confirmed | Low — bug-priority-matrix.md:52 | Not filed yet |

Open bugs for the 1 candidate above? (Yes → create-bug for all · Choose rows · No)
```

Anti-example (what drifted before): the same finding written as a bullet — `- TC_05: heading
wrong, probably a bug` — with no table and no owner question. That output fails this template.
