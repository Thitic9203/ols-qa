# Tasks — retest-guard pre-review evidence checks

| # | task | rule | failing test first | done when |
|---|---|---|---|---|
| T1 | pure helpers + R5 inline image width | R5, R6 | 1280 px PNG inline must flag; 640 px must pass | `retest_evidence.test.js` R5 cases green |
| T2 | R1 width claims | R1 | `1440 / 390 px` with only a 390 file flags 1440; 1440 capture.json clears it | R1 cases green |
| T3 | R2 role claims | R2 | two roles claimed, one backed → flag; both backed → clean | R2 cases green |
| T4 | R3 clip verifier / decision | R3 | FAIL clip no decision → flag; decision row → clean; PASS → clean; no decisions → unchecked | R3 cases green |
| T5 | R4 decision times | R4 | bare time flags; time with source passes; tz mismatch flags | R4 cases green |
| T6 | CLI wiring, `--decisions`, `--verify-dir`, exit 2 on unchecked | R3, R4, R6 | CLI: no decisions → exit 2; full clean set → exit 0; error → exit 1 | CLI cases green; old tests keep meaning |
| T7 | README + full suite | R6 | — | `bash scripts/run-test-suites.sh` exit 0 |
