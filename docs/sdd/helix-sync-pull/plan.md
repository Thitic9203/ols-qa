# Plan: helix-sync-pull

Spec: [spec.md](spec.md). Full plan: SkillLane/team-pluton-skills `docs/sdd/skill-sync-simplify/plan.md`.

| File | Change | Rules |
|------|--------|-------|
| `scripts/helix-sync/apply.py` (new) + its tests | Select, keep-list, lock, refuse edited owned files, add/delete | R3-R5 |
| `helix-keep.txt`, `.helix-sync.lock` (new) | Keep-list; lock of owned paths | R3, R4 |
| `.github/workflows/helix-sync.yml` (new) | dispatch (+ schedule at cutover); clone the Helix tag; apply; suites + secret guard + post-mortem guard; one PR; merge if green, red if not | R2, R6, R8 |
| `tools/helix-sync-guard/*.test.js` (new) | Fail a PR that changes a lock-owned path | R7 |
| `scripts/sync-skills-to-helix.sh`, `scripts/sync-skills-pr-mode.sh`, `tools/helix-sync/*`, the sync call in `scripts/hooks/post-commit` | Remove at cutover | R1 |
