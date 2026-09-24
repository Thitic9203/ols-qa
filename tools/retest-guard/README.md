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
| `retest_rules.js` | **the rules** — required header lines, table headers, banned constructs per endpoint, caveat and hedge vocabulary, scope and coverage line shapes, plus `scanBody()`. Markdown links here; it does not restate a rule |
| `retest_manifest.js` | the run manifest: scope arithmetic, coverage, and the verdict **the rows support** rather than the one that was hoped for |
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
