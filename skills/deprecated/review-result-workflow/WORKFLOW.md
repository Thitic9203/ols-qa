---
name: review-result-workflow
description: |
  Review already-recorded test results and their evidence clips — build one contact sheet per clip, judge every case against the ten review criteria, record PASSED / FAILED / AWAITING RE-REVIEW, drive a live board, then group the fixes cheapest-first and re-queue what was re-recorded.
  Use when the user says review result, review the clips, check the evidence, audit the recorded runs, verify the result sheet, /review-result, or Review result from Helix. Works for any recorded set — unit, system, integration, or another suite.
  Do NOT use for running the tests in the first place (testing-ticket-workflow), retesting one ticket after a dev fix (retest-bug-workflow), writing new TC tables (tc-fe-prep / tc-api-prep), or opening bugs (create-bug-workflow).
---

# Review result workflow

End-to-end review of a set of results that has **already been executed and recorded**: intake → working
directory → run manifest → contact sheet per clip → per-case brief → the ten criteria → targeted zoom →
recorded verdict → live board → lane dispatch → fix ordering → final review.

**What this workflow judges.** Not whether the product works — that verdict was reached when the run
happened. It judges whether **the recorded evidence proves the case it claims to prove**: the right role,
every step, every expected result visible on a real screen, and nothing in frame that a user would never
see. A clip that shows a working product but proves nothing is a failed case.

**Suite-agnostic.** Unit, system, integration, or any other recorded set. The suite decides which cases
exist; it never changes the criteria or the statuses.

**Project-agnostic.** Environment names, hands-off environments, customer-owned content markers, board
template location, and the account/session store all come from the workspace's own
`references/*-guide.md` — never from a value written into this skill.

## Discipline

**Settle and strategize FIRST** — before Step 0 or any tool call, follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Every investigation that starts inside this review runs under `superpowers:systematic-debugging`.** A
clip that will not decode, a contact sheet that comes out wrong, a verdict that contradicts the sheet, a
tool that returns nothing — each is an investigation, not a retry. Two identical failures = stop and
diagnose, never a third blind attempt. When a round is planning or grouping rather than diagnosis, say so
explicitly rather than letting it pass as an investigation.

**Read the workspace's own agent instructions in full before starting**, every round. The rules that
govern evidence, customer-owned content, and hands-off environments live there and change between rounds.

**Report progress as you go.** Announce the plan, report each lane as it completes, name what is blocking
you the moment it blocks you. Silence is read as a stalled session.

## Refusal-first (precondition gate)

MUST NOT start without all of:

- the **result sheet or case list** — for each case: its tab, its role, its steps, and its expected results;
- the **recorded evidence** for those cases, reachable on disk;
- the **suite scope** — which tabs/cases are in this review round.

Missing any of them, stop in one message per [skill-rules-style.md](../../../references/skill-rules-style.md)
refusal block. Reviewing clips without the case list behind them yields an opinion, not a verdict.

---

## Step 1 — Working directory (before the first file)

**Create the run's working directory before writing anything.** Never write run files into a system
temp directory: it is cleared without warning, and a review that loses its verdicts, contact sheets and
board payloads mid-round has to be re-run from zero.

A layout that has worked, one directory per run:

| Subdirectory | Holds |
|---|---|
| `clips/` | the evidence under review (read-only — never renamed, never overwritten here) |
| `sheets/` | the exported case list and any manifest built from it |
| `contact/` | one contact sheet per case, plus targeted zoom crops |
| `verdicts/` | one record per case, machine-readable |
| `board/` | the live board payloads |

Everything the review produces goes here. The clips themselves stay where they live.

## Step 2 — Build the run manifest from the case list

Export the case list once into a machine-readable manifest and **derive every structural fact from it** —
tab, role, sequence number, expected results, and which evidence file belongs to the case.

**MUST NOT accept a hand-typed tab or sequence number anywhere downstream.** When the recorder, the
verdict file and the board each carry their own copy of "which tab is this case in", they will disagree,
and the disagreement surfaces as a wrong number on a board somebody is trusting. Read it from the manifest
every time — that closes the whole class rather than one instance of it.

Reconcile before reviewing anything: every case in scope has an evidence file, every evidence file maps to
a case. An unmatched file on either side is reported now, not discovered at the end.

## Step 3 — One contact sheet per clip

For each clip, extract **frames evenly spread across the whole clip plus the real last frame**, and tile
them into a **single image for that case** (a 4×3 of twelve reads well: eleven spread + the last frame in
the final cell).

Putting the true last frame in the last cell means the "finished, loaded screen" criterion is judged in
the same image as everything else — no second pass over the set.

**Three traps, all seen in a real round. Handle them or the sheets lie to you:**

| Trap | What happens | What to do |
|---|---|---|
| Frames of unequal size fed to the tiler | The tile silently comes out incomplete or mangled — cells missing, cells stretched — and it still looks like a contact sheet | Normalize every frame to one size **before** tiling; assert the output cell count equals the frame count |
| Tiling invoked with a single input | The tile step fails, but the **previous run's output file is still sitting there** — and it is read as this case's evidence | **Delete the output file before every run.** A stale image read as a fresh one is worse than no image |
| A fixed pixel crop reused across clips | Clips are recorded at different resolutions; a crop tuned on one lands somewhere else on the next | Compute every crop from **that clip's own width and height**, never from a constant |

## Step 4 — Per-case brief, before looking at pixels

Print a short text brief per case **first**: the tab's role · the item under test · the steps · the
expected results · the addresses visited during the clip · any word matching the test-data marker list ·
any line that looks like raw data rather than a screen.

This is the single biggest speed gain in the workflow, and it does not cost quality. Most criteria are
decided from the brief and **confirmed** by the contact sheet. The alternative — zooming around each
image hunting for what to check — is slower and misses more.

The brief tells you what to look for; the image decides. Never the reverse: a brief alone never passes a
case, because the criteria are about what is **on screen**.

## Step 5 — The ten criteria

Judge every case against all ten. **All ten must pass. One failure fails the case** — there is no
"passed with a note".

| # | Criterion | Fails when |
|:--:|---|---|
| 1 | The role acting in the clip is the role that tab is for | The clip was recorded as a different account/role than the tab covers |
| 2 | Every step the case lists was actually performed | A step was skipped, merged away, or replaced by a shortcut |
| 3 | Every expected result appears, in full, on the real screen in the recording | An expected result is missing, partially visible, or only inferred |
| 4 | Every frame is a system screen a user would see | Raw data responses, a terminal, developer tools, an editor, the desktop, another application, a blank or half-rendered page |
| 5 | No test-data traces on screen | Names or descriptions carrying test/QA markers, placeholder text, or a status word in parentheses that belongs in a field, not a title |
| 6 | The last frame is a finished, loaded screen | The clip ends mid-navigation, mid-spinner, or on a page still painting |
| 7 | The case sits in the correct tab | It is filed under the wrong tab — **fails even if the clip is otherwise perfect** |
| 8 | Sheet sequence numbers run 1, 2, 3 with no gap, duplicate or swap — **and no clip filename has been changed** | A number is out of order, or any evidence file was renamed |
| 9 | Every step was driven through the real screen | A request was sent to the backend instead of clicking the control the case names |
| 10 | The backend was cross-checked, and that check is **absent from the video** | No cross-check was done (a value hardcoded into the screen would pass unnoticed), or the cross-check itself appears in frame |

**Criteria 9 and 10 together.** Clicking through the real screen is what makes the evidence real;
cross-checking the backend is what stops a value baked into the page from passing as a live one. Both are
required, and they are separate artifacts: **the video contains only system screens the user sees.** The
backend check is recorded beside it, never inside it.

**Criterion 7 is not a formality.** A case in the wrong tab is reviewed by the wrong reader against the
wrong role, and it is counted in the wrong total. It is moved — see Step 9 group A — and the fix never
involves renaming its clip.

## Step 6 — Zoom only where the contact sheet cannot decide

Zoom is the exception, not the method. When a criterion genuinely cannot be settled from the sheet, crop
the region in question at a named time fraction and stack the crops into one image.

- Address regions by **name and by that clip's own dimensions** (corners, edges, mid-bands, centre, full
  frame) — never fixed pixels, because clips differ in resolution.
- Stack crops from one case into a single image so one look settles several questions.
- If the zoom still cannot decide it, the criterion is **not** quietly passed — the case goes to the
  three-layer gate in Step 7.

## Step 7 — Record the verdict

**Only three closing statuses exist:**

| Status | Meaning |
|---|---|
| `PASSED` | All ten criteria met |
| `FAILED` | At least one criterion not met |
| `AWAITING RE-REVIEW` | Re-recorded under the same filename and back in the queue for a fresh judgement |

**MUST NOT leave an interim status on any case.** A working note such as "needs a closer look" that never
gets closed makes the board read as fully reviewed while cases are still open — and the numbers are
believed. If a case cannot be closed this round, it is `FAILED` with the reason, or it goes to the gate
below; it is never parked in a fourth state.

**MUST NOT close a case as "awaiting spec confirmation" until all three layers have been walked:**

1. **Read the related ticket — every comment.** The answer is usually already there: known behaviour, a
   decision recorded by the developer, or a fix that has not shipped yet.
2. **Compare against the regression result** for the same case. Passing there before means the behaviour
   changed after that run; never appearing there means there is no precedent, and say so plainly.
3. **Open the actual source.** Behaviour that looks wrong on screen often has a deliberate reason in the
   code — a flag, a condition, a fallback.

All three walked and it is still undecided → that is a **question for the owner**, raised explicitly. It
is never a defect, and never a status left sitting on the board (see
[non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)).

**Record one line per case, using reason codes rather than free prose**, with the codes defined in one
place shared by the board and the delivery document. Free prose per case cannot be counted, cannot be
grouped for Step 9, and drifts in wording until two identical problems look like two different ones.

**Read every verdict source when producing a total.** A writer that reads one of two verdict stores
reports fewer results than were actually reached — under-reporting looks like honest progress and is not
questioned.

## Step 8 — Live board (mandatory for every review round)

Every review round has a **one-page live board** that reads its numbers from the live data store, updated
**the moment a status changes** — not when someone asks.

- **The page format is frozen.** Use the structure the workspace already standardised: the board layout
  rule in the workspace's own agent instructions is authoritative, and the template file lives outside
  this repo. **MUST NOT redesign the board, rename its sections, or reorder its lanes.** Only the data
  read from the live store changes.
- **Generate the board payload from the recorded verdicts** — never by typing counts by hand. A
  hand-typed number is a claim with nothing behind it, and it is believed because it is on a board.
- **Write the payload from a file, not inline**, when the store's write path offers both: long
  payloads — non-ASCII ones especially — get truncated in transit and land as malformed data.
- **Anything embedded in the page itself** (section names, lane names, the frame) only changes on reload.
  When you change one of those, say so in the same message: *the page needs a refresh.* Leaving the owner
  to find stale text themselves is how a board loses its credibility.
- **A comment on the board is work, not feedback.** Act on it immediately, reply in that thread, and
  report it in chat — without waiting to be asked.
- **Never claim the board was published without reading the live version back** and confirming the new
  content is there and the old content is gone.

## Step 9 — Lanes and dispatch

**A lane is a role or a tab — never a slice of the raw file count.** Splitting by file count puts two
lanes on the same account and the same data, and they corrupt each other's session. Splitting by role
keeps accounts and fixtures disjoint by construction.

**A lane that finishes takes the next piece of work in the same turn** — it does not wait to be told.
Before dispatching, check all four:

| Check | Passes when |
|:--:|---|
| Files | No file overlaps a lane still running |
| Accounts | No account or session is in use by a running lane |
| Shared resources | No contention over a browser, port, disk, or destination sheet |
| Ordering | The work does not depend on a lane that has not finished |

No work passes all four → say so in chat: the lane is free and this is what it is waiting on. A finished
lane nobody dispatched is capacity disappearing silently.

**Read-only analysis work is the easiest to dispatch** — it collides with almost nothing, and it usually
unblocks something else.

## Step 10 — Fix ordering, cheapest first

Group the failures by **how expensive the fix is**, and start with the groups that need **no new
recording** at all:

| Group | Failure | Fix | Cost |
|:--:|---|---|---|
| **A** | Case filed in the wrong tab (criterion 7) | Move the case to the right tab and renumber the sheet so the sequence is continuous. **The clip filename is not touched.** | No re-record |
| **B** | Non-system-screen content in frame (criteria 4, 10) | Fix the recording script once, re-run the affected set | One script change |
| **C** | Test-data traces on screen (criterion 5) | Rename the data once, re-run. **Never touch items marked as customer-owned** — see MUST/NEVER | One data change |
| **D** | Role does not match the tab (criterion 1) | Change the account in that case's configuration, re-run | Per case, small |
| **E** | Steps or expected results incomplete (criteria 2, 3, 9) | Extend that case's steps in its script | Per case, real work |
| **F** | An expected result no screen can show | **Stop and ask the owner.** Do not invent a surface for it | Blocked |

Cases failing only A, only C, or both are always the first ones actioned — they are the cheapest
correct outcome available.

**Re-recording rules:**

- **Record on the same environment the original clip was recorded on** — read it from the address visible
  in the clip. Same build, different data; a different environment makes the comparison meaningless.
- **Use data that already exists.** Do not create new fixtures. If existing data is genuinely
  insufficient, bring forward assets already produced for this suite rather than inventing more.
- **A new clip replaces the old one under the exact same filename** and the case returns to the queue as
  `AWAITING RE-REVIEW`. It is then reviewed again from Step 3 — a replacement is not trusted because it is
  a replacement.

## Step 11 — Final review (mandatory before "done")

Two checks that are easy to skip and expensive to miss, plus the status sweep:

- [ ] **Sheet sequence numbers are continuous** — 1, 2, 3 … with no gap, no duplicate, no swap, across
      every tab touched this round. Moving a case between tabs (group A) is exactly what breaks this.
- [ ] **No clip filename changed** — diff the evidence filenames against the manifest from Step 2. A
      renamed clip breaks every reference that points at it, and nothing else in the round will notice.
- [ ] **No case carries an interim status** — every case reads `PASSED`, `FAILED`, or `AWAITING RE-REVIEW`.
- [ ] **Board numbers match the recorded verdicts** — regenerated from the verdict files, read back live.
- [ ] **Every case flagged for a question has been raised** with the owner, not left on the board.

---

## Skill composition

| Situation | See |
|-----------|-----|
| Something breaks mid-review | `superpowers:systematic-debugging`, plus [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) |
| A failing case may be a phantom (the expected side is wrong) | [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) |
| Evidence completeness rules | [qa-evidence-gates.md](../../../references/qa-evidence-gates.md) |
| Depth gates from the shipped-defect review | [customer-escape-prevention.md](../../../references/customer-escape-prevention.md) |
| A real defect surfaces during the review | [skill-routing.md](../../../references/skill-routing.md) → create-bug-workflow |
| Environment names, hands-off environments, customer markers, board template, session store | the workspace's own `references/*-guide.md` |

---

## Out of scope

- Running the tests, retesting one ticket after a dev fix, TC prep, filing bugs — see
  [skill-routing.md](../../../references/skill-routing.md).
- Deciding the product verdict. This workflow decides whether the **evidence proves** the recorded verdict.

---

## MUST / NEVER

Shared rules: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST create the run's working directory before writing the first file, and NEVER write run files to a system temp directory | A cleared temp directory takes the verdicts, contact sheets and board payloads with it — the round restarts from zero |
| MUST derive tab, role and sequence number from the manifest, NEVER from a value typed at the point of use | Three copies of the same fact disagree eventually, and the disagreement reaches a board somebody trusts |
| MUST delete the contact-sheet output file before every run | A failed tile leaves the previous output in place, and it is read as this case's evidence |
| MUST normalize frames to one size before tiling | Unequal inputs produce a silently incomplete tile that still looks like a contact sheet |
| MUST compute every crop from that clip's own width and height | Clips are recorded at different resolutions; a constant crop lands somewhere else on the next clip |
| MUST include the true last frame in the contact sheet | The "finished, loaded screen" criterion is otherwise judged in a second pass that gets skipped |
| MUST fail the case when any one of the ten criteria fails | "Passed with a note" is how a gap ships as a pass |
| MUST fail a case that sits in the wrong tab even when the clip is perfect | It is read by the wrong reader, against the wrong role, and counted in the wrong total |
| MUST NEVER rename an evidence file — in any group, for any reason, including when moving a case between tabs | Every reference pointing at that file breaks, and nothing else in the round notices |
| MUST verify each expected result on the real screen in the recording, not from a backend value | A backend value proves the system, never that the user was shown anything |
| MUST cross-check the backend as a separate artifact, and NEVER let that check appear in the video | Without the check, a value hardcoded into the screen passes; inside the video, it is not a screen a user sees |
| MUST drive every step through the real screen — NEVER send a request to the backend in place of the control the case names | An interface shortcut verifies the wrong layer and can pass while the screen is broken ([test-through-real-steps.md](../../../references/test-through-real-steps.md)) |
| MUST close every case as `PASSED`, `FAILED`, or `AWAITING RE-REVIEW` — NEVER leave an interim or working status | An unclosed working status makes the board read as complete while cases are open, and the numbers are believed |
| MUST walk all three layers — the ticket's full comment history, the regression result, the actual source — before treating anything as awaiting spec confirmation | Two of the three usually already answer it; skipping them turns a known behaviour into a fake open question |
| MUST raise an undecidable case as a question to the owner — NEVER as a defect and never as a status parked on the board | Uncertainty about a spec is a question, not a finding |
| MUST record verdicts as reason codes defined in one shared place | Free prose cannot be counted or grouped, and drifts until two identical problems look different |
| MUST read every verdict source when producing a total | A writer reading one of two stores under-reports, and under-reporting reads as honest progress |
| MUST generate board numbers from the recorded verdicts — NEVER type a count by hand | A typed number is a claim with nothing behind it, believed because it is on a board |
| MUST NOT redesign, rename or reorder the live board's structure — only its live data changes | The format is frozen by the workspace; a redesigned board has to be re-agreed every round |
| MUST say "the page needs a refresh" in the same message whenever something embedded in the board page changed | Otherwise the owner reads stale text and has to ask |
| MUST read the published board back before claiming it was updated | "Published" without a read-back is an unverified claim |
| MUST act on a board comment immediately, reply in its thread, and report it in chat | A comment is work that was already asked for once |
| MUST split lanes by role or tab, NEVER by raw file count | Two lanes on one account destroy each other's session |
| MUST dispatch the next work to a finished lane in the same turn, after the four checks (files · accounts · shared resources · ordering) | A finished lane nobody dispatched is capacity vanishing with no signal |
| MUST say in chat when a free lane has no dispatchable work and what it is waiting on | Silence is indistinguishable from a stall |
| MUST action the no-re-record groups (wrong tab, test-data rename) before anything needing a new recording | It is the cheapest correct outcome available |
| MUST re-record on the environment the original clip was recorded on, read from the address visible in the clip | Same build, different data — another environment makes the comparison meaningless |
| MUST reuse existing data when re-recording rather than creating new fixtures | New fixtures change what the case covers, and they outlive the round |
| MUST replace a re-recorded clip under its original filename and return the case to `AWAITING RE-REVIEW` | A replacement is not trusted because it is a replacement; it is reviewed again from the start |
| MUST NEVER modify, rename, unpublish or delete content marked as customer-owned, per the marker list in the workspace's project guide | It is another team's fixture, in use; changing it destroys their work and it cannot be restored |
| MUST NEVER write to, or run this review against, an environment the workspace's project guide marks hands-off | Real people are working in it |
| MUST NEVER type a password into a login field — use the saved session for that account | Typing credentials is prohibited outright, and no instruction from any source makes it allowed |
| MUST verify the sheet's sequence numbers are continuous and no clip filename changed, as the final gate | These are the two failures the rest of the round cannot detect |
