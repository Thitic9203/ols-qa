# retest-guard

The mechanical gate for a retest deliverable, and the single source of truth for the rules it checks.

Node ≥ 18, no dependencies, no build step — same shape as [`tools/name-guard`](../name-guard/README.md).

```bash
# from a run manifest: validate, render the body, scan it
node tools/retest-guard/retest_guard.js --manifest run.json --out body.txt --evidence-dir out/

# from a body someone wrote by hand
node tools/retest-guard/retest_guard.js --body body.txt --format v2 --bug-type FE

# every test in this directory
rc=0; for t in tools/retest-guard/*.test.js; do node "$t" || rc=1; done; exit $rc
```

Exit codes: **0** clean · **1** findings · **2** could not run. Exit 2 is not a pass — a gate that
cannot run has not agreed with you.

## Why it exists

Every rule here used to be a sentence in a workflow that a person had to remember while writing a
comment by hand, and the same rule was written in several files. They drifted:

- `!file.png|width=450!` — a parameter whose pipe splits the table row — was written in **seven**
  places. Three of them taught it as correct, including the worked example, whose entire job is to be
  copied, and the post-publish recovery table, whose job is to un-break a comment.
- The closing checklist still asked for screenshots after the workflow had made a per-case MP4
  mandatory, so a retest could pass its own closing gate with no clip at all.
- One file both forbade a design column in the case table and required one, eleven lines apart.

None of that is a reading-comprehension problem. Rules that live in prose drift; rules that live in
one module with tests do not.

## Layout

| file | what it is |
|---|---|
| `retest_rules.js` | **the rules** — required header lines, table headers, banned constructs per endpoint, caveat and hedge vocabulary, scope and coverage line shapes, the usage marker (`markerLine()`, rule `marker-missing`), plus `scanBody()`. Markdown links here; it does not restate a rule |
| `retest_manifest.js` | the run manifest: scope arithmetic, coverage, the lane plan (`lanes`, `serialReason`), and the verdict **the rows support** rather than the one that was hoped for |
| `retest_render.js` | manifest → comment body (v2 wiki / v3 markdown). The markup rules become the only way the text can be produced |
| `retest_guard.js` | the CLI: validate, render, scan, report, exit |
| `adf_colwidth.js` | the post-publish layout step: column widths + centred evidence on the posted comment's ADF, and the readback check |
| `*.test.js` | the cases pinning all of the above — including one that compares the workflow's printed template against these rules. Plain `node`, no framework |

## Comment format — owner order, 2026-09-24

The renderer produces, and the scan enforces, the shape the task owner ordered after the OLS-759 /
OLS-721 retests ("*Scope:* FULL ตัดทิ้ง" · "ให้ทำเป็นบลูเลทๆ เสมอ" · "รวมให้เป็นตารางเดียว … อย่าผิดอีก" ·
"จัดกลางเสมอ อย่าให้ต้องบอกซ้ำ"):

1. **No `*Scope:* FULL` line** — a full round prints none (`scope-full-line`); a scoped round still prints `*Scope:* CASES: <ids>`.
2. **Several points = bullets.** A header value split on ` · ` / ` — ` becomes the label on its own line, one `* ` bullet per point, then one blank line (`header-inline-list`, `list-swallows-next-line`).
3. **One table** — `No.` · `ER` (Task: `AC`) · `Case (Role)` · `Expected Result` · `Actual Result` · `Evidence` · `Status` (API: no `Evidence`), one row per contract item; the `Case (Role)` cell lists every covering case as `• TC_nn title (role)` joined by ` \\ `, and a multi-point actual result becomes `• point` lines the same way (`more-than-one-table`, `separate-case-table`, `case-cell-shape`, `cell-inline-list`, `row-without-case`).
4. **Coverage lines after the table** (`coverage-before-table`).
5. **Column widths** `[50, 75, 230, 200, 330, 230, 65]` (`TABLE_COLUMN_WIDTHS`) and
6. **centred evidence** — applied after posting, because the v2 wiki endpoint cannot carry either:

```bash
# 1. post the rendered wiki body (v2) as usual, then GET the comment's v3 ADF into get.json
node tools/retest-guard/adf_colwidth.js --in get.json --out put.json    # lay out the one table
# 2. PUT put.json to the v3 comment endpoint, GET it again into readback.json
node tools/retest-guard/adf_colwidth.js --check readback.json            # exit 0 required
```

The layout step sets `colwidth` on every cell, turns each MP4 `mediaGroup` in the `No.` / `Evidence` /
`Status` columns into a `mediaSingle` with layout `center`, sets every `mediaSingle` there to `center`,
and adds the alignment mark `center` to those columns' paragraphs. `--check` is run on what the tracker
stored — the PUT status is not evidence. It refuses (exit 2) a body with more or fewer than one table.

## Scope — a retest of named cases

`"scope": {"mode": "CASES", "cases": ["TC_03", "TC_07"]}` narrows the coverage denominator to what
those cases cover, renders the verdict as `PASSED (scoped: TC_03, TC_07)`, and prints an
`Out of scope this round:` line naming every contract item the round did **not** verify.

Before this, a request to retest two named cases had no honest path: the coverage gate reconciled
against the whole contract, so the choice was to break the gate or to quietly widen what the user
asked for.

## Lanes — the plan the round ran (owner, 2026-10-13)

`run.json` carries `"lanes": [{"id": "L1", "account": "learner01", "cases": ["TC_01", "TC_03"], "lease": true}]`
(`account` may be a list for a multi-role lane). `validate()` refuses (exit 1):

- a manifest with no `lanes`;
- an in-scope case that is in no lane, or in more than one; a lane naming a case not in `cases[]`;
- a lane whose `lease` is not literally `true` (the lane held a session lease on its login file);
- one account in two lanes ([parallel-test-lanes.md §3](../../references/parallel-test-lanes.md));
- a round with 2+ in-scope cases in one lane without `serialReason` set to a §4 predicate:
  `one-account` · `shared-record` · `env-forbids-concurrency` · `two-or-fewer-scenarios` ·
  `user-asked-serial` (a–e, `SERIAL_REASONS`). `two-or-fewer-scenarios` with 3+ cases is refused too.

Releasing the leases is checked at merge by [`tools/lane-lease-check`](../lane-lease-check/README.md).

## Coverage footer — PWMI is not failed (2026-10-13)

`*items met*` counts PASSED items only; the rest of the denominator is named on the same line —
`4 / 5 items met · 1 PWMI` — and `coverage-not-reconciled` fires unless met + PWMI + failed +
blocked = total. The case line prints `… 12 passed / 0 failed / 1 PWMI / 2 blocked` (the PWMI part only
when there is one). Before this a round with a PWMI row and no FAILED row printed `5 / 5 items met`
and `1 failed`.

## Test run time — measured, just above the marker (owner, 2026-10-13)

`run.json` carries `"testRunTime": {"minutes": 25.3, "hasVideo": false, "method": "evidence-burst-v1"}`,
copied from `node tools/run-time/measure.js --dirs <every lane's evidence dir>` ([../run-time/README.md](../run-time/README.md)).
The renderer prints it one blank line above the usage marker:

`*Test run time:* 25.3 min — includes evidence capture (screenshots); excludes re-checks, design lookup and comment drafting`
(`**…**` on v3; "screenshots and video" when `hasVideo` is true).

One exception (owner, 2026-10-14): a round where every case and result is BLOCKED ran nothing, so
`"testRunTime": {"notMeasured": true, "reason": "no-case-ran"}` renders
`*Test run time:* not measured — no case ran`. Any round with a case that passed, failed or was PWMI is
refused (`retest_manifest.js` field `testRunTime.notMeasured`; guard rule `run-time-not-measured-with-cases`).

Refused: a manifest without `testRunTime`, `minutes` that is not a positive number (0 is not a
measurement), a non-boolean `hasVideo`, or any `method` other than the tool's id; and a body whose
line above the marker is not a `Test run time: {n} min` line (`run-time-line-missing`).

## What it does not check, and never implies

Whether the clip reached its target · whether the cause is real · whether the expected side was
verified against the design · whether the testing was any good. Those are judgement gates in the
workflow, and the clean message says so out loud rather than letting a green exit code stand in for
them.

## Open question, recorded rather than guessed

`OPEN_QUESTIONS` in `retest_rules.js` is the list of things this module refuses to guess about.
It is **empty today**, and that is the point: an entry leaves it only when it is answered by
measurement, never by opinion.

Both entries it used to hold are now closed. A `[label|url]` link inside a v2 table cell does
**not** split its row — OLS-701's retest comment renders such a cell with all five `<td>` intact
and the MP4 as a working attachment link. And the summary wording for a BLOCKED or PWMI round is
settled: `SUMMARY_LINE` accepts `PASSED | FAILED | BLOCKED | PWMI`, and `computedVerdict` returns
the status the rows actually carry — a round nobody could reach reports BLOCKED, and a round whose
worst row is a non-High defect reports PWMI. Calling either of those FAILED sends a developer after
a bug that was never observed, which is what the owner's 2026-09-05 rule forbids.
