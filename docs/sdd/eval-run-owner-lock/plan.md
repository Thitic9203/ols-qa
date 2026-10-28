# Plan — eval run owner lock

## Files

| File | Change |
|---|---|
| `scripts/claim-run.sh` | new — claim / re-claim / release (R1–R5) |
| `tools/agent-dispatch-guard/dispatch_rules.js` | new exported `findRunDirs`, `parseOwnerLine`, `assessRunOwnership`; `assessBrief(text, ctx)` runs it as one more counted check (R6–R10) |
| `tools/agent-dispatch-guard/check.js` | `briefFromHookPayload` also returns `session_id`; `--session-id` CLI flag; passes `{ sessionId }` (R11) |
| `tools/agent-dispatch-guard/run_owner_lock.test.js` | new suite, real temp dirs on disk |
| `tools/agent-dispatch-guard/README.md` | table row |
| `docs/AGENT_BOARD.md` | one line citing #0199 |

## Data

Lock line: `2026-10-28T10:01:18Z OWNER 00000000-0000-4000-8000-000000000001 automate` (placeholder id).
Regex (single source in `dispatch_rules.js`, mirrored in `claim-run.sh` with the same pattern):
`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z OWNER ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})( [A-Za-z0-9._-]{1,64})?$`

The shell copy exists because the script must run without node; the test suite asserts both
accept/refuse the same known lines, so the two cannot drift silently (#0003).

## Atomic claim

Write the line to a temp file in the run dir, then `ln <tmp> OWNER.lock` (hard link creation fails
with EEXIST if the name exists — create-if-absent, and the file is complete the instant it appears),
then remove the temp. Chosen over `set -o noclobber` (O_EXCL create, but a reader can see an empty
file between create and write) and `mkdir` (needs a separate content file).

## Path discovery

Regex over the brief for tokens starting `/`, `~/`, `$HOME/`, `${HOME}/`, ending at whitespace or
quote/bracket/backtick/`<>|;,`; strip trailing `.,:;)`. Expand `~`/`$HOME` with `ctx.home`
(default `os.homedir()`). Walk up with `fs.existsSync(join(dir,'ROUND.md'))`, stop before home and at `/`.
Placeholders like `<evidence-repo>/…` are not absolute, so they are ignored.

## Alternatives weighed

- Check in the shell hook — rejected: decisions live in `dispatch_rules.js` (#0003).
- Require `ROUND.md` to declare the owner — rejected: `ROUND.md` is written by the round author
  before any session claims it; a separate lock is what changes hands.
- Accept any non-empty session token — rejected: the old free-text lock (`… OWNER session "Automate" …`)
  would parse as session id `session`. Requiring a UUID makes that form fail closed.

## What could break

- Briefs that mention a real round folder now block until claimed — intended.
- Existing tests call `assessBrief(text)` with no ctx: default home = real home; none of their paths
  sit under a `ROUND.md` folder (checked: only one real `ROUND.md`, under `<evidence-repo>/evals/<round>/`).
  The new suite always passes an explicit temp `home`.
- Check count rises by one — existing `checks >= 13` assertions stay true.
