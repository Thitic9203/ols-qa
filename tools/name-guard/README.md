# OLS name guard

Catches content names that must never reach a real user — QA/test traces, gibberish, ticket
references, status markers in parentheses, profanity, and duplicate titles — across every
customer-facing list (media · courses · learning paths · achievements), on a schedule.

The **scan** is read-only — it reports, it never edits. The **fixers** that act on a report are a
separate, off-repo toolkit, and they are **switched off permanently as of 2026-08-17** — the
customer is testing on pre-prod, which was the last environment they were allowed to write to. See
[Write guard](#write-guard--writes-are-off-everywhere).

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

The scan runs twice a day; findings often outlive a run. Posting the same list every time buries the channel and teaches people to scroll past it — on 2026-08-13 the same 34
items arrived three times before this existed.

`alert_dedup.js` sends only when the findings **change**. The finding set is fingerprinted
(`id|rule|field`, sorted — catalogue counts are excluded so a growing library does not look like
a new finding), and the alert is skipped when either source of history says it was already said:

- the state file next to the report (`<report>.alert-state.json`, or `NAME_GUARD_STATE`) — this
  is what a local scheduled run remembers between runs;
- the most recent alert for the same environment still in the channel — this is what a CI run
  uses when it has no local state at all. The comparison ignores lines that drift on their own
  (catalogue counts), for the same reason the fingerprint does.

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

**A blocked alert is loud, never silent.** `notify.js` exits 4 and sends nothing; `run_guard.sh`
propagates that exit instead of swallowing it, so the SFD harness DMs the owner. The findings are
still there and nobody has been told — that has to be visible, and the fix is to correct the
generator until all seven layers pass, not to loosen a layer.

**Verify with `--dry-run`, never against the live channel.** It runs every check and prints the
message without sending. Testing the sender by posting and deleting is how a test alert reached
the QA thread on 2026-08-13.


## Customer-owned content — `[RGS]` is never touched, twelve layers deep

HI (the customer's QA) keep their own fixtures on the shared pre-prod catalogue, marked `[RGS]`
in the title. Nothing in this toolkit used to know the difference. On **2026-08-25** the 11:00
scan reported 68 findings and asked, in the QA channel, for 40 renames — **24 of those rows were
HI's**, and the standing "Needs fix = คิวงาน" rule points the next agent straight at that list.
Renaming or deleting another team's fixtures mid-test destroys their run and we cannot put it back.

**The rule (owner, 2026-08-25): ถ้ามี RGS ไม่ต้องยุ่งเด็ดขาด เพราะเป็นของลูกค้า.** Never touch —
not deprioritise, not ask first — in any flow, forever. And **every alert says so**, on every
round including a clean one ("เพิ่มเสมอตลอดไป").

The definition lives in one file, [`customer_content.js`](customer_content.js): a token-shaped
match, so `[RGS]`, `[Beer][RGS]`, `RGS - …` and `[BT] RGS - …` all match while `orgs` does not.
Adding another customer marker is one entry in `CUSTOMER_MARKERS` and every layer picks it up.

| ชั้น | อยู่ที่ | กันอะไร |
|:--:|---|---|
| **1** classifier | `customer_content.js` | นิยามเดียวของคำว่า "ของลูกค้า" — ไม่มี regex กระจายไป 4 ที่แล้วเพี้ยนกันเอง |
| **2** scanner แยกออก | `scan.js` | ย้ายออกจาก `findings` ไปอยู่ `customerOwned` **ก่อน** นับ `actionable` → โค้ดปลายทางที่ไล่ `findings` เอาไปทำ fix list ไม่ได้ แม้ไม่เคยรู้จักกฎนี้ |
| **3** alert กรองซ้ำ | `alert_format.js` | builder รันกับรายงานที่ตัวเองไม่ได้สร้างด้วย (ไฟล์เก่า · fixer สร้างเอง · toolkit คนละเวอร์ชัน) — fix list คือสิ่งที่คนลงมือทำ จึงตรวจเองอีกชั้น |
| **4** remark ถาวร | `alert_format.js` | ทุกฉบับมีบรรทัดบอกว่าไม่แตะ RGS ทั้งใน Prevention และ FYI — รวมรอบที่ clean และรอบที่สแกนล้ม |
| **5** notify ปฏิเสธ fix list | `notify.js` (exit 6) | ถ้า **Solution** เผลอมี marker = ไม่ส่ง · `--force` ข้ามไม่ได้ (นี่คือเส้นแบ่ง ไม่ใช่กันโนติซ้ำ) |
| **6** notify ปฏิเสธ remark หาย | `notify.js` (exit 6) | ข้อความที่ไม่มี remark = ไม่ส่ง — คนอ่านจะได้ไม่เข้าใจว่าแถวที่หายไปคือเราลืม |
| **7** write assert | `write_guard.assertNotCustomerContent()` | ปฏิเสธ **ตัวรายการ** ไม่เกี่ยวกับ env — เปิดสิทธิ์เขียนคืนเมื่อไหร่ ชั้นนี้ยังปฏิเสธอยู่ · fail closed เมื่ออ่านไม่ออก |
| **8** network abort | `write_guard.armContext()` (C2) | non-GET ที่ URL/body มี marker ถูก abort — ครอบคำสั่งที่ยิงจาก `page.evaluate()` ซึ่งชั้น 7 มองไม่เห็น |
| **9** runner ปฏิเสธ | `namecheck/run_fix.sh` (exit 4, off-repo) | ตรวจทั้ง argument และ **เนื้อในไฟล์แผนงาน** (mutator รับงานจาก plan JSON ไม่ใช่ command line) · วางไว้ **เหนือ** kill-switch เพื่อให้รอดแม้เปิดสิทธิ์เขียนคืน |
| **10** tests | `customer_content.test.js` | ผูกทั้ง 9 ชั้นด้วยชื่อจริงจากสแกน 2026-08-25 · หลายเคสอ่าน **source** ไม่ใช่พฤติกรรม เพราะชั้นที่ถูกย้ายไปอยู่ใต้สิ่งที่มันป้องกัน ยังสอบผ่านพฤติกรรมในวันที่ย้าย |
| **11** command hook | `.claude/hooks/customer-content-guard.sh` (exit 2) | ชั้น 1–10 กัน **toolkit** · ชั้นนี้กัน **คำสั่งที่พิมพ์เอง** ซึ่งเป็นวิธีที่การแก้ content ทีละชิ้นบน pre-prod เกิดขึ้นจริงมาตลอด · นั่งบน Bash tool จึงเห็นทุกคำสั่งไม่ว่าเรียก binary ด้วย path ไหน (`/usr/bin/curl` · python · node) ซึ่ง shell function กับ PATH shim ดักไม่ได้ |
| **12** shell guard | `~/ols-qa-testing-bot/guard/customer_curl_guard.zsh` (rc 4, off-repo) | เทอร์มินัลของคนนอก session ของ agent · ติดตั้งด้วย `source` 1 บรรทัดใน `.zshrc` ลบบรรทัดนั้นคือถอด · **fail open ถ้าตัวมันเองพัง** โดยตั้งใจ — guard ที่ทำให้ `curl` ใช้ไม่ได้ทั้งเครื่องคือ guard ที่ถูกลบทิ้งภายในวันเดียว |

ชั้น 11 และ 12 ตัดสินด้วย **3 เงื่อนไขพร้อมกัน**: มี marker · เป็นคำสั่งที่**เขียน** · เป้าเป็น env ของ OLS
(host อ่านจาก `~/.ols-qa-secrets/*.env` ตอนรัน — ไม่มี hostname อยู่ใน repo public นี้ · อ่านไม่ได้จึง fallback
ไปดูรูป path `/api/media|courses|learning-paths|achievements|livestreams`). ครบ 3 ข้อถึงบล็อก — งานปกติจึงไม่โดน:
อ่านแถวของลูกค้า · grep · แก้ไฟล์ใน repo · PATCH โนติ Discord ที่ตัวข้อความอ้างถึง `RGS` ผ่านได้หมด
ผูกด้วย `customer_hook.test.js` ซึ่งทดสอบ **ทั้งสองทางที่พังได้** — ปล่อยของจริงหลุด และบล็อกงานปกติ

Two directions on purpose: **reporting** answers only on a real marker match (an item we cannot
read is not silently reclassified as theirs — that would hide our own defects), while **writing**
fails closed (a marker match *or* an unreadable input both refuse).

A refusal at layer 7, 8 or 9 is audited, never silent — a block nobody hears about is how the
next attempt gets made.


## Write guard — writes are OFF everywhere

The toolkit no longer only reports; it also fixes (rename, edit, unpublish, delete). Those fixers
take an environment as an argument, so one wrong `OLS_ENV=` is all it takes to rewrite content in
an environment where real people are working. A wrong write there is not a QA artefact, it is
damage to someone's live work.

**Writes are refused in every environment, permanently, since 2026-08-17.** The customer is
testing on pre-prod — the one environment that used to be writable — so the owner's instruction is
hands-off: nothing in this toolkit changes pre-prod data any more.

The refusal is expressed **twice on purpose**, because a single line is one accident away from
being reverted by somebody who does not know why it is there:

- **L0** `WRITES_DISABLED = true` — a kill-switch that ignores the allowlist entirely;
- **L1** `WRITABLE_ENVS = []` — nothing left to match even if L0 is removed.

Re-enabling writes takes two deliberate edits **and** the owner's say-so; flipping either one
alone leaves the other refusing, and `write_guard.test.js` goes red if either drifts.

**What still runs:** the read-only scan and its Discord alert. `isProtectedEnv()` deliberately
still returns `false` for pre-prod, so bad names are still reported — reporting was never the
risk, writing was. `scan.js` does not arm the L5 interceptor, so turning writes off cannot break
the scan's own SSO login.

`write_guard.js` holds the rules; `write_guard.test.js` pins them. Eight independent layers, each
one enough on its own:

| layer | where | stops |
|---|---|---|
| **L0** kill-switch | `classifyEnv()` | every write in every env, whatever the allowlist says |
| **L1** allowlist | `classifyEnv()` — also applied in `namecheck/envs.js`, so an env cannot be resolved without its verdict | any env not explicitly writable; empty list = everything; a missing label or origin fails closed |
| **L2** label denylist | `classifyEnv()` | `training69`, `training70`, `obectraining…` — token-shaped, survives a rename |
| **L3** host denylist | `classifyEnv()` | a training host reached under a different label, e.g. a hand-passed `OLS_ORIGIN=` |
| **L4** script assert | `assertWritable()` at the top of every mutating script | the run, before login — exit 3 |
| **L5** network abort | `armContext()` on every Playwright context | non-GET requests to a protected host, including writes issued from inside `page.evaluate()` |
| **L6** runner refusal | `namecheck/run_fix.sh` | the process, before node starts — covers a script that lost its import |
| **L7** audit + alert | `namecheck/guard_audit.js` | nothing — it makes the refusal heard: ledger `logs/sfd/WRITE_GUARD_BLOCKED.md` + SFD DM |

Reads are **not** untouched any more. Refusing writes was never the whole instruction: a read logs
in as a real person and ends in an alert about their live work, which is what actually reached the
QA channel. Since 2026-08-13 `scan.js` calls `isProtectedEnv()` **before it loads a browser** and
exits `2` — deliberately not `0`, because a refusal that exits clean is indistinguishable from
"scanned, found nothing". `GUARD_DRILL=1` labels a rehearsal in the ledger and the alert so a drill
is never mistaken for a real attempt.

The rules live here (public, unit-tested, no hostname in them — `preprod` and `training` are
enough to tell the two apart). The ledger and the Discord alert live off-repo with the fixers,
because they touch local paths and secrets. If the rules file cannot be loaded, the off-repo
binding refuses **every** write rather than guessing.

Run the checks:

```bash
node tools/name-guard/write_guard.test.js
```

## Schedule — pre-prod only, and scan-only

| environment | runs on | cadence | what it does |
|---|---|---|---|
| pre-prod (org VPN only) | local `launchd` job on the QA machine | twice daily, 11:00 and 17:00 | `run_guard.sh` → **scan + alert only.** It never invoked a fixer, and since 2026-08-17 no fixer can write anywhere anyway |
| training | **nothing. hands-off.** | never | refused by the runner *and* by `scan.js` itself |

No scheduled job has ever changed pre-prod data: the fixers are run by hand through
`namecheck/run_fix.sh`, which now refuses every environment. Stopping the scheduled job as well is
a `launchctl` action on the QA machine, not a change in this repo — see the note below the table.

**Training is not scanned.** Real people are working in it, and the owner's instruction is to
leave it alone — which covers polling and alerting, not just writing. The GitHub Actions job that
scanned it every 30 minutes was deleted on 2026-08-13 after it kept posting training findings into
the QA channel; `run_guard.sh` refuses a training label outright, with no override flag, because an
override that exists is an override that eventually gets used. The wrapper alone was not enough,
though — a scan started by hand, or by an agent that sourced the wrong env file, walked straight
past it, so `scan.js` now refuses on its own too. `write_guard.test.js` fails if any workflow
reappears that schedules a scan or names a training environment, if the scanner stops consulting
the hands-off guard, if that check drifts below the `require('playwright')` line, or if an override
flag appears in it.

**The channel is guarded too, not only the scanner.** The requirement is about what appears in the
QA thread: no alert that checked training, ever. So `notify.js` refuses to post a report whose
`env`, `origin` **or any finding** mentions training — `exit 5`, before delivery is attempted, and
`--force` does not override it (that flag suppresses duplicate-suppression, it is not a licence to
cross a boundary). In the normal flow this never fires, because the scanner already refused; it is
there for the abnormal one — a stale report file on disk, a report built by a fixer, a copy of this
toolkit whose scanner is older than this rule.

**The same instruction covers the daily health check**, which is a separate job that used to log
into training twice a day: it now runs on pre-prod only, and drops any env whose key or host looks
like training even if the config says otherwise. See the OLS project guide.

The pre-prod run goes through the SFD fail-loud harness and needs the machine awake and on the VPN.
It skips (exit 0) when the host is unreachable — being off the VPN is not a finding, and alerting on
it would train everyone to ignore the alerts.

Cost: nothing. No hosted runner minutes are used at all now that the scheduled job is gone.

## Required configuration

The pre-prod run reads `~/.ols-qa-secrets/name-guard-preprod.env` (off-repo): `OLS_ORIGIN` ·
`OLS_SSO` · `OLS_EMAIL` · `OLS_PW` · `OLS_OWN_EMAILS` · `DISCORD_CHANNEL_ID`, with the bot token in
`~/ols-qa-testing-bot/.discord_bot_token`.
