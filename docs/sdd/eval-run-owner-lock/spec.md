# Spec — eval run owner lock (post-mortem #0199)

## Problem

On 2026-10-28 between 16:55 and 17:00 (+07) one Claude session was running an eval round folder
(`<evidence-repo>/evals/<round>/`, its `ROUND.md` lists steps 0–8 and "Max 6 agents"). A second
session did not check for another owner, re-ran steps 0 and 5 over the same files, and dispatched
4 step-1 agents whose brief named `<evidence-repo>/evals/<round>/BRIEF.md`. One of them overwrote
`<round>/baseline/helix.json` with an empty 318-byte skeleton (16:59:53), destroying the other
session's work. The owning session wrote a free-text `OWNER.lock` only after that.

The rule that should have stopped it — `docs/AGENT_BOARD.md:11` (read every lane's locks/markers
before acting, from #0184) — is prose. Nothing mechanical checks it at dispatch time. This is a
repeat of #0184, so the fix must be a new, harder layer, not another warning.

Sources: incident timeline above (post-mortem #0199, main thread) · `docs/AGENT_BOARD.md:11`
(#0184 rule) · `docs/AGENT_BOARD.md:12` (#0185 anchored-marker rule) ·
`tools/agent-dispatch-guard/check.js:42-64` (hook payload parsing keeps only `tool_input.prompt`)
· `.claude/hooks/agent-dispatch-guard.sh:37` (whole payload is piped to `check.js`).

## Scope

In: a claim script for round folders; one new BLOCK rule in `tools/agent-dispatch-guard`; tests;
one doc line each in the guard README and `docs/AGENT_BOARD.md`.
Out: `.claude/settings.json` (hook already wired), anything under `<evidence-repo>/evals/`,
`docs/post-mortem/*`, the helix repo. Writes by the main thread itself (not via a dispatch) are not
gated by this layer.

## Terms

- **Run dir** — the nearest directory, walking up from a path, that holds a file named `ROUND.md`.
  The walk stops before the user's home directory and at the filesystem root.
- **Lock** — `<run dir>/OWNER.lock`.
- **Lock line** — exactly one line matching, as a whole line,
  `^<YYYY-MM-DDTHH:MM:SSZ> OWNER <session-id>( <name>)?$` where `<session-id>` is a UUID
  (8-4-4-4-12 lowercase hex) and `<name>` is 1–64 of `[A-Za-z0-9._-]`.
- **Session id** — `session_id` in the PreToolUse hook JSON.

## Rules

- **R1** When `scripts/claim-run.sh <run-dir> <session-id> [<name>]` runs and no lock exists, the
  system must create the lock atomically (create-if-absent; a concurrent second creator fails) with
  one complete lock line, and exit 0. Source: incident (two sessions on one round).
- **R2** When the lock already holds a valid lock line with the same session id, `claim-run.sh`
  must exit 0 and must not rewrite the file. Source: idempotent re-claim by the owner.
- **R3** When the lock exists with any other content (another session id, the old free-text form,
  empty, extra lines), `claim-run.sh` must exit 1, print the existing first line, and must not
  modify or delete the lock. Source: incident lock was free text; "never overwrite someone else's lock".
- **R4** When arguments are missing, the run dir does not exist, the session id is not a UUID, the
  name is invalid, or the lock is unreadable, `claim-run.sh` must exit 2 and change nothing.
- **R5** When `claim-run.sh --release <run-dir> <session-id>` runs, the system must delete the lock
  only if its lock line carries that session id (exit 0); another owner's or unparseable lock must
  be left in place (exit 1); no lock or bad arguments → exit 2.
- **R6** When an Agent dispatch brief names a path in absolute, `~/` or `$HOME`/`${HOME}` form whose
  directory or any ancestor (below home) holds `ROUND.md`, the guard must BLOCK with code
  `RUN_DIR_NOT_CLAIMED` unless that run dir's lock line carries the dispatching session id.
  Source: incident brief named `<round>/BRIEF.md`; `docs/AGENT_BOARD.md:11`.
- **R7** When the lock is the old free-text form, malformed, has more than one line, cannot be read,
  or the hook payload carries no session id, the guard must treat the run dir as not ours and BLOCK
  (fail-closed, #0005). Source: incident lock form; `docs/POSTMORTEM_RULE.md` (#0005).
- **R8** The lock line must be parsed with a regex anchored to the whole line, never a substring
  search. Source: `docs/AGENT_BOARD.md:12` (#0185).
- **R9** The refusal message must quote the existing lock line when there is one (who owns it), and
  otherwise give the claim command `bash scripts/claim-run.sh <dir> <session_id> <name>` filled with
  the run dir and the dispatching session id.
- **R10** When a brief names no path under a run dir (e.g. `<evidence-repo>/runs/<round>/lane.jsonl`
  with no `ROUND.md` above it), `RUN_DIR_NOT_CLAIMED` must not fire. Source: lane ledgers live under
  `runs/`, not round folders.
- **R11** The guard must read the session id from the hook payload in `check.js` and pass it to
  `dispatch_rules.js`; the shell hook stays a relay. Every existing rule keeps its behaviour.
  Source: `.claude/hooks/agent-dispatch-guard.sh:3-7` (decisions live in `dispatch_rules.js`).

## Edge cases

- Path inside a run dir that does not exist yet (`<round>/new/out.json`) → walk up still finds `ROUND.md`.
- Trailing punctuation after a path in prose (`…/BRIEF.md.`) → stripped before resolving.
- Brief names two run dirs → each must be claimed; first unclaimed one is reported (all listed).
- CLI mode (`--file`, `--stdin-text`) takes `--session-id <id>`; without it a round path blocks (R7).

## Done when

- `claim-run.sh` exists and the test suite proves R1–R5 on real files, including 8 concurrent claims → exactly one exit 0.
- `RUN_DIR_NOT_CLAIMED` blocks: no lock · other session · free-text lock · no session id; passes: own lock · no `ROUND.md` above.
- The incident brief line, replayed against a temp round folder, is BLOCKED end-to-end through `check.js` with a hook payload.
- `bash scripts/run-test-suites.sh` is green with the new suite counted.
- Guard README has a table row; `docs/AGENT_BOARD.md` has one line citing #0199.
