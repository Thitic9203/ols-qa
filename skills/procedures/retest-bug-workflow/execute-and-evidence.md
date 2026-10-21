# Retest bug — execute and evidence (Steps 4–5, result quality gate)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read in run order after Step 3.

## Contents

- [Step 4 — Login and test \[low freedom\]](#step-4--login-and-test-low-freedom)
  - [4a. Environment](#4a-environment)
  - [4b. Login](#4b-login)
  - [4c. Test data](#4c-test-data)
  - [4d. Design comparison + depth sweep (mandatory for every UI case, PASSED ones included)](#4d-design-comparison--depth-sweep-mandatory-for-every-ui-case-passed-ones-included)
  - [4e. API testing](#4e-api-testing)
  - [4f. Swagger comparison](#4f-swagger-comparison)
  - [4g. Entry-point coverage + settle + contradiction gate (mandatory for every non-PASSED item)](#4g-entry-point-coverage--settle--contradiction-gate-mandatory-for-every-non-passed-item)
  - [4h. Root-cause investigation (mandatory for every non-PASSED item — run it before Step 6)](#4h-root-cause-investigation-mandatory-for-every-non-passed-item--run-it-before-step-6)
  - [4i. Challenge the non-PASS + surface it to the user (mandatory for every non-PASSED item — before Step 6)](#4i-challenge-the-non-pass--surface-it-to-the-user-mandatory-for-every-non-passed-item--before-step-6)
- [Step 5 — Evidence \[medium freedom\]](#step-5--evidence-medium-freedom)
  - [API bugs](#api-bugs)
  - [FE bugs](#fe-bugs)
  - [5c. Reconcile the plan against what was captured (numbered, mandatory)](#5c-reconcile-the-plan-against-what-was-captured-numbered-mandatory)
- [Result quality gate (mandatory before the comment is drafted) \[low freedom\]](#result-quality-gate-mandatory-before-the-comment-is-drafted-low-freedom)

---

## Step 4 — Login and test [low freedom]

**The sub-steps are in the order they happen.** 4a–4d set up and observe **while the surface is
still open** — a screen not compared while it was open cannot be compared later, and a boundary
not captured during the run cannot be reconstructed afterwards. 4e–4f are the API legs. 4g–4i are
the gates that follow a case that did not pass. Nothing in 4d is deferred to drafting time.

**Parallel lanes (default).** Dispatch the planned lanes at once — after any parent pre-login for
accounts sharing one OTP inbox (§3), one subagent per lane, all in a single message, each with the lane prompt from
[parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §5. Each lane runs 4a–4h on its
own cases with **only its leased account** and records the authenticated user id at login; barrier
cases run alone after the lanes return. The parent then runs the §6 merge (isolation · coverage ·
evidence) and does 4i on every non-PASS itself before Step 5. Lanes never post, transition, assign,
or notify.
**Session lease per lane.** If the workspace provides a session-lease tool (see project guide), each
lane acquires the lease on its account before loading the login file, renews it on long runs, and
releases it in `finally` — the §5 lane prompt carries those lines (or `LEASE-HELD-BY-PARENT` when the
parent holds the lease). Never load a login file without a lease. Each lane also runs every driver or
browser script under a hard time limit and leaves no process of its own running when it returns, and
the §6 merge runs the leftover-process check for the round's account tags (§5/§6). The §6 merge adds the lease check:
none held by this round (`tools/lane-lease-check/` where the workspace carries it), and `run.json`
records the lanes with `lease: true` (6·0).

**Fan-out rule** ([round-time-contract.md](../../../references/round-time-contract.md) §4): fan out
whenever the round has **2 or more units**; a barrier unit still runs alone. Lane count =
min(units, accounts leasable without collision) — **no fixed cap** for this flow. Each lane **owns its
unit end to end**: execution, the 4d Figma compare, recording during execution (Step 5), the 4h
root-cause investigation and the repro shape. The main thread only merges into one report and one
bundle. Execution stays agent-driven step by step — never replaced by a scripted run.

### 4a. Environment

From config: base URL, portal, login URL for the env on the ticket.

### 4b. Login

**Main thread only, login by command**
([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §3 *Dead session*). Pick lane accounts whose sessions are live first.
Claude never opens a browser, login window or sign-in page, and never drives a login form, for any test account, whether on the main thread or in a lane (spec: login-by-command). Instead the main thread gives the user **ready-to-run commands** in chat, **one `bash` block per command**, built from the intake answers (`<project-dir>`, `<env>`, `<account>` and the relink/mint command names from the project guide or intake). The user presses Run, and Claude never runs them itself:

1. **Relink.** One block per needed account whose session is not live. This step uses no password:
   ```bash
   cd <project-dir> && <relink-command> --env <env> --account <account>
   ```
2. **Setup/mint.** Only for each account whose relink came back **FAILED**, one block for that account alone. The user types any secret in their own terminal:
   ```bash
   cd <project-dir> && <mint-command> --env <env> --account <account>
   ```
3. **Probe.** When the user says the commands have run, Claude calls the session endpoint for each account, expects that account's user id, and reports account → OK / FAILED with the reason. An account still FAILED blocks only its cases, which are reported BLOCKED ("session not restored") and never PASSED.

OTP/SSO per config, and any code is typed by the user in the mint step. If blocked → ask user for a bearer token.

**Login reuse** ([round-time-contract.md](../../../references/round-time-contract.md) §5): first load
the saved login file `{auth dir from guide}/{env}-{role}-{alias}.json` — named by account, not by lane,
gitignored — and call the session endpoint **before any result counts**; it must return the expected
user id. On 401/403, a redirect to login, or a different user, a lane stops that account's cases and
returns `SESSION-DEAD {account tag}` — it never logs in itself; the main thread restores the account by
command as above. One account belongs to one lane, never shared across concurrent sessions.

### 4c. Test data

**Never stop with "no data to test."** Try in order:

1. Use existing records (list APIs).
2. Create data via API (POST) with clear test naming.
3. Clone and modify an existing record.
4. Ask the user only for data you cannot synthesize.

Do not modify unrelated production records; record IDs you create.

**This is setup only — the boundary is strict.** Creating data via API is allowed to reach a case's
**precondition**. The **action under test** is never performed via API: run it through the ticket's
real Test Steps (UI bug → through the UI). For an API-layer bug, the API call in Step 4e *is* the real
step. See [test-through-real-steps.md](../../../references/test-through-real-steps.md).

### 4d. Design comparison + depth sweep (mandatory for every UI case, PASSED ones included)

Run this **as each case is executed**, not while drafting.

**Dedupe, never thin** ([round-time-contract.md](../../../references/round-time-contract.md) §7): one
compare per **screen × width** per round — cases landing on the same screen share one fresh app capture
and one design read. The design-side export (node screenshot + metadata) is cached keyed by the Figma
file's `lastModified` and re-fetched only when it changes; the app-side capture is always fresh. The
compare itself stays full — all five points below.

1. **Compare the captured screen against its design node** on all five points —
   elements present · text char-exact · order/position · the states the node defines · no overflow and
   no overlap ([figma-design-comparison.md](../../../references/figma-design-comparison.md) §3). Record
   the node link on the header's `Design ref:` line.
2. **Measure, do not eyeball, the layout checks** — overflow is `rect.right > window.innerWidth` or
   `document.documentElement.scrollWidth > window.innerWidth`; overlap is two text rectangles
   intersecting by more than ~3 px. Do this at **every in-scope width**, both sides of any breakpoint
   the spec names.
3. **Verify values, not just presence** — each displayed value is checked against its source (API
   field, record, count), not merely observed to exist.
4. **Report anything wrong you see, even when no expected asked for it** — as its own row where it
   belongs to the contract, otherwise as a noted observation with evidence. Seeing a defect and not
   writing it because "the expected didn't ask" is a recorded escape cause
   ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §2).
5. **A difference is not yet a defect.** App-vs-design differences go through Step 4i; a screen this
   very ticket intentionally changed is **design out of date** (report it, name the design owner, ask
   for the node update in this ticket) rather than a bug, and an AC revised mid-test to match the build
   is an **accepted limitation** that the verdict line must spell out (§5–§6 of the same reference).

### 4e. API testing

Use `fetch` with **full URLs**. Patterns: baseline, bug case from ticket, edge cases if relevant.

### 4f. Swagger comparison

Load OpenAPI/Swagger from config URL.

| Check | Result |
|-------|--------|
| Code matches Swagger | Continue |
| Code mismatch | FAILED |
| Code OK, message mismatch vs error docs | FAILED |
| Swagger + docs silent | BLOCKED |

Swagger is source of truth — not stale ticket text alone.

### 4g. Entry-point coverage + settle + contradiction gate (mandatory for every non-PASSED item)

Follow [defect-report-completeness.md](../../../references/defect-report-completeness.md) §2–§3. Three things happen **during the run**, not while drafting — you cannot reconstruct them later:

1. **Exercise every entry point, one at a time.** For a UI defect that means at minimum: the direct URL/route **and** the in-app path a real user takes to the same surface (list card, menu, CTA, deep link). Capture a separate screenshot per entry point (each becomes an `Evidence`-cell image), and name the exercised paths in the `Fixture` line; a path you did not exercise is **never inferred from another path** — don't claim it.
2. **Settle after every state change.** After a fixture step that changes server state (publish / unpublish / approve / delete / role change), hard-reload each surface before observing it. A view that was already open holds pre-change data; recording it is reporting your own test timing as the product's behavior. A stale window worth reporting is a **separate timing note** with the measured delay — not a verdict row.
3. **Resolve contradictions before drafting.** If two of your observations of the same surface disagree, name the contradiction, re-run that surface cleanly, and record which observation was the artifact and why. Never resolve it in favour of the verdict you already have. Unresolvable after a clean re-run → that item is **BLOCKED**, not FAILED.

**Go back:** If an entry point was not exercised or a contradiction is still open, return to Step 4 — Login and test for that surface; Step 6 does not start on it.

### 4h. Root-cause investigation (mandatory for every non-PASSED item — run it before Step 6)

Follow [root-cause-investigation.md](../../../references/root-cause-investigation.md) end to end — the
debugging skill (§0), the 8-boundary evidence sweep (§1), compare against something that works (§2),
one falsifiable hypothesis at a time (§3), and a confidence label (§4). The reference is the single
source for those steps; do not paraphrase them here.

What is specific to retest:

- **Run it while the environment is still open.** A boundary you did not capture during the run
  cannot be reconstructed while drafting; reconstructing it is guessing.
- **Skip Phase 4 of the debugging skill** — QA does not patch product code.
- **The investigation block goes into the comment** at Step 6a, not only into chat.
- **BLOCKED is not an escape from this step.** A BLOCKED item still records the sweep up to the
  boundary that blocked it, and names the access or person needed to continue.

### 4i. Challenge the non-PASS + surface it to the user (mandatory for every non-PASSED item — before Step 6)

Follow [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) end to end, **before
the draft exists** — name the discrepancy (§1), re-verify the expected side against an authoritative
source including related tickets' AC/EC (§2, and its three outcomes), rule out a test-side cause (§3),
then surface it (§4). The reference is the single source for those steps.

What is specific to retest:

- **The primary contract is the bug's own Expected Result** (Step 2), read char-exact, cross-checked
  against the parent story's AC/EC, every linked issue, and sibling tickets on the same surface.
- **Surface it at the end, not mid-run** — record `expected (+source) · observed · AC/EC finding ·
  recommendation (A adjust the expected/TC · B re-test · C confirm defect)` and queue it for the Step 6d
  decisions popup ([round-time-contract.md](../../../references/round-time-contract.md) §2). Picking
  **B re-test** there starts a new round (§1).
- **Superseded bug ER → no "confirm defect" option (owner, 2026-10-14).** When the bug's own Expected
  Result was superseded by a later ticket, comment or design (quote the superseding source char-exact),
  the end menu offers only **A adjust the expected/TC · B re-test** — never **C confirm defect**, because
  there is no confirmed spec left for the defect to differ from.
- **Never edit the ticket's expected-result field** to match the app on your own — QA reports the
  conflict and names the owner.

**Default while the question is queued (attended and unattended / bot mode alike):** resolve the gate
instead of waiting. Expected wrong/unclear, sources disagree, data missing, or "needs a decision" →
run the **[no-wait decision gate](../../../references/no-wait-decision-gate.md) (20 layers)** and
decide from evidence: read every source, apply precedent and standing decisions, create the missing
data, and write the decision log. BLOCKED only for the layer-17 causes, with the layer-18 record.
Test-side cause → fix and re-run; confirmed defect → draft the comment as normal. Only what no layer
can resolve is queued; unattended runs put it in the run's report.

**Go back:** A test-side cause returns the item to Step 4 — Login and test (fix and re-run); a **B re-test** answer in the Step 6d popup returns to Step 2c — a new round.

---

## Step 5 — Evidence [medium freedom]

### API bugs

- Full cURL (method, URL, headers, body) per case — no "same as above"
- Full response (status, headers, body)
- Swagger link for the endpoint
- Dates in headers as YYYY-MM-DD

### FE bugs

**Whole-flow MP4 per case — same capture format as the story-testing flow — attached to the Jira issue and referenced in the comment (NOT Google Drive).**

**Record during execution** ([round-time-contract.md](../../../references/round-time-contract.md) §8):
the lane run that executes the case **is** the recording — there is no separate capture pass after the
run. The 7 layers below are unchanged: every clip still clears all 7, and a red layer still means
re-capture and re-run all 7.

- **Record a whole-flow MP4 for every executed case, and for every role the case or the bug detail names** (drive the case's real steps end-to-end, same capture the story-testing flow uses). 5 roles named = 5 clips, named `{KEY}_TC_{nn}_{ROLE}.mp4`; a role you could not exercise is a **BLOCKED row naming that role and the blocker**, never "same as the other role". The MP4 is the retest evidence — it replaces the former screenshot-only rule. Record with the QA toolkit's `capture/qa_recorder.js` (never Playwright `recordVideo`) — it writes the provenance manifest and runs `capture/verify_video.py` on the clip before it returns. Every clip MUST clear the **[MP4 7-layer quality + correctness gate](../../../references/qa-evidence-gates.md)** (the capture spec — 1920×1080, dsf 2, CRF 18 preset slow, yuv420p limited-range, steady picture, provenance manifest; **never Playwright `recordVideo`**, whose 1 Mbps VP8 cap makes the picture pump and whose fixed-grid padding makes it judder; the flow reaches the stated target — "scroll to menu XX" must actually arrive, never cut early; the Expected Result is visible on screen) — fail-closed: a blurry / skipped / early-cut clip = re-capture, the case is not done.
- **Text-verification case → screenshot AS WELL as the MP4.** When a case verifies exact wording / label / message / count / displayed values (anything judged char-exact against the bug's Expected Result), also embed a still screenshot inline so the exact text is legible in a frame — the row then carries **both** the MP4 link and the `!png!` image. A non-text case carries the MP4 only.
- **Destination = the Jira issue, in the comment.** Upload every file (MP4 + any screenshot) as an **issue attachment**, then reference it in the verdict table's `Evidence` cell (the column between `Actual Result` and `Status`). A retest never writes to Google Drive — that is the story/bot flow, not this one.
- **Naming (reuse the story convention):** `{KEY}_TC_{nn}.mp4` for the clip, `TC_{nn}-ER_{n}.png` for a text still — **and when the case covers more than one role, every file for it carries the role**: `{KEY}_TC_{nn}_{ROLE}.mp4`, `TC_{nn}_{ROLE}-ER_{n}.png`. One rule, same as the [story gate](../../../references/qa-evidence-gates.md); the `Evidence` link must use the name the file was **actually attached** under.
- Max ~3 bullets per case in the comment.
- **In-cell embedding (mandatory):**
  - **MP4** → attach, then link it in the `Evidence` cell as a wiki attachment link `[▶ {KEY}_TC_{nn}.mp4|^{KEY}_TC_{nn}.mp4]` — **with the role suffix when the case has one** (`[▶ {KEY}_TC_{nn}_{ROLE}.mp4|^{KEY}_TC_{nn}_{ROLE}.mp4]`); the link text and the attachment name must both be the name the file was uploaded under, or gate layer 7 fails on a link that resolves to nothing. (An MP4 cannot render as an inline picture in a wiki cell — a working attachment link that plays/downloads from Jira is the requirement.)
  - **screenshot** (text-verification rows) → reference as `!filename.png!` with **no `|width=…` parameter**. Inside a wiki table cell the `|` in `!img|width=N!` collides with the cell delimiter and splits the row, so resize the image **before** upload (~600–640 px wide) and embed it bare. It MUST render as a picture inside the cell — never filename-only text.

**Upload + embed flow:**
1. Save the MP4 (and any text-verification screenshot, resized to ~600–640 px wide via `sips -Z 640 in.png --out out.png`) to a scratch dir outside the repo.
2. Upload each file: `POST /rest/api/3/issue/{KEY}/attachments` with `X-Atlassian-Token: no-check` (curl `-u email:token`, or authenticated browser fetch).
3. In the `Evidence` cell of the verdict table: the MP4 link `[▶ …mp4|^…mp4]`, plus `!filename.png!` on text-verification rows — one case per row.

---

### 5c. Reconcile the plan against what was captured (numbered, mandatory)

**When the workspace provides an evidence reconciler**, run it over this ticket's plan **before
drafting** and treat its exit code as the result. Where it does not, the same reconciliation is done
by hand — every planned file opened, not counted:

```
capture/evidence_plan.py <KEY>                                    # the required file list, from the ticket
capture/evidence_reconcile.py <KEY>_evidence_plan.json --dir out/ [--jira]
```

It opens and measures every file rather than counting names, and with `--jira` it fetches each
attachment from the ticket so "the link resolves" stops being a claim. Contracts (arguments, exit
codes, manifest names) are pinned in
the workspace's `references/qa-capture-tooling.md`; a tool that cannot run is a
**stop**, never a silent pass. A file the reconciler cannot find is a BLOCKED row with its reason,
never a row quietly dropped.

**Go back:** If the reconciler exits non-zero or a planned file is missing, return to Step 5 — Evidence and capture it, or record the BLOCKED row with its reason. The Step 6 draft waits for a clean reconcile.

---

## Result quality gate (mandatory before the comment is drafted) [low freedom]

Run [result-quality-gate.md](../../../references/result-quality-gate.md) — all 20 layers, every case, PASSED
ones included — **before the Step 6 draft, the Step 9 notify, or any status transition**. Write one final result line per case (older lines marked
`superseded`), run the mechanical layers with the workspace's checker when it has one, walk the
judgement layers, and paste the checker's last output line (or the counted hand check) into the
round's record. A red layer blocks that case's verdict: report the case as what it really is
(usually BLOCKED with the reason), never drop it and never soften the layer. A lane's "gate green"
is a claim — the main thread re-runs the gate itself (layer 20).

**Go back:** A layer red for missing or wrong evidence returns that case to Step 5 — Evidence (Step 4 — Login and test when the case must be re-run); if it cannot be fixed, report the case as BLOCKED with the reason.

**Source sweep before any BLOCKED, FAILED or "ask the PO / reporter" outcome** (layer 14 of
[result-quality-gate.md](../../../references/result-quality-gate.md)): read the product code at the default
branch with `path:line` including its inline comments and `git log -L` / blame on those lines, the
main ticket's description and every comment, the surrounding tickets (parent / epic, linked,
sibling stories on the same screen or API, and every ticket the commit messages name), the
regression results, and the design node; if data is missing, try to create it first. Quote each
source on the verdict line (`code_refs`, `ticket_refs`). Never conclude "cannot be done", "wrong"
or "wait for someone" before this sweep is written down.

**Required output when defects are found — never auto-file.** The round's report carries the two
tables in [result-quality-gate.md](../../../references/result-quality-gate.md) § *Required output
when the round finds defects*: **Defect candidates — NOT filed** (Ticket · TC/ER point · Actual ·
Expected · Requirement reference with char-exact quote · Evidence: still + accepted clip (layer 10) + capture
manifest · Root cause `path:line` · Priority per
[bug-priority-matrix.md](../../../references/bug-priority-matrix.md) · Status "Not filed yet", in a
Thai report "ยังไม่ได้เปิดบั๊ก"), holding only rows whose expected side is a confirmed spec; and
**Needs PO decision** for spec conflicts, quoting both sources. Filing waits for the owner. Use the
exact shape in [defect-candidates.md](../../../references/output-templates/defect-candidates.md),
ending with its fixed owner question when the candidate table has at least one row.
