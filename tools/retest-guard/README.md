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
| `*.test.js` | the cases pinning all of the above — including one that compares the workflow's printed template against these rules. Plain `node`, no framework |

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
