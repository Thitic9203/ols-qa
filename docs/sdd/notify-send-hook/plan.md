# Plan — notify-send hook

## Files touched
- `tools/notify-send-guard/check.js` (new; R1–R9) — node, no dependency. Exports `parseInvocations`,
  `inspect`, `decide`, `hook`. Shell splitting follows `tools/process-kill-guard/kill_rules.js`
  (pipelines outside quotes, wrapper words skipped) plus `$'…'` ANSI-C quoting for `--body`.
- `tools/notify-send-guard/notify_send_guard.test.js` (new; R11) — plain `assert`, temp state dir via
  `NOTIFY_SEND_GUARD_STATE_DIR`; picked up by `scripts/list-test-suites.sh` (`*.test.js`).
- `tools/notify-send-guard/README.md` (new) — what it blocks and how to pass.
- `.claude/settings.json` (R10) — one entry in the existing PreToolUse `Bash` hooks list.
- `.gitignore` (R10) — `.claude/.notify-send-guard-state/`.

## Data
State: `<state dir>/<sanitised session_id>.json` = `{ "tickets": { "<ticket>": "<ISO time of last dry-run>" } }`.
Session id sanitised to `[A-Za-z0-9._-]` so it can never escape the directory.

## Library
None (node ≥18 built-ins only). No cost.

## Options weighed
- Bash wrapper like `discord-notify-guard.sh` vs direct `node … --hook` like process-kill-guard: direct node
  (the brief named process-kill-guard; one fewer file). If node is missing the harness reports a hook error
  and the command proceeds — the helper's own refusal (layer in the bot repo) still stands.
- Fail-closed vs fail-open on unparseable input: split (R8) — closed only when the raw text names the helper.
- Clearing state after a real send: no (R7) — a second identical send must not need a second dry-run; the
  helper's registry de-duplicates posts.

## What could break
- A false block on a legitimate send whose body is a real bullet with `n/n` that is not a verdict — accepted:
  the count line is rendered by the helper from `--pass-count`… flags, so bullets must not repeat it.
- Every Bash call now spawns one more node process (~tens of ms) — same cost as process-kill-guard.
