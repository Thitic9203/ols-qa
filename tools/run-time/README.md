# run-time

Measures how long a test round took from the evidence it wrote — the number printed on the
`Test run time:` line just above the usage marker of a result comment. Never estimated.

```bash
node tools/run-time/measure.js --dirs <lane1_dir>,<lane2_dir> [--gap-s 120] [--ext png,jpg,mp4,webm,jsonl]
node tools/run-time/measure.test.js        # known-answer tests
node tools/run-time/workflow_docs.test.js  # both workflows document the step and the line
```

## Method `evidence-burst-v1`

1. Every file with a listed extension under every `--dirs` directory (recursive) — screenshots,
   clips, `results.jsonl` — taken as one union across lanes.
2. Their modification times, sorted; a new burst starts whenever no file was written for more than
   `--gap-s` seconds (default 120).
3. Run time = the sum of burst durations (last file − first file of each burst), one decimal.

It counts running and evidence capture; it leaves out idle time, thinking, re-checks, design lookup and
drafting the comment, because no evidence file is written then.

## Output and exit codes

stdout (exit 0): `{"method", "minutes", "bursts": [{"start", "end", "minutes"}], "files", "gapS", "hasVideo"}`
plus `"warning"` when every burst is a single instant (e.g. one file — 0.0 is then not a usable duration).
`hasVideo` is true when any `.mp4`/`.webm` was counted.

Exit 2 with nothing on stdout: no `--dirs`, a listed directory does not exist (a partial measurement
under-reports), or no evidence files were found. A caller can therefore never read 0 as a measurement.

`measure({files: [{path, mtimeMs}], gapS, ext})` is exported for tests and other tools; it returns
`null` when no file matches.

## Where it is used

- `skills/procedures/retest-bug-workflow/WORKFLOW.md` Step 6 → `run.json` `testRunTime`, enforced by
  `tools/retest-guard` (manifest validation + rule `run-time-line-missing`).
- `skills/procedures/testing-ticket-workflow/WORKFLOW.md` G5·M → the summary comment line. That comment
  has no renderer or guard; `workflow_docs.test.js` pins the documented template only.
