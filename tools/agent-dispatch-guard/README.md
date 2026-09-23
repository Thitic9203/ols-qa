# agent-dispatch-guard

Refuses a background-agent dispatch whose brief never tells the agent to put
each result on disk before its next tool call.

## Why

Measured 2026-09-18 across 2,611 subagent transcripts on one machine
(`tools/agent-stall-metrics/measure.js` reproduces every number):

| measured | result |
|---|---|
| agents the watchdog killed while waiting on the **model** | **328 of 328 (100%)** |
| agents the watchdog killed while waiting on a **tool** | **0 (0%)** |
| median final silence before the kill | **600.2 s** — the watchdog threshold exactly |

The tool always came back. The model's next response never started. So nothing
the agent held only in its own context survived, and a brief that says "report
back when you are done" is a brief whose work is lost the first time a stream
stalls.

Reports #0053 and #0057 both found this and both closed with prose. Prose did
not carry — #0057's own lanes had the instruction and still lost their work.
This directory is the mechanical layer that prose could not be.

## What it checks

| code | severity | meaning |
|---|---|---|
| `NO_PERSIST_CONTRACT` | **BLOCK** | the brief never says to write results to disk as it goes |
| `SCREENSHOT_INTO_CONTEXT` | NOTE | screenshots requested with nothing said about keeping them out of context |
| `UNBOUNDED_SCAN` | NOTE | "every file / all cases" with no stated bound |
| `PROXY_PRELOAD_MISSING` | **BLOCK** | runs `session_verify`/`session_capture` on training69 / `PW_PROXY` but never names `pw_proxy_preload.js` or the `capture/t69_env.sh` wrapper (#0121) |

Only the first blocks. The other two have legitimate uses, and a guard that
over-blocks is a guard somebody switches off — which then takes the blocking
layer down with it.

## Satisfying the rule

Either put the literal token `PERSIST-BEFORE-PRINT` in the brief, or name all
three of: an output file, a write verb, and a per-unit cadence.

```
Check 12 cases on pre-prod.
Append one JSON line per case to out/round-9/lane1.jsonl before calling the next tool.
```

"Write your results to out/x.jsonl at the end of the run" does **not** satisfy
it, and there is a test pinning that: an end-of-run write is exactly the write
that never happens.

## Layers

| # | layer | what it stops |
|:--:|---|---|
| 1 | this rule in `CLAUDE.md` (§ จ่ายงานให้ agent เบื้องหลัง) | loaded every session |
| 2 | `.claude/hooks/agent-dispatch-guard.sh` — PreToolUse on `Agent` | a dispatch that never got the instruction |
| 3 | `dispatch_rules.js` — the only place that decides | two runtimes drifting apart (#0003) |
| 4 | `dispatch_rules.test.js` — 23 cases | the rules eroding, silently |
| 5 | `.github/workflows/tests.yml` | layers 3–4 rotting between sessions |

The shell layer **fails closed**: no node, no guard file, or a payload it
cannot read all refuse the dispatch. "Cannot check" is not "clean" (#0005),
and it is verified by running the hook with node absent from `PATH`.

## Commands

```bash
node tools/agent-dispatch-guard/check.js --explain
```

```bash
node tools/agent-dispatch-guard/dispatch_rules.test.js
```

Exit codes: `0` allowed · `2` blocked, or could not check.
