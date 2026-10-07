# discord-notify-guard

Outer ring of the smoke-notify defence. Owner orders 2026-09-21: *never post a smoke notify in the
wrong format* and *always get the owner's approval first*.

The format and approval checks themselves (layers L1–L10) live in the off-repo bot,
`smoke/notify_guard.py`. That module can only stop code that goes through it; this guard stops an
agent from going around it.

| Mode | Hook | Does |
|---|---|---|
| `--gate` | PreToolUse — Bash, Write, Edit, MultiEdit, NotebookEdit, Desktop Commander shell/file tools | blocks a Discord API write with bot auth, any read of the bot's credential file, inline code driving the smoke senders, and any write to the approval ledger or a notify draft |
| `--record` | UserPromptSubmit | when the owner's own prompt says `อนุมัติ <code>` / `approve <code>` (8 hex), appends it to the approval ledger — the only writer of that ledger |

Allowed on purpose: webhook posts (other workflows), Discord GETs, and running
`notify_guard.py <round> --approve <code>` as a file, because that path re-checks every layer and
the owner's approval itself.

## Flow

1. `python3 smoke/passed_report.py <round> --version <tag>` — builds list, PDF and text, runs
   L2–L5, prints the draft and its approval code. Nothing is posted.
2. The owner reads the draft and types `อนุมัติ <code>` (or replies `approve <code>` to the bot's DM).
3. `python3 smoke/notify_guard.py <round> --approve <code>` — L6 approval → L2–L5+L8 again → L9
   cooldown → L7 bot identity → post → L9 record → L7 read-back → L10 audit.

The scheduled watcher follows the same path: it DMs the draft and sends it on a later tick only once
the owner's approval exists.

## Release summary (#ols-release)

Owner order 2026-10-07: the QA bot may post release summaries, but only into `#ols-release` and
only after the owner approves. The sender is off-repo, `release/release_notify.py`:

1. `python3 release/release_notify.py build <dir>` — reads `<dir>/draft.md`, checks the header,
   ≤ 2000 chars and no mentions, writes `release-draft.json`, prints the approval code.
2. The owner types `อนุมัติ <code>`.
3. `python3 release/release_notify.py send <dir> --approve <code>` — re-checks the hash and the
   ledger approval (24h, single use), confirms the bot identity, posts only to
   `<OLS_RELEASE_CHANNEL_ID>` from the secrets store with no mentions, then reads the message back.

`release_notify.py deploys` lists prod release announcements (read-only) to confirm the tag. This
guard blocks inline code driving `release_notify` and any write to `release-draft.json`; reading
the bot token directly stays blocked.

Exit contract: 0 allow · 2 block · anything else = could not decide (wrapper lets it through
loudly). Unreadable input on `--gate` blocks (report #0005). `--record` never blocks a prompt.

Tests: `node tools/discord-notify-guard/discord_notify_guard.test.js`
