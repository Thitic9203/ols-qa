# lane-lease-check — every lease a round acquired is released at merge

Parallel test lanes ([parallel-test-lanes.md](../../references/parallel-test-lanes.md)) each load a saved
login file. When the workspace provides a session-lease tool, a lane acquires a lease on that login
before loading it (holder text carries the **round id**), renews it on long runs, and releases it in
`finally`. A lease left behind blocks the background session refresh for that account after the round
ended, and it marks a lane that died mid-run.

At merge (§6) the parent runs:

```bash
node tools/lane-lease-check/check.js --round <round id> --dir <lease dir from the project guide>
# or, through the lease tool's own list output:
node tools/lane-lease-check/check.js --round <round id> --list-cmd "<lease tool> list"
```

| Exit | Meaning |
|------|---------|
| 0 | No lease whose holder contains the round id is on disk — prints how many leases it scanned |
| 1 | At least one is still held — lists tag, state, holder. Release each, run again |
| 2 | Cannot check: no round id (or shorter than 4 characters), unreadable dir, list command failed, or a corrupt lease that cannot be attributed. Never a pass |

An **expired** lease still on disk counts as held: release removes the file, expiry does not.

## Leftover processes — `--procs-tags`

A lane driver or browser that outlives its lane keeps its account looking "in use" to any job that
reads command lines. At merge the parent also runs, with every account tag the round leased:

```bash
node tools/lane-lease-check/check.js --procs-tags <tag1>,<tag2>
```

It lists processes (`ps -axww -o pid=,ppid=,command=`) whose command line contains any tag, except
itself and its ancestors, one `LEFTOVER pid <n>: <first 120 chars of command>` line each.

| Exit | Meaning |
|------|---------|
| 0 | No other process names a tag |
| 1 | At least one does — stop it by PID only if this round started it, run again |
| 2 | Cannot check: ps failed or listed nothing, or a tag is empty / shorter than 3 characters. Never a pass |

`--ps-cmd "<shell>"` replaces the ps call; it exists for the tests.

Known answers (`check.test.js`, 27 cases; 15 lease + 12 process): a lease naming the round must fail; another round's lease
and an empty dir must pass; missing dir, corrupt lease, failing list command must refuse. Measured
against the real lease tool on 2026-10-13: acquire → exit 1 · other round id → exit 0 · release → exit 0.

```bash
node tools/lane-lease-check/check.test.js
```
