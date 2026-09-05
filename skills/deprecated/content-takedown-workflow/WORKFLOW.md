---
name: content-takedown-workflow
description: |
  Take a set of published content items out of public view — inventory the set, prove the items are otherwise healthy, pick the least damaging mechanism the available accounts can actually use, execute, then prove with guest-side evidence that every item is gone and nothing else moved.
  Use when the user says hide this content, take these down, remove from the public catalogue, unpublish this batch, ซ่อนสื่อ, นำออกจากคลัง, or /content-takedown.
  Do NOT use for deleting content permanently, for renaming or fixing item metadata (name-guard fixers), or for retesting a bug fix (retest-bug-workflow).
---

# Content takedown workflow

Remove a batch of already-published items from public view, reversibly, with proof.

The hard part is never the request — it is that **the mechanism that looks obvious usually is not
available to the accounts you hold**, and the wrong first attempt can permanently burn the only
lever you had. This workflow orders the attempts so the cheapest, most reversible, least
accusatory one is tried first, and so no attempt destroys the next.

## Discipline

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Nothing here is a fact until this round's own output shows it.** Endpoint shapes, role powers,
thresholds and status names drift between environments and releases. Every claim you make to the
user must trace to a request/response you ran **this round** — see the no-guessing rule at the top
of `CLAUDE.md`.

**Reversibility is a requirement, not a preference.** Before executing anything, you must be able
to state the exact call that undoes it. If you cannot, you have not finished investigating.

**This is outward-facing work on someone else's data.** Every item in the batch usually belongs to
a real person whose name is attached to it. Treat "which mechanism" as an ethical choice, not only
a technical one (Step 3).

## Refusal-first (preconditions)

MUST NOT start without **all** of:

1. **An explicit instruction from the user to hide this specific set.** "This content looks bad" is
   an observation, not an instruction. Quote back what you are about to hide and how many.
2. **A confirmed environment**, per the intake gate in
   the workspace's `references/ols-project-guide.md` — ask once, wait, never pick one
   yourself, and never default to the one that is easiest to reach.
3. **A named account set**, with the role each one resolves to (verified live, not assumed from a
   spreadsheet column).
4. **A stated scope boundary** — exactly which items are in the batch, and the assertion that
   nothing outside it may change. You will verify that assertion in Step 6.

MUST refuse, and say so plainly, when the environment is one the workspace marks hands-off, when
the instruction is to hide content the user does not own or administer, or when the only available
mechanism would require writing something untrue about a person (Step 3d).

## Step 0 — Intake, in one message

Ask for anything missing from the refusal list in a **single** message, then wait. Do not begin the
inventory while a precondition is open — the inventory itself is cheap, but starting work signals
approval you do not have.

State back, before touching anything: the environment, the account(s), the batch definition, the
expected item count if known, and the sentence *"I will not change anything outside this set."*

## Step 1 — Inventory the batch from the API, not from a screen

Pull the authoritative list and keep it on disk; every later step keys off this file.

- Read the **list envelope defensively**: some endpoints return `{data:[...]}` and others
  `{items:[...]}` beside an identical `total`. Read `j.data || j.items || (Array.isArray(j) ? j : [])`
  or you will get an empty array next to a healthy `total` and mistake it for an outage.
- Respect the paging contract you observe (in OLS: `page` is 1-based, `limit` maxes at 50). Page
  until you have `total` items, then assert `unique ids === total`.
- Record per item: id, title, owner/channel, status, created/published time, and anything the
  takedown call will need later.
- If the batch is defined by a quality judgement ("the junk ones"), run the shared rules rather
  than your own taste — `tools/name-guard/name_rules.js` `checkItem` / `checkAsset` / `findDuplicates`
  are the single source of truth, and they are unit-tested. Report the counts per rule so the user
  can see what would go.

**Show the user the list before you touch it** — titles, count, and how many are in each rule
bucket. This is their last cheap chance to say "not that one".

## Step 2 — Prove the items are otherwise healthy first

Hiding content also hides evidence. If an item is broken, that is a finding the user may want
**before** it disappears, and "we hid it" must never be the reason a defect went unseen.

For media-bearing items, check at least:

- The asset itself is served: fetch the real file URL and read the status, `content-type` and size.
  A `206`/`200` with a real content type is evidence; a page screenshot is not.
- The file is intact: probe the container/codec/duration (`ffprobe -v error -show_entries …`) and
  compare the duration against the item's own metadata.
- The delivery headers a browser needs are present (e.g. `Access-Control-Allow-Origin` matching the
  app origin, range support).

**Separate a machine-side block from a product defect before reporting either.** A local security
suite, proxy or extension can block a CDN for *subresources only*, which looks exactly like a broken
player. The decisive test: load the same asset from an unrelated origin (`about:blank`, a third-party
page) in the same browser. If it fails there too, the block is yours — say so, and say plainly that
you could not observe playback yourself rather than implying you did.

Report what you found. If something is genuinely broken, stop and ask before hiding it.

## Step 3 — Pick the mechanism, cleanest first

Work down this ladder and **stop at the first rung that the accounts you hold can actually reach**.
Verify each rung with one real call on one item — never assume a role's powers from its name.

**a. The owner unpublishes.** Reversible, silent, states nothing about anyone. In OLS this is
`PATCH /api/media/{id}/unpublish` (a `POST` is `404` — the verb matters), reversed with
`republish`.
🔴 **Ownership, not role, gates this.** Verified 2026-08-25: a `SYSTEM_ADMIN` account still gets
`403 media.not_owner` on content it does not own. A high role is not a takedown power.

**b. The platform team does it server-side.** Ask dev/PO to bulk-unpublish. Slower, but it leaves no
record implying wrongdoing by a creator, and it is the right answer whenever the batch belongs to
many owners. Prefer this over rung (d) unless the user has weighed the trade-off themselves.

**c. An administrative moderation action, if one exists that does not require an accusation.**
Check whether the moderation queue offers a decision on an *already-actioned* case only, or whether
it can act on a fresh one. In OLS,
`POST /api/content-moderation/cases/{caseId}/decisions {action:'FLAG'|'UNFLAG', note}` **reviews a
case that is already flagged**; against a fresh case it answers
`409 moderation.invalid_transition — Cannot flag moderation case with status PENDING_REVIEW`.
So it is a rollback lever, not a takedown lever.

**d. A user report at a severity that hides on submission — last resort, and only with the user's
informed approval.** This works, and it also writes a permanent accusation against a named person.

Before proposing it, tell the user in plain language: what the reason code literally accuses the
creator of, how many creators are affected, and that it distorts the customer's moderation
statistics. If they decline, stop. If they reaffirm after hearing it, that is their decision —
proceed, and record in the note field what is actually true about the content.

## Step 4 — The traps that make this go wrong

**🔴 One report per (account, item), and the first one is binding.** Re-reporting the same item from
the same account returns the **same case id and the same status regardless of the reason code you
send**, and still answers `201` — which reads like success. A low-severity report filed first
permanently prevents that account from ever hiding that item. **Decide severity before the first
call.** If a slot is already spent, you need a *different* account that has never reported that item.

**🔴 Severity decides visibility; count does not.** In OLS the reason master data is in the FE
bundle (`REPORT_REASON_MASTER_DATA`): only the `HIGH` group opens a case directly as `FLAGGED`,
which is the only status that hides. Every `MEDIUM`/`LOW` code opens `PENDING_REVIEW`, which changes
nothing — verified across 461 live cases, and cases 8 days old were still sitting there. Read the
severity from the bundle or an equivalent authoritative source; never infer it from the label's
tone.

**🔴 Pick the least damaging code within the qualifying tier**, and never one that carries legal or
political risk. Write the note field truthfully — it is the only place the real reason survives.

**🔴 Account inventory is environment-scoped.** Accounts from one environment's pool will
authenticate and still resolve to `user: null` in another. Verify each account against the target
environment's own session endpoint before planning around it.

**🔴 A refusal must never read as a pass.** If a precondition fails mid-batch, stop the batch —
do not let partially-hidden state be reported as done.

## Step 5 — Execute

- **Dry-run first on exactly one item**, then verify that one item guest-side (Step 6) before the
  remaining N−1. A mechanism that works on item 1 and fails on item 2 is far cheaper to discover
  at N=1.
- Keep a per-item result record on disk: id, title, HTTP status, resulting state, and **the id of
  whatever you would need to undo it**. Without the undo id, the action is not reversible in
  practice even if it is in theory.
- Pace the calls (a small delay between items) and never parallelise a write batch against a live
  system.
- Tally the outcomes by status and print every item that did not reach the intended state. Zero
  silent drops.

## Step 6 — Verify from the outside, five ways

The write's own `201` proves nothing about what the public sees. All five, every time:

| layer | check | pass = |
|:--:|---|---|
| **1** | the write response per item | intended terminal state on every item, none missing |
| **2** | the public list endpoint, unauthenticated | the batch's `total` is `0` |
| **3** | every item's detail endpoint, unauthenticated — **all of them, not a sample** | the expected refusal code (in OLS `409`) on every id |
| **4** | the whole catalogue count before vs after | drops by **exactly** the batch size — proves nothing outside scope moved |
| **5** | the real page as a guest, screenshotted | the empty-state string renders; send the image to the user |

Layer 4 is the one that catches collateral damage, and it is the one people skip.

## Step 7 — Report, evidence, and memory

- Send the guest screenshot in chat (`SendUserFile`), captioned with environment, route, account
  state (guest) and timestamp.
- Report the mechanism used, the exact reason/justification recorded in the system, the counts at
  every verification layer, and **what is still outstanding** — including any earlier attempt that
  left residue (an abandoned case, a spent report slot) even when it has no user-visible effect.
- State the rollback call explicitly, with the ids needed to run it.
- Write what was learned to agent memory — endpoint shapes, role powers, traps — and put real
  hosts/accounts/ids only in the local secrets store, never in this repo.

## Step 8 — Rollback readiness

Before you call the job done, be able to answer: *if the user asks tomorrow to put all of this back,
what exactly do I run?* In OLS that is an admin account issuing
`POST /api/content-moderation/cases/{caseId}/decisions {action:'UNFLAG', note}` per case, or the
owner issuing `republish` — either way you need the per-item ids from Step 5 on disk.

If the batch cannot be restored by any call available to the accounts you hold, say that **before**
executing, not after.

## MUST NOT

- Start without an explicit instruction naming the set, or with an unconfirmed environment.
- Attempt the accusatory mechanism before the reversible ones have been proven unavailable **by a
  real call**.
- File a report at a severity chosen for its effect while knowing the label is untrue, without the
  user's informed, restated approval.
- Report success from the write responses alone, or from a sampled subset of the batch.
- Present a screenshot of an empty page as proof of a state you have not confirmed via the API.
- Hide an item you know is broken without first surfacing that defect.
- Write real hosts, emails, credentials, or resource ids into this repo.
