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
| `*.test.js` | 62 cases pinning all of the above. Plain `node`, no framework |

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

`OPEN_QUESTIONS` in `retest_rules.js`: the retest workflow says a `[label|url]` link inside a v2 table
cell splits the row, **and** mandates `[▶ file.mp4|^file.mp4]` inside the Evidence cell. Both cannot
be true. Which one holds has not been verified against a live Jira comment, so the parser and the
renderer treat a link span as atomic and nothing is raised. Verify by posting one comment carrying
such a cell and reading it back with `?expand=renderedBody`.
