# Tasks — eval run owner lock

| # | Task | Rules | Failing test first | Done when |
|---|---|---|---|---|
| T1 | Write `run_owner_lock.test.js` with all cases below; run it red | R1–R11 | suite fails (module funcs / script missing) | red run recorded |
| T2 | `scripts/claim-run.sh` claim / re-claim / release / usage | R1–R5, R8 | `claim: fresh dir → 0`, `claim: 8 concurrent → exactly one 0`, `claim: other owner → 1, lock unchanged`, `claim: free-text lock → 1`, `claim: non-UUID id → 2`, `release: non-owner refused`, `release: owner removes` | those tests green |
| T3 | `parseOwnerLine` + `findRunDirs` + `assessRunOwnership` in `dispatch_rules.js`; wire into `assessBrief(text, ctx)` | R6–R10 | `no lock → BLOCK`, `other session → BLOCK`, `free-text → BLOCK`, `two-line lock → BLOCK`, `no session id → BLOCK`, `own lock → pass`, `~ and $HOME forms resolve`, `runs/ ledger without ROUND.md → pass`, `parser anchors whole line` | those tests green |
| T4 | `check.js` reads `session_id` from payload; `--session-id` CLI flag | R11, R9 | `hook payload replay of incident brief → exit 2 + claim command with session id`, `same payload after claim → exit 0` | green; existing `dispatch_rules.test.js` still green |
| T5 | README row + AGENT_BOARD line | — | — | rows present |
| T6 | `bash scripts/run-test-suites.sh` green; PR opened | all | — | suites line pasted in PR |
