# Plan — no advisor calls inside subagents

**Spec:** [spec.md](spec.md)

## Files touched

- `tools/agent-dispatch-guard/dispatch_rules.js` — export `NO_ADVISOR_MARKER = 'NO-ADVISOR'`, add the regexes `ADVISOR_FORBID_RE` (negation + advisor, EN/TH) and `ADVISOR_CALL_RE` (call/use/consult + advisor), and add check 14 `ADVISOR_ALLOWED_IN_SUBAGENT` (BLOCK).
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — new cases for R1–R3. Existing `ok: true` fixtures get the marker (R6).
- `tools/agent-dispatch-guard/check.js` — only if `--explain` enumerates codes by hand (R5).
- `tools/agent-dispatch-guard/README.md` — one row for the new check.

## Alternatives weighed

- **NOTE instead of BLOCK** — rejected. Today's stall came from a brief that said nothing about the advisor, so a note changes nothing.
- **Strip the advisor tool from subagents** — not possible from a hook; tool exposure is set by the harness.
- **Block only briefs that ask for the advisor** — rejected. The 9.3 min stall came from a brief that never mentioned it.

## What could break

- Every existing dispatch without the token is blocked until its brief adds `NO-ADVISOR`. That is intended, and the fix line says exactly what to add.
- A brief that mentions the advisor only to forbid it must not trip R2. `ADVISOR_CALL_RE` is checked per line, after removing negated spans.
