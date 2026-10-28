# Spec — combined-merge test that proves what it tested

## Problem (post-mortem #0198, 2026-10-28)
Before merging several PRs together, the main thread ran the suites "on the combined merge" with a hand-written shell line. `git worktree add` failed (the folder already existed), the test step was joined with `;` instead of `&&`, so the suites ran in the current folder (origin/main `c8afad4`) and printed green. The green was reported as the combined result. Caught before merge by checking which branches were in the tested tree.

## Rules
**R1.** Testing a set of branches merged together must go through one committed tool, `scripts/test-combined-merge.sh <branch>...`, never a hand-written chain.
**R2.** The tool must refuse (non-zero, message says why) when: no branch is given; the worktree path already exists; the worktree cannot be created; it is not inside that worktree after creating it; any branch fails to merge (merge aborted); any branch is not an ancestor of the merged HEAD.
**R3.** Before running the suites the tool must print and log one `in-test <branch> <sha>` line per branch and `combined HEAD <sha> in <worktree path>`; the result line is `rc=<n>` from `scripts/run-test-suites.sh` run inside that worktree.
**R4.** The tool removes its own worktree when it finishes (pass or fail) so the next run never meets a stale folder, and never touches any other worktree.
**R5.** A report of a combined result must quote the `in-test` lines and the `combined HEAD` line, not only the green tick.

## Done when
- Known-answer tests: existing path → refused; a branch that conflicts → refused, merge aborted; a branch missing from HEAD cannot pass; a clean set → `in-test` lines for every branch, `combined HEAD` inside the tool's own worktree, worktree removed after.
- `bash scripts/run-test-suites.sh` green; CLAUDE.md §4 names the tool.
