# Spec — helix-parity kill order

Status: owner-approved fix (2026-10-22, chat: fix the flaky parity test) · offline · no env access

## Why

`bash scripts/run-test-suites.sh` failed 1 of 8 checks in `tools/helix-sync/parity.test.js`:
"orphaned transport still running". The check passes when run alone; the failing run was under heavy load.

Root cause (measured 2026-10-22, git 2.53.0): `kill_tree` in `scripts/helix-parity.sh` signals children
before their parent while the parent keeps running. git with a `GIT_SSH_COMMAND` whose name it does not
recognise first runs it as a `-G` variant probe, waits for it, then spawns the real transport from the
same git process. When the bound fires, `kill_tree` kills the stalled probe; git — still alive — spawns
the transport after `kill_tree` already listed git's children; git is then killed and the transport is
reparented to init and keeps running. Unmodified script: orphan in 1 of 12 runs; instrumented: 13 of 13.

## Rules

- **R1** — เมื่อ fetch เกินเวลา (`HELIX_PARITY_FETCH_TIMEOUT`) ระบบต้องหยุดทุก process ใน tree ของ fetch
  รวมถึง process ที่ parent ใน tree สร้างขึ้นระหว่างที่ tree กำลังถูกฆ่า — ต้องไม่เหลือ process ใดของ tree
  ทำงานต่อหลังสคริปต์จบ.
- **R2** — ระบบต้องไม่ให้ process ใน tree สร้างลูกใหม่หลังจากที่ลูกของมันถูกอ่านรายชื่อไปแล้ว: each process
  is stopped (`SIGSTOP`) before its children are listed, and stays stopped until it is sent `SIGTERM`.
- **R3** — A child that appears after a stopped parent's first listing (a fork already in flight when
  the stop landed) must also be stopped and killed: the parent's children are listed a second time after
  the first set is handled, and any pid not yet seen is handled the same way.
- **R4** — Each process is sent `SIGTERM` then `SIGCONT` (a stopped process acts on `SIGTERM` only once
  continued). The script only signals pids in the tree of a process it started itself.
- **R5** — Outcomes are unchanged: a timed-out fetch is `CANNOT-VERIFY … timed out after <n>s` exit 2,
  never OK; a fetch that finishes in time behaves exactly as before; exit codes 0/1/2 keep their meaning.
- **R6** — A regression test must reproduce the orphan deterministically against the old kill order
  (a transport that respawns a child when one of its children dies, plus a slow `pgrep` that widens the
  window) and pass against the fixed order.

- **R7** — Each fetch has its own bound: `HELIX_PARITY_FETCH_TIMEOUT_OLS` for the ols-qa fetch and
  `HELIX_PARITY_FETCH_TIMEOUT_HELIX` for the helix fetch, each defaulting to `HELIX_PARITY_FETCH_TIMEOUT`
  (default 120) and validated the same way (positive whole seconds). The timed-out message names the bound
  of the fetch that timed out. Source: 27 Nov 2026, a pre-push on a machine at load average 120+ failed
  `a fetch that never answers…`: the test set one 2 s bound to stall helix, and the *ols-qa* fetch of a
  local bare repo timed out first (`CANNOT-VERIFY fetch of ols-qa origin/main timed out after 2s`, 2 of 6
  runs, with and without `GIT_INDEX_FILE`). Owner approved 27 Nov 2026 ("แก้ให้ stall เฉพาะ helix").
- **R8** — Tests that stall only helix must set only `HELIX_PARITY_FETCH_TIMEOUT_HELIX`, so the ols-qa
  fetch never races the short bound. A regression test must make the ols-qa fetch slower than the shared
  bound and prove its own bound applies (fails on the old script).

## Edge cases

- A parent that ignores or handles `SIGTERM` itself is out of scope (git does not respawn on `SIGTERM`).
- Killed children of a stopped parent stay as zombies until the parent runs; the second listing (R3)
  skips pids already handled, so it cannot loop.

## Out of scope

Changing the default fetch timeout (R7 adds per-repo overrides only), transport options, or the parity
comparison itself.

## Done when

- The new regression check fails on `origin/main` `scripts/helix-parity.sh` and passes after the fix.
- `bash scripts/run-test-suites.sh` is fully green.
- `node tools/helix-sync/parity.test.js` passes 20 of 20 consecutive runs under load (count reported).
