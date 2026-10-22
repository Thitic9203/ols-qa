# Plan — helix-parity kill order

## Files

- `scripts/helix-parity.sh` — `kill_tree` only (R1–R4). Nothing else in the script changes (R5).
- `tools/helix-sync/parity.test.js` — one new check (R6). Existing checks unchanged.

## Approach

`kill_tree <pid> [seen]`: `kill -STOP pid` → list `pgrep -P pid` → recurse into each unseen child →
list again and recurse into any unseen child (R3) → `kill -TERM pid` → `kill -CONT pid`.
Pre-order stop means a parent is frozen before its children are listed, so it cannot react to a
child's death by spawning (R2). Bash 3.2 compatible (macOS `/bin/bash`): no associative arrays — the
seen set is a space-delimited string.

Regression test: a fake transport (node, so it is portable to CI) started with `GIT_SSH_VARIANT=ssh`
(no `-G` probe) spawns three children that sleep, and spawns one more child the moment any of them
exits. All children carry a per-fixture marker path in argv. A `pgrep` shim on `PATH` sleeps before
calling the real `pgrep`, so the old post-order walk takes seconds between killing the first child and
killing the transport — the respawn lands in that window every time. After the script ends, the test
asserts no process with the marker remains, then kills any it finds (they are the test's own).

## Alternatives weighed

- Process-group kill (`set -m`, `kill -- -pgid`): one signal, but a descendant that changes group escapes,
  and job-control mode changes how bash reports jobs. Rejected for a larger behaviour change.
- `SIGKILL` instead of `SIGTERM`: does not close the respawn window by itself. Not needed.

## What could break

- A stopped process that is never continued: every `STOP` is paired with `TERM` + `CONT` on the same pid
  inside the same call, so none is left stopped.
- The watchdog subshell is also walked with `kill_tree` when git finished first; it is stopped, its
  `sleep` killed, then it is terminated — same as before.
- Cost: none (local processes only). Other repos: none.
