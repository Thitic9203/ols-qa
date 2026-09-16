# ask-guard — search conversation history before asking the owner for a reference

PreToolUse hook on `AskUserQuestion`. A question that asks the owner for a **reference** — a thread,
channel, webhook, link, id, account, env, folder, sheet, destination, token, endpoint or host — is
blocked until an episodic-memory search (`mcp__plugin_episodic-memory_episodic-memory__search`) has
run **in the same turn**.

**Why:** [report #0059](../../docs/post-mortem/20260916-post-mortem-report-0059-asked-owner-three-times-for-discord-destination-already-given.md).
The owner was asked three times for a Discord destination they had given two days earlier. Only the
`memory/` files were searched; the answer existed only in a past session's transcript. Repeat of
#0021 — "not found in memory" is not "never answered".

## How it decides

| state | when | result |
|---|---|---|
| `not-ask` / `no-signal` | another tool, or a question that asks for no reference | allow |
| `searched` | a search tool call sits between the last user prompt and now | allow |
| `not-searched` | the turn is readable and has no search | **block** |
| `unverifiable` | the transcript or the question cannot be read, or a line in this turn is unparseable | **block**, with a recorded way out |

- **A turn** starts at the last genuine user prompt: a `user` line that is not `isMeta` and not a
  `tool_result`. A popup answer is a tool result, so a follow-up question in the same turn does not
  need a second search.
- **The signal list** lives in `ask_rules.js` (`SIGNALS`) and is the only copy. Thai signals are nouns
  matched as substrings; English ones use word boundaries.
- **Unverifiable is never a pass** (report #0005). The way out leaves a record and only works in that
  state — it cannot unlock a readable turn that simply was not searched:

  ```bash
  node tools/ask-guard/check.js --unverifiable-ok "<what was searched, what came back>"
  ```

  Single use, 10 minutes. State in `.claude/.ask-guard-state/` (git-ignored).

## Files

| file | role |
|---|---|
| `ask_rules.js` | the whole decision — pure, no I/O |
| `check.js` | hook entry: reads the payload, the transcript and the override; exit `0` allow · `2` block · other = could not decide |
| `.claude/hooks/ask-guard.sh` | relay only. Block reason goes to **stderr**. Missing node / missing `check.js` / a crash allow with a warning, same policy as the other guards |
| `ask_rules.test.js` | signals, turn scan, decision, the #0059 replay, the gate on disk, the bash relay, the wiring |

```bash
node tools/ask-guard/ask_rules.test.js
```
