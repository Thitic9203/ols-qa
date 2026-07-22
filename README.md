# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at <ORG>.

Helix skills embedded directly — no separate install needed.

**OLS Workspace version: v1.16.0** (22 Jul 2026) — based on helix v1.5.31

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## What this workspace can do

Three ways of working, all pointed at the OLS project:

- **A. Interactive skills** — you run these yourself in Claude Code (see *Helix commands*): design test
  cases (`/tc-fe-prep`, `/tc-api-prep`), run a Playwright test (`/testing-ticket`), re-verify a dev fix
  (`/retest-bug`), or file bugs (`/create-bug`).
- **B. Discord-driven testing** — a bot on the QA Mac tests tickets headless and reports back:
  - **On request** — type `/bot-testing OLS-xx` in the QA thread; it auto-routes (Bug → retest, Story →
    test). See *On-request testing*.
  - **Automatic (autopoll)** — every 2 h it finds ready tickets and asks in the thread; the first person to
    answer claims them, one **Yes** runs them. See *Automated testing trigger*.
- **C. Background automations** — scheduled jobs keep the pipeline running unattended: TC drafting, auto-flip
  of started stories to TESTING, QA-owner sync, a daily login smoke-test, auth-token refresh. See *Background
  automations*.

Each is detailed below.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend TC (Thai) from a story — รีเช็คคำจาก TC glossary ให้ยืนยันก่อน แล้ว outputs Jira comment + สูงสุด 5 CSV attachments (Draft_Jira, Import_Qase, Unit_Test, Integration_Test, System_Test) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, add evidence, comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |

## OLS links

- **Jira board:** https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID>
- **Figma:** https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file
- **Qase:** https://app.qase.io/project/OLS

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## On-request testing — `/bot-testing`

Type `/bot-testing OLS-<key>` in the QA Discord thread to test one ticket on demand (same bot/listener as
autopoll, so it also runs headless on the QA Mac). It reads the ticket type from Jira and routes
automatically:

- **Bug → retest** — re-verifies the dev's fix against the bug's Expected Result, attaches evidence, then
  **writes the verdict back to Jira** (comment + status transition) and notifies the QA thread.
- **Story → test** — runs the ticket's reviewed test cases with Playwright and writes results to the
  **Google Sheet + Drive** (screenshots / MP4); it **does not touch Jira**.

Anyone in the thread can trigger it. Only one run executes at a time — a lock serialises `/bot-testing` and
autopoll together, so they never collide on the single OLS account.

## Automated testing trigger (autopoll)

A background service that watches the QA tracking sheet and offers to start testing whenever tickets are
ready — you confirm once in Discord, it runs the rest headless. This is **OLS-specific infrastructure**,
not a helix skill: it lives outside this repo in the testing bot (`~/ols-qa-testing-bot/listener/index.js`,
run by a launchd `KeepAlive` job) and is additive to the on-request `/bot-testing` command in the same
listener. Ownership of tickets it tests is claimed automatically (see step 7).

### Eligibility

A ticket is offered for testing only when **all** of these hold (checked against the
[QA tracking sheet](references/ols-project-guide.md#qa-tracking-sheet-ticket-list--tc-status)):

- **Status** = `READY TO TEST` (Summary tab)
- **TC Status** = `QA Reviewed` (Summary tab)
- Its per-ticket tab still has **≥ 1 test case with Test Status = `NOT STARTED`** (i.e. real work is left)

The scan reads Google Sheets over an OAuth token, so it works without the NDLP VPN.

### The 2-hour cycle

The scan (`scanTick`) runs **every 2 hours**, plus once ~15 s after the listener (re)starts. Each cycle
short-circuits in order:

1. **NDLP VPN not connected** → silent skip, wait for the next cycle (testing can't run without it, so it
   doesn't ask)
2. **A prompt is still awaiting an answer** → wait (never stack a second prompt; an unanswered prompt
   expires after **12 h**)
3. **A test run is active** (a `/bot-testing` run or an autopoll run holds the lock) → skip this cycle
4. **The queue is non-empty** → skip (still draining)
5. **Scan the sheet** for the tickets still `NOT STARTED`, then split them:
   - **Unfinished** — a ticket we already launched that is *still* `NOT STARTED` (its run ended without
     completing, e.g. VPN dropped mid-run). It resumes automatically — see *Resume unfinished runs* below.
   - **Fresh** — never launched, not declined in the last **24 h**, not already queued → offered for testing.
6. **Nothing fresh** → silent
7. **Fresh tickets found** → post **one** prompt in the QA review thread on Discord listing all of them,
   with **Yes / No** buttons (ownership is claimed on the first click — see *Ownership* below)

### Confirm once → serial queue

- **Yes** → every ticket in that prompt is queued, and the queue drains **one at a time** — `drainTick`
  (every 60 s) launches `run.sh <ticket>` for the next ticket only once no run holds the lock. Each run is
  the normal test flow, starting from the VPN check.
- **No** → those tickets are suppressed for **24 h**, then become eligible again.

**Invariant — one confirmation per batch:** a single prompt covers all eligible tickets and a single
**Yes** approves the whole batch. The bot **never** re-confirms ticket-by-ticket; it just queues them and
tests serially.

### Ownership — first click claims the batch

Anyone in the QA thread can answer — this is how the whole team uses one central bot (there is nothing to
deploy per person; deploying the bot on more than one machine is **not** supported — the runs share a
single OLS account and would collide). **The first person to click (Yes *or* No) becomes the QA Owner** of
every ticket in that prompt: the bot writes `customfield_12120` in Jira to that clicker (assignee
untouched), and the sheet's QA Owner column follows via the hourly Jira→sheet sync. This claims the
tickets so no one else picks them up. The Discord-user → Jira-account mapping lives in
`~/ols-qa-testing-bot/.qa-roster.json`; if the clicker isn't in it, the tickets are still queued or
suppressed but ownership is left unset and a warning is shown (add the person to the roster). The test run
itself always executes centrally on the QA Mac, whoever clicked.

### Resume unfinished runs

A launched run can end without finishing — the NDLP VPN drops mid-session, the machine sleeps, or the run
hits its timeout. The ticket's test cases then stay `NOT STARTED` in the sheet. **Such a ticket is never
dropped: the next cycle picks it up and continues it automatically, without asking again** (the batch was
already approved). Concretely, once no run holds the lock, any ticket we launched that is *still*
`NOT STARTED` is re-queued and re-run. Each `run.sh` launch already retries 3× internally; the autopoll
layer resumes a ticket up to **2 more times** (`MAX_AUTO_RETRY`). If it still hasn't completed after that,
it is suspended for **24 h** with a Discord notice (run `/bot-testing <KEY>` to force it sooner). A ticket
whose status moves off `NOT STARTED` (i.e. it finished) is forgotten and never re-run.

### Why buttons (not a typed yes/no)

The bot runs without Discord's privileged **Message Content** intent, so it can't read the text of a typed
reply. Buttons emit an interaction that routes back without that intent. The result is rendered by
**editing the prompt message over the bot token** (not the interaction response) because this gateway link
can deliver interaction events after Discord's 3-second reply window has closed — editing over the bot
token is independent of that window and never fails with a stale-interaction error.

### State & operation

Durable state lives in `~/ols-qa-testing-bot/.autopoll_state.json`
(`{pending, declined, queue, launched, attempts}`) and survives restarts. Key constants: scan **2 h** ·
drain **60 s** · declined **24 h** · auto-resume cap **2** · settle window **120 s** · pending-prompt
expiry **12 h**. Team roster (Discord user → Jira account) for ownership:
`~/ols-qa-testing-bot/.qa-roster.json`. Logs: `~/ols-qa-testing-bot/logs/listener.out.log` (look for
`autopoll armed`, `auto-resume`, `QA Owner ->`). Restart after editing:
`launchctl kickstart -k gui/$(id -u)/com.<USER>.ols-testing-listener`.

## Automated TC auto-draft (ทุก ~4 ชม.)

งานอัตโนมัติที่ **ร่างเทสเคส FE** ให้ ticket ที่ยังไม่มี TC แล้วเขียนลง **QA tracking sheet** โดยตรง — เพื่อให้ทีม QA
มี TC ตั้งต้นรอรีวิว ไม่ต้องเริ่มจากศูนย์ เป็น **OLS-specific infrastructure** (launchd bot บนเครื่อง QA) ไม่ใช่ helix skill
และ **แยกจาก autopoll** ด้านบน (คนละงาน: autopoll = รันเทสต์ ticket ที่ TC พร้อมแล้ว; ตัวนี้ = ร่าง TC ให้ ticket ที่ยังไม่มี TC)

### Eligibility

Ticket จะถูกร่าง TC ให้ เมื่อ **ครบทุกข้อ** (เช็คกับ tab **Summary** ของ
[QA tracking sheet](references/ols-project-guide.md#qa-tracking-sheet-ticket-list--tc-status)):

- **TC Status** = `TO DO`
- **Ticket Detail Status** = `Details Provided`
- **ยังไม่มี TC** — ยังไม่มีแท็บของ ticket นั้น หรือมีแท็บแต่ว่าง

ticket ที่มี TC อยู่แล้ว **แม้ยังไม่ครบ** = **ข้าม** ให้คนจัดการต่อ การสแกนอ่าน Google Sheets ผ่าน OAuth token
จึงทำงานได้โดยไม่ต้องต่อ VPN แต่ตัว bot จะ **ทำงานจริงเฉพาะช่วงที่เปิดคอม + ต่อ NDLP VPN อยู่** ถ้าไม่ครบเงื่อนไข = อยู่เงียบ

### ขั้นตอน (ยึดวิธีนี้ทุกรอบ)

1. **Scan** — หา ticket ที่เข้าเกณฑ์จาก tab Summary
2. **Triage** — ถ้า ticket **ไม่มี AC/EC** เลย → **ไม่ร่าง** (ห้ามมโน) แค่เขียน note ที่ช่อง Remark ของ Summary;
   caveat อื่น (Jira status = BLOCKED / In Progress / REVIEWING, PO รอ Figma, comment ที่ AC/EC ยังเปลี่ยน) →
   เก็บเป็นโน้ต `Need QA recheck: …`
3. **Draft (parallel)** — ยิง subagent 1 ตัวต่อ 1 ticket พร้อมกัน ป้อน AC/EC แบบ verbatim จาก Jira เพื่อกันการแต่งเติม
   แต่ละตัวออกแบบ TC ให้: ทุกเคส trace กลับ AC/EC จริง — **ครบทุก AC + EC**, ไม่เกินขอบเขต; `Type` = Unit /
   Integration / System **เฉพาะ layer ที่ AC/EC รองรับจริง** (ไม่แต่ง TC มา filler); เนื้อหาไทยทางการ;
   `Test Case ID` = `TC_01, TC_02, …`; `Test Status` เริ่มต้น = **`Not Started`**
4. **Verify** — ตรวจ coverage (AC/EC → TC) ของทุก ticket ก่อนเขียนลงชีท
5. **Write** — สร้าง **แท็บใหม่** ต่อ 1 ticket ตามฟอร์แมต tab **`OLS-44`** (16 คอลัมน์: Acceptance Criteria ·
   Services Impacted · Test Case ID · Test Title · Precondition · Test Data · Test Steps · Expected Result ·
   Priority · Type · QA Owner · Test Status · Actual Result · Capture Screen Link · Linked Bug · Remark) →
   เพิ่มแถวใน tab **`Test Progress - ALL TC`** → เขียนโน้ตที่ช่อง Remark ของ tab **Summary**
6. **ไม่แตะ** ค่า `TC Status` ใน Summary (ให้ QA เปลี่ยนเอง) และ **ไม่เขียน Jira**

ความขัดแย้งใน ticket (description/comment) ถูกบันทึกที่ช่อง Remark ของแท็บนั้นเสมอ เช่น `Need QA recheck เกี่ยวกับ…`
ผลลัพธ์ทุกชุดเป็น **Draft** — ต้องผ่านการรีวิวจาก QA ก่อนใช้งานจริง Sheet, tab, และ gid อยู่ใน
[`references/ols-project-guide.md`](references/ols-project-guide.md) → ตาราง **QA tracking sheet**

### ตารางเวลา, resume งานค้าง & self-healing

Bot อยู่ที่ `~/ols-qa-tc-autodraft-bot/` (นอก repo): `run.sh` (VPN gate + lock + pre-scan → เรียก
headless `claude --print prompt.md` เมื่อมีงานจริง) · `scan_todo.py` · `write_tabs.py` (generic,
validate fail-closed) · `check_token.sh` (token probe + alert) · `prompt.md` (วิธีทำ). ใช้ secret ร่วมกับ
bot อื่น (claude token, Jira, Google OAuth) — ไม่มี secret อยู่ใน repo.

- **ตารางเวลา** — launchd `com.<USER>.ols-tc-autodraft` ยิงทุก 4 ชม. **ตรงเวลานาฬิกา 00 / 04 / 08 / 12 /
  16 / 20 น.** (`StartCalendarInterval`, caffeinate). รอบที่เครื่องหลับ/VPN ลง = ข้ามเงียบ
- **Resume งานค้างอัตโนมัติ (ชีทคือ state เอง — ไม่มีไฟล์จำสถานะให้ drift)** — scan คิดค่า **`needsTC`** =
  ไม่มีแท็บ **หรือแท็บมีแต่ว่าง** (รอบก่อนสร้างแท็บแล้ว crash/timeout ก่อนเขียน → รอบหน้าเห็นว่าว่าง → ทำต่อ).
  แต่ละรอบ draft ไม่เกิน **`OLS_MAX_PER_ROUND` = 6** ticket (ที่เหลือไปต่อรอบหน้าเอง) → รอบสั้น timeout ยาก;
  ตราบใดยังไม่เขียนจริง = ยัง `needsTC` = ถูกหยิบซ้ำ **ไม่มีวันโกหกว่าเสร็จ**
- **กันรัน run เปล่า** — ticket ที่ถูก flag ว่า **ไม่มี AC/EC** (ร่างไม่ได้) จะถูกอ่านจาก Summary Remark แล้ว
  **ไม่ trigger รอบใหม่** จนกว่าคนจะเคลียร์ Remark / ticket เปลี่ยนสถานะ
- **Token guard (renew อัตโนมัติไม่ได้ เพราะ `claude setup-token` เป็น browser-OAuth)** — `check_token.sh`
  probe token แบบถูกๆ; ถ้า stale เด้ง **แจ้งเตือน macOS + Discord** พร้อมคำสั่งแก้ ใช้ 2 จุด: (ก) **preflight
  ใน run.sh** (token เสีย = เตือน + ข้ามรอบ ไม่เผา run ทิ้งเงียบ) · (ข) **monitor รายวัน 09:30**
  (`com.<USER>.ols-tc-token-check`) เตือนล่วงหน้าก่อนรอบเที่ยง. Logs: `~/ols-qa-tc-autodraft-bot/logs/`
  (`bot.log`, `token.log`). ทดสอบ scan-only: `DRYRUN=1 bash ~/ols-qa-tc-autodraft-bot/run.sh`

## Auto-flip stories to TESTING

Keeps the Jira board honest against the QA tracking sheet: a **story** sitting at **READY TO TEST** whose
own per-ticket TC tab already has **at least one (≥1)** test case in any status other than `Not Started`
means testing has actually begun, so its Jira status is moved to **TESTING**. The **QA Owner / assignee is
never changed** — ownership is tracked by status, not by assignee.

OLS-specific infrastructure (a launchd bot on the QA Mac), **not** a helix skill. Google Sheets + Jira REST
are both reachable without the NDLP VPN, so this one runs every weekday regardless of VPN state.

- Tool: `~/ols-qa-testing-bot/scan_testing_flip.py` — reads the sheet **Summary** tab → each
  READY-TO-TEST story's own tab, counts `started` (status non-empty and not `Not Started`); `started ≥ 1`
  = flip candidate.
  - `python3 scan_testing_flip.py` → dry-run, report candidates only (no Jira write)
  - `python3 scan_testing_flip.py --apply` → transition each candidate via Jira transition **121 "pick up by
    QA"** (READY TO TEST → TESTING). It re-reads each story's **live** status first and only flips ones still
    at READY TO TEST, and never sends `assignee` → QA Owner stays exactly as-is. **Idempotent** — safe to
    re-run by hand.
- Stories with no per-ticket tab in the sheet are skipped, never flipped.
- Schedule: weekday **10:00 AM & 5:00 PM** via `~/ols-qa-testing-bot/flip_run.sh` (if the Mac is asleep at
  fire time, launchd runs the missed job on next wake). Log: `~/ols-qa-testing-bot/logs/flip.log`.

## Post-run close-out (runs after every AI test run, per story)

Two steps the AI/bot performs to hand a story back to its human QA Owner once the automated cases are done. **The card stays at `TESTING`** — AI only pre-runs; the real QA Owner does the final recheck + closes.

**1. Sort + highlight the progress tab** — `~/ols-qa-testing-bot/sort_test_progress.py [--apply] [--ai-ticket OLS-xx ...]`
- Re-sorts the QA sheet **`Test Progress - ALL TC`** tab by **`% Passed` (col D) descending**, tie-break **`Total TC` (col C) descending** — most-complete tickets float to the top.
- Paints every **AI-tested** ticket's row **solid yellow** (union of existing yellow rows + `--ai-ticket`).
- Uses native `sortRange` (moves whole rows, formulas recompute) + a **surgical** self-heal that repairs **only** an exact bare `=OLS-nn` cell (→ `#NAME?`) back to plain text. It must **never** touch `=HYPERLINK(…,"OLS-nn")` tab-link formulas — stripping their `=` turns them into dead literals and breaks the whole tab (root cause of the 2026-07-22 corruption; see [docs/qa-owner-sync/README.md](docs/qa-owner-sync/README.md#incident-2026-07-22--test-progress-tab-corruption-fixed)).

**2. Hand QA Owner back to the real person** — after posting the result comment:
- Revert **QA Owner** from the AI account (`QA Lead`) to the story's **most-recent prior owner** (from the Jira field changelog) in BOTH Jira field **`customfield_12120`** and the sheet (`Summary` col G + `Test Progress` col B).
- Post an AI comment on the story **@mentioning that owner** — "recheck the AI results + test the remaining cases AI couldn't (multi-account / threshold / BPM / missing-fixture / PO-confirm)". Card kept at **TESTING**.
- **QA Owner B resigned → substitute QA Owner A** wherever the prior owner would be QA Owner B; never assign/ping QA Owner B again.
- Assignee is **never** touched (ownership = status + QA Owner field, not assignee).

**Discord destination** — every QA notify/handoff goes **only** to the thread `🏂 ปั่นเทสด้วย AI` (id `<DISCORD_QA_THREAD_ID>`). `discord_qa_notify.py` targets it via `?thread_id=`; ad-hoc sends must include that thread id (or use the bot token to post to the channel directly) — a bare webhook POST lands in the wrong parent channel.

## Background automations (launchd on the QA Mac)

Scheduled jobs that keep the QA pipeline running unattended. All are `launchd` agents on the QA Mac; each
needs the machine awake, and anything that touches OLS also needs the NDLP VPN up (jobs skip quietly
otherwise).

| Job | Schedule | What it does |
|-----|----------|--------------|
| **Testing listener** (`ols-testing-listener`) | ทำงานตลอด (KeepAlive) | Runs the Discord bot: `/bot-testing` on-request **+** the autopoll trigger |
| ↳ Autopoll (inside the listener) | every 2 h | Finds ready tickets → asks in Discord → first click claims + runs on **Yes** (see *Automated testing trigger*) |
| **TC auto-draft** (`ols-tc-autodraft`) | every 4 h (00/04/08/12/16/20) | Drafts FE test cases for tickets that have none yet (see *Automated TC auto-draft*) |
| **QA-owner sync** (`ols-qa-owner-sync`) | every 2 min | Keeps the QA Owner shown in already-sent Discord notifications in step with Jira |
| **Auto-flip to TESTING** (`ols-flip-testing`) | Mon–Fri 10 AM & 5 PM | Flips any story at **READY TO TEST** whose sheet TC tab has **≥1 started case** to **TESTING**, QA Owner untouched (see *Auto-flip stories to TESTING*) |
| **Login smoke-test** (`ols-login-check`) | Mon–Fri 10:35 AM | Connects the VPN and checks NDLP→OLS SSO login still works; logs the result |
| **Auth-token check** (`ols-tc-token-check`) | เป็นรอบ | Keeps the headless Claude auth token fresh — unattended runs fail silently on a stale token |
| **Wake-for-audit** (`wake-for-audit`) | Mon–Fri 10:25 AM | Wakes the Mac ~10 min before the morning jobs so the schedule actually fires |

Separately, a Google Apps Script syncs the tracking sheet's **QA Owner** column from Jira — so ownership set
anywhere (a `/bot-testing` verdict, an autopoll click, a manual Jira edit) shows up in the sheet on its own.

## Changelog

### v1.16.3 — Post-run close-out: progress sort/highlight + QA-Owner handoff (22 Jul 2026)

- **Test Progress sort + yellow** — หลังทุก test run: `sort_test_progress.py` เรียง tab `Test Progress - ALL TC` ตาม **% Passed มากสุดก่อน** (เท่ากัน→ **Total TC มากกว่าก่อน**) + ไฮไลต์แถวที่ AI รันเป็น **สีเหลือง**; ใช้ native `sortRange` + self-heal guard คืน col A ถ้า tab-sync ทำพัง (`=OLS-xx` → `#NAME?`)
- **QA Owner handoff** — หลัง AI เทสสตอรี่เสร็จ: คืน **QA Owner** จากบัญชี AI (QA Lead) → **คนเดิมล่าสุด** ทั้งใน Jira (`customfield_12120`) + ชีท (Summary G / Test Progress B), การ์ด**คงที่ `TESTING`**, แล้วเม้นแท็ก QA Owner จริงให้ recheck + เทสเคสที่เหลือ (assignee ไม่แตะ)
- **QA Owner B ลาออก → ใช้ QA Owner A แทน** ทุกที่ (Jira/Sheet/Discord); ไม่ ping/assign QA Owner B อีก
- **Discord** — ทุก QA notify/handoff ส่งเฉพาะ thread `🏂 ปั่นเทสด้วย AI` (`<DISCORD_QA_THREAD_ID>`); ต้องมี `?thread_id=` เสมอ, ticket key เป็นลิงก์ Jira `[OLS-xx](…/browse/OLS-xx)`
- รายละเอียด: section [Post-run close-out](#post-run-close-out-runs-after-every-ai-test-run-per-story)

### v1.16.2 — Auto-flip stories READY TO TEST → TESTING (22 Jul 2026)

- **งานใหม่ (launchd bot, Mon–Fri 10:30)** — สแกน story ที่ Jira status = **READY TO TEST** แล้วเช็ค TC ในชีท; ถ้าแท็บของ story มีเคสสถานะ **ที่ไม่ใช่ `Not Started` อย่างน้อย 1 เคส** (= เริ่มเทสแล้ว) → flip Jira story เป็น **TESTING** อัตโนมัติ, **QA Owner คงเดิม** (ไม่เคยส่ง `assignee`)
- **Idempotent + status-guarded** — `scan_testing_flip.py --apply` อ่าน status สดจาก Jira ก่อน flip เฉพาะตัวที่ยัง READY TO TEST ผ่าน transition **121 "pick up by QA"**; รันซ้ำมือได้ปลอดภัย; dry-run ได้ (`--apply` เท่านั้นที่เขียน Jira)
- **ไม่ต้อง VPN** (Google Sheets + Jira REST) → รันทุก weekday; story ที่ไม่มีแท็บ TC ในชีท = ข้าม ไม่ flip
- รายละเอียด: section [Auto-flip stories to TESTING](#auto-flip-stories-to-testing)

---

## ตัวอย่างผลลัพธ์ TC FE Prep

> ตัวอย่างจาก story สมมติ **OLS-142 — Admin อนุมัติหรือปฏิเสธคำขอเข้าร่วมคอร์ส**
> 3 AC/EC → 5 TCs: Unit Test ×1 · Integration Test ×1 · System Test ×3

---

### 💬 เม้นใน Jira

<details>
<summary>คลิกเพื่อดูตัวอย่าง comment ที่โพสต์ใน Jira</summary>

Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ

**Shared data preparation (all TCs):**

1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin
2. ไปที่เมนู **จัดการคอร์ส** → เลือกคอร์ส **OLS-Demo-Course**
3. เปิดแท็บ **คำขอเข้าร่วม**
4. ตรวจสอบว่ามีคำขอในสถานะ **รอการอนุมัติ** อย่างน้อย 1 รายการ (ถ้าไม่มี: สร้างคำขอใหม่ผ่านบัญชี test.learner01@example.com)
5. ใช้คำขอของ **test.learner01@example.com** เป็นเป้าหมายสำหรับทุกเคสด้านล่าง

| **AC/EC Ref** | **Services Impacted** | **ID** | **Test Title** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- |
| EC_01 | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | Low | Unit Test |
| AC_02 | **1.** Enrollment Service **2.** Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | Medium | Integration Test |
| AC_01 | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | Medium | System Test |
| AC_02 | **1.** OLS Portal **2.** Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | High | System Test |
| EC_01 | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | High | System Test |

**Remark — Type coverage:**
- มี *Unit Test* 1 เคส (TC 1)
- มี *Integration Test* 1 เคส (TC 2)
- มี *System Test* 3 เคส (TC 3–5)

📎 **Attachments:**
- [Draft\_Jira\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11001/Draft_Jira_OLS-142.csv)
- [Import\_Qase\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11002/Import_Qase_OLS-142.csv)
- [Unit\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11005/Unit_Test_OLS-142.csv)
- [Integration\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11004/Integration_Test_OLS-142.csv)
- [System\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11003/System_Test_OLS-142.csv)

⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io

</details>

---

### 📎 Attachments (CSV)

> ไฟล์ CSV เป็น standalone — คอลัมน์ Precondition จึงรวม shared data preparation ทุกขั้นตอนไว้ในตารางโดยตรง ไม่มี section แยกด้านบน

<details>
<summary>Draft_Jira_OLS-142.csv — ตาราง 10 คอลัมน์สำหรับ Jira (ทุกประเภท รวม 5 TC, เรียง Unit → Integration → System)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |

</details>

<details>
<summary>Import_Qase_OLS-142.csv — สำหรับนำเข้า Qase.io (เรียง Unit → Integration → System)</summary>

| AC/EC | Title | Preconditions | Priority | Type | Status | Suite | Steps – Action | Steps – Expected | Steps – Data | Tags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | Low | Unit Test | Done | Course Management > Enrollment Requests | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | reason: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Medium | Integration Test | Done | Course Management > Enrollment Requests | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Email: test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| AC_01 — Admin เห็นรายการคำขอที่รอการอนุมัติ | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | Medium | System Test | Done | Course Management > Enrollment Requests | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | - | AC_01, Admin เห็นรายการคำขอที่รอการอนุมัติ |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | คำขอของ test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | ช่องเหตุผล: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |

</details>

<details>
<summary>Unit_Test_OLS-142.csv — Unit Test 1 TC (TC 1)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |

</details>

<details>
<summary>Integration_Test_OLS-142.csv — Integration Test 1 TC (TC 2)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |

</details>

<details>
<summary>System_Test_OLS-142.csv — System Test 3 TC (TC 3–5)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |

</details>
