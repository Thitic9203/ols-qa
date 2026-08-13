# OLS name guard

Catches content names that must never reach a real user — QA/test traces, gibberish, ticket
references, status markers in parentheses, profanity, and duplicate titles — across every
customer-facing list (media · courses · learning paths · achievements), on a schedule.

Read-only. It reports; it never edits content.

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
