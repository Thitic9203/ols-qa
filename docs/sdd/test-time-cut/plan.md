# Plan — test-time-cut

## Files
- `skills/procedures/retest-bug-workflow/WORKFLOW.md`: Step 2 "Parallel intake" block (R1, R2).
- `skills/procedures/retest-bug-workflow/comment-and-post.md`: a "while waiting" line at the 6d gate (R3).
- `skills/procedures/testing-ticket-workflow/WORKFLOW.md`: a "while waiting" line at Phase C (R3).
- `references/parallel-prep.md`: retest pairs plus the owner-wait prep (R4).
- `skills/procedures/retest-bug-workflow/execute-and-evidence.md`, `references/qa-capture-tooling.md` and
  `references/qa-evidence-capture.md`: recorder wording (R5).

No code here. The machine check lives in `docs/sdd/test-time-cut-guard/`. No new dependency and no cost.

## Weighed
- Merging the two owner gates into one approval: rejected by the owner on 18 Nov.
- Skipping the session check when the keepalive is green: rejected. The check is cheap, and a dead session found late costs the
  most.

## Could break
- Doc-structure tests: anchor and heading tests in `tools/`. Run the full suites.
- Helix parity: sync after merge.
