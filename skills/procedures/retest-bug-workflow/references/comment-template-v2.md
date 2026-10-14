# Retest comment — v2 wiki template (render, never type)

The output shape of a FE retest comment posted through `/rest/api/2/…`. The body is **produced by
the renderer**, never typed by hand: you fill a run manifest, the guard renders and scans it, and
you post the file it wrote byte for byte. The rules themselves live in
`tools/retest-guard/retest_rules.js` (single source); this file only shows the command, the line
order and one checked input→output pair. The full step that uses it is Step 6 of the workflow.

## Contents

- [Command](#command)
- [Line order of the body](#line-order-of-the-body)
- [Example — manifest in, body out](#example--manifest-in-body-out)
- [Anti-example](#anti-example)

## Command

```text
node tools/retest-guard/retest_guard.js --manifest run.json --out body.txt --evidence-dir <EVIDENCE_DIR>
```

- Exit **0** is required. Exit 1 = findings (fix the manifest, render again); exit 2 = the gate
  could not run, which is not a pass.
- Post `body.txt` byte-identical. Never edit it after rendering, never save it as `.md`.
- Several points in one value (Build, Fixture, an Actual Result) are written in the manifest as one
  string joined by ` · `; the renderer turns them into bullets (header) or ` \\ `-joined points
  (table cell).
- A `{word}` placeholder inside a wiki body opens a macro that never closes — the guard reports
  `unclosed-macro`. Evidence file names therefore use `<ISSUE_KEY>`, not `{ISSUE_KEY}`.

## Line order of the body

1. `*Retest Result: <PASSED|FAILED|BLOCKED|PWMI>*` plus its icon (scoped rounds: `PASSED (scoped: TC_nn)`).
2. Header lines: `*Env:*`, `*Design ref:*`, `*Role:*`, `*Date:*`, `*Build:*`, `*Fixture:*` — a
   multi-point value is the label on its own line, one bullet per point, then one blank line.
3. `----`
4. `*Test Step (from ticket):*` and `*Expected Result (from ticket, verbatim):*`.
5. ONE table: `||*No.*||*ER*||*Case (Role)*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||`
   — one physical line per row; multi-point cells use ` \\ `, never a newline or `* `.
6. `*Expected-result coverage:*` then `*Case coverage:*` — after the table.
7. `*Test run time:*` — the measured value from `tools/run-time/measure.js`.
8. One blank line, then the usage marker `_retestskillmarker · …_` as the last line.

## Example — manifest in, body out

Input — `run.json` (placeholders; a FE bug, PASSED, one ER with two observed points):

```json
{
  "ticket": "{ISSUE_KEY}",
  "ticketType": "Bug",
  "bugType": "FE",
  "format": "v2",
  "env": "<ENV_NAME> (<ENV_HOST>)",
  "designRef": "<DESIGN_NODE_LINK>",
  "role": [
    "<ROLE_A>"
  ],
  "date": "2026-10-14",
  "build": "<BUILD_TAG> · <FIX_COMMIT>",
  "fixture": "<FIXTURE_A> created for the run · deleted after the run",
  "scope": {
    "mode": "FULL"
  },
  "testStep": "<STEP_UNDER_TEST>",
  "expectedVerbatim": "<ER1_VERBATIM>",
  "contract": [
    {
      "id": "ER1",
      "text": "<ER1_VERBATIM>"
    }
  ],
  "cases": [
    {
      "id": "TC_01",
      "title": "<TITLE_A>",
      "covers": [
        "ER1"
      ],
      "role": "<ROLE_A>",
      "status": "PASSED"
    }
  ],
  "results": [
    {
      "id": "ER1",
      "actual": "<POINT_1> · <POINT_2>",
      "evidence": [
        "<ISSUE_KEY>_TC_01_<ROLE_A>.mp4",
        "TC_01_<ROLE_A>-ER_1.png"
      ],
      "status": "PASSED"
    }
  ],
  "verdict": "PASSED",
  "lanes": [
    {
      "id": "L1",
      "account": "<ACCOUNT_A>",
      "cases": [
        "TC_01"
      ],
      "lease": true
    }
  ],
  "serialReason": "two-or-fewer-scenarios",
  "testRunTime": {
    "minutes": 12.4,
    "hasVideo": true,
    "method": "evidence-burst-v1"
  },
  "marker": {
    "src": "ols-qa",
    "via": "retest-bug",
    "agent": "claude-code"
  }
}
```

Output — `body.txt`, exactly as the renderer wrote it (guard exit 0 on the manifest and again on the
body with `--body body.txt --format v2 --bug-type FE`):

```text
*Retest Result: PASSED* ✅

*Env:* <ENV_NAME> (<ENV_HOST>)
*Design ref:* <DESIGN_NODE_LINK>
*Role:* <ROLE_A>
*Date:* 2026-10-14
*Build:*
* <BUILD_TAG>
* <FIX_COMMIT>

*Fixture:*
* <FIXTURE_A> created for the run
* deleted after the run

----

*Test Step (from ticket):* <STEP_UNDER_TEST>
*Expected Result (from ticket, verbatim):* <ER1_VERBATIM>

||*No.*||*ER*||*Case (Role)*||*Expected Result*||*Actual Result*||*Evidence*||*Status*||
|1|ER1|• TC_01 <TITLE_A> (<ROLE_A>)|<ER1_VERBATIM>|• <POINT_1> \\ • <POINT_2>|[▶ <ISSUE_KEY>_TC_01_<ROLE_A>.mp4|^<ISSUE_KEY>_TC_01_<ROLE_A>.mp4] !TC_01_<ROLE_A>-ER_1.png!|✅|

*Expected-result coverage:* 1 / 1 items met
*Case coverage:* 1 / 1 cases run — 1 passed / 0 failed / 0 blocked

*Test run time:* 12.4 min — includes evidence capture (screenshots and video); excludes re-checks, design lookup and comment drafting

_retestskillmarker · skill=retest-bug-workflow · src=ols-qa · via=retest-bug · agent=claude-code_
```

## Anti-example

The drift seen in evaluation runs: the Actual Result cell hand-typed across lines as bullets.

```text
|1|ER1|• TC_01 <TITLE_A> (<ROLE_A>)|<ER1_VERBATIM>|
* <POINT_1>
* <POINT_2>|…|✅|
```

The guard rejects it with `row-column-count` — the row now has fewer cells than the header. Fix the
manifest (`"actual": "<POINT_1> · <POINT_2>"`) and render again; never repair the body by hand.
