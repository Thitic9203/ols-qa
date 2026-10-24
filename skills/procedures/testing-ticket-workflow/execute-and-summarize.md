# Testing ticket — execute and summarize (Phase E, result quality gate, Phase F)

Part of [WORKFLOW.md](WORKFLOW.md). Sections moved verbatim; read in run order after Phase D.

## Contents

- [Phase E — Execute tests (Playwright) \[low freedom\]](#phase-e--execute-tests-playwright-low-freedom)
  - [E0 — Design comparison + depth checks (every scenario, PASSED ones included)](#e0--design-comparison--depth-checks-every-scenario-passed-ones-included)
  - [E1 — For every FAILED scenario, capture the repro shape *during the run*](#e1--for-every-failed-scenario-capture-the-repro-shape-during-the-run)
  - [E2 — Root-cause investigation (mandatory for every FAILED and BLOCKED scenario, during the run)](#e2--root-cause-investigation-mandatory-for-every-failed-and-blocked-scenario-during-the-run)
  - [E3 — Challenge the non-PASS + queue it for the user (mandatory for every non-PASSED scenario)](#e3--challenge-the-non-pass--queue-it-for-the-user-mandatory-for-every-non-passed-scenario)
- [Result quality gate (mandatory before Phase F) \[low freedom\]](#result-quality-gate-mandatory-before-phase-f-low-freedom)
- [Phase F — Summarize in this chat (mandatory) \[high freedom\]](#phase-f--summarize-in-this-chat-mandatory-high-freedom)
  - [F1 — Executive summary](#f1--executive-summary)
  - [F2 — Results table](#f2--results-table)
  - [F3 — Defects observed (if any)](#f3--defects-observed-if-any)
  - [F4 — Reader gate (MUST pass before Phase G)](#f4--reader-gate-must-pass-before-phase-g)
  - [F5 — End of round (fixed order)](#f5--end-of-round-fixed-order)

---

## Phase E — Execute tests (Playwright) [low freedom]

Run the planned scenarios; record **PASSED** / **FAILED** / **BLOCKED** / **NOT TESTED** with evidence (screenshots, console, network).
**Open every evidence file you cite, this round** — view each still, play each clip to its last frame — before it backs a verdict; a `verify.json`, a checker line or `file` output is not opening it ([qa-evidence-gates.md](../../../references/qa-evidence-gates.md) § *Pre-delivery completeness*).

Phase E runs in this order; each step names its output:

- **E-a Dispatch lanes** — output: one lane prompt per lane, sent in a single message (*Fan out* below).
- **E-b Lease + session preflight per lane** — output: each lane's lease and its authenticated user id (*Session lease per lane* below; Phase D).
- **E-c Execute per AC/EC id** — output: one result row per id, with evidence (*Real surface* and *Cover every enumerated AC/EC id* below), then E0–E2 per scenario inside the lane.
- **E-d Merge** — output: one report and one bundle after the §6 merge checks, including *Lane failure* below; then E3 on every non-PASS.

**Fan out whenever the plan has 2 or more units** ([round-time-contract.md §4](../../../references/round-time-contract.md)) —
dispatch the planned lanes at once, after any parent pre-login for accounts sharing one OTP
inbox (§3), one subagent per lane, all in a single message, each
with the lane prompt from [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §5.
Lane count = min(units, accounts leasable without collision); **no fixed lane cap** for this flow.
**Each lane owns its unit end to end:** execution, the E0 Figma compare, recording during execution
([round-time-contract.md §8](../../../references/round-time-contract.md) — the run that executes the
case is the recording; every clip still passes all 7 layers), the E1 repro shape, and the E2 root
cause. Barrier units run alone after the lanes return. The **main thread only merges** — it runs the
§6 merge (isolation · coverage · evidence) into one report and one bundle, and applies E3 (default +
queue) on every non-PASS before Phase F. Execution stays agent-driven, step by step. Lanes never post
or update anything outside the run.

**Session lease per lane.** If the workspace provides a session-lease tool (see project guide), each
lane acquires the lease on its account before loading the login file, renews it on long runs, and
releases it in `finally` — the §5 lane prompt carries those lines (or `LEASE-HELD-BY-PARENT` when the
parent holds the lease). Never load a login file without a lease. Each lane also runs every driver or
browser script under a hard time limit and leaves no process of its own running when it returns, and
the §6 merge runs the leftover-process check for the round's account tags (§5/§6). The §6 merge adds the lease check:
none held by this round (`tools/lane-lease-check/` where the workspace carries it).

**Lane failure (a lane returns no result, exceeds its hard time limit, or its Playwright runner
crashes).** The main thread stops that lane's leftover processes for its account tag, releases its
lease, and re-dispatches that unit **once** on a fresh lease. A second failure → every case of that
unit with no reported result becomes a **BLOCKED** row (`lane did not return` + the lane's log path)
and goes through E2 like any other BLOCKED case. A lane's cases are never dropped, never inferred from
another lane, and never PASSED without the lane's own result line. A lane that returns `SESSION-DEAD`
follows Phase D *Fresh login* instead.

Drive every scenario through its **real surface** — a UI scenario through the UI (Playwright clicks the
button / submits the form), following the case's steps completely. The API is for test-data /
precondition setup only, **never** to perform the action under test; an API scenario is driven at the
API. See [test-through-real-steps.md](../../../references/test-through-real-steps.md).

**Cover every enumerated AC/EC id (coverage gate layers 3–5).** Exercise each `AC*/EC*` id on its
real surface — never infer one from a sibling, never assume it covered because the happy path passed.
An id you cannot reach is an **explicit BLOCKED row** with the reason, never left off the table. Record
each id's result as its **own row** (layer 4 — row, never a remark); a case is **PASSED only when every
id it covers met its expected** (layer 5), and an id observed to differ makes that a FAILED/PWMI/BLOCKED
row for that point — never a PASS with the exception noted below the table.

Internal failures: note for chat summary only — **do not create Jira/GitHub issues in this workflow.**

### E0 — Design comparison + depth checks (every scenario, PASSED ones included)

Run this **as each scenario executes**, not while writing Phase F.

1. **Compare the screen against its design node** on all five points — elements present · text
   char-exact · order/position · the states the node defines · no overflow and no overlap
   ([figma-design-comparison.md](../../../references/figma-design-comparison.md) §3). Record the node
   link opened on the report header's `Design ref:` line (F2 — no design-node column). **Dedupe, never shorten** ([round-time-contract.md §7](../../../references/round-time-contract.md)):
   one compare per screen × width per round — cases on the same screen share one fresh app capture and
   one design read; cache the design-side export (node screenshot + metadata) keyed by the Figma file's
   `lastModified` and re-fetch only when it changes. The app-side capture is always fresh, and the
   compare still covers all five points.
2. **Measure the layout checks, do not eyeball them** — overflow is `rect.right > window.innerWidth` or
   `document.documentElement.scrollWidth > window.innerWidth`; overlap is two text rectangles
   intersecting by more than ~3 px. Run them at **every in-scope width**, and on both sides of any
   breakpoint the spec names.
3. **Check values against their source**, not just their presence — each displayed value against the
   API field / record / count it comes from.
4. **Exercise the states in scope** (empty · loading · error · over-limit · disabled), not only the
   happy state.
5. **Report anything wrong you see, even where no AC asked for it** — as its own row where it belongs
   to the contract, otherwise as a noted observation with evidence
   ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §2).
6. **A difference is not yet a defect** → E3. A screen this ticket intentionally changed is **design
   out of date** (report it, name the design owner, ask for the node update in this ticket), and an AC
   revised mid-test to match the build is an **accepted limitation** the verdict line must spell out
   (§5–§6 of the same reference).
7. **No design node for this screen** → it was already reported back to the assigner in Phase B; keep
   its visual points **BLOCKED** with that remark. Never upgrade them to PASSED because the function
   worked.

### E1 — For every FAILED scenario, capture the repro shape *during the run*

These three cannot be reconstructed while writing Phase F — do them before moving to the next scenario
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §2–§3):

1. **Every entry point, one at a time.** Reach the failing surface by the direct route **and** by the
   in-app path a real user takes (list card, menu, CTA, deep link). One screenshot per path, one
   **repro-matrix row** per path. A path you did not exercise is recorded `not tested` — never inferred
   from another path, never silently dropped.
2. **Settle after every state change.** After a fixture step that changes server state (publish /
   unpublish / approve / delete / role change), hard-reload each surface before observing it. An
   already-open view holds pre-change data; recording it reports your test timing as the product's
   behavior. A stale window worth reporting is a **separate timing note** with the measured delay.
3. **Resolve contradictions before writing anything down.** If two of your observations of the same
   surface disagree, name it, re-run that surface cleanly, record which was the artifact and why. Never
   resolve it in favour of the result you already wrote. Unresolvable after a clean re-run → **BLOCKED**,
   not FAILED.

### E2 — Root-cause investigation (mandatory for every FAILED and BLOCKED scenario, during the run)

Follow [root-cause-investigation.md](../../../references/root-cause-investigation.md) end to end — the
debugging skill (§0), the 8-boundary evidence sweep (§1), compare against something that works (§2),
one falsifiable hypothesis at a time (§3), and a confidence label (§4). The reference is the single
source for those steps; do not paraphrase them here.

What is specific to testing a ticket:

- **Run it before moving to the next scenario** — the browser, the session and the fixture state are
  open now and cannot be reconstructed in Phase F.
- **Skip Phase 4 of the debugging skill** for product code; repairing our own test, selector, fixture
  or environment is in scope. Name the skill in the write-up.
- **A test-side cause counts too, and is stated as such** — selector drift, stale auth, missing
  fixture, VPN. Fix our side, re-run, and record it as a test defect, never as a product FAILED
  ([qa-debug-discipline.md](../../../references/qa-debug-discipline.md)). Never the reverse: a real
  product bug is never filed away as "flaky".
- **BLOCKED is not an escape.** A BLOCKED scenario still records the sweep up to the boundary that
  blocked it and names the access or person needed to continue.

### E3 — Challenge the non-PASS + queue it for the user (mandatory for every non-PASSED scenario)

Follow [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md) end to end, **before
the scenario is written into Phase F as a defect** — name the discrepancy (§1), re-verify the expected
side against an authoritative source including related tickets' AC/EC (§2, and its three outcomes),
rule out a test-side cause (§3), then surface it (§4). The reference is the single source for those
steps.

What is specific to testing a ticket:

- **The contract is this ticket's Expected/AC/EC and the test case's own source**, read char-exact and
  cross-checked against the parent story, every linked issue, and sibling tickets on the same surface.
- **Apply the gate's default and keep running — no mid-run wait**
  ([round-time-contract.md §2](../../../references/round-time-contract.md)): expected wrong/unclear,
  sources disagree, data missing, or "needs a decision" → run the
  **[no-wait decision gate](../../../references/no-wait-decision-gate.md) (20 layers)** and decide from
  evidence (every source read, precedent applied, missing data created, decision logged); BLOCKED only
  for its layer-17 causes with the layer-18 record. Test-side cause → fix and re-run; confirmed defect →
  record as normal. Only what no layer can resolve is queued. Queue `expected (+source) · observed · AC/EC finding · recommendation (A adjust the TC ·
  B re-test · C confirm defect)` for the end decisions popup; a **B re-test** answer starts a new round
  ([§1](../../../references/round-time-contract.md)).
- **Never rewrite the ticket's expected text** to match the app on your own.

**Go back:** A test-side cause returns that scenario to Phase E (fix and re-run on its real surface); a **B re-test** answer in the F5 popup returns to Phase C — a new round.

---

## Result quality gate (mandatory before Phase F) [low freedom]

Run [result-quality-gate.md](../../../references/result-quality-gate.md) — all 20 layers, every case, PASSED
ones included — **before any result is summarized in Phase F or written in Phase G**. Write one final result line per case (older lines marked
`superseded`), run the mechanical layers with the workspace's checker when it has one, walk the
judgement layers, and paste the checker's last output line (or the counted hand check) into the
round's record. A red layer blocks that case's verdict: report the case as what it really is
(usually BLOCKED with the reason), never drop it and never soften the layer. A lane's "gate green"
is a claim — the main thread re-runs the gate itself (layer 20).
The mechanical (**M**) and judgement (**J**) layers are listed by kind in the reference; the
mechanical ones run with `node tools/result-gate/check.js` where the workspace carries it. Gate time is
AGENT+EXEC time: it counts toward the round's `Round time:` line, and an overrun is reported there —
never hidden by skipping or sampling a layer.

**Go back:** A layer red for missing or unopened evidence returns that case to Phase E to capture it again; if it cannot be fixed, report the case as BLOCKED with the reason. Phase F waits until every case has a final line.

**Source sweep before any BLOCKED, FAILED or "ask the PO / reporter" outcome** (layer 14 of
[result-quality-gate.md](../../../references/result-quality-gate.md)): read the product code at the default
branch with `path:line` including its inline comments and `git log -L` / blame on those lines, the
main ticket's description and every comment, the surrounding tickets (parent / epic, linked,
sibling stories on the same screen or API, and every ticket the commit messages name), the
regression results, and the design node; if data is missing, try to create it first. Quote each
source on the verdict line (`code_refs`, `ticket_refs`). Never conclude "cannot be done", "wrong"
or "wait for someone" before this sweep is written down.

**Required output when defects are found — never auto-file.** The round's report carries the two
tables of [result-quality-gate.md](../../../references/result-quality-gate.md) § *Required output
when the round finds defects*, as templated in **F3** — never as bullets or prose — and the owner is
asked, per candidate, whether to file it (F5 step 2).

## Phase F — Summarize in this chat (mandatory) [high freedom]

Always post a clear summary **in the same conversation** before anything else:

### F1 — Executive summary

2–4 sentences: overall result, pass/fail counts, blockers.

### F2 — Results table

```text
| # | Scenario | AC/EC id | Width | Result | Evidence |
|---|----------|----------|-------|--------|----------|
| 1 | ...      | AC1      | 1280  | PASSED | shot-01.png |
| 2 | ...      | AC2 / EC1| 375   | FAILED | shot-02.png |
```

**Every row carries evidence — passed rows included** (`count(passed rows) == count(evidence
references)`). 🔴 **No design-node column** — the design reference is one fact about the round, not a
per-row fact: it goes on the report header's `Design ref:` line (the node URL, or the Phase B
BLOCKED-with-reason when none exists), never repeated down every row. Removed on user instruction
2026-08-25. A
run whose passed rows have no evidence cannot be re-examined later, which is how layout defects
survived a green round and reached the customer
([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §7). `Width` is
the screen width the row was run at; a scenario in scope at two widths is two rows.

**Every enumerated AC/EC id has a row here (coverage gate layer 4·6).** The table — not the Notes
column, not a remark below it — is where each AC/EC result lives. If an AC/EC point matters, it is a
row with its own verdict; it is **never** parked in Notes/remark/chat while the case reads PASSED.

### F3 — Defects observed (if any)

Report defects **without filing them**, as these two tables (bullets or prose do not count):

**Defect candidates — NOT filed** (only rows whose expected side is a confirmed spec)

| Ticket | TC / ER point | Actual | Expected | Requirement reference (source + char-exact quote) | Evidence (still + accepted clip, layer 10, + capture manifest) | Root cause `path:line` | Confidence | Priority ([matrix](../../../references/bug-priority-matrix.md)) | Status |
|---|---|---|---|---|---|---|---|---|---|
| `{ISSUE_KEY}` | `TC_nn` · `ER_n` | … | … | AC id / design node / PO comment id: "…" | … | … | Confirmed | … | Not filed yet (Thai: ยังไม่ได้เปิดบั๊ก) |

**Needs PO decision** — `| Ticket | TC / ER point | Source 1 + char-exact quote | Source 2 + char-exact quote | Observed |`, one row per spec conflict; the case stays BLOCKED.
Follow the template and example in [defect-candidates.md](../../../references/output-templates/defect-candidates.md):
when the candidate table has at least one row, the report ends with its fixed owner question
`Open bugs for the <N> candidate(s) above? (Yes → create-bug for all · Choose rows · No)` — filing
starts only after the owner answers.
The **Confidence** column carries the E2 label — `Confirmed` / `Suspected` / `Unknown — not
investigated` — and it describes the **cause**, not how strongly you feel about the defect.

**The `Priority` column is judged only by the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md)** — match the observed defect to its row, never invent a severity/priority
notion. Cheat-sheet (full matrix + hard rule at the link):

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

**Each defect row expands into a complete write-up** — this is what gets pasted into a bug, a Jira
comment, or a sheet cell later, so it must stand alone
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §1–§4 and
[root-cause-investigation.md](../../../references/root-cause-investigation.md) §5):

| Block | Content | Answers |
|-------|---------|---------|
| **Repro matrix** | one row per entry point exercised: entry point · steps · observed · reproduces? · evidence file; untried paths `not tested` | "does this only happen from a direct URL?" |
| **Expected vs Actual** | the failing acceptance/expected line **quoted verbatim**, then *should be* vs *is now* as implementable facts (which elements render, which are disabled, which route) | "what should it look like, and which line did I break?" |
| **Root cause** | the E2 investigation block verbatim: one-sentence cause + `Confirmed`/`Suspected`/`Unknown — not investigated` label, the skill used, the 8-boundary evidence lines, hypotheses ruled out, and (Suspected) the check that would confirm it | "why does it happen, which layer do I open, and how sure are you?" |
| **Resolution options** | when the behavior deviates from the written expectation but the feature otherwise works: the two mutually exclusive outcomes with a named owner each — spec owner updates the expectation (no code change) **or** dev changes `{exact route/surface}` and leaves `{what already passes}` alone | "do I change code or does the spec change, and who decides?" |

**Never rewrite the ticket's acceptance/expected text to match observed behavior.** Report the conflict and
name the decision-maker.

**Every defect row must have passed the E3 challenge gate** — its expected side re-verified against an
authoritative source (this ticket's AC/EC **and** related/linked tickets), and the discrepancy already
queued for the end decisions popup. A row whose expected turned out wrong / superseded / unclear does **not** belong
here — it is a test-case adjustment or a BLOCKED question, not a defect.

### F4 — Reader gate (MUST pass before Phase G)

Read F2 + F3 as the developer who will act on them. Run the six-question gate in
[defect-report-completeness.md](../../../references/defect-report-completeness.md) §5. Any "no" → fix the
write-up. Also confirm: every scope word (`always`, `any entry point`, `only when …`) traces to a
repro-matrix row, and no observation is under an unresolved contradiction.

**AC/EC coverage reconciliation (gate layers 6–7 — hard, fail-closed).** Reconcile the Phase B
enumerated `AC*/EC*` list against F2: **`enumerated ids == rows carrying a verdict + evidence (or an
explicit BLOCKED reason)`**. Every id appears as a row; no id lives only in a remark/Notes/chat; no row
is verdict-less; no case reads PASSED while an id it covers was untested or observed to differ. Any
shortfall ⇒ the run is **NOT complete** — go back, add the row / run the id / re-verdict the partial
case, and do **not** proceed to Phase G, report "100%/complete", or close the session until the count
is green.

**Design + depth reconciliation (same pass, fail-closed).**

- [ ] Every UI row carries a **design node link**, or the Phase B BLOCKED-with-reason naming who was
      asked for it. No UI row is PASSED on an assumed expected.
- [ ] Every in-scope width has results for every in-scope page, and the overflow/overlap checks were
      **measured** (numbers in the notes), not judged by eye. Out-of-scope widths are stated as such.
- [ ] `count(rows with a passing verdict) == count(evidence references)`.
- [ ] No row carries a passing verdict while its notes contain `caveat` / `not verifiable` /
      `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้` — those are BLOCKED, or PWMI with a bug raised.
- [ ] Anything wrong that was seen during the run is written down, including what no AC asked for.
- [ ] The surface's existing cases were covered, not only this ticket's AC lines; the build id under
      test is recorded.

Any box unchecked ⇒ the run is **not complete** — fix it before Phase G
([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) ·
[figma-design-comparison.md](../../../references/figma-design-comparison.md)).

**Go back:** A UI row with no design node returns to Phase B (design reference); an unmeasured width, a missing evidence reference or an uncovered existing case returns that row to Phase E — E0.

**Cause gate (same pass, no exceptions)** — read every sentence in F1–F3 that states or implies a
cause:

- [ ] It cites a **captured artifact** from the E2 sweep (status code, response field, console error,
      bundle probe, fixture read-back) — not a recollection, not another scenario's behaviour.
- [ ] It carries a label matching what was actually run — `Confirmed` only if the falsifying check ran.
- [ ] It contains **no hedge standing in for a cause** (`probably`, `น่าจะ`, `seems`, `flaky`,
      `cache issue`, `environment issue`, `race condition`).
- [ ] It does not restate the symptom as the cause, and `not checked` boundaries are still visible.

Any box unchecked → delete the sentence or return to E2 and earn it. Never soften it into a hedge.

If the user wants these logged as bugs:

> Say **Create bug** from `/helix`, or ask me to switch to the **create-bug-workflow**.

**The report ends with the round-time line** ([round-time-contract.md §1](../../../references/round-time-contract.md)),
measured from the session's own timestamps, never estimated:

```text
Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {max(0, n-15)} min
```

**Do not proceed to Phase G until F1–F4 are posted.**

### F5 — End of round (fixed order)

Follow [round-time-contract.md §3](../../../references/round-time-contract.md):

1. **Reviewer and bundle in parallel.** If the project names an independent reviewer subagent, start it
   in the background; meanwhile build the bundle — the render and media check
   ([§6](../../../references/round-time-contract.md)) when a comment will be posted, and the popups. The
   reviewer must return CLEAN before step 4.
2. **Decisions popup** — only when questions are queued. One structured-question popup (e.g. `AskUserQuestion`; a runtime without one uses a single numbered question list in chat), batched 4 at a time:
   the scope plan from Phase C, each queued E3 non-PASS (A/B/C), missing design, cross-ticket
   conflicts (*Investigate further* / *Close out now*), and **for every Defect-candidate row (and
   every C answer) "Open a bug for {TC/ER}?"** (*Not now — stays Not filed yet* / *Open it via
   create-bug-workflow*). Only a live *Open it* answer from the owner routes to create-bug.
3. **Apply the answers** — re-render the draft and re-run the guard.
4. **Approval popup** — one approval for the whole bundle, naming every concrete action: the comment
   (target ticket + endpoint), each external result update (destination + rows), and any notify
   (channel + resolved recipient).
5. **Execute** — Phase G4–G7 with no second approval.

No queued decisions → step 2 is skipped and the round has a single human touch.
Write `references/helix-handoff-{KEY}.md` at the close of every round with the fingerprints
([§10](../../../references/round-time-contract.md)).

**Go back:** If the reviewer returns findings, fix them and return to F5 step 1 with a fresh round; a scope correction or **B re-test** answer at step 2 returns to Phase C — a new round.

---
