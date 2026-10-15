# Spec — no advisor calls inside subagents

**Owner request:** 15/Oct/2026 — "Apply both: add a no-advisor-in-subagent rule to agent-dispatch-guard with tests, and save the heartbeat-chase rule to memory".

## Why

Measured on 15/Oct/2026 in `ols-qa-evidence/runs/sdd-mint-2026-10-15/`:

- `sdd.jsonl`: the lane sat 9.3 min (18:16:47 → 18:26:06) on advisor calls that were cut off repeatedly. Its next ledger line says "advisor skipped (call cut off repeatedly)".
- `mint.jsonl`: the lane sat 12.7 min (18:17:48 → 18:30:28) on a response that stalled into an API `server_error`.

Subagents get the advisor tool by default, along with instructions to call it before and after work. Nothing in the dispatch contract tells them not to.

## Rules

- **R1** — When an Agent brief is assessed, the guard must BLOCK it unless the brief forbids advisor calls. It can do this with the literal token `NO-ADVISOR`, or with a sentence that negates calling, using or consulting the advisor (English or Thai, e.g. "do not call the advisor", "never use advisor", "ห้ามเรียก advisor").
- **R2** — When a brief line tells the agent to call, use or consult the advisor, with no negation before it on that line, the guard must BLOCK, even if `NO-ADVISOR` appears elsewhere. A brief that both forbids and requires it is contradictory.
- **R3** — The finding must name the measured cost (9.3 min stall, `sdd.jsonl`) and give a one-line fix: add `NO-ADVISOR`, and the main thread reviews the work instead.
- **R4** — The new check must count in `checks`, like every other check (a run that measured nothing is never a pass, per #0006).
- **R5** — `check.js --explain` must list the new code, like every other check.
- **R6** — The existing checks' behaviour must not change. Existing tests keep their meaning; fixtures that expect `ok: true` gain the token only.

## Done when

- A test with a brief that has no advisor prohibition → BLOCK `ADVISOR_ALLOWED_IN_SUBAGENT` (red before the rule).
- A brief with `NO-ADVISOR` → no finding from this check. A Thai prohibition ("ห้ามเรียก advisor") → no finding.
- A brief "call the advisor before writing" plus `NO-ADVISOR` → BLOCK (R2).
- `bash scripts/run-test-suites.sh` is green.
