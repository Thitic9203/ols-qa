# TC FE prep — MUST / NEVER

Binding rule table for [WORKFLOW.md](../WORKFLOW.md). Every row applies on every run; the step text in WORKFLOW.md, requirement-gates.md and design-and-review.md is the procedure, this table is the checklist of what must never slip.

Shared rules: [shared-must-never.md](../../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST refuse without story key/URL | No traceable AC/EC source |
| MUST NOT comment on sub-tasks or other issues | Scope is one story |
| MUST NOT add TC outside story AC/EC | Traceability |
| MUST write all TC content in Thai (Step 3b) — there is no English-only mode | Workspace standard; English mode is not offered for FE TC |
| MUST re-fetch the TC glossary from its published sheet at Step 2.6 every run, and post the source URL, row count, and diff in chat before designing TCs | The team edits the sheet between runs; a cached CSV is not evidence of the current words |
| MUST treat the glossary as the first authority for Thai wording — above the Step 3b fallback table, above remembered wording, above the UI-label exception | Two sources of truth guarantee drift; the sheet is the one the team maintains |
| MUST NOT normalise, spell-fix, dedupe, or sort `{GLOSSARY_CSV}` (local CSV path from the project guide § TC glossary, requirement-gates Step 2.6.1) — it is a verbatim mirror; typos are fixed in the sheet by its owner | A CSV that differs from the sheet is a silent drift bug |
| MUST stop and ask the user when a glossary Thai cell is empty, or when one English key carries conflicting Thai meanings across rows | The agent has no authority to coin project terminology |
| MUST NOT write a guessed term and tag it "provisional", "pending confirmation", or "documented fallback" instead of asking | Tagging a guess is not asking; the guess still reaches the deliverable |
| MUST use ราชบัณฑิตยสภา approved Thai term first (Step 3b); fall back to English only when no official term exists or the UI label is English | Authoritative Thai is more professional than ad-hoc transliteration or unnecessary English |
| MUST post the Step 4.5 Thai↔English term table and get user confirmation BEFORE writing any TC content to a deliverable file — the Step 4f reviewer working draft, outside the repo, is the only exception | User must approve term choices before they are committed to the real TC file |
| MUST use formal Thai language level throughout | TCs are delivered to internal and external teams |
| MUST keep Type to exactly `System Test` / `Unit Test` / `Integration Test` (Step 3d) | These are the project's Qase Type values; other values break import |
| MUST set Status = `Done` on every Qase CSV row | Workspace rule for the project's Qase import |
| MUST inspect the project's existing Qase suites and reuse a fitting one; create a new suite only with user approval and never a duplicate | Duplicate/colliding suites corrupt the existing Qase tree |
| MUST verify the project's Qase Type and Status options exist before import (Step 6 suite gate; method in [qase-import-format.md](qase-import-format.md) — Field option values); stop and tell user if a value is missing | Qase silently resets unknown Type/Status values on import |
| MUST produce both `Draft_Jira_{ISSUE_KEY}.csv` (Jira 10-col schema) and `Import_Qase_{ISSUE_KEY}.csv` (Qase schema) | Two different audiences: comment table consumers and Qase importers |
| MUST upload both CSV files before posting the comment; embed both as footer links | Footer must have two clickable download lines — one per file |
| MUST use simple sequential numbers (1, 2, 3) as TC IDs in all outputs — no prefix, no padding, do not ask user | Fixed workspace standard |
| MUST sort Jira comment + Draft_Jira CSV + Import_Qase CSV by Type first (Unit Test → Integration Test → System Test), then ACs ascending, then ECs ascending within each Type group; TC IDs run continuously 1, 2, 3 across whole file (Step 3e) | All three outputs share the same Type-first ordering for consistency |
| MUST NOT invent Type test cases that lack an AC/EC trace | Type is a label on existing coverage, not a reason to add out-of-scope rows |
| MUST add Remark block for any Type with zero test cases | Makes coverage gaps explicit rather than silently absent |
| MUST NOT reference agent-machine absolute paths in Jira | Other users cannot reproduce |
| MUST run Step 2.5 conflict check before designing TCs | Contradictions between ticket and PRD/Figma invalidate TCs built without resolution |
| MUST ask for PRD/Figma links if not found in ticket (Step 2.5a) | Cannot cross-reference without sources; one question covers both at once |
| MUST collect last-updated datetime for each source before comparing (Step 2.5b) | Recency determines which source is stronger truth; without it the recommendation is guesswork |
| MUST convert all datetimes to Bangkok time (ICT, UTC+7) before displaying | User's working timezone is Bangkok; raw UTC or platform timestamps cause confusion |
| MUST format datetimes as `DD Mon YYYY HH.MM AM/PM` (e.g. `11 Dec 2026 11.45 AM`) | Consistent, readable format agreed with user |
| MUST show "Newer source (ICT)" column with datetime per conflict row in the report | User needs to know which version to trust and exactly how much newer it is |
| MUST NOT start Step 3 while conflicts from Step 2.5 are unresolved | Designing TCs on contradictory requirements creates rework |
| MUST generate the Step 2.5d pre-draft review HTML and post its one-line chat notice even when no conflicts found | Gives user visibility that cross-check was done |
| MUST run Step 4 review before the Step 5 HTML draft | Prevents out-of-scope cases reaching Jira |
| MUST run the Step 4 review as a LOOP that exits only on a clean (zero-comment) round — no fixed 2-round cap — and MUST run the Step 4f independent reviewer-agent pass (≥2 reviewers per round for a thorough/"superpowers" request) | One or two passes can still leave fabricated/uncovered cases; the exit condition is a clean round, not a round count |
| MUST report the verdict of EVERY review round to the user as it finishes (round number + CLEAN/defects + fixes applied) — never batch rounds into one summary, never go silent between rounds | The user must always know a round ran and what it found; silent multi-round work reads as a stalled session |
| MUST apply tc-quality-standards on every row | ISTQB / 29119-3 consistency |
| MUST convert `<br>` to Jira-native line breaks before posting (see [jira-linebreak-conversion.md](../../../../references/jira-linebreak-conversion.md)) | `<br>` renders as literal text on Jira |
| MUST pass post-publish review ([jira-comment-post-review.md](../../../../references/jira-comment-post-review.md)) before reporting "commented" or "done" to user | Prevents false success claims with broken formatting |
| MUST post Step 7.5 final review report ([tc-final-review-report.md](tc-final-review-report.md)) with overall **PASS** before Step 8 or any "TC prep complete" message | User receives certified four-axis review of final TC |
| MUST attach CSV/Excel to Jira issue when file was generated (not just workspace) | User expects downloadable file on the issue |
| MUST NOT use `\n` inside markdown table cells of the Step 6 `{ISSUE_KEY}_FE_TC.md` file — use `<br>` | Breaks table row in markdown renderers |
| MUST generate a typed CSV for each Type that has TCs — no user selection needed; skip if a Type has zero TCs | Only Types with actual TCs produce a deliverable file |
| MUST filter TCs by Type into each typed CSV: Type = `Unit Test` → Unit_Test; `Integration Test` → Integration_Test; `System Test` → System_Test | Each template's audience expects only its own test type |
| MUST map Jira draft columns to each template's columns per Step 6 mapping tables — derive values for columns with no direct source; only execution-result columns (Actual Result, Test status, Test Date, Test By, ผลการทดสอบ, วันที่ทดสอบ, ผู้ทดสอบ) are left blank | Column names differ between Jira and typed templates; all non-execution columns must have correct content |
| MUST use ticket title/feature name as Function and Services Impacted as Sub Function in Unit_Test CSV | Unit Test template requires Function/Sub Function grouping structure |
| MUST skip typed CSV for a Type that has zero TCs — do NOT generate an empty file | Empty files are not useful deliverables |
| MUST add a note line in the Jira comment for each skipped type: `ไม่มี TC ประเภท [type] สำหรับ ticket นี้` | User must know explicitly that the type was absent, not silently missing |
| MUST upload only generated typed CSVs to Jira; embed footer links only for uploaded files (after Draft_Jira + Import_Qase) | No broken or phantom links |
| MUST append disclaimer as last line of comment after all attachment links — exact text, no translation | Required quality gate for all TC FE deliverables |
| **MUST NOT drop any required comment element when regenerating or re-posting** — every rebuild MUST include: (1) table with all TC rows, (2) Attachments heading + all file links, (3) Remark block when Figma/PRD absent or any Type has zero TCs, (4) Disclaimer as last line. Run pre-publish re-check table before every post. Fixing TC text ≠ permission to omit the rest. | Partial rebuild silently loses mandatory elements — user must not discover missing content by inspection |
| MUST NOT invent or paraphrase AC/EC labels or criterion text anywhere in any CSV — use verbatim text from the ticket only | Invented AC/EC creates false traceability and corrupts test coverage records |
| MUST run Step 2a AC/EC internal consistency check after Step 2 and before Step 2.5 | Duplicate/redundant/contradictory AC/EC within the ticket wastes TC effort or produces conflicting test cases |
| MUST include Step 2a results in the pre-draft review HTML even when no issues found | Gives user visibility that the check was done |
| MUST NOT proceed to Step 3 while Step 2a issues are unresolved | TC design on inconsistent AC/EC creates rework |
| MUST follow user's decision on how to handle flagged AC/EC (skip, draft all, fix first) | User owns the AC/EC scope — AI does not unilaterally remove or merge items |
| MUST set Test Status = `BLOCKED` on every case whose spec is uncertain, with a per-row Remark naming actor (**the QA Owner goes and contacts**), contact target, topic, and unblock condition (Step 4e) — never guess, never leave an uncertainty out of the sheet | A guessed TC produces a false verdict; an unattributed "waiting" remark means nobody acts on it |
