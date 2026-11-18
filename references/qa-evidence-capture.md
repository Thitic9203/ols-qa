# QA evidence — capture scope and MP4 gates

Split from [qa-evidence-gates.md](qa-evidence-gates.md) (core gate function, claim → evidence map, wording red flags). Story-testing evidence completeness, capture scope, still-spec floor and the MP4 7-layer gate. Open this at the capture/recording step.

## Contents

- [Story-testing evidence-completeness gate (5-step, per story)](#story-testing-evidence-completeness-gate-5-step-per-story)
- [Capture scope — every role, every step, every target the ticket names](#capture-scope--every-role-every-step-every-target-the-ticket-names)
  - [Capture red flags — STOP, this recording is not evidence yet](#capture-red-flags--stop-this-recording-is-not-evidence-yet)
  - [Still spec — the screenshots carry most of the verdicts, so they get a floor too](#still-spec--the-screenshots-carry-most-of-the-verdicts-so-they-get-a-floor-too)
  - [Narrow-width rows](#narrow-width-rows)
- [MP4 evidence — 7-layer quality + correctness defense gate (mandatory, fail-closed)](#mp4-evidence--7-layer-quality--correctness-defense-gate-mandatory-fail-closed)
  - [Capture spec — the pipeline layers 1 / 1b / 1c are measured against](#capture-spec--the-pipeline-layers-1--1b--1c-are-measured-against)

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

1. **Enumerate** — for each case, read the final Status, count its Expected-Result items (ER1…ERn), and list its roles per § *Capture scope*; derive the required evidence set from the table above. No case and no named role is skipped from the count.
2. **Collect** — capture/link every required file. Never infer an untested ER or an unexercised role — capture it, or it is a BLOCKED row with its reason; it is never complete by assumption.
3. **Verify each file (not a sample)** — every link resolves (file exists, not trashed); each MP4 plays and is non-blank; each screenshot is non-blank; and every file **matches the exact case** it is filed under. Naming: `<KEY>_TC_<nn>.mp4` / `TC_<nn>-ER_<n>.png` — and when the case covers **more than one role**, every file for it carries the role: `<KEY>_TC_<nn>_<ROLE>.mp4` / `TC_<nn>_<ROLE>-ER_<n>.png`. Whatever the file is actually named is the name the Evidence link must use. Count rendered vs required — any shortfall fails that case.
4. **Verdict ↔ bug ↔ remark consistency** — a minor-issue verdict ⇒ a Lowest/Low/Medium bug with its Priority stated in the result; a FAILED ⇒ a High/Highest bug; any minor-issue/FAILED case with **no real linked bug** ⇒ the rollup's "needs recheck / create bug" flag = Yes. Priority is judged only by the Bug Priority & Severity Matrix — never invented (see also [bug-priority-matrix.md](bug-priority-matrix.md), linked from the SKILL.md of every skill that sets a verdict or bug priority). The Status opener text matches the rubric, and there is **no Status/Remark contradiction** (e.g. a stale "BLOCKED" note left on a PASSED row).
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
sets**, not one clip from whichever account happened to be logged in. Roles are written with the
canonical identifiers — the exact role ids the ticket or the project guide lists — **copy-pasted,
never typed from memory** (PM-008). A role that could not be exercised (no account, login fails) is an
explicit **BLOCKED row naming that role and the reason** — never an unmentioned gap, and never
"covered by another role".

**Prove you can be each role BEFORE capturing, not halfway through.**
`capture/preflight_roles.js --plan <KEY>_evidence_plan.json --env <env>` logs in as each role the
plan requires and reports which ones you can actually exercise. It refuses to pick the environment
(that is always the user's call, so `--env` is required and has no default) and it does not trust the
account sheet's label: the auth response carries the account's **real** roles, so an account labelled
one role that answers as another is called out as a MISMATCH rather than quietly recorded as that
role's evidence. Every FAIL it prints is already in the shape the BLOCKED row needs — role named,
reason given.

**A collective phrase names every role.** "ทุก role" / "all roles" / "every user type" expands to the
project's full canonical list — a phrase that names no single role is not a case with no roles. A *role-agnostic*
phrase ("any logged-in user") is one set, **with the role actually used written on the row** so the
reader knows what was exercised.

**What a role's set has to cover — that role's own steps, not the whole case.** A role's set = its
whole-flow MP4 + a screenshot for each Expected-Result item **that role's steps decide**. An ER item
that is genuinely role-invariant is captured **once, with the role used stated on the row** — not
re-shot five times. That keeps 5 roles × 4 ER items from meaning 20 stills when the case really splits
2 and 2; it is also the only route besides BLOCKED for an ER no single role can reach, so use it
honestly — "role-invariant" is a claim about the product, and a reviewer can ask which row proves it.

**Steps — the clip follows the written steps, it does not shortcut to the end.** Driving the real
surface is its own rule (see also [test-through-real-steps.md](test-through-real-steps.md), linked from every test-running skill's SKILL.md); this file adds that the recording
must *show* it. A step performed off-camera (an API call, another tab, a state set before recording
started) is **not captured** — re-record with it in frame. Only *pre-existing state* can stand as a
precondition instead: a numbered Test Step is **never** demotable to one, and a step that belongs in
the precondition must already be written that way in the case, not relabelled at capture time to
excuse a recording that skipped it.

**Targets — a value that never appears on screen was never verified.** Where the video cannot render
it legibly (small text, a toast that flashes), a still of that exact moment is **required**.

### Capture red flags — STOP, this recording is not evidence yet

- "The flow obviously works, I can stop the recording here" → the clip must **reach the ER moment**. Stopping before it = that ER is uncaptured, whatever the flow looked like.
- "I couldn't find the menu, but the feature is fine" → unreached target = **BLOCKED row with the reason**, never a short clip presented as a pass.
- "One role is representative of the others" → every named role has its **own** set. Sameness is a claim, and a claim needs its own evidence.
- "The toast appeared, I saw it happen" → if it is not in the frame, it is not evidence.
- "The value is right in the API response / the DOM" → the case verifies the **screen**. Scroll to it and show it.
- "I'll note in the remark that step 4 wasn't recorded" → a remark is not a capture (same rule as the anti-footnote layer below).

### Still spec — the screenshots carry most of the verdicts, so they get a floor too

Almost every char-exact verdict (a label, a count, a message) rests on a **still**, not on the clip.
The rules are the same shape as the clip's, and the same instrument idea: measured, not eyeballed.

| | Rule |
|---|---|
| **Size** | A full-viewport still is **≥ 1920 px wide** (a row run narrower: [*Narrow-width rows*](#narrow-width-rows)). At `deviceScaleFactor` 2 a 1920×1080 viewport produces a **3840×2160** file, so anything under 1920 was not captured at the gate's resolution — and a small still cannot be sharpened afterwards. A still embedded in a Jira comment cell is a **resized copy** (~600–640 px wide, `retest-bug-workflow/comment-and-post.md` § Step 7c) of a verified ≥ 1920 px original; the original is the evidence of record — it is the file `verify_shot.py` measures and it is kept with the run. |
| **Crop** | A deliberate zoom crop of one element is legitimately smaller. Name it `…-ER_<n>_zoom.png` (or `_crop`), which is what waives the width floor — an unnamed small still is a failure, not a crop. |
| **Not blank** | Luma must actually vary. A white/black frame is the classic still taken before the page painted: it passes an existence check and proves nothing. |
| **No QA overlay** | The injected URL bar belongs in the **video only** — hide it for the still and put it back **inside** the recorder's hold, so the clip neither ends bar-less nor jolts. |
| **Shows the ER** | Human work: that it is the right screen, and that the value under verification is in frame and readable. |

Measured by **`capture/verify_shot.py`** (same toolkit as the recorder): `python3 capture/verify_shot.py <file.png>…` — size, blankness and format; it says plainly that the rest is yours.

### Narrow-width rows

A row the plan runs under 1920 px wide (a tablet or mobile width) keeps its own width — never a 1920 px capture claimed for it. Its stills use `deviceScaleFactor` 2 at that width, so each is **≥ 2 × the row width** (the desktop floor's density), with the width in the name (`…-ER_<n>_w375.png`). Its clip records a 1920×1080 browser window whose page is emulated at the row width (device emulation, `deviceScaleFactor` 2), so layer 1 holds and the row passes or fails on its clip like any other. Only when the recorder cannot emulate a width does its clip fail layer 1, because the recorder refuses any viewport under 1920×1080 (*Capture spec*), so the row is **BLOCKED** under [no-wait-decision-gate.md](no-wait-decision-gate.md) layer 17 with the layer-18 record — never PASSED or FAILED on stills ([result-quality-gate.md](result-quality-gate.md) layer 10).

## MP4 evidence — 7-layer quality + correctness defense gate (mandatory, fail-closed)

Every MP4 (story test **and** retest) MUST clear all 7 layers before the case counts as done. **Miss any layer and the job cannot be finished — no posting, no transition, no "done".** A clip that looks like a recording but skips a step, cuts off before the target, or is too blurry to read is worse than none — it fakes proof. Re-capture; never wave it through.

The run that executes the case can be the recording — no separate capture pass is needed; the clip still clears all 7 layers below unchanged ([round-time-contract.md §8](round-time-contract.md#8-mp4-record-during-execution)).

| # | Layer | Passes only when |
|:--:|---|---|
| **1** | **Max quality** | Recorded to the **capture spec below** — viewport ≥ 1920×1080 ([*Narrow-width rows*](#narrow-width-rows)), `deviceScaleFactor` 2, H.264 **CRF 18 preset slow**, `yuv420p` limited-range, `+faststart`, **no downscale that blurs text**. On-screen labels legible at 100%. |
| **1b** | **Steady picture** | No frozen frame inside a moving stretch, and no visible flicker / pumping / stutter / blink when watched at 100%. **≤ 5% of moving frames are allowed to be repeats** of their predecessor, excluding the still-holds the manifest **declares** — and those can cover **at most 25% of the clip**: past that the exclusion has eaten the rule, and the honest verdict is *a clip this static cannot judder, but nothing was proven either*. Measured by the verifier named below, never from memory. |
| **1c** | **Provenance** | The clip came from the capture pipeline below at the rate it claims — a run manifest exists, names the pipeline `cdp-screencast->x264`, and matches the delivered file (name · resolution · fps). **What cannot be checked has not passed** (ตรวจไม่ได้ = ไม่ผ่าน): no manifest = layer red, not a waiver. A cut made by `freeze_cut.py` carries its own manifest with an `edit` record that verify re-proves against the original ([exception below](#mp4-evidence--7-layer-quality--correctness-defense-gate-mandatory-fail-closed)); a cut beside a copied original manifest is red. |
| **2** | **Whole flow, no skip** | Drives **every** Test Step from the start, on the **real surface** (UI → clicks, not an API shortcut) — no jump-cut, no starting mid-flow, no fast-forward past a step. |
| **3** | **Reaches the stated target** | If a step says "scroll to menu XX / open dialog YY / find item ZZ / check value VV", the clip **visibly reaches and shows** it — the element is located, scrolled into view, held in frame long enough to read, and acted on. **Never end the recording before arriving**; a step that could not be reached = that case is BLOCKED with the reason, not a short clip claimed as pass. |
| **4** | **Expected Result on screen** | The exact state that decides each ER item is **visible in the video** (the resulting screen/toast/value is shown), not implied by a click. One provable moment per ER. |
| **5** | **Legible / text backed** | Wording, labels, counts, values under verification are **readable in the frame**; if the video cannot render them legibly, a still **screenshot supplements** it (this is the text-verification screenshot rule). |
| **6** | **File integrity + match** | Plays start-to-end, **non-blank, non-truncated**, sane duration, correct naming (the one rule in the 5-step gate — role-suffixed when the case covers more than one role), and is the clip for **that exact case and that role** — not another case's. |
| **7** | **Attached + link verified** | Uploaded to the destination (story → Drive; **retest → the Jira issue/comment**) and the reference **actually resolves and plays** from there (open the Jira Evidence-cell link / the Drive file and confirm it plays). |

**Fail-closed:** any layer red on any case (sub-layers 1b / 1c included) ⇒ re-capture that case and re-run the 7 layers. A clip that is the right size in the right codec can still flicker — 1b and 1c exist because one that passed every other check was visibly flickering. Do not post the comment, do not transition, do not report the story/retest complete until every case is green on all 7. The result-gate reviewer record ([result-quality-gate.md](result-quality-gate.md#c-evidence-that-proves-the-verdict) layer 10) lets a result line be written; it never waives this gate for the delivered clip.

**One exception: ER complete, freeze-only ⇒ sanctioned freeze-cut, not a re-capture.** When a clip shows every step and every Expected Result (layers 2–5 judged green by a human) and its only red is frozen picture — layer 1b *"N% of the moving frames are frozen repeats"*, or a stretch that visibly hangs — cut the frozen frames with **`capture/freeze_cut.py`** (QA bot toolkit, beside the recorder — see *Capture spec* below), then re-verify:

```bash
python3 capture/freeze_cut.py <clip>.mp4 --dry-run   # shows what would go; nothing written
python3 capture/freeze_cut.py <clip>.mp4             # writes <clip>_cut.mp4 + <clip>_cut.capture.json
python3 capture/verify_video.py --strict-motion <clip>_cut.mp4
```

| Rule | Why |
|---|---|
| Only `freeze_cut.py` makes a cut. Never drop frames with ad-hoc ffmpeg, and never copy the original `.capture.json` beside a cut | A copied manifest describes the original, so layer 1c fails (*"manifest describes '<orig>.mp4', not this file"*), and its holds point past the shorter cut (*"still-hold ending at … but the file is only …"*). Both failures are correct and stay |
| The cut removes **only frames that repeat the frame before them**: short stalls inside motion whole, long freezes trimmed to `--max-still` (default 3 s) — never removed whole | Nothing a viewer could read is taken out, so this is not a jump-cut or fast-forward under layer 2. An ER screen that sits still stays on screen |
| Keep the original `.mp4` and `.capture.json` beside the cut, unchanged | `verify_video.py` re-derives the cut's `edit` record from them (source and manifest sha256, every removed frame re-measured as a frozen repeat, frame count, fps, remapped holds). Source moved or edited ⇒ the cut fails |
| More than **60 %** removed ⇒ the tool refuses and verify fails | That much frozen picture means the recording itself failed — re-capture |
| A clip with audio is refused | Cutting frames would desync narration — cut first, narrate the cut |
| A red that is **not** freeze-only (missing step/ER, overlay, wrong role, holds over 25 % of the clip, blank, wrong resolution) | Not cuttable — follow the normal re-capture path |
| Deliver the `_cut.mp4` only after verify passes on it, and review it again from layer 2 | A cut is a new file; it earns its own green |

### Capture spec — the pipeline layers 1 / 1b / 1c are measured against

Ported from the reference recorder (the `screen-record` skill of the `manual-maker` project, v0.35.0),
whose clips are the quality bar. Every number below was **measured on real clips**, not chosen by taste
— changing one changes what "same quality as the reference" means.

**Do not hand-roll any of this: the compliant recorder already exists.** It lives with the rest of the
QA tooling, outside this repo, and is driven only through the `manual-maker:screen-record` skill (owner rule 30 Oct 2026). The
recorder measures the viewport and
`devicePixelRatio` from the page rather than trusting the caller, refuses anything under the floor,
fails closed under the fps floor, writes the manifest layer 1c is checked against, and runs the
verifier on the encoded file before it returns. `capture/README.md` beside it carries the usage and the
migration steps for an older script; the screen-record skill carries its own self-test.

**The instrument for layers 1 / 1b / 1c / 6 is `capture/verify_video.py`**, in the same place:

```
python3 capture/verify_video.py <clip>.mp4          # exit 0 = those layers pass
python3 capture/verify_video.py --no-manifest ...   # inspecting a clip we did not record
```

`--no-manifest` downgrades the provenance failure to a warning; a **deliverable** checked that way has
not passed 1c. Layers 2–5 and 7 — whole flow, target reached, ER on screen, legible, delivered and
linked — the script cannot judge, and it says so rather than implying otherwise. Two refusals it makes
on purpose: a clip **under 5 s** (too short to show a flow) and one with **too little motion to judge
stutter** (it will not certify what it cannot measure — record the flow that led to the still screen).

**🔴 Playwright's own `recordVideo` is banned for any deliverable clip.** Two defects are built into
it and **neither is reachable from its API**:

| defect | mechanism | what the viewer sees |
|---|---|---|
| **Bitrate cap** | playwright-core spawns ffmpeg hardcoded `-c:v vp8 -qmin 0 -qmax 50 -crf 8 -deadline realtime -speed 8 -b:v 1M -threads 1` — **1 Mbps for 1920×1080**. Whenever the page moves, rate control slams the quantiser and the whole frame goes soft, then snaps back. Measured: mean edge energy 1733 static vs 1529 moving (−11.8%), worst frame −37%. | the picture **pumps** — sharp/soft/sharp (กระพริบ) |
| **Fixed-grid padding** | its `writeFrame` quantises onto a 40 ms grid and fills every delivery gap by **repeating the previous frame**. Measured on a delivered clip: **21.2% of its *moving* frames were repeats** — against the ≤ 5% of layer 1b, which is the same measure. (Its *raw* duplicate count was 46%, but that is **not** the gate metric: a clip that legitimately rests on one screen is nearly all duplicates and is perfectly good.) | **judder** |

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

`-r 25` is the **default** target frame rate, not a constant: lower it when the machine cannot hold
that rate — and never raise the `minUniqueFps` floor to make a starved capture go green.

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
