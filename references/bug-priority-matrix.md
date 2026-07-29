# Bug Priority & Severity Matrix

The authoritative source for judging a bug's **Priority** in every OLS QA verdict. **Always follow
this matrix — never invent a severity or priority notion, never guess ("ยึดหลักนี้เสมอ ไม่มโนเอง").**
When a defect's priority is unclear, cite the matching row/column below; if nothing here answers it,
say so and ask rather than assume.

## Source of truth

Source of truth: Bug Priority & Severity Matrix — Confluence (space `<CONFLUENCE_SPACE>`, page id in
`~/.ols-qa-secrets/ols-secrets.md` § Confluence). This file is a verbatim transcription of that page's
table. If the two ever disagree, Confluence wins — re-sync this file, don't patch around the gap.

## How to read the matrix

Two different axes:

- **Severity** (rows: Low / Medium / High / Urgent) — describes the defect's functional/business impact.
- **Priority** (columns: Lowest / Low / Medium / High / Highest) — the field actually recorded on the
  Jira bug, and the one the verdict rubric keys off.

Find the cell whose example text best matches the observed defect. The **column** it sits in is the
bug's Priority. `N/A` cells are not valid combinations — a Low-severity defect is never Highest
priority, and an Urgent-severity defect is never Lowest/Low priority.

## The matrix

| Severity ↓ \ Priority → | Lowest | Low | Medium | High | Highest |
|---|---|---|---|---|---|
| **Low** | N/A | Cosmetic issues (typos, minor UI misalignment) | Minor feature glitches that don't block workflow | Rarely used feature broken | N/A |
| **Medium** | N/A | Minor calculation or display error | Optional feature not working | Feature issue affecting some users | Security warning in minor feature |
| **High** | N/A | Major feature affected but workaround exists | Functionality problem affecting several users | Core functionality affected; partial outage | System crash for some users |
| **Urgent** | N/A | N/A | Critical feature partially broken | Core system failure affecting most users | Complete system outage, data loss, or security breach |

## Matrix → Priority → verdict cheat-sheet

Every populated cell above, reduced to a lookup: match the defect's description, read off its
Priority, then its verdict.

| If the defect reads like… | Priority | Verdict |
|---|---|---|
| cosmetic / typo / UI misalignment | Low | **PWMI** |
| minor calculation or display error | Low | **PWMI** |
| major feature affected **but a workaround exists** | Low | **PWMI** |
| minor glitch that does **not** block the workflow | Medium | **PWMI** |
| **optional** feature not working | Medium | **PWMI** |
| functionality problem affecting **several** users | Medium | **PWMI** |
| critical feature **partially** broken | Medium | **PWMI** |
| rarely-used feature **fully** broken | High | **FAILED** |
| feature issue affecting **some** users | High | **FAILED** |
| core functionality affected / partial outage | High | **FAILED** |
| core system failure affecting **most** users | High | **FAILED** |
| security warning in a minor feature | Highest | **FAILED** |
| system crash for some users | Highest | **FAILED** |
| complete outage / data loss / security breach | Highest | **FAILED** |

Rule of thumb: **workaround exists · cosmetic · optional · "several"** → ≤Medium → **PWMI**.
**broken-for-its-users · core · crash · "some" · security · data-loss** → High+ → **FAILED**.

## Hard rule

**Verdict Priority is judged ONLY by this matrix — never invent a severity notion.**

- **PWMI** (PASSED WITH MINOR ISSUE) = the case carries a **Lowest / Low / Medium** bug — state the
  Priority in the write-up.
- **FAILED** = ONLY when the case hits a **High / Highest** bug.
- A **coverage gap is not a defect** — it is not evidence of any Priority. Re-verify; if nothing
  reproduces, the case is PASSED, with the caveat noted in the Actual Result.
- **When unsure, cite the matrix row — don't guess.** Never leave a Low/Medium defect as FAILED, and
  never leave a High/Highest defect as PWMI.
- BLOCKED and SKIPPED are unrelated to this matrix (they are not verdicts about a bug's priority) —
  see local agent memory `feedback_verdict-rubric` for the full rubric.

## Used by

- [CLAUDE.md](../CLAUDE.md) § Bug priority = the matrix, never invented
- [testing-ticket-workflow/WORKFLOW.md](../skills/deprecated/testing-ticket-workflow/WORKFLOW.md) Phase F3
- [retest-bug-workflow/WORKFLOW.md](../skills/deprecated/retest-bug-workflow/WORKFLOW.md) Step 2
- [qa-evidence-gates.md](qa-evidence-gates.md) § Story-testing evidence-completeness gate, step 4
- Local agent memory `feedback_verdict-rubric`
