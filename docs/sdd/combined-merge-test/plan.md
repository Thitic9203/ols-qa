# Plan — combined-merge test that proves what it tested

## Files
- `scripts/test-combined-merge.sh` — the tool (bash, `set -euo pipefail`, `trap` removes its own worktree).
- `tools/combined-merge-test/combined_merge.test.js` — known-answer suite (Node built-ins only) that builds a throw-away git repo with a fake `scripts/run-test-suites.sh`, then runs the tool against it. Picked up by `scripts/list-test-suites.sh` (tools/**/*.test.js).
- `CLAUDE.md` §4 — one line naming the tool.

## Options weighed
- A note in CLAUDE.md only: rejected — the failure was a typed chain; a rule nobody runs is a reminder, not a layer.
- Hook that blocks hand-written combined tests: rejected — cannot tell a combined test from any other `git merge` reliably.
- Committed tool with proof lines + tests (chosen): the proof (`in-test`, `combined HEAD`) is in the output, so a reader can see what was tested.

## Cost / reach
Node and bash built-ins only. New cost: NO. Touches other repos: NO.

## What could break
- The tool's worktree path is fixed per repo (`.worktrees/combined-merge-test`); two runs at once → the second is refused by R2 (existing path) instead of sharing a folder.
