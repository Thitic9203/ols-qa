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

1. **Enumerate** — for each case, read the final Status, count its Expected-Result items (ER1…ERn), **and list every role the case names** (§ *Capture scope*); derive the required evidence set from the table above. The required set is **cases × roles**, not cases. No case and no named role is skipped from the count.
2. **Collect** — capture/link every required file: an MP4 for each non-BLOCKED story case **per role** + one screenshot per ER item per role. Never infer an untested ER or an unexercised role — capture it, or it is a BLOCKED row with its reason; it is never complete by assumption.
3. **Verify each file (not a sample)** — every link resolves (file exists, not trashed); each MP4 plays and is non-blank; each screenshot is non-blank; and every file **matches the exact case** it is filed under. Naming: `<KEY>_TC_<nn>.mp4` / `TC_<nn>-ER_<n>.png`, with the role appended when the case covers more than one (`<KEY>_TC_<nn>_<ROLE>.mp4`, `TC_<nn>_<ROLE>-ER_<n>.png`). Count rendered vs required — any shortfall fails that case.
4. **Verdict ↔ bug ↔ remark consistency** — a minor-issue verdict ⇒ a Lowest/Low/Medium bug with its Priority stated in the result; a FAILED ⇒ a High/Highest bug; any minor-issue/FAILED case with **no real linked bug** ⇒ the rollup's "needs recheck / create bug" flag = Yes. Priority is judged only by the [Bug Priority & Severity Matrix](bug-priority-matrix.md) — never invented. The Status opener text matches the rubric, and there is **no Status/Remark contradiction** (e.g. a stale "BLOCKED" note left on a PASSED row).
5. **Gate result (fail closed)** — if any case fails steps 1–4, the story is **NOT done**: capture the missing evidence, fix the verdict/bug flag, clear the stale remark — then re-run the gate. Only when every case passes do you record the per-case proof line and claim the story complete. Never report "100% passed / done" while the gate is red.

## Capture scope — every role, every step, every target the ticket names

**The capture is scoped by what the ticket says, not by what was convenient to record.** Read the case
(and the task/bug detail it belongs to) *before* recording and extract three lists; each one dictates
files that must exist.

| List | Extract from | Evidence consequence |
|---|---|---|
| **Roles** | every role / persona / account named in the case, its Precondition, the task or bug detail, or the AC/EC lines | **one full capture set per role** — a role named is a role recorded |
| **Steps** | the case's Test Steps, in written order | every step is visibly performed on screen in that role's clip |
| **Targets** | the exact element or value each Expected Result decides (menu, dialog, badge, count, label, toast, field value) | the clip **navigates/scrolls to it and holds it in frame long enough to read**, and it is captured as its own still |

**Roles — one set each, no sampling.** If the ticket mentions 5 roles, the deliverable is **5 capture
sets**, not one clip from whichever account happened to be logged in. A role's set = its own whole-flow
MP4 + its own screenshot per Expected-Result item, named so a reviewer can tell them apart
(`<KEY>_TC_<nn>_<ROLE>.mp4`, `TC_<nn>_<ROLE>-ER_<n>.png`). Roles are written with the canonical
identifiers — `GUEST · LEARNER · CREATOR · CONTENT_ADMIN · SYSTEM_ADMIN` — **copy-pasted, never typed
from memory** (PM-008). A role that could not be exercised (no account, login fails) is an explicit
**BLOCKED row naming that role and the reason** — never an unmentioned gap, and never "covered by
another role".

**Steps — the clip follows the written steps, it does not shortcut to the end.** Driving the real
surface is [test-through-real-steps.md](test-through-real-steps.md); this file adds that the recording
must *show* it. A step performed off-camera (an API call, another tab, a state set before recording
started) is **not captured** — re-record with it in frame, or state it as a precondition line and keep
the recorded steps intact.

**Targets — go to the thing, then look at it.** "Check the count in the summary panel" means: scroll
that panel into view, let it settle, and keep it in frame long enough for the number to be read.
A value that never appears on screen was never verified. Where the video cannot render it legibly
(small text, a toast that flashes), a still of that exact moment is **required**, not optional.

### Capture red flags — STOP, this recording is not evidence yet

- "The flow obviously works, I can stop the recording here" → the clip must **reach the ER moment**. Stopping before it = that ER is uncaptured, whatever the flow looked like.
- "I couldn't find the menu, but the feature is fine" → unreached target = **BLOCKED row with the reason**, never a short clip presented as a pass.
- "One role is representative of the others" → every named role has its **own** set. Sameness is a claim, and a claim needs its own evidence.
- "The toast appeared, I saw it happen" → if it is not in the frame, it is not evidence.
- "The value is right in the API response / the DOM" → the case verifies the **screen**. Scroll to it and show it.
- "I'll note in the remark that step 4 wasn't recorded" → a remark is not a capture (same rule as the anti-footnote layer below).

## MP4 evidence — 7-layer quality + correctness defense gate (mandatory, fail-closed)

Every MP4 (story test **and** retest) MUST clear all 7 layers before the case counts as done. **Miss any layer and the job cannot be finished — no posting, no transition, no "done".** A clip that looks like a recording but skips a step, cuts off before the target, or is too blurry to read is worse than none — it fakes proof. Re-capture; never wave it through.

| # | Layer | Passes only when |
|:--:|---|---|
| **1** | **Max quality** | Recorded to the **capture spec below** — viewport ≥ 1920×1080, `deviceScaleFactor` 2, H.264 **CRF 18 preset slow**, `yuv420p` limited-range, `+faststart`, **no downscale that blurs text**. On-screen labels legible at 100%. |
| **1b** | **Steady picture** | No frozen frame inside a moving stretch, and no visible flicker / pumping / stutter / blink when watched at 100%. **≤ 5% of moving frames may be repeats** of their predecessor (excluding deliberate still-holds). |
| **1c** | **Provenance** | The clip came from the capture pipeline below at the rate it claims — a run manifest exists, names the pipeline `cdp-screencast->x264`, and matches the delivered file (name · resolution · fps). **ตรวจไม่ได้ = ไม่ผ่าน**: no manifest = layer red, not a waiver. |
| **2** | **Whole flow, no skip** | Drives **every** Test Step from the start, on the **real surface** (UI → clicks, not an API shortcut) — no jump-cut, no starting mid-flow, no fast-forward past a step. |
| **3** | **Reaches the stated target** | If a step says "scroll to menu XX / open dialog YY / find item ZZ / check value VV", the clip **visibly reaches and shows** it — the element is located, scrolled into view, held in frame long enough to read, and acted on. **Never end the recording before arriving**; a step that could not be reached = that case is BLOCKED with the reason, not a short clip claimed as pass. |
| **4** | **Expected Result on screen** | The exact state that decides each ER item is **visible in the video** (the resulting screen/toast/value is shown), not implied by a click. One provable moment per ER. |
| **5** | **Legible / text backed** | Wording, labels, counts, values under verification are **readable in the frame**; if the video cannot render them legibly, a still **screenshot supplements** it (this is the text-verification screenshot rule). |
| **6** | **File integrity + match** | Plays start-to-end, **non-blank, non-truncated**, sane duration, correct naming (`<KEY>_TC_<nn>.mp4`), and is the clip for **that exact case** — not another case's. |
| **7** | **Attached + link verified** | Uploaded to the destination (story → Drive; **retest → the Jira issue/comment**) and the reference **actually resolves and plays** from there (open the Jira Evidence-cell link / the Drive file and confirm it plays). |

**Fail-closed:** any layer red on any case (sub-layers 1b / 1c included) ⇒ re-capture that case and re-run the 7 layers. A clip that is the right size in the right codec can still flicker — 1b and 1c exist because one that passed every other check was visibly flickering. Do not post the comment, do not transition, do not report the story/retest complete until every case is green on all 7.

### Capture spec — the pipeline layers 1 / 1b / 1c are measured against

Ported verbatim from the reference recorder (`manual-maker` `skills/screen-record`, v0.35.0), whose
clips are the quality bar. Every number below was **measured on real clips**, not chosen by taste —
changing one changes what "same quality as the reference" means.

**🔴 Playwright's own `recordVideo` is banned for any deliverable clip.** Two defects are built into
it and **neither is reachable from its API**:

| defect | mechanism | what the viewer sees |
|---|---|---|
| **Bitrate cap** | playwright-core spawns ffmpeg hardcoded `-c:v vp8 -qmin 0 -qmax 50 -crf 8 -deadline realtime -speed 8 -b:v 1M -threads 1` — **1 Mbps for 1920×1080**. Whenever the page moves, rate control slams the quantiser and the whole frame goes soft, then snaps back. Measured: mean edge energy 1733 static vs 1529 moving (−11.8%), worst frame −37%. | the picture **กระพริบ** — sharp/soft/sharp |
| **Fixed-grid padding** | its `writeFrame` quantises onto a 40 ms grid and fills every delivery gap by **repeating the previous frame**. Measured: 46% of a delivered clip's frames were duplicates. | **judder** |

The machine was never the bottleneck — that was tested, not assumed: driving the screencast directly
on the same machine, same 1920×1080 viewport, `deviceScaleFactor` 2, on a *heavier* page gave **59.8
fps, median gap 17 ms**. Lowering `deviceScaleFactor` fixes nothing (dsf 1 measured 58.9 fps — inside
the noise) and makes every still blurrier.

**Required pipeline — capture the frames yourself, encode once:**

1. **Frames over CDP** — `Page.screencastFrame` as JPEG (quality **92**; the only lossy step before the final encode), written to a scratch dir **with their real browser timestamps**.
2. **ACK first, write after** — Chrome sends nothing further until a frame is acked. Acking before touching the disk is what holds the browser at full rate however slow the disk is; the opposite coupling is exactly why the built-in recorder starves.
3. **Nothing is thinned** — keep **every** frame the browser sends; let the encoder do the rate conversion. A "keep only if `t - lastKept >= 1/fps`" filter **aliases**: on a page delivering ~31 fps (median gap 22 ms) it dropped every second frame → **15.4 fps, worse judder than the bug it was meant to fix**. Bound the disk, never the frame rate.
4. **One encode, after the run** — no realtime deadline, no bitrate ceiling. This also deletes a whole lossy generation: JPEG → x264, instead of JPEG → VP8@1Mbps → x264.

```
ffmpeg -y -f concat -safe 0 -i frames.txt \
  -fps_mode cfr -r 25 \
  -vf scale=in_range=full:out_range=limited \
  -c:v libx264 -crf 18 -preset slow \
  -pix_fmt yuv420p -color_range tv \
  -movflags +faststart out.mp4
```

The concat demuxer carries each frame's **measured** duration, so `-fps_mode cfr` lays frames on the
output grid at the times they actually happened. The range conversion is **not decoration**: screencast
JPEGs are full-range, so a plain `-pix_fmt yuv420p` still comes out tagged `yuvj420p` — crushed blacks
in players that ignore the tag. `scale=in_range=full:out_range=limited` *converts* the levels (rather
than relabelling them, which would shift every tone) and `-color_range tv` records what was done.

**Fail-closed at record time — a starved capture is never shipped:**

- achieved **unique fps ≥ 0.8 × target fps** — under it, the run dies; the clip would judder. **Never raise the floor to go green**; lower the target fps to a rate the machine can hold, or close other heavy work and re-run.
- scratch budget hit ⇒ the clip is **cut short** ⇒ do not ship it.
- any frame that failed to write ⇒ red.
- the run writes a **manifest** (rate, gap distribution, encoder args, still-holds) next to the clip — that is what layer 1c is checked against, so "it looked fine" is never the evidence.

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

## Pre-delivery completeness — 7-layer defense gate (before handing results to the requester)

**The last gate. It runs after the other gates, immediately before anything leaves your hands** — the
Jira comment, the results sheet write, the Discord notify, or simply telling the requester the round is
done. Its job is one question: *is what I am about to hand over actually complete, or does it merely
look complete?*

**The bar is an adversarial reviewer, not a friendly one.** Judge the deliverable as if a second QA —
or another AI given the ticket, the deliverable and nothing else — has been told: *"find where this
was cut short."* Every layer below therefore names the attack it must survive. A layer is green only
when the attack **fails against the artifacts as delivered** — not when you personally remember doing
the work. **Fail-closed: any layer red means nothing is delivered yet.**

| # | Layer | Passes only when | Reviewer attack it must survive |
|:--:|---|---|---|
| **1** | **Recount the scope from the source, this round** | Reopen the ticket / case / bug **now** and re-extract the three lists (roles · steps · AC-EC-ER ids) plus the case list itself. The deliverable is measured against **that** list, not against the plan written earlier in the session — a plan can be stale, the ticket cannot. Any item present in the source and absent from the deliverable is a gap, not a judgement call. | *"I read the ticket and counted 9 testable items; your table has 7. Which two are missing and why?"* — you must be able to answer with the same count they get. |
| **2** | **Role × case matrix is full** | Every (role, case) pair required by layer 1 carries a row with its own verdict. **No empty cell, no cell inheriting another role's result**, no role quietly dropped. A pair that could not be run is a **BLOCKED row naming the role and the blocker** — visible in the deliverable, not in chat. | *"The ticket names 5 roles. Show me the 5 evidence sets. If one is missing, show me the BLOCKED row that says so."* |
| **3** | **Open every evidence file, not a sample** | For each row: the link resolves, the MP4 plays and is non-blank, it is **that case and that role**, and the ER moment is **visibly in it**. Counting files is not this layer; opening them is. A row whose evidence you did not open this round is not ready to ship. | *"I opened row 4's clip. It ends before the panel is on screen. Where is the ER?"* — a clip that stops short is caught by whoever opens it, so open it first. |
| **4** | **Every claim points at a row** | Each result sentence in the summary/comment names the row or file behind it. Anything you cannot point at is deleted or demoted to an explicit open question — never smoothed into the narrative. Hedging words (`should`, `seems`, `likely`, `น่าจะ`) in a delivered result = layer red. | *"You wrote 'works on all roles'. Point at the rows. All of them."* |
| **5** | **Verdict ↔ bug ↔ priority ↔ remark all agree** | Verdict wording follows the rubric; a minor-issue verdict carries a linked Lowest/Low/Medium bug with its Priority stated; FAILED carries a High/Highest bug; priority comes only from the [Bug Priority & Severity Matrix](bug-priority-matrix.md); no remark contradicts the status it sits beside. | *"This row says PASSED and its remark says the count was wrong. Which one is true?"* |
| **6** | **Nothing lives only in prose** | No role, step, AC/EC item or observed deviation exists **only** in a remark / "หมายเหตุ" / note under the table / chat message. Items deliberately excluded appear in a visible **Out-of-scope** block that was agreed at the confirm gate — never silently absent. | *"Your note mentions a second entry point. There is no row for it. Was it tested?"* |
| **7** | **Adversarial pass, then fail-closed handover** | Run the adversarial pass below and answer **every** question with a pointer. Only then: post / write the sheet / notify / say "done". Any red: close the gap and re-run from layer 1. If an item genuinely cannot be completed, deliver everything else **and state plainly what is missing and why** — an incomplete result reported honestly is deliverable; a complete-looking result with a silent hole is not. | *"What did you not test, and where does the deliverable say so?"* — the honest answer must already be written down, not produced when asked. |

### Adversarial review pass — read your own deliverable as the reviewer hunting for the shortcut

Before layer 7 signs off, re-read the deliverable **as artifacts only** — the table, the files, the
comment — with the working memory of what you did set aside; the reviewer does not have it. Answer
each question by **pointing at something**, not by recalling. **One unanswerable question = layer 7 red.**

1. Count the testable items in the ticket yourself, right now. Does that number equal the rows carrying a verdict? Name the difference.
2. Count the roles the ticket names. Does that number equal the evidence sets? Which row proves each one?
3. Pick the row whose evidence you are **least** sure about. Open it. Does it show that case, that role, that ER?
4. Which clip is the **shortest**? Open it — did the flow reach the target, or did the recording stop early?
5. Which verified value is the **hardest to read** on screen? Is there a still that makes it legible?
6. Is any row PASSED whose ER you inferred from a click rather than saw on screen?
7. Is any fact in the summary unsupported by a row — including anything a reviewer would read as "all", "every", "same as", "no issues"?
8. Does any status contradict its own remark, its linked bug, or that bug's priority?
9. What was **not** tested this round? Is it written in the deliverable as BLOCKED / Out-of-scope with a reason, or does it exist only in your head?
10. If the reviewer replaced you and had only these artifacts — could they reproduce every verdict without asking you a single question?

**Report line to the requester** — the handover states, in one line each: cases run / total, roles
covered / roles named, evidence files opened-and-verified this round, and every BLOCKED item with its
reason. A handover with none of those numbers has not passed layer 7.

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
| Testing ticket | [playwright-preflight.md](playwright-preflight.md) YES before run; F1–F3 before external update; **pre-delivery 7-layer gate green before any post/sheet/notify** |
| Retest | Plan posted before execute; v2/v3 format locked; **pre-delivery 7-layer gate green before the comment goes out** |
| Create bug | Phase C confirm before create; URL verify after |
