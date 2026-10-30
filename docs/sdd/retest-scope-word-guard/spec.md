# Retest guard: a universal scope word needs its measured count: spec

2026-10-30 · Owner order: "จัดการแค่ข้อนี้มา" on the CatchAI finding for OLS-279 (comment 93113 rows AC_02/AC_03
said "Every first-page item …" while only some cases had been measured).

## Rules
- **R1.** When a manifest result's `actual` has a point (split on ` · `) containing a universal scope word —
  `every`, `all`, `always`, `any`, `none`, `never`, `no item`, `ทุก` — the guard must reject it unless that same
  point states the measured count as `N/N` or `N of N` with the same N. Source: retest WORKFLOW.md MUST/NEVER
  "MUST NOT write a scope word … that no exercised-and-captured Evidence row supports"; owner order 2026-10-30.
- **R2.** A point without a universal word, or with a matching `N/N` count, must pass unchanged. Source: owner rule 5 (do not break existing).
- **R3.** Tests: one known-reject and one known-pass per word family. Source: owner rule 18; CLAUDE.md §0 (known-answer).

## Done when
- `validate()` reports `results[i].actual` for R1 cases; existing tests stay green; new tests red before, green after.
