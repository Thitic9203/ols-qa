# QA evidence gates (before completion claims)

Adapted from evidence-before-claims discipline for **QA deliverables**. Use with [verify-closing-checklist.md](verify-closing-checklist.md).

## Gate function

Before claiming **passed**, **posted**, **created**, **retest complete**, or **tests done**:

1. **IDENTIFY** — What check proves this? (command, URL re-read, file exists)  
2. **RUN** — Execute it fresh in this session (not an earlier turn)  
3. **READ** — Full output or visible UI state  
4. **MATCH** — Does evidence support the exact claim?  
5. **CLAIM** — State result **with** evidence snippet or path  

Skip a step → treat as unverified.

## Claim → evidence map

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Playwright / tests passed | Test runner exit 0 + summary shows 0 failed for in-scope tests | “Should pass”, prior run, agent said success |
| Playwright failed | Failing test name + log/trace path or screenshot | Vague “broken” |
| Jira comment posted | GET issue or open UI — comment body visible, row count matches draft, **no literal `<br>`/HTML tags**, numbered items on separate lines, CSV attached | POST API 201 only, MCP “success”, unchecked comment |
| Jira transition done | Issue status in UI/API matches target transition | Transition API called once |
| CSV/Excel exported | File exists in workspace + row count = approved table | Wrote path without opening file |
| Retest PASSED | Evidence in comment matches checks in [retest-fix-intake.md](retest-fix-intake.md) plan | Dev said fixed |
| Retest FAILED | Failing check documented with evidence | Assumed still broken |
| Bug created | Issue URL returns title + body matching approved draft | Create API returned id only |
| Coverage review complete | Posted review block with **Ready for draft: YES** + coverage delta | “Looks complete” |
| Environment reachable | URL load or curl returns expected status (not CF block) | VPN “should” work |

## Story-testing evidence-completeness gate (5-step, per story)

Testing a story by its test cases is **not done** until every case carries complete, matching evidence.
Run this gate across the whole story before claiming it tested/complete. **Fail closed** — one red case
means the story is not done. A pass-rate that counts minor-issue verdicts as "passed" is **not** proof of
completeness; only this gate is.

**Evidence rule — by workflow + status (the axis is the workflow, not first-run vs re-run):**

| Workflow / status | Required evidence |
|---|---|
| **Story** test case — PASSED / passed-with-minor / FAILED | whole-flow **MP4** + **one screenshot per Expected-Result item** |
| **Story** test case — BLOCKED | exempt — the precise blocker reason is the deliverable |
| **Retest-bug** (re-verify a fixed bug, not a story run) | whole-flow **MP4** per case — **plus** one screenshot per Expected Result on **text-verification** cases (exact wording/label/message/count/values). Attached to the **Jira issue / comment**, never Google Drive. |

**The 5 steps — all must pass:**

1. **Enumerate** — for each case, read the final Status and count its Expected-Result items (ER1…ERn); derive the required evidence set from the table above. No case is skipped from the count.
2. **Collect** — capture/link every required file: an MP4 for each non-BLOCKED story case + one screenshot per ER item. Never infer an untested ER — capture it or the case is not complete.
3. **Verify each file (not a sample)** — every link resolves (file exists, not trashed); each MP4 plays and is non-blank; each screenshot is non-blank; and every file **matches the exact case** it is filed under. Naming: `<KEY>_TC_<nn>.mp4`, `TC_<nn>-ER_<n>.png`. Count rendered vs required — any shortfall fails that case.
4. **Verdict ↔ bug ↔ remark consistency** — a minor-issue verdict ⇒ a Lowest/Low/Medium bug with its Priority stated in the result; a FAILED ⇒ a High/Highest bug; any minor-issue/FAILED case with **no real linked bug** ⇒ the rollup's "needs recheck / create bug" flag = Yes. Priority is judged only by the [Bug Priority & Severity Matrix](bug-priority-matrix.md) — never invented. The Status opener text matches the rubric, and there is **no Status/Remark contradiction** (e.g. a stale "BLOCKED" note left on a PASSED row).
5. **Gate result (fail closed)** — if any case fails steps 1–4, the story is **NOT done**: capture the missing evidence, fix the verdict/bug flag, clear the stale remark — then re-run the gate. Only when every case passes do you record the per-case proof line and claim the story complete. Never report "100% passed / done" while the gate is red.

## MP4 evidence — 7-layer quality + correctness defense gate (mandatory, fail-closed)

Every MP4 (story test **and** retest) MUST clear all 7 layers before the case counts as done. **Miss any layer and the job cannot be finished — no posting, no transition, no "done".** A clip that looks like a recording but skips a step, cuts off before the target, or is too blurry to read is worse than none — it fakes proof. Re-capture; never wave it through.

| # | Layer | Passes only when |
|:--:|---|---|
| **1** | **Max quality** | Recorded at the **highest resolution/sharpness the harness supports** — viewport ≥ 1080p, `deviceScaleFactor` 2 where available, high bitrate / low CRF, **no downscale that blurs text**. Sharp enough that on-screen labels are legible. |
| **2** | **Whole flow, no skip** | Drives **every** Test Step from the start, on the **real surface** (UI → clicks, not an API shortcut) — no jump-cut, no starting mid-flow, no fast-forward past a step. |
| **3** | **Reaches the stated target** | If a step says "scroll to menu XX / open dialog YY / find item ZZ", the clip **visibly reaches and shows** it — the element is located, brought into view, and acted on. **Never end before arriving**; a step that could not be reached = that case is BLOCKED with the reason, not a short clip claimed as pass. |
| **4** | **Expected Result on screen** | The exact state that decides each ER item is **visible in the video** (the resulting screen/toast/value is shown), not implied by a click. One provable moment per ER. |
| **5** | **Legible / text backed** | Wording, labels, counts, values under verification are **readable in the frame**; if the video cannot render them legibly, a still **screenshot supplements** it (this is the text-verification screenshot rule). |
| **6** | **File integrity + match** | Plays start-to-end, **non-blank, non-truncated**, sane duration, correct naming (`<KEY>_TC_<nn>.mp4`), and is the clip for **that exact case** — not another case's. |
| **7** | **Attached + link verified** | Uploaded to the destination (story → Drive; **retest → the Jira issue/comment**) and the reference **actually resolves and plays** from there (open the Jira Evidence-cell link / the Drive file and confirm it plays). |

**Fail-closed:** any layer red on any case ⇒ re-capture that case and re-run the 7 layers. Do not post the comment, do not transition, do not report the story/retest complete until every case is green on all 7.

## AC/EC & bug-detail coverage — 7-layer completeness defense gate (mandatory, fail-closed)

**The scope of what must be tested is the ticket's own contract — every Acceptance Criteria, every
Expected Condition / Expected Result line, and (for a retest) every item of the bug's Expected Result
plus each bullet of the bug's own detail/steps. The job is not done until every one of those items is
tested AND appears as its own row in the results/verdict table with its own verdict + evidence.** A
point that was worth noticing is worth a row — it is **never** acceptable to mark a case PASSED on
partial coverage and mention the untested/failing item in a remark, a "หมายเหตุ", a note under the
table, or in chat. Coverage is proven by rows in the table, not by prose beside it.

Run all 7 layers per ticket. Layers 1–2 run **while building the test plan** (before the confirm gate
/ before execution); layers 3–5 run **during execution, per item**; layers 6–7 run **before any
summary, verdict, post, transition, or "done"**.

| # | Layer | Passes only when |
|:--:|---|---|
| **1** | **Enumerate the full scope** | Every testable item in the authoritative contract is extracted **char-exact** and given a stable id — the ticket's Acceptance Criteria (`AC1…`), every Expected Condition / Expected Result line (`EC1…` / `ER1…`), and for a **retest** every item of the bug's Expected Result field **plus** each bullet of the bug's detail/steps. **Extract assertions embedded in prose too**, not only bulleted lines — a paragraph "the user can X and the count updates" is two items. **Completeness self-check (the gate is only as strong as this layer):** re-read the AC/EC source **end-to-end** and confirm no testable assertion is missing from the list — under-enumeration here passes layer 6 silently because layer 6 only reconciles against what was enumerated. This numbered list is the coverage baseline: nothing tested-or-reported lives outside it, and no item in it is silently dropped. |
| **2** | **Map 1:1 to rows — no orphan, no bundling** | Every enumerated id maps to **≥1 row** in the test plan / verdict table (build the coverage matrix `id → row #`). An enumerated id with **no row** = a coverage gap → stop and add the row. A **compound** AC ("does A **and** B **and** C") splits into **one checkable row per clause** — never one row claiming three behaviours it only touched one of. |
| **3** | **Execute each on its real surface** | Every enumerated id is **actually exercised and observed** — never inferred from a sibling item, never assumed-covered because "the happy path passed". An id you could not reach is an **explicit BLOCKED row** with the reason + who/what is needed — never quietly left off the table. |
| **4** | **Row, never a remark (anti-footnote)** | Every enumerated id's result is its **own table row** carrying a verdict + evidence cell. It is **forbidden** to record an AC/EC/bug-detail observation **only** in a remark / "หมายเหตุ" / note below-or-beside the table / a trailing paragraph / chat-only. A remark may add context **to** a row; it may **never** be the sole place an AC/EC item is recorded. If it deserves a mention, it deserves a row. |
| **5** | **Verdict integrity — partial coverage ≠ PASS** | A case/scenario/retest is **PASSED only when every id it covers met its expected** (char-exact where wording is specified). A covered id **not yet observed / not reached** cannot make the case PASS — its honest status is **BLOCKED** (or go re-test it), **never a product FAILED**: an untested item is a coverage gap, not a defect ([Bug Priority & Severity Matrix](bug-priority-matrix.md)). A covered id **observed to differ** from its expected = a **FAILED / PWMI row for that point**, severity judged only by the [matrix](bug-priority-matrix.md) — never a PASS with the exception hidden in a remark. Either way, "works except one point" is a **row**, not a footnote on a green case. |
| **6** | **Reconcile the count before "done"** | Before any summary / verdict / post / external write: `enumerated in-scope ids == rows carrying a verdict + evidence (or an explicit BLOCKED reason)`. **Every id appears as a row; no id lives only in a remark; no row is verdict-less; no id is left `NOT TESTED`.** The **only** id allowed off the table is one **explicitly excluded from scope at the confirm gate** — and it is listed in a visible **Out-of-scope** block, never silently dropped. Any other shortfall fails the gate. |
| **7** | **Fail-closed = not complete** | Layer 6 not green ⇒ the story/retest is **NOT complete**: do **not** report "PASSED" / "100%" / "complete", do **not** proceed to the external results update / Jira transition / notify, do **not** close the session. Return to the first unmet layer — add the missing row, run the untested id, re-verdict the partial case — then re-run from layer 1. Partial AC/EC coverage is a **stop condition**, not a remark. **Unattended / bot mode:** resolve instead of halting — an unrun or unreachable id becomes a **BLOCKED row** with its reason, and the case/story is reported **incomplete / not-all-passed**; a bot **never** silently marks it PASSED or drops the id. |

**Fail-closed:** any layer red ⇒ close the gap and re-run the gate. A case reported PASSED whose AC/EC
list is only partially rowed-and-verdicted is treated as **not done**, no matter how the untested item
was footnoted.

### Coverage red flags — STOP, you are about to pass on partial coverage

- "The main flow passed, this one AC is edge-casey" → it is still a row. Test it or BLOCK it, don't drop it.
- "I'll just note the remaining point in the remark / หมายเหตุ" → the point is a **row**, not a note.
- "AC says A and B and C; I checked A, close enough" → one row per clause; B and C are untested until rowed.
- "It's covered by another case" → then cite that case's row; an id with no row anywhere is uncovered.
- "PASSED with a minor caveat below the table" → partial coverage/deviation is a FAILED/PWMI row, not a caveat.
- "Enumerated 9 items, table has 6 rows, but the summary reads complete" → 6 ≠ 9 → not done. Reconcile first.

**All of these mean: add the row (or a BLOCKED row), give it a verdict + evidence, then re-run layer 6.**

## Wording red flags

Do not use without fresh evidence in the **same** turn:

- should, probably, seems, likely, I believe  
- Done!, Perfect!, Great!, Successfully! (before gate 5)  
- Posted (without URL re-read)  
- All tests pass (without runner output)

## Workflow pointers

| Workflow | Extra gate |
|----------|------------|
| TC FE / API | Coverage review YES + delta before full draft; TC FE also requires Step 7.5 four-axis final report **PASS** before close |
| Testing ticket | [playwright-preflight.md](playwright-preflight.md) YES before run; F1–F3 before external update |
| Retest | Plan posted before execute; v2/v3 format locked |
| Create bug | Phase C confirm before create; URL verify after |
