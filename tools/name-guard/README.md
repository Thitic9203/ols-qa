# OLS name guard

Catches content names that must never reach a real user — QA/test traces, gibberish, ticket
references, status markers in parentheses, profanity, and duplicate titles — across every
customer-facing list (media · courses · learning paths · achievements), on a schedule.

The **scan** is read-only — it reports, it never edits. The **fixers** that act on a report are a
separate, off-repo toolkit, and they may only ever write to pre-prod: see
[Write guard](#write-guard--the-training-environment-is-read-only-absolutely).

## Why it exists

Real users are on the system now, so a name like `testest`, `ทดสอบ Live`, `[QA TEST] OLS-205 tc08`,
`ddddd`, `1234565` or `เหรียญนักเรียนดีเด่น (แก้ไข)` is a live defect, not a QA artefact. Names drift
back in every time someone tests against a shared environment, so a one-off cleanup does not hold —
the scan has to keep running.

## Rules

`name_rules.js` is the single source of truth, shared by the scanner and any fixer:

| rule | catches |
|---|---|
| `test-trace` | `test` · `QA TEST` · `ทดสอบ` · `dummy` · `sample` · `placeholder` · `TBC` · `demo` · `asdf` … |
| `ticket-ref` | `OLS-205`, any `ABC-123` issue key leaking into a user-visible name |
| `status-paren` | `(เผยแพร่)` · `(ร่าง)` · `(รอแก้ไข)` · `(แก้ไข)` · `(สำเนา)` · `(2)` … |
| `gibberish` | `mx;smclsnvlcsmv;cxc[lc` · `ddddd` · Thai with no vowel/tone marks at all |
| `no-words` | names that are only digits/symbols, e.g. `1234565` |
| `too-short` | titles under 4 characters |
| `profanity` | Thai + English profanity list |
| `duplicate-name` | the same title appearing twice in one list |
| `missing-cover` | user-facing content with no `coverImageUrl` / `thumbnailUrl` — the card renders a blank tile |
| `cover-broken` | the cover URL exists but does not load as an image (404, empty body, wrong content-type) |

`missing-cover` exempts `DRAFT`: a cover is only owed once the content can face a user
(`PUBLISHED`, `PENDING_APPROVAL`, `PENDING_EDIT`, `FLAGGED`, `UNPUBLISHED` — the last two still show
on creator and admin screens). `cover-broken` is checked by fetching each distinct cover once per
run inside the browser session; if that verification cannot run, the field check still stands.

Two learning paths sat published with `coverImageUrl = null` in training69 for a day before a human
spotted the blank tiles — the scan was green throughout because it only read titles and
descriptions. Both cover rules exist to make that failure mechanical instead of visual.

Known brand/tech words (`Python`, `ChatGPT`, `HTML`, `SQL`, …) are allow-listed so they are never
mistaken for gibberish — vowel-poor real words were the first false positives this hit.

## Running it

Everything environment-specific comes from the environment. Nothing about any environment is
committed here — this repository is public.

```bash
OLS_ORIGIN=https://<app-host> \
OLS_SSO=https://<sso-host>/sign-in/embed \
OLS_EMAIL=<qa account> OLS_PW=<password> \
OLS_ENV_LABEL=<env name> \
node tools/name-guard/scan.js --json report.json --own
```

`--own` adds the signed-in account's own content in every status (draft / flagged / unpublished) —
invisible in the public lists but visible on creator and admin screens.

Exit codes: `0` clean · `1` findings · `2` the scan could not run (login, network, origin mismatch).
The distinction matters: a scan that cannot run is not a pass.

Then alert:

```bash
node tools/name-guard/notify.js report.json
```

Posts to the QA Discord channel (`DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID`), with
`DISCORD_WEBHOOK` as a fallback if the channel post fails. **No DMs** — the owner asked for the
team channel. Clean runs stay silent unless `--force`.

### One alert per change, not per run

The scan runs every 30 minutes; findings take longer than that to fix. Posting the same list
every run buries the channel and teaches people to scroll past it — on 2026-08-13 the same 34
items arrived three times before this existed.

`alert_dedup.js` sends only when the findings **change**. The finding set is fingerprinted
(`id|rule|field`, sorted — catalogue counts are excluded so a growing library does not look like
a new finding), and the alert is skipped when either source of history says it was already said:

- the state file next to the report (`<report>.alert-state.json`, or `NAME_GUARD_STATE`) — this
  is what a local scheduled run remembers between runs;
- the most recent alert for the same environment still in the channel — this is what a CI run
  uses, since it starts on a fresh machine with no state at all. The comparison ignores the
  `Scope` line for the same reason the fingerprint does.

`--force` sends regardless: a person asking for the current state is not a duplicate. Pinned by
`alert_dedup.test.js`.

### Alert contract — six fields, every time

The accepted message carries the same six fields in the same order on every send — findings, a
clean run and a failed scan alike. None is skipped when it has nothing to say (it says "ไม่มี"),
none is added, none is reordered:

```
**Inappropriate content:** [Content Naming][<env>] <headline>
> **Environment:** …
> **Media Type:** …
> **Status:** Needs fix | Fixed | Clean | Failed
> **Solution:**
> • …
> **Prevention:**
> • …
> **FYI:** …
```

**Seven checks run on the exact outgoing string before anything is sent** (`alert_gate.js`,
fail-closed — a message that fails is not sent at all, and `notify.js` exits 4):

| layer | catches |
|---|---|
| **L1** field set | a dropped field |
| **L2** field order | fields reordered |
| **L3** line shape | a wrong header, or a line that is neither a field nor a bullet |
| **L4** no extras | an invented field (the old `Scope` / `Action` drift) |
| **L5** markdown safe | literal `**`, unescaped `_` — Discord renders those as formatting |
| **L6** substance | an empty field, a bullet block with no bullets, over Discord's 2000 chars |
| **L7** no empty claim | a headline counting findings the message never lists; an unfilled placeholder |

Reading the draft is not a substitute: every format defect that shipped looked right to whoever
wrote it. Pinned by `alert_gate.test.js` (20 cases) and `alert_format.test.js`.


## Write guard — the training environment is read-only, absolutely

The toolkit no longer only reports; it also fixes (rename, edit, unpublish, delete). Those fixers
take an environment as an argument, so one wrong `OLS_ENV=` is all it takes to rewrite content in
the **training** environment — where real people are working. A wrong write there is not a QA
artefact, it is damage to someone's live work.

**Writes are allowed in pre-prod only.** `write_guard.js` holds the rules; `write_guard.test.js`
pins them. Seven independent layers, each one enough on its own:

| layer | where | stops |
|---|---|---|
| **L1** allowlist | `classifyEnv()` — also applied in `namecheck/envs.js`, so an env cannot be resolved without its verdict | any env not explicitly writable; a missing label or origin fails closed |
| **L2** label denylist | `classifyEnv()` | `training69`, `training70`, `obectraining…` — token-shaped, survives a rename |
| **L3** host denylist | `classifyEnv()` | a training host reached under a different label, e.g. a hand-passed `OLS_ORIGIN=` |
| **L4** script assert | `assertWritable()` at the top of every mutating script | the run, before login — exit 3 |
| **L5** network abort | `armContext()` on every Playwright context | non-GET requests to a protected host, including writes issued from inside `page.evaluate()` |
| **L6** runner refusal | `namecheck/run_fix.sh` | the process, before node starts — covers a script that lost its import |
| **L7** audit + alert | `namecheck/guard_audit.js` | nothing — it makes the refusal heard: ledger `logs/sfd/WRITE_GUARD_BLOCKED.md` + SFD DM |

Reads are untouched: the scanner still runs against training every 30 minutes. Only writes are
refused. `GUARD_DRILL=1` labels a rehearsal in the ledger and the alert so a drill is never
mistaken for a real attempt.

The rules live here (public, unit-tested, no hostname in them — `preprod` and `training` are
enough to tell the two apart). The ledger and the Discord alert live off-repo with the fixers,
because they touch local paths and secrets. If the rules file cannot be loaded, the off-repo
binding refuses **every** write rather than guessing.

Run the checks:

```bash
node tools/name-guard/write_guard.test.js
```

## Schedule — pre-prod only

| environment | runs on | cadence |
|---|---|---|
| pre-prod (org VPN only) | local `launchd` job on the QA machine | every 30 min |
| training | **nothing. hands-off.** | never |

**Training is not scanned.** Real people are working in it, and the owner's instruction is to
leave it alone — which covers polling and alerting, not just writing. The GitHub Actions job that
scanned it every 30 minutes was deleted on 2026-08-13 after it kept posting training findings into
the QA channel; `run_guard.sh` refuses a training label outright, with no override flag, because an
override that exists is an override that eventually gets used. `write_guard.test.js` fails if any
workflow reappears that schedules a scan or names a training environment.

The pre-prod run goes through the SFD fail-loud harness and needs the machine awake and on the VPN.
It skips (exit 0) when the host is unreachable — being off the VPN is not a finding, and alerting on
it would train everyone to ignore the alerts.

Cost: nothing. No hosted runner minutes are used at all now that the scheduled job is gone.

## Required configuration

The pre-prod run reads `~/.ols-qa-secrets/name-guard-preprod.env` (off-repo): `OLS_ORIGIN` ·
`OLS_SSO` · `OLS_EMAIL` · `OLS_PW` · `OLS_OWN_EMAILS` · `DISCORD_CHANNEL_ID`, with the bot token in
`~/ols-qa-testing-bot/.discord_bot_token`.
