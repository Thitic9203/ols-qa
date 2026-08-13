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

### Alert contract

The message shape is fixed and pinned by `alert_format.test.js` — it drifted twice by hand
before the test existed:

```
**Inappropriate content:** [Content Naming][<env>] <headline>
> **Environment:** …
> **Status:** …
> **Items:**
> • `<title>` — <source> · <reason>
> **Action:**
> • …
```

- Bold headline first, then a blockquote of **English field labels**.
- **Body text is Thai.** English is kept only where translating hurts: API, LIVESTREAM, ticket,
  GitHub Actions, VPN, LaTeX.
- Short bullets, never a paragraph.
- One content item reported once, even when it appears in several sources.
- A scan that could not run reports `Status: Failed` — never anything that reads as a pass.
- Titles are escaped: content names contain `_` and `*`, which Discord renders as italics.

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

## Schedule

| environment | reachable from | runs on | cadence |
|---|---|---|---|
| public training environment | the internet | GitHub Actions — `.github/workflows/name-guard.yml` | every 30 min |
| pre-prod | org VPN only (private address) | local `launchd` job on the QA machine | every 30 min |

A GitHub-hosted runner cannot reach a VPN-only host, so pre-prod cannot be scanned from the cloud;
that half runs locally through the SFD fail-loud harness and needs the machine to be awake. The
local runner skips (exit 0) when the host is unreachable — being off the VPN is not a finding, and
alerting on it would train everyone to ignore the alerts.

Cost: GitHub-hosted standard runners are free with no minute cap on public repositories. This adds
no spend.

## Required repository secrets

`OLS_TRAINING_ORIGIN` · `OLS_TRAINING_SSO` · `OLS_TRAINING_EMAIL` · `OLS_TRAINING_PW` and one
delivery channel: `OLS_DISCORD_BOT_TOKEN` + `OLS_DISCORD_USER_ID`, or `OLS_NAME_GUARD_WEBHOOK`.
