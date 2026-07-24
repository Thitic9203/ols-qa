# Debug discipline — when the bug still fails after retest

Use when retest shows the fix is incomplete or wrong — diagnose before closing as FAILED.

## Mantra

1. **Reproduce first** — if you cannot reproduce, you cannot conclude FAILED vs BLOCKED.
2. **Trace the fail path** — follow evidence, do not guess.
3. **Falsify hypotheses** — what observation would prove each guess wrong?
4. **Keep a breadcrumb ledger** — every run is a row in a table.

## When retest → FAILED

### 1. Reproduce clearly

- Follow ticket test steps literally.
- Record exact input, URL, response, screenshot.
- If not reproducible → try other env, user, data.
- Still not reproducible → **BLOCKED** (not FAILED) and tell the user why.

### 2. Same bug vs new bug

| Situation | Conclusion |
|-----------|------------|
| Original bug case still fails | FAILED — fix ineffective |
| Original passes, new defect found | PASSED for original + new ticket for new bug |
| Mixed results | FAILED — list failing cases |

### 3. Evidence for FAILED

Include:

- Before fix (from ticket)
- After fix (from retest)
- Expected (Swagger / ticket)
- Clear diff

### 4. Invoke systematic debugging — mandatory, not optional

This file is the **retest-specific FAILED vs BLOCKED triage**. The cause itself is governed by
[root-cause-investigation.md](../../../../references/root-cause-investigation.md): invoke
`superpowers:systematic-debugging` (Phases 1–3 — QA does not patch product code), complete the
8-boundary evidence sweep, and label the cause `Confirmed` / `Suspected` / `Unknown — not
investigated`. A cause without a captured artifact is not written down.
