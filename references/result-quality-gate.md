# Result quality gate — 20 layers before any verdict leaves the round

A wrong result is how a defect escapes: a false PASSED ships the bug, a phantom FAILED buries the
real one under noise, a missing case was never tested at all. This gate sits **between execution
and every place a verdict is reported or written** (chat summary, results sheet, ticket comment,
notify channel, live board). Every layer is mandatory, every round, every lane. No flag turns a
layer off.

**Violating the letter of a layer is violating its spirit.** "The clip is fine, the verifier is
just strict", "it failed once, that is enough", "the role probably has access" — each of these is
the exact sentence that preceded a recorded escape below.

## Contents

- [How to run it](#how-to-run-it)
- [Result line](#result-line)
- [The 20 layers](#the-20-layers)
- [Required output when the round finds defects](#required-output-when-the-round-finds-defects)
- [Red flags — stop, the verdict is not ready](#red-flags--stop-the-verdict-is-not-ready)
- [Used by](#used-by)

## How to run it

1. Write one result line per case (JSONL, fields in § Result line). A resumed or re-run lane does
   not append a second final line — it marks the old one `"superseded": true`.
2. Run the mechanical layers. If the workspace carries the checker (`tools/result-gate/check.js` in
   the ols-qa repository), run it and paste its last line:

   ```bash
   node tools/result-gate/check.js --results <round>/results.jsonl \
     --cases <round>/cases.json --env-map <round>/env-map.json --types <round>/types.json
   ```

   exit 0 = no mechanical violation · 1 = violation(s), fix the line or the test, never the
   checker · 2 = nothing was checked (missing file, zero lines) — that is not a pass. Without the
   checker, apply every layer marked **M** by hand and list each one with its count.
3. Walk the judgement layers (marked **J**) for every line, PASSED ones included.
4. The **main thread** re-runs step 2 itself on the lane's files (layer 20). A lane's "gate green"
   message is a claim, not a result.
5. Only then report or write the verdicts. A red layer blocks the verdict for that case; the case
   is reported as what it really is (usually BLOCKED with the reason), never silently dropped.

## Result line

| Field | Meaning |
|-------|---------|
| `key`, `tc` | Ticket key and case id — one **final** line per pair |
| `verdict` | `PASSED` · `PWMI` · `FAILED` · `BLOCKED` only (a skipped case is `BLOCKED`) |
| `actual` | What the screen really showed, in plain words |
| `evidence[]` | Clip / still / API capture names for this case |
| `clip_verified` | `true` only after this clip passed the video verifier |
| `verifier_failures[]` | The verifier's failed checks by category (`motion`, `freeze`, `manifest_mismatch`, …) |
| `er_frames_confirmed`, `er_frames_reviewer` | A reviewer confirmed every ER point is visible in the frames, and where that record is — layer 10 |
| `evidence_mode`, `api_verified` | `"api"` cases prove with a verified request/response instead of a clip |
| `root_cause` | Required for every non-PASSED line |
| `er_issue` | Which expected-result item the defect breaks (PWMI / FAILED) |
| `remark`, `contact` | BLOCKED: what is missing, and who can unblock it |
| `requirement_source`, `requirement_quote` | FAILED: where the confirmed expected result lives, and its exact words — layer 17 |
| `code_refs[]`, `ticket_refs[]` | BLOCKED / FAILED: `path:line` read at the default branch, and ticket keys (`KEY#comment-id`) read — layer 14 |
| `attempts`, `failed_attempts`, `intermittent` | FAILED: how often it was observed |
| `role`, `env`, `skill`, `ts` | Who, where, with which workflow, when |
| `superseded` | `true` on an older line kept for history |

## The 20 layers

Kind: **M** = mechanical (the checker or a counted hand check decides) · **J** = judgement (the
agent decides, and must write what it compared). Citations are post-mortem report numbers in this
repository's `docs/post-mortem/` index, or incidents from the 2026-10-10/11 round (described
generically).

### A. Right test, right place

**1. Right workflow for the ticket type — M.** Stops: a Story run without the repository's
testing workflow, so none of its gates ran (#0174). Check: Story → `testing-ticket-workflow`, Bug →
`retest-bug-workflow` per [skill-routing.md](skill-routing.md); other types record the skill used,
no invented mapping. Runs: checker `SKILL_MISMATCH` / `SKILL_MISSING` with `--types`. Proof: checker
line, or the type and skill per key listed.

**2. Right environment — M.** Stops: results produced on the wrong environment staying in the
round's files (2026-10-11 round); a tool whose default pointed at a forbidden environment (#0009).
Check: every line's `env` equals the env the ticket must be tested on. Runs: checker `ENV_MISMATCH`
/ `ENV_UNMAPPED` / `ENV_MISSING` with `--env-map`. Proof: checker line. A wrong-env line is not
"close enough" — it is re-run on the right env or removed and reported.

**3. Right account and role, from the account source of record — J+M.** Stops: accounts taken
from a local roster instead of the account source the project names (#0088, #0169); a verdict
written while the role-mismatch code was still open (#0024). Check: the account was read live from
the project's account source for this env, and its role is the role the case names. Runs: before
execution; `role` must be present (checker `ROLE_MISSING`). Proof: the source row and role per line.

**4. Session and build are fresh at the moment of the run — J.** Stops: lanes recording on a dead
session (#0062); "waiting for deploy" claimed from ticket status instead of the deployed commit
(#0084). Check: session preflight per [customer-escape-prevention.md](customer-escape-prevention.md)
§9; the result belongs to the build now on the env (§6). Runs: before execution and again before
reporting. Proof: preflight output and deployed version, timestamped.

### B. Every case, against the real expected result

**5. Every in-scope case has exactly one final line — M.** Stops: running a reference suite without
reading its scope (#0044); cases silently missing from a delivery. Check: case list == final lines,
no extra, no missing. Runs: checker `MISSING_CASE` / `OUT_OF_SCOPE` with `--cases`. Proof: checker
line with the case count.

**6. Expected result read char-exact from an authoritative source — J.** Stops: a verdict built on
another case's expected result (#0139); a recheck lane misjudging an expected item (#0165). Check:
the ER text was opened in the design / AC / spec this round and compared character by character,
both sides quoted. Runs: per case, before the verdict. Proof: the quoted ER and its source.

**7. Self-contradicting or unclear spec is surfaced, never passed — J.** Stops: a case that
contradicts itself recorded as PASSED. Check: contradictions and hedged expected results go to the
owner with the conflicting lines quoted; the case is BLOCKED meanwhile. Runs: per case. Proof: the
question asked and its answer, or the BLOCKED line.

**8. Fixtures can fail, and reached the surface under test — J.** Stops: fixtures created with a
reason that never routed them to the review page, so 17 rows stalled before anyone noticed
(2026-10-10 round). Check: after preparing data, confirm it is visible on the exact page the case
tests, per [customer-escape-prevention.md](customer-escape-prevention.md) §5. Runs: after data prep,
before execution. Proof: a screen or API read showing the fixture on that surface.

### C. Evidence that proves the verdict

**9. PASSED carries evidence — M.** Stops: rows marked PASSED with nothing attached
([customer-escape-prevention.md](customer-escape-prevention.md) §7). Runs: checker
`PASS_NO_EVIDENCE`. Proof: checker line.

**10. The clip is accepted before PASSED or FAILED is written; stills alone never carry it — M.** Stops: a lane writing
PASSED while its clip failed the verifier (2026-10-11 round); clips flipped to pass with "verify +
gate passed" that never ran (#0113); a clip captured with a forbidden recorder and marked PASSED
before provenance was checked (#0075); lanes marking PASSED with stills only (2026-10-11 round);
a pass citing the ER from a PNG (#0115). Check: a clip is **accepted** when EITHER the verifier passed it
(`clip_verified: true`, set only by reading the verifier's own result file) OR the verifier's
**only** failures are motion/freeze metrics (too little motion, frozen repeats, still-hold share)
**and** a reviewer record confirms every ER point is visible in the frames (`er_frames_confirmed:
true` + `er_frames_reviewer`). A motion/freeze metric is a signal to look at the frames, not a
verdict; stutter is fixed by cutting the frozen span, not by rejecting the clip. **Hard** failures
are never waived by a reviewer: missing or mismatched capture manifest, wrong resolution, wrong env
or account, and any failure name the gate does not list as motion/freeze. A stills-only line never
has an accepted clip; API-only cases use `evidence_mode: "api"` with a verified request/response
(`api_verified`). Runs: checker `PASS_CLIP_UNVERIFIED` / `FAILED_NO_VERIFIED_CLIP` /
`CLIP_HARD_FAILURE`. Proof: verifier output per clip, plus the reviewer record when the waiver is
used.

**11. The evidence shows the expected result on a real screen — J.** Stops: a lane flipping cases
to pass while the clip itself showed a failing verdict strip (#0050). Check: the frame that shows
each ER item is named; raw data pages, consoles and blank or loading frames never count
([qa-evidence-gates.md](qa-evidence-gates.md)). Runs: per PASSED line. Proof: timestamp or frame per
ER item.

**12. A passing row never hedges — M.** Stops: "caveat / not verifiable / assumed" inside a passed
row ([customer-escape-prevention.md](customer-escape-prevention.md) §3). Runs: checker `PASS_HEDGED`.
Proof: checker line. A hedge means the case is not PASSED yet.

### D. Non-PASS verdicts that are real

**13. Every non-PASS has a root cause and an actual result — M.** Stops: conclusions beyond the
evidence (#0067, #0172). Runs: checker `NONPASS_NO_ROOT_CAUSE` / `NONPASS_NO_ACTUAL`; the
investigation itself follows [root-cause-investigation.md](root-cause-investigation.md). Proof:
checker line plus the root-cause note.

**14. Exhaustive source sweep before any BLOCKED, FAILED or "ask the PO / reporter" — M+J.**
Stops: concluding "cannot be done", "wrong" or "wait for someone" before reading what already
answers it. Real case (2026-10-11 round): a detail page showed an "unavailable" guard that looked
like a defect; the guard's commit message named a sibling ticket whose business rule required it,
which turned a suspected defect into a documented spec conflict. Check, in this order, and quote
each source in the verdict line:
1. **Product code at the default branch** — the lines that produce the behaviour, with `path:line`,
   **including their inline comments**, and `git log -L <start>,<end>:<path>` (or blame) on those
   lines to find the commit and the ticket that introduced them.
2. **The main ticket** — description and **every** comment, not only the latest.
3. **Surrounding tickets** — parent / epic, linked issues, sibling stories that touch the same
   screen or API, and every ticket named in the commit messages found in step 1.
4. **Regression results** for the same screen or API.
5. **The design node** for the screen.
6. **Missing data** — try to create it (or the path to it) before blocking.

A result with nothing found at a step says so, with the search used. Runs: per BLOCKED / FAILED
line and before any question to the PO or reporter; checker `NO_SOURCE_SWEEP` refuses a BLOCKED or
FAILED line without at least one `code_refs` entry shaped `path:line` **and** one `ticket_refs`
entry shaped like a ticket key (optionally `KEY#comment-id`). Proof: `code_refs`, `ticket_refs` and
the regression / design sources on the line.

**15. Every non-PASS survived the challenge gate — J.** Stops: a role that could not open a page
nearly reported as a defect from what the code intended (2026-10-11 round); a verdict flipped
without reading the recorded decision for that case (#0159). Check: run
[non-pass-challenge-gate.md](non-pass-challenge-gate.md) end to end; code intent is not a
specification and access refused to a role is BLOCKED or a question until a confirmed source says
that role must have access. Runs: per non-PASSED line. Proof: the gate's outcome per line.

**16. FAILED is reproduced, or labelled intermittent with counts — M.** Stops: a FAILED observed 1
of 4 attempts reported as a plain failure (2026-10-11 round). Check: 3 of 3 (or more) failing
observations, or `intermittent: true` with `attempts` and `failed_attempts`; the write-up states
the counts. Runs: checker `FAILED_NOT_REPRODUCED`. Proof: checker line plus the attempt log.

**17. Every FAILED is a fully-evidenced defect candidate, priority from the matrix — M+J.**
Stops: invented severity; a defect reported without what correct looks like or without proof.
Check: the expected side is a **confirmed** spec quoted char-exact (`requirement_source` +
`requirement_quote`: AC id, design node or PO comment id — no paraphrase, no invention); the clip
is accepted (layer 10) and a still shows the failing point; the matching cell of
[bug-priority-matrix.md](bug-priority-matrix.md) is cited; PWMI and FAILED name the broken ER item.
The row goes into the **Defect candidates — NOT filed** table (§ below), never into a tracker on
its own. Runs: checker `FAILED_NO_REQUIREMENT` / `FAILED_NO_VERIFIED_CLIP` / `FAILED_NO_SCREENSHOT`
/ `DEFECT_NO_ER_ISSUE`. Proof: checker line plus the matrix row quoted.

**18. BLOCKED only when the gap cannot be closed by us — M+J.** Stops: BLOCKED used where the data
could have been created; work parked under "limitations" (#0032). Check: the missing thing is
named (`remark`) with who can unblock it (`contact`), and creating the data or path ourselves was
tried first (layer 14 step 6). Runs: checker `BLOCKED_NO_REMARK` / `BLOCKED_NO_CONTACT`. Proof: checker line plus
what was tried.

### E. The round's record is single and re-checked

**19. One final line per case, even after a resumed agent — M.** Stops: resumed agents appending
lines that contradicted their own earlier lines (2026-10-11 round); a runner writing `done rc=0`
for work that did not finish (#0179). Check: older lines are marked `superseded`, never left as a
second final line. Runs: checker `CONFLICT` / `DUPLICATE`. Proof: checker line.

**20. The main thread re-checks before reporting — M+J.** Stops: repeating a lane's or a previous
round's conclusion as fact (#0077). Check: the main thread runs the checker itself on the files on
disk, opens at least one PASSED and every non-PASSED line's evidence, and reports the checker's own
count. Runs: after all lanes finish, before any report or write. Proof: the command, its last
output line, and the lines opened.

## Required output when the round finds defects

Defects are **never filed automatically**. The round's report carries two tables, built from the
result lines that passed this gate.

**Defect candidates — NOT filed.** Only rows whose expected side is a **confirmed** spec. Use the
exact table, the Needs PO table and the fixed owner question in
[output-templates/defect-candidates.md](output-templates/defect-candidates.md) — the single copy of
that shape.

The Status cell is always "Not filed yet" (in a Thai report: "ยังไม่ได้เปิดบั๊ก") until the owner
says to file; filing then goes through the bug-filing workflow.

**Needs PO decision.** Rows where the sources disagree (spec conflict) or the expected side is not
confirmed. Each row quotes **both** conflicting sources char-exact with their references, and the
case stays BLOCKED until the PO decides — it never appears in the defect table.

## Red flags — stop, the verdict is not ready

- "The verifier is too strict, the clip looks fine to me"
- "It failed once, that is a FAILED"
- "The role probably should see this page" / "the code says it should"
- "The lane said the gate was green"
- "It is obviously a bug, I will file it now" — candidates are listed, never filed without the owner
- "Two lines for the same case, the later one wins anyway"
- "Close enough — it was tested on the other environment"
- "Not enough time, mark it BLOCKED"
- "I will ask the PO" — before the code, its comments, its history and every related ticket were read

## Used by

- [testing-ticket-workflow/WORKFLOW.md](../skills/procedures/testing-ticket-workflow/WORKFLOW.md) § Result quality gate
- [retest-bug-workflow/WORKFLOW.md](../skills/procedures/retest-bug-workflow/WORKFLOW.md) § Result quality gate
- [review-result-workflow/WORKFLOW.md](../skills/procedures/review-result-workflow/WORKFLOW.md) § Result quality gate
- [smoke-test-workflow/SKILL.md](../skills/smoke-test-workflow/SKILL.md) § Result quality gate
- [catch-ai-workflow/SKILL.md](../skills/catch-ai-workflow/SKILL.md) § Result quality gate
- [shared-preamble.md](shared-preamble.md)
