# Plan — notify-send hook

## Files touched
- `tools/notify-send-guard/check.js` (new; R1–R9, R12, R13) — node, no dependency. Exports `tokenize`,
  `parseInvocations`, `normalizeFlags`, `inspect`, `decide`, `hook`, `record`. Shell splitting follows
  `tools/process-kill-guard/kill_rules.js` (segments outside quotes, `WRAPPERS` skipped with their options) plus
  `$'…'` ANSI-C quoting, `bash -c`/`eval` re-parse, and a tokenizer that reports unbalanced quotes / heredocs (R8).
  Flag list `HELPER_FLAGS` copied from the helper's `main()` for R12 prefix matching.
- `tools/notify-send-guard/notify_send_guard.test.js` (new; R11) — plain `assert`, temp state dir via
  `NOTIFY_SEND_GUARD_STATE_DIR`, per-rule counter printed at the end; picked up by `scripts/list-test-suites.sh`
  (`*.test.js`).
- `tools/notify-send-guard/fixtures/post-tool-use-*.json` (new; R1, R7) — recorded PostToolUse Bash payloads
  (exit 0, exit ≠ 0, interrupted) with ids and paths replaced by placeholders.
- `tools/notify-send-guard/README.md` (new) — what it blocks and how to pass.
- `.claude/settings.json` (R10) — one PreToolUse `Bash` entry (`--hook`) and a new PostToolUse `Bash` entry (`--record`).
- `.gitignore` (R10) — `.claude/.notify-send-guard-state/`.

## Data
State: `<state dir>/<sanitised session_id>.json` =
`{ "dryruns": { "<ticket>": { "sha256": "<hex of ticket \0 body>", "at": <epoch s> } } }`.
Valid for 0–1800 s (the helper's `DRYRUN_MAX_AGE`); deleted after a successful real send (use-once, like the helper's
stamp). Written atomically (temp file + rename). Session id sanitised to `[A-Za-z0-9._-]`.

## Library
None (node ≥18 built-ins: `crypto`, `fs`, `path`). No cost.

## Options weighed
- Record dry-run in PreToolUse vs PostToolUse: PostToolUse (R1) — PreToolUse runs before the command, so a dry-run
  that fails, is refused by the helper (exit 4) or is blocked by another hook would still count.
- Hash args vs hash rendered content: the hook cannot render the helper's content offline, so it hashes ticket+body;
  the helper's own content stamp still checks every other argument.
- Keep vs clear state after a real send: clear (R7) — matches the helper, which deletes its stamp after the post;
  the `--registry` file is the precedent and edit-in-place record, it does not stop a second post.
- Abbreviated flags: normalise unique prefixes like argparse (R12) rather than block every abbreviation — a
  legitimate `--dry` dry-run stays allowed; ambiguous prefixes are blocked on real sends.
- Run-time values (`$BODY`, `$(cat f)`): block as cannot prove (R13) — the hook cannot know the value.
- Bash wrapper like `discord-notify-guard.sh` vs direct `node … --hook`: direct node (as process-kill-guard). If node
  is missing the harness reports a hook error and the command proceeds — the helper's own refusal still stands.
- Fail-closed vs fail-open on unparseable input: closed only when the raw text names the helper (R8).

## What could break
- A false block on a legitimate body bullet with a verdict word and `n/n` — accepted: the count line is rendered by
  the helper from `--pass-count`… flags, so bullets must not repeat it.
- The PostToolUse payload shape (`is_error`, `interrupted`, exit code) is confirmed from recorded fixtures before
  coding (T3); if success cannot be read, nothing is recorded (fail closed: real sends block until it is fixed).
- `HELPER_FLAGS` drifts when the helper gains a flag: a new flag sharing a prefix can turn a unique abbreviation
  ambiguous (blocked, safe direction); README names the helper's `main()` as the list to copy.
- Every Bash call spawns two more node processes (Pre + Post, ~tens of ms each) — same cost class as process-kill-guard.
