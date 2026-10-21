# Plan — sdd-commit-gate (ols-qa)

- `tools/sdd-gate/check.js` — new. `git log <base>..HEAD --no-merges`; classify (R1–R4); `git cat-file -e
  <base>:docs/sdd/<slug>/<file>` for R3; self-test first (R5) in a `mkdtemp` repo; exit codes R6.
- `tools/sdd-gate/check.test.js` — new; picked up by `scripts/run-test-suites.sh` (runs the self-test).
- `.github/workflows/tests.yml` — on `pull_request`: checkout with full history, then
  `node tools/sdd-gate/check.js --base origin/<base branch>`.

Libraries: none (node built-ins). Cost: none (existing free CI minutes, one extra step, seconds).
Options weighed: commit-msg hook (rejected — persistent machine state, global rule 23) · pre-push only
(skippable) → CI step on PR + suite test.
What could break: `chore(release)` bumps are not code commits (R1) so auto-version is unaffected.
A shallow checkout would hide the base — missing base = exit 2, never a pass.
