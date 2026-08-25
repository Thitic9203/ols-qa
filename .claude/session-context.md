# WIP — OLS Playwright Agentic Testing (updated 2026-08-25)

> Hand-written. Machine facts — HEAD, today's commits, uncommitted work, round totals, which cases
> are red — are in `.claude/session-state.md`, regenerated every turn. Do not duplicate them here.
> This file is only for what the artifacts cannot say: what is being worked on, and what waits on
> a person.

Plan: `ols-qa-evidence/docs/ols-playwright-agentic-testing/ols-playwright-agentic-testing-plan.md`
(read it before touching this work). Code: private `ols-qa-e2e`, committed straight to `main`, no PR.
Environment is **pre-prod only**, VPN required.

## Where this stands after 2026-08-25

Last full round: **2026-08-25 · 344 case-runs · 248 passed · 83 skipped · 13 failed · flaky 0** ·
automated **desktop 203 · tablet 23 · mobile 23** of 288 · **C1 81/150 = 54.0%** (0.7% that morning).
Confluence synced to **v11**. Every gate green: 10 offline plus `gate:tickets`, `typecheck`, `lint`,
`format:check`.

Nine plan rows closed and pushed (`dea67c4` · `93fa8fb` · `068b4eb` · `0081419` · `bbcee95` ·
`3065c01` · `3183a07` · `6d9bf7e` · `dcc5eaa`). Two of those came out of the round auditing itself
rather than from the plan's queue:

- **`run-staged.sh` now keeps each phase's evidence** (`6d9bf7e`). Playwright clears
  `test-results/` at the start of every run, and every phase here IS a run — which is why phase 1's
  NAV-005 screenshot was already destroyed by the time anyone looked. Artifacts now land in
  `round-artifacts/<phase>/` the moment a phase ends. `test-results/` still holds only the last
  phase; that is Playwright's behaviour, not ours.
- **`IN(-00N` → `INT-00N`** (`dcc5eaa`), fixed at the source: `prefixFor()` took the first
  *character* of each word and the third word of `Integration NDLP (Media)` is `(Media)`. Pinned in
  `MODULE_PREFIX` and the fallback now takes the first letter-or-digit. 🔴 The trap, if you ever
  rename a caseId again: **`report:cases` derives the id from the test titles in `round-json/`, not
  from the catalog** — rename there too, then check orphans are 0 and the automated counts did not
  move. Off-repo follow-up: the Drive uploader's filename allowlist still expects the old id.

The agentic tooling is installed and constrained rather than merely planned:

- **Read-only is the current mode, on purpose.** `playwright-ms` (`@playwright/mcp@0.0.79`) is
  registered at **local scope for `ols-qa-e2e`** — so `claude mcp list` only shows it when run from
  that directory — pointing at `node_modules/.bin/playwright-mcp`, started
  `--headless --isolated --blocked-origins`. Eleven tools are denied in `.claude/settings.json`;
  the per-tool reasoning is in `.claude/README-mcp-guard.md`.
- **G2 is not finished, and the remaining half is a proof, not a build.** Nobody has yet called a
  denied tool and captured the refusal. Until someone does, use only `browser_snapshot` ·
  `browser_find` · `browser_take_screenshot` · `browser_console_messages` ·
  `browser_network_requests` · `browser_network_request`.

## Outstanding, in priority order

1. **Write cases for the 54 Done tickets nothing asserts (plan items 9 and 10, second half).** C1 is
   **81/150 = 54.0%** and this is the only thing that moves it. Grouped by screen in the plan —
   Feed 8 · Live 6 · Course/LP 6 · NDLP import 5 · Nav/Sidebar 5, plus ten smaller groups.
   🔴 **Cannot be done from another repo**: the plan's own rule binds authoring to
   `playwright-test-planner` + `browser_snapshot`, and the MCP server is registered at *local* scope
   for `ols-qa-e2e`. Start that session there.
2. **Prove G2** — from a session whose cwd is `ols-qa-e2e`, call one denied tool and attach the
   refusal. It is the last thing between here and a usable agent loop, and it takes minutes.
3. **`AXX-002` is one live selector confirmation from running** (the logout control in the avatar
   menu). Cheapest item on the whole board.
4. **The 45 skips blamed on missing test data.** Largest skip bucket, and the one 2026-08-18 taught
   us to distrust — that round found three clusters claiming absent data that was present. Each
   reason is written to be re-checkable; go query the API rather than believe the annotation.
5. **Wire layout-twin to its five pilot cases and run them (item 13).** The fixture landed
   (`bbcee95`); nothing uses it yet. Largest lever on tablet and mobile, stuck at 23 of 288.

## Both investigations closed — one fixed, one is the owner's call

- **`NAV-005` was ours, not the product's — fixed and pushed (`3183a07`).** An interstitial had
  `aria-hidden` over the app root, so `getByRole` resolved zero elements and the read timed out.
  NAV-001 passed on the same control in the same round; three lines after NAV-005's ✘ the round log
  shows the `@safe` guard blocking `acknowledge-rewards` on that same shared creator account. The
  sibling cases already establish this precondition; NAV-005 never did. It now passes in 7.8s.
  Nothing was weakened — no retry, no longer timeout, no `fixme`.
- 🔴 **The orphaned media are 45, not 3, and they are in the real approval queue.** Measured:
  `PENDING_APPROVAL` count is 46 across the three creator accounts (C1 21 · C2 14 · F1 11); 45 are
  ours, dating back to 2026-08-17. `DELETE` answers 409 because nothing can be deleted out of the
  review queue, and the page object has no transition that pulls an item back out — only an
  approver rejecting it. **Not deleted: removing 45 items from a shared environment is your call**,
  and they are not deletable in this state anyway. The cause fix is in the plan (row 1b):
  `registerDeleteThrowaway` must reject via `adminContent` before deleting.

## Two things left open on purpose, both needing a person

- **The `@safe` guard blocks `POST /api/me/achievements/acknowledge-rewards`.** That endpoint is
  housekeeping on the tester's own account, not a content mutation — so an interstitial met by a
  `@safe` case can never be acknowledged and returns on the next navigation for the rest of the
  lane. Loosening a read-only guard on shared pre-prod is a risk decision, so it was reported, not
  taken.
- **`creatorPage` uses a hardcoded `poolFor('creator')[0]`** while `leasedLearner` leases by worker
  index. With two workers, concurrent creator cases share one account — the condition that let one
  case's interstitial land in another case's way.

## Waiting on a person

- **`ssoEmbed` has no per-env variable** (item 5) — every login in the suite runs through it, so it
  is not a change to make unasked.
- **CNT-004** is a real defect verified against OLS-86 AC_12: file it, or keep it red?
- **REC-003 and REC-009 ER 2** are spec questions for the PO, not bugs (PM-006). Deliberately red.
- **OLS-325**: does its scope include 320px? The 47px horizontal overflow is measured and repeatable.

## Things that cost time — do not rediscover them

- **A gate's fixtures belong inside the gate.** Five fake exemptions living in the real register
  inflated C1 fourfold while every check passed. Full write-up in `…-lessons.md`.
- **`~/ols-qa-testing-bot` is 14 GB** — a recursive `grep` over it hangs for minutes. Always scope
  with `--include` and `--exclude-dir`.
- **A skip that blames the environment is as suspect as a failure.**
- **Playwright wipes `test-results/` at the start of every run**, including each phase of a staged
  round. Copy failure evidence before running anything else.
- **Background agents driving a browser stall.** Prefer API reads; keep browser steps short.

## ติดอะไรอยู่ — บันทึกไว้ 2026-08-25 (เจ้าของงานสั่ง: ไม่ต้องเปิดบั๊ก ให้โน้ตไว้)

วัดสดในรอบนี้ทั้งหมด ไม่ได้ยกมาจากรอบก่อน

1. **🔴 เกตนับ ticket จาก "แถว catalog" เท่านั้น — เคสที่มีแต่ spec ไม่ถูกนับเลย.** `ci-assert-ticket-coverage.ts`
   โหลด `loadCatalog` + `ticketsFor` อย่างเดียว ⇒ `FEED-001…` ใน `trending-feed.spec.ts` ซึ่ง **ไม่มีแถว catalog**
   (ตัวไฟล์เขียนเองว่า "No catalog rows exist for it; the sheet never had any") ไม่ได้ถูกนับสักเคส
   ผลคือ `OLS-292 · 310 · 311 · 400` ยังโผล่ในลิสต์ "ไม่มีเคสอ้างถึง" ทั้งที่มีเทสเดินหน้าจอนั้นจริง
   ⇒ **การปิดช่องว่างกลุ่ม D ต้องเพิ่มแถว catalog เสมอ ไม่ใช่แค่เขียน spec**
   (ชีต UAT แช่แข็งแล้ว แถวใหม่จึงเป็น local-only · `pull-tc-catalog.mjs` จะรายงานเป็น `vanished` ตอน re-pull
   ซึ่งอยู่หลัง `--confirm` = เห็นได้ ไม่หายเงียบ)

2. **MCP `playwright-ms` เรียกจาก session นี้ไม่ได้.** `claude mcp list` รันจาก `ols-qa-e2e` เห็น `✔ Connected`
   แต่ tool `mcp__playwright-ms__*` ไม่มีในเซสชันที่เปิดจาก `ols-qa` · สั่งย้าย working directory แล้ว `pwd`
   ยังเป็น `ols-qa` = ย้ายไม่สำเร็จภายในเซสชันเดียวกัน
   ⇒ กฎหลักของแผน (author ผ่าน `playwright-test-planner` + `browser_snapshot`) ทำครบไม่ได้จากเซสชันนี้
   **ทางแก้: เปิด session ใหม่โดย cwd = `ols-qa-e2e` ตั้งแต่แรก** — recon รอบนี้จึงใช้ scratch spec ของ Playwright ตรงๆ แทน

3. **G2 ยังพิสูจน์ไม่ได้ด้วยเหตุผลเดียวกันกับข้อ 2** — ต้องเรียก tool ที่อยู่ใน deny-list จริงแล้วเก็บคำปฏิเสธ
   ทำได้เฉพาะเซสชันที่ MCP โหลด (ticket OLS-622)

4. **row 1b (สื่อค้างคิวรออนุมัติ) ยังไม่ได้แก้ และหลักฐานรอบก่อนหายหมด** — ไม่มีทั้ง `round-artifacts/` และ `logs/`
   ในรีโป ⇒ **ยังไม่รู้ว่า reject 1 เสียงพอถอนของออกจาก `PENDING_APPROVAL` ไหม** (olsClient จดไว้ว่าสายอนุมัติเป็น
   3 เสียง) · scratch 6 ไฟล์ (`_scratch-taskA-recon*.spec.ts`) ยัง uncommitted และเป็น `@mutates` ที่สร้างบทความใหม่
   **ห้ามรันซ้ำ** เพราะจะเพิ่มของค้างอีก

5. **รอเจ้าของงานเคาะ 4 เรื่อง ยังไม่มีคำตอบ** — ลบสื่อค้าง 45 ชิ้นไหม · `CNT-004` · `OLS-325` ครอบ 320px ไหม ·
   แก้ `ssoEmbed` ให้แยกตาม env ไหม

**Jira ของงานนี้:** `OLS-608` `[QA Task] OLS E2E Automate` (สถานะ To Do) · subtask ที่ยังค้าง `OLS-620` (สืบ skip 45)
· `OLS-621` (รหัสเคสมีวงเล็บ — โค้ดแก้แล้วที่ `dcc5eaa` แต่ ticket ยัง To Do) · `OLS-622` (พิสูจน์ deny-list)

## วัดแล้วไม่ตรงสเปก แต่ยังไม่เปิดบั๊ก — เจ้าของงานสั่งให้โน้ตไว้เฉยๆ (2026-08-25)

ทั้ง 3 ข้อวัดสดบน pre-prod รอบนี้ · ยังไม่ยืนยันฝั่งสเปกกับ Figma/PO จึงยัง**ไม่ใช่บั๊ก** (PM-006) ·
ไม่มีเคสไหนตั้ง verdict ให้ — เคสที่ลงไปแล้ว assert เฉพาะส่วนที่ไม่กำกวม

1. **OLS-400 — สื่อที่เรียนจบแล้วยังไม่ถูกดันไปท้าย.** `GET /api/feed/media?trending=true` คืน 12 รายการ
   พร้อม `myProgress.completedAt` ให้ learner ธรรมดาอ่านได้ · วัดได้: รายการที่เรียนจบแล้ว 2 ชิ้นอยู่ลำดับ
   3–4 **ก่อน** รายการที่ยังไม่จบ 7 ชิ้นที่ลำดับ 5–11 (`orderHolds=false`) ขัดกับ AC_01 ที่ให้ย้ายไปท้าย ·
   ทั้ง 2 ชิ้นเป็นการ์ดใบที่ 4 กับ 5 ของ 6 ใบแรกที่ผู้ใช้เห็นก่อนกดขยาย
   · **แก้ความเชื่อเดิมที่จดไว้ผิด**: เคยบันทึกว่าเรื่องนี้ตรวจไม่ได้เพราะต้องใช้ `/api/feed-debug/media`
   (401 operator only) — จริงเฉพาะกับ endpoint นั้น · endpoint จริงที่หน้าเว็บเรียกเปิดข้อมูลนี้อยู่แล้ว
   · ตรวจแล้วว่าไม่มีหน้าจอ "personalized" อื่น (`/api/feed/personalized` · `/api/recommendations` ·
   `/api/feed/recommended` · `/api/me/feed` = 404 ทั้งหมด)
2. **OLS-168 TC_04 — เนื้อหาเติมไม่ได้อยู่ท้ายสุดบนหน้าเทรน.** ลำดับที่วัดได้ซ้ำ 4 รอบ = `F,T,F,T,F,…`
   คือมีรายการที่ชั้นปีตรงแทรกอยู่ระหว่างรายการที่ชั้นปีไม่ตรง · **เฉพาะหน้าเทรน** — หน้ากลุ่มเป้าหมาย
   (OLS-169 กฎเดียวกัน) ผ่านสะอาดทั้ง 6 แท็บ และมีเคส `FEED-142` คุมไว้แล้ว
3. **OLS-311 — ปุ่ม "แสดงเพิ่มเติม/แสดงน้อยลง" หนา 500 ไม่ใช่ Regular 400.** ตั๋วบอกให้เปลี่ยนจาก Bold
   เป็น Regular · ของจริงวัดได้ `font-weight: 500` (Medium ของ MUI) — ไม่ใช่ทั้ง 400 และ 700 ·
   เคส `FEED-123` assert แค่ "ต้องไม่เป็นตัวหนา" ซึ่งเป็นครึ่งที่ตั๋วพูดชัด · จะเป็น 400 หรือ 500 ต้องเปิด
   Figma ยืนยันก่อน

**ยังไม่มีเคสเพราะติดของจริง (จดไว้ ไม่ได้เงียบ):**
- OLS-292 ข้อ "ปักไลฟ์ที่กำลังออกอากาศไว้ 3 อันดับแรก" — ทั้งระบบไม่มีไลฟ์สดเลย (`/api/livestreams total=0`
  วัดซ้ำวันนี้ ตรงกับที่ `live-streaming.spec.ts` วัดไว้ 2026-08-16) · จะสร้างเองต้องเปิดไลฟ์บน env รวม =
  เขียนข้อมูล ไม่ทำ · ลงเป็น `FEED-103` แบบประกาศเหตุผลไว้ชัด
- OLS-246 ข้อ "แบนเนอร์ชวนทำ Onboarding" — บัญชี learner ในพูลทำ onboarding ไปแล้วทั้งคู่
  (`learningGoals.length === 1`) · สร้างสถานะ "ยังไม่ทำ" = เขียนข้อมูล
- OLS-168 TC_05 / OLS-169 TC_09 "ผู้เรียนไม่มีข้อมูลชั้นปี" — ชั้นปีมาจาก NDLP แก้ไม่ได้ และไม่มีบัญชีไหน
  ว่าง จึงหาไม่ได้และสร้างไม่ได้

## สืบ skip 45 ใบเสร็จแล้ว (OLS-620) — 2026-08-25

วัดสดกับ API ทุกใบ (GET อย่างเดียว ไม่แตะข้อมูล) ผลไม่เหมือนที่ annotation อ้างทั้งหมด:

| ผล | จำนวน | หมายถึง |
|---|:--:|---|
| **PRESENT** | 4 | ข้อมูลมีอยู่จริง — `BCX-004` · `BCX-005` · `LPM-011` · `MMG-012` |
| **SEEDABLE-STATE** | 23 | ไม่มีจริง แต่สร้างได้จากการเปลี่ยนสถานะของที่มีอยู่ ไม่ต้องสร้างเนื้อหาใหม่ |
| **NEEDS-CONTENT** | 11 | ต้องมีสื่อ/คอร์ส/LP/เหรียญใหม่จริงๆ |
| **วัดไม่ได้** | 7 | ไม่เข้าเกณฑ์ 3 ถังนี้ ระบุเหตุผลรายใบไว้แล้ว |

- **PRESENT ≠ สั่งรันได้เลย** — `BCX-004`/`BCX-005` ข้อมูลมีจริงแต่ยังต้องข้ามต่อ เพราะการรันคือการกดตัดสิน
  เนื้อหาจริงของ creator จริงบน env ที่ใช้ร่วมกัน ย้อนกลับไม่ได้
- **แก้ขอบเขตให้ถูก:** ไล่จาก `round-json/` จริงได้ 44 ไม่ใช่ 45 · ตัวที่หายคือ `LSX-013` ซึ่งแผนจัดไว้ผิดถัง
  (ไปอยู่กับ "ต้องมีกล้อง") ทั้งที่ annotation ของมันเขียนเหมือน `LSX-008/009/010/016` เป๊ะว่า
  `GET /api/livestreams` คืน `total=0`
- **เจอบั๊กแยกอีกตัวระหว่างทาง:** `api/courses/me` ตอบ `400 "uuid v7 expected"` ทุกบัญชีทุกบทบาท ทำให้
  `MLV-033`/`MLV-034` วัดไม่ได้ — คนละเรื่องกับ skip แต่เป็นของจริง

## กองสื่อค้างคิวรออนุมัติโตขึ้น — วัดสด 53 ชิ้น ไม่ใช่ 46

`creatorC1 28 · creatorC2 14 · fixtureOwnerF1 11` (นับทุกหน้าจริง ไม่ใช่หน้าเดียว) — เช้าวันเดียวกันจดไว้ 46
**โตขึ้น 7 ภายในวันเดียว** เพราะ scratch recon ของ session ก่อนสร้างบทความเพิ่มแล้วลบไม่ออก (ติด 409)
⇒ ตราบใดที่ยังไม่แก้ `registerDeleteThrowaway` ให้ reject ก่อนลบ (แผนข้อ 1b) **กองนี้โตทุกครั้งที่มีคนสืบเรื่องนี้**
· ยังไม่ลบให้ รอเจ้าของงานเคาะเหมือนเดิม
