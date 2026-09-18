# agent-stall-metrics

Measures why background agents die with
`Agent stalled: no progress for 600s (stream watchdog did not recover)`,
from the subagent transcripts on this machine. Reads local files only and
prints counts — never a path, an account or a host.

```bash
node tools/agent-stall-metrics/measure.js
```

```bash
node tools/agent-stall-metrics/measure.js --since 2026-09-01 --json
```

```bash
node tools/agent-stall-metrics/stall_metrics.test.js
```

Exit codes: `0` measured and printed · `2` the root is unreadable or zero
transcripts were measured. A run that measured nothing is never a pass.

## What it separates

- **Watchdog kill vs person pressing Escape.** Both leave
  `[Request interrupted by user]`. Only a silence of the full 600 s threshold is
  counted as a stall; a shorter gap is an interrupt, and missing timestamps are
  `unknown` — never folded into either.
- **Waiting on the model vs waiting on a tool.** Decided by the last real record
  before the kill, walking back past harness `attachment` records.
- **Per-request hazard, not per-agent rate.** Every assistant turn is one
  request that survived at that context size; a stall is one that did not, at
  the agent's final size. Per-agent counting confuses "big context is risky"
  with "long agents get more chances to die".

## Result on 2026-09-18 (2,611 transcripts, 198,027 requests)

| measured | result |
|---|---|
| watchdog kills waiting on the model | 328 of 328 |
| watchdog kills waiting on a tool | 0 |
| median final silence | 600.2 s |
| sonnet-5 stalls per 1,000 requests, 200–300k → 300–400k context | 0.9 → 2.4 |
| opus-5, same buckets | 0.9 → 2.0 |
| stall rate, 0 images in context → 21–60 images | 9.8% → 30.8% |

Why the server stops streaming is **not** answered here: no HTTP status or
retry log exists for these runs. The rule that acts on these numbers, and the
guard that enforces it, live in `CLAUDE.md` § จ่ายงานให้ agent เบื้องหลัง and
`tools/agent-dispatch-guard/`.
