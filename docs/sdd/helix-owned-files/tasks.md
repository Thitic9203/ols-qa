# helix-owned-files — tasks

Commits cite `Spec: docs/sdd/helix-owned-files O<n>` (Helix `docs/sdd/project-agnostic` R8 R10).

| # | Task | Rules | Failing test first | Done when | Status |
|---|---|---|---|---|---|
| T1 | Suite `tools/helix-sync/owned_files.test.js` | O7 | owned file in the change → helix copy unchanged + `sync: skipped 1 Helix-owned file(s):` (fails today: file is copied) | suite runs and fails on current script | ⬜ |
| T2 | Owned-list filter + report + missing warning + unreadable abort in `sync-skills-to-helix.sh` | O1–O6 | T1 | T1 green; `bash scripts/run-test-suites.sh` green | ⬜ |
| T3 | PR to ols-qa main | all | — | PR open, CI green, not merged by a lane | ⬜ |
