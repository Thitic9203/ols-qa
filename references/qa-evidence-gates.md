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
