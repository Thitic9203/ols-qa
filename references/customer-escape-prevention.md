# Customer-escape prevention — the gates a shipped-defect review put in writing

Applies to **every** QA run in
[testing-ticket-workflow](../skills/deprecated/testing-ticket-workflow/WORKFLOW.md) and
[retest-bug-workflow](../skills/deprecated/retest-bug-workflow/WORKFLOW.md).

These are not general good practice. Each section below is a mechanism that let a real defect reach
the customer after our own run reported the surface green, taken from the root-cause review of **25
escaped defects** on one project. The counts are kept so nobody re-argues the priority order:

| Escape mechanism | Share of the 25 | Gate |
|---|---:|---|
| A screen size / scope that our run never exercised | 7 | §4 |
| Behaviour nobody had written a requirement for | 7 | §2 · §8 |
| A ticket's result lived only in a comment, never became a re-runnable case | 3 | §1 |
| Expected result asked "is it present?" instead of "is it right?" | 2 | §2 |
| Filed against a misread or absent spec — not reproducible | 2 | §8 |
| An AC revised mid-test to match the build, passed silently | 1 (the only High) | [figma-design-comparison.md](figma-design-comparison.md) §6 |
| The design was changed but never updated, customer compared the old one | 1 | [figma-design-comparison.md](figma-design-comparison.md) §5 |
| We wrote "not independently verifiable" and recorded PASSED anyway | 1 | §3 |

Two supporting facts from the same review, because they explain the rest: evidence was attached to
**12 of 122** passed rows, and the fixture used for the whole round was one course with one media
item — a screen that small can never overflow, overlap, or need to scroll.

---

## 1. Test the surface, not only the ticket's own AC

The review's clearest case: a card component was changed, the card was tested, the card passed — the
customer opened the bug on the **detail page** that used the same component.

- When a ticket touches a screen/route/component, the run covers **every case that already exists for
  that surface**, not only the AC lines of the ticket in hand. Name the surface explicitly in the plan
  (route · page · component), then pull its existing cases in.
- A result that exists **only** as prose in a ticket comment is a result that will not be re-run. Any
  finding worth a verdict is worth a **case row** with an id, in whatever catalogue the project keeps
  ([qa-evidence-gates.md](qa-evidence-gates.md) coverage gate). This is what "the retest comment
  carries a case list" is for — the list is the artifact that survives the ticket.
- Applies to Bug **and** Task/Story retests alike: a task that changed a screen is re-verified across
  that screen, not only against the one line the task described.

---

## 2. Expected results must test "is it right", never "is it present"

An expected of the form *"the page displays the profile completely, consisting of …"* passes a screen
where every element exists and the layout is wrecked. The same screen produced five customer bugs.

**Every case on a display surface carries at least these four expected-result dimensions:**

| # | Dimension | Written as |
|---|---|---|
| 1 | Elements present | the list of elements |
| 2 | **Values correct against their source** | the exact expected value, or the source to read it from (API field, record, count) |
| 3 | **Order / position matches the design** | with the design node link ([figma-design-comparison.md](figma-design-comparison.md)) |
| 4 | **No overflow, no overlap** at the agreed widths | with the measurement, per §4 |

**Banned as an expected result, on their own:** `complete` · `correct` · `looks right` · `properly` ·
`ครบถ้วน` · `ถูกต้อง` · `สวยงาม` · `as designed`. Each must be replaced by the literal expected text,
value, order, or measurement. If you cannot write the concrete expected, you do not have one — that
is §8, not a case you can run.

**Report what you saw, even when the expected did not ask.** A wrong thing observed while checking
something else is reported (as its own row, or as a noted observation with evidence). The review found
a case where the run wrote that badges "render correctly" while the actual defect — the list needing
to scroll past its visible slots — was on screen at that moment and unremarked.

---

## 3. "Cannot verify" is never PASSED — enforced by words, not memory

The most credibility-damaging entry in the review: a case whose actual result literally read
*"Caveat: score-sort order not independently verifiable"* and whose status read **PASSED**. The
customer's bug was exactly that ordering. (The follow-up probe confirmed the ordering endpoint really
does require operator credentials — so the caveat was true, and the PASSED was indefensible.)

- If the recorded actual result contains any of `caveat` · `not verifiable` · `could not verify` ·
  `unable to confirm` · `assumed` · `ยืนยันไม่ได้` · `ตรวจไม่ได้` · `น่าจะ` — the status **may not be
  PASSED**. It is `BLOCKED` (unreachable — a coverage gap) or, where the point is minor and a bug is
  raised for it, `PASSED WITH MINOR ISSUE` per the [priority matrix](bug-priority-matrix.md).
- An expected that depends on data the UI does not show (ranking score, internal ordering, a computed
  flag) must carry its **verification method at write time** — the endpoint plus the permission it
  needs. No method = the case is `BLOCKED` from the start, not discovered mid-run.
- Missing access is a request to be made, named in the remark (who, for what), not a caveat parked
  under a green row.

---

## 4. Screen sizes: measure them, and say which ones are in scope

`mobile`, `tablet`, `viewport` and `responsive` appeared **zero** times in the frozen test set while
the harness captured at one desktop width. Seven escaped defects were on other widths.

- **Settle scope in writing before the run:** which widths are in scope this round, and which are
  explicitly not delivered yet. A width that is out of scope is stated out of scope to the customer —
  not silently untested (a "not yet delivered" scope is a change request, never our defect).
- **In-scope widths are exercised as their own lane** (typically a mobile and a tablet width beside
  desktop), and every in-scope page carries a result per width.
- **Judge by measurement, not by eye** — these two checks caught the real defects and are cheap:
  - overflow: any element with `rect.right > window.innerWidth`, or
    `document.documentElement.scrollWidth > window.innerWidth`
  - overlap: two text boxes whose rectangles intersect by more than ~3 px
  A screenshot that "looks fine" is not a result; the numbers are.
- Boundary widths named by the spec (e.g. a drawer switching at a stated breakpoint) are tested **on
  both sides of the boundary**, not near it.

---

## 5. Fixtures must be able to fail

One course and one media item cannot overflow, cannot wrap, cannot paginate, cannot scroll. Testing on
minimum data proves the empty state and nothing else.

Keep a standing realistic set, and check it exists **before** the run starts:

- a title long enough to wrap past two lines, and one with the project's maximum length
- a collection past its visible slot count (a list that must scroll / paginate)
- an account with enough related records to fill a section (badges, followers, enrolments)
- an account in the pre-first-use state (nothing selected/completed yet) for onboarding paths
- at least one record in each state the surface can display

A case that cannot be run because the fixture does not exist is `BLOCKED` with the missing fixture
named — and the fixture is created rather than the case dropped, where the project allows creating it.

---

## 6. A result expires when the build moves

The frozen set passed 122/122 against a build that received ~50 further changes before the customer
tested it. The pass rate was true and useless.

- **Bind results to a build/commit id**, not only a date. Write it at the head of the result set.
- **Delta review before every delivery:** list every ticket resolved after the set was frozen, and
  answer in writing, per ticket — *which cases does it touch · which are re-run*. The delivery
  document carries that table and it is never empty by default.
- Anything landing **after** the run invalidates the results **for that surface**; those cases are
  re-run before the results are handed over.

---

## 7. Every passed row carries its evidence

12 of 122 passed rows had a link. Nobody could go back and see the layout that later produced bugs.

- A row that says PASSED and has no evidence reference is not a completed row — this is already the
  fail-closed rule in [qa-evidence-gates.md](qa-evidence-gates.md); the escape review is why it is
  enforced on **passed** rows too, not only on failures.
- Before a result set is handed over: `count(rows with a pass verdict) == count(rows with an evidence
  link)`. Unequal ⇒ stop, do not deliver.

---

## 8. No requirement ⇒ a question, never a verdict and never a bug

Seven escapes were behaviours no document ever specified, and two "bugs" were filed against specs that
said something else (or nothing at all). Both directions cost a full round.

- Search the requirement corpus **where the AC actually lives** for that project (often the ticket
  description itself, not a custom field) before concluding "unspecified".
- Unspecified behaviour → a written question to the PO/spec owner, plus the point recorded as
  `BLOCKED` with who was asked. Never a PASSED (there was nothing to pass), never a filed defect
  (PM-006, [non-pass-challenge-gate.md](non-pass-challenge-gate.md)).
- Every defect claim states its source, pointing at something a reader can open: AC id, design node,
  spec line. No pointable source ⇒ it is not a defect claim yet.

---

## 9. Preflight the session before believing any result

A test run whose session had silently expired kept running and reported "no defects found" for the
whole set.

- Before the first case: confirm an authenticated session by reading the app's own session endpoint
  and **seeing the user in the response** — not by "the page loaded".
- Confirm the environment is reachable (and the tunnel/VPN up when the project requires one) and
  record the environment + build in the run log before the first result line.
- A button with two directions (a toggle, a mode switch) has its **starting state confirmed before it
  is pressed** — otherwise the run measures the opposite direction and reports it confidently.
- Any of these failing = stop and report. Results recorded after a failed preflight are not results.

---

## 10. An empty field means nothing was recorded — not that nothing was done

The first version of the escape review itself got this wrong: it read an empty tracking field, concluded
"these were never tested", and named that the number-one cause. Reading the changelog and comments
showed the opposite — they had been tested, and the finding had to be retracted.

Before writing "nobody did X" — in a report, a comment, or a root cause — open the **trace of the
action** (changelog, transitions, comments, run logs), not the summary field. The same discipline that
forbids guessing a spec forbids guessing an absence.

---

## MUST / NEVER

| Rule | Because |
|------|---------|
| MUST cover the whole **surface** a ticket touched (its existing cases), not only the ticket's own AC lines | A card passed while the bug sat on the detail page that reused it |
| MUST turn any result worth a verdict into a **case row with an id** — never leave it as prose in a comment | A result that is not a case is never re-run; 3 escapes came through that gap |
| MUST write display-surface expected results with all four dimensions (present · values correct vs source · order/position vs design node · no overflow/overlap measured) | "Shows A, B, C" passes a wrecked screen |
| MUST NOT use `complete` / `correct` / `properly` / `ครบถ้วน` / `ถูกต้อง` / `สวยงาม` alone as an expected result | They are unfalsifiable, and they passed the screen that produced five customer bugs |
| MUST report a wrong thing observed while checking something else, even when no expected asked for it | The badge-overflow defect was on screen and unremarked |
| MUST NOT record PASSED when the actual result contains `caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้` — it is BLOCKED (or PWMI with a bug) | We shipped a PASSED whose own text said it could not be verified |
| MUST state the verification method (endpoint + permission) for any expected the UI does not display, at the time the case is written; no method ⇒ BLOCKED from the start | Discovering it mid-run is how the caveat-then-PASSED happened |
| MUST settle in writing which screen widths are in scope, run every in-scope width as its own lane, and judge overflow/overlap by **measurement** | 7 escapes were on widths nobody ran; the numeric checks caught them when finally run |
| MUST verify the standing realistic fixture set exists before the run (long titles, lists past their visible slots, populated accounts, pre-first-use account) | A one-item fixture cannot overflow, wrap, or scroll |
| MUST bind results to a build/commit id and re-run any surface changed after the run before delivering | 122/122 passed against a build the customer never saw |
| MUST NOT hand over a result set where passed rows outnumber evidence links | Nobody could re-examine the layouts that later produced bugs |
| MUST turn unspecified behaviour into a written question + BLOCKED, never a PASSED and never a defect | 7 escapes had no requirement; 2 filed bugs had no supporting spec (PM-006) |
| MUST preflight the authenticated session (see the user in the session response), the environment, and a toggle's starting state before the first case | A dead session reported "no defects" for an entire set |
| MUST open the trace (changelog / comments / logs) before claiming an action never happened | An empty field was read as "never tested" and became a wrong number-one root cause |
