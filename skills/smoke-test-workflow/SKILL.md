---
name: smoke-test-workflow
description: Run a post-deployment smoke test of the OLS core features on a named environment, triage every non-passing case to a verified root cause, produce a one-page A4-landscape PDF summary plus the Playwright per-case report, and post the result to the QA release channel. Use when asked to smoke test a build, confirm a deployed version is healthy, or decide whether a build can be promoted to the next environment.
---

# Smoke Test Workflow (OLS)

Confirms that the version currently deployed to an environment still works, and produces the two
artefacts a team acts on: a one-page summary and a clickable per-case report.

**This is a release-gate workflow, not a per-ticket test.** It grades main features. Never expand it
into ticket-by-ticket verification — that is `testing-ticket-workflow`.

Resolve every `<PLACEHOLDER>` from `~/.ols-qa-secrets/ols-secrets.md` at runtime. This repo is
public: never write a resolved host, id, account or channel into any file here.

---

## Stage 0 — Intake (blocking)

1. **Confirm the environment with the owner and wait.** Never default, never pick the one that is
   easier to reach. If the owner already named it this session, state what you will use and carry
   on — do not ask twice.
2. **Read `docs/post-mortem/PENDING.md`.** An `OPEN` row blocks every commit later in this
   workflow; know that before you start, not at the end.
3. `git pull origin main` in `ols-qa`, and check `~/GitHub/ols-qa-e2e` is on a clean tree.

## Stage 1 — Preflight

| Check | How | Refuse if |
|---|---|---|
| VPN | `scutil --nc list` — the tunnel for dev/pre-prod must read `Connected` | not connected |
| Host reachable | `command curl -s -o /dev/null -w '%{http_code}' --cacert ~/.ols-qa-secrets/ca-bundle-with-bitdefender.pem https://<ENV_HOST>/` | not `200` |
| Secrets store | `~/.ols-qa-secrets/ols-secrets.md` present | missing |

`global-setup` re-checks all three and fails loudly. A preflight failure is a **harness** failure —
never report it as a product verdict.

## Stage 2 — Identify the deployed version

The app exposes **no version endpoint**. Pin it by evidence, not by assumption:

1. Fetch the environment's home page and keep the `_next/static/**` asset list as a build
   fingerprint (`shasum -a 256`).
2. Find a **UI marker unique to one release** — a label a known commit introduced. Read the live DOM
   or a Playwright failure snapshot for it.
3. `cd ~/GitHub/ols-monorepo && git fetch -q origin && git tag --contains <commit> --sort=-creatordate`
   — the earliest tag containing that commit is the deployed release, and the previous tag must
   **not** contain it. State both facts in the report.

If no marker separates two candidate tags, say the version is a range. Do not name one.

## Stage 3 — Run

```bash
cd ~/GitHub/ols-qa-e2e
E2E_JSON_OUT=<WORKDIR>/run.json TARGET_ENV=<env> rtk proxy npx playwright test \
  --grep @safe \
  --project=guest --project=learner --project=creator --project=admin-content --project=admin-user \
  --output=<WORKDIR>/artifacts \
  tests/e2e/specs/navigation.spec.ts tests/e2e/specs/authentication.spec.ts \
  tests/e2e/specs/media-list-view.spec.ts tests/e2e/specs/course-management.spec.ts \
  tests/e2e/specs/learning-path-management.spec.ts tests/e2e/specs/profile-page.spec.ts \
  tests/e2e/specs/trending-feed.spec.ts
```

- **`rtk proxy` is mandatory.** Without it the rtk hook rewrites the command and collapses Playwright's
  output to `PASS (0) FAIL (0)` — a run that looks empty rather than one that ran.
- **Do not pass `--reporter=`.** The config's own reporter list includes the HTML reporter, and that
  report is a deliverable. Overriding it silently loses the artefact.
- `@safe` is read-only. Anything that writes is out of scope for this workflow.
- `<WORKDIR>` is a **permanent** folder — `~/ols-qa-testing-bot/out/<env>-smoke-<YYYY-MM-DD>/`.
  Never `/tmp`: it is wiped and takes the round's evidence with it.

**Then rerun every flagged case alone**, `--workers=1 --retries=0`, into a separate `--output` dir so
the first run's artefacts survive. A case that passes on the rerun is unstable, not a defect.

## Stage 4 — Triage every non-passing case

No case may be left as "a limitation". Each one ends in exactly one of these, with evidence:

| Verdict | What proves it |
|---|---|
| **App defect** | the app contradicts a spec you opened this round (Jira description / AC field / Figma), quoted char-exact |
| **Stale test** | a Done ticket changed the product deliberately and the suite still asserts the old behaviour — cite ticket + the commit + the source line |
| **Test-code defect** | the suite mis-reads a correct app — cite the line and what it should read instead |
| **Missing fixture** | the environment lacks the state; say what state, and whether creating it is reversible |
| **Unstable** | passed on the single-worker rerun |

**Never open a bug from an assumed spec** (PM-006). "The app differs from what I think the spec
says" is a question, not a defect.

Useful moves, all cheap:
- `git log -S "<the exact string the test expects>"` in `ols-monorepo` — finds the commit that
  removed a label and names the ticket that ordered it.
- Read the Jira description via REST (read-only is fine):
  `command curl -s --cacert <CA> -u "$(head -1 ~/ols-qa-testing-bot/.jira_token)" "https://<JIRA_DOMAIN>/rest/api/2/issue/<KEY>?fields=summary,status,description"`
  OLS bugs keep their content in **custom fields**, not `description`.
- Open the failure's `error-context.md` — it holds the full accessibility snapshot at the moment of
  failure, which usually answers the question without re-running anything.

## Stage 5 — Fix what is ours, then re-verify

Fix stale expectations and test-code defects in `ols-qa-e2e` on a branch. Then:

1. `npx tsc --noEmit` and `npx eslint <changed files>` — both clean.
2. **Close the class, not the instance.** If one reader paged only the first page, grep every sibling
   reader and fix them all; report the count you scanned and the count you changed.
3. Re-run the **whole** suite, not just the cases you touched. A fix that repairs 11 cases and breaks
   8 others is a net loss, and only a full run shows it.
4. Commit with a message that names the ticket and the source line behind each change.

**Known trap:** when adding paging to a list reader, honour a `page=` the caller already pinned.
Appending a second one yields `page=1&page=1`, which the API parses as `NaN` and rejects with 400.

## Stage 6 — The one-page summary

Template and renderer live off-repo at `~/ols-qa-testing-bot/smoke/`
(`report-template.html`, `render-landscape.js`, `measure.js`).

Fixed design decisions — do not redesign them each round:

- **A4 landscape, exactly one page.** Verify with `pypdf`, never by eye.
- Apple-style clean: `-apple-system`, `"SF Pro Display"`, **`"Sukhumvit Set"`** for Thai, near-black
  `#1d1d1f` on white, `#f5f5f7` cards, 4mm radius, one green `#1d8a3f`.
- Header carries **environment · version · completion time**. Every round.
- Left card: totals and the split by user role. Middle card: one bar per feature module with
  **bullets underneath naming what that module's cases cover**. Bottom strip: equal columns, bullets
  only, no prose paragraphs.
- Thai body copy, non-technical. No file names, no case ids, no error codes on the page.

**Fitting to one page — measure, do not guess.** `measure.js` reports `avail` vs `body` and each
block's height. If it overflows, cut content or spacing and re-measure. Two traps seen for real:
a missing `</div>` turns the bottom strip into a grid item and wrecks the layout, and content that
measures *exactly* `avail` still spills — leave a few px of slack.

**Always rasterise the finished PDF and look at it** before sending. A page-count check does not
catch a broken layout.

## Stage 7 — Deliverables

| File | What |
|---|---|
| `YYYYMMDD-Smoke-Test-Summary.pdf` | the one-page summary |
| `YYYYMMDD-Playwright-Test-Report.html` | `playwright-report/index.html` from the run |

The Playwright report is a **folder** (`index.html` plus `data/` holding the screenshots). The single
`index.html` opens standalone and shows every case, its steps and its timing; only the attached
screenshots break. Say so plainly rather than implying the file is complete.

**A no-login public link is a security decision, not a technical one** — the report carries internal
hostnames, test-account names and screenshots. Never publish it publicly on your own initiative.

### Scoping the report to passing cases

If the owner asks for a pass-only report, produce it by **re-running with the non-passing cases
excluded** (`--grep-invert`), never by editing report data. Two things to know before promising it:

- Skips are data-dependent, so each run can skip a different case. Excluding them one round at a time
  does not converge — the case set just shrinks.
- One or two cases usually pass only on the second attempt and are badged **flaky**, and it is rarely
  the same ones. **Say this out loud instead of re-running until it looks clean.**

## Stage 8 — Notify

Post to the QA release channel `<QA_RELEASE_CHANNEL_ID>` as bot `<QA_BOT_ID>` (token at
`~/ols-qa-testing-bot/.discord_bot_token`).

1. **Verify the bot first** — `GET /users/@me` must return the expected id. Never send as a different
   bot because the expected one did not resolve.
2. **Draft the message and get the owner's approval before sending.** Sending is outward-facing.
3. English, concise. One fact per line. Times as `9 Sep 2026, 3:14 PM`.
4. To make a mention ping, use `<@id>` **and** `allowed_mentions.users`. Look an id up with
   `GET /guilds/<GUILD_ID>/members/search?query=<name>`.
5. Attach both files in the same request (`files[0]`, `files[1]` + `payload_json`).
6. **A correction is a `PATCH` to the same message id.** Never delete and repost.

Message shape:

```
**OLS Smoke Test — <env> · `<version>`**

Smoke test of the OLS core features on **<env>** is complete. **All N cases passed** — no product defects found.

• **Environment:** <env>
• **Version:** `<tag>` (`<short sha>`)
• **Completed:** 9 Sep 2026, 3:14 PM

See the attached files for details:
• **YYYYMMDD-Smoke-Test-Summary.pdf** — one-page overview of the result and feature coverage
• **YYYYMMDD-Playwright-Test-Report.html** — per-case results, opens in any browser

**This build is cleared to deploy to pre-production.** <@id>
```

## MUST / NEVER

- **MUST** confirm the environment with the owner before touching anything.
- **MUST** end every non-passing case at a verified root cause. "Test-suite limitation" written into
  a deliverable without a `path:line` behind it is unfinished work, not a finding.
- **MUST** re-run the whole suite after any fix.
- **MUST** look at the rendered PDF before sending it.
- **NEVER** report a harness or VPN failure as a product verdict.
- **NEVER** run this against training — real people work there.
- **NEVER** touch anything whose title or description contains `RGS`; that is the customer's data.
- **NEVER** publish the Playwright report publicly without the owner's explicit decision.
- **NEVER** claim a version without the tag evidence from Stage 2.
