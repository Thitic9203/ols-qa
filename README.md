# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at <ORG>.

Helix skills embedded directly — no separate install needed.

**OLS Workspace version: v1.15.4** (20 Jul 2026) — based on helix v1.5.31

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

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
5. **Scan the sheet** for eligible tickets, then exclude: any declined in the last **24 h**, any already
   queued, and any launched within the last **3 h** (its sheet status can lag a just-started/failed run)
6. **Nothing eligible** → silent
7. **Eligible tickets found** → set their **QA Owner = the QA lead** in both Jira (`customfield_12120`,
   assignee untouched) and the sheet, then post **one** prompt in the QA review thread on Discord listing
   all of them, with **Yes / No** buttons

### Confirm once → serial queue

- **Yes** → every ticket in that prompt is queued, and the queue drains **one at a time** — `drainTick`
  (every 60 s) launches `run.sh <ticket>` for the next ticket only once no run holds the lock. Each run is
  the normal test flow, starting from the VPN check.
- **No** → those tickets are suppressed for **24 h**, then become eligible again.

**Invariant — one confirmation per batch:** a single prompt covers all eligible tickets and a single
**Yes** approves the whole batch. The bot **never** re-confirms ticket-by-ticket; it just queues them and
tests serially.

### Why buttons (not a typed yes/no)

The bot runs without Discord's privileged **Message Content** intent, so it can't read the text of a typed
reply. Buttons emit an interaction that routes back without that intent. The result is rendered by
**editing the prompt message over the bot token** (not the interaction response) because this gateway link
can deliver interaction events after Discord's 3-second reply window has closed — editing over the bot
token is independent of that window and never fails with a stale-interaction error.

### State & operation

Durable state lives in `~/ols-qa-testing-bot/.autopoll_state.json`
(`{pending, declined, queue, launched}`) and survives restarts. Key constants: scan **2 h** · drain
**60 s** · declined **24 h** · launched cooldown **3 h** · pending-prompt expiry **12 h**. Logs:
`~/ols-qa-testing-bot/logs/listener.out.log` (look for `autopoll armed`). Restart after editing:
`launchctl kickstart -k gui/$(id -u)/com.<USER>.ols-testing-listener`.

## Changelog

### v1.15.0 — Retest bug + Testing ticket: วิธีเข้าถึง Figma design reference (20 Jul 2026)

- **เพิ่มวิธี view Figma design ในทั้ง 2 สกิล** — retest-bug (Step 2 ตอนอ่าน expected result ที่ Figma เป็น supplement) + testing-ticket (Phase B load context): ลำดับคือ **Figma Dev Mode MCP** ก่อน (ต้องเปิด Dev Mode MCP Server ใน Figma desktop + เปิดไฟล์; `node-id` ใน URL ใช้ `-` แต่ MCP `nodeId` ใช้ `:` เช่น `2257-114654` → `2257:114654`) → ถ้า server ปิด **fallback เป็น browser-automation MCP**: เปิด URL ไฟล์ (login เบราว์เซอร์ค้างไว้) → รอ canvas render → screenshot node
- **ปิด modal "view this file in Dev Mode?" ด้วย "Not now" เท่านั้น — ห้าม "Request access"** (ส่งคำขอ seat); account แบบ **View + Comment** ก็อ่าน/แคป/copy spec ได้พอ
- OLS-specific (working-file URL + หมายเหตุการเข้าถึง) อยู่ใน [`references/ols-project-guide.md`](references/ols-project-guide.md) — ตาราง Figma

### v1.12.0 — TC FE Prep: บังคับรีเช็คคำศัพท์จาก TC glossary ก่อนออกแบบ TC (10 Jul 2026)

- **Step 2.6 — TC glossary re-check (gate ใหม่ บังคับ)** — หลังเคลียร์ AC/EC + conflict check เสร็จ ก่อนออกแบบ TC สกิลจะดึง tab `คำที่ใช้ใน TC` จาก [published sheet](https://docs.google.com/spreadsheets/d/e/<TC_GLOSSARY_PUB_ID>/pubhtml) ใหม่สดๆ แล้วโพสต์ URL ต้นทาง + จำนวนคำ + diff ให้ user ดูเป็นหลักฐาน; ของเก่าที่ cache ไว้ใช้ไม่ได้
- **Glossary อยู่เหนือทุกตารางคำในสกิล** — 14 คำที่ชีทเป็นเจ้าของ (Login, Checkbox, Filter, Upload, Status, Role, Cancel, Confirm, Notification, Toast, Modal, Dialog, Tab, Dashboard) ถูกถอดออกจาก fallback table เพื่อไม่ให้มี source of truth สองที่; เหลือ fallback ไว้เฉพาะคำที่ชีทไม่มี
- **หยุดถามเมื่อคำไม่ชัด** — ช่องคำไทยว่าง หรือ 1 คำอังกฤษมีความหมายไทยขัดกัน (เช่น `Creator` vs `Creator (media owner)`) → บล็อก ห้ามเดา; การเดาแล้วติดป้าย "provisional" ไม่นับว่าถาม
- **`references/tc-glossary.csv` เป็น mirror เป๊ะๆ** — ห้ามแก้ typo/เรียง/ลบซ้ำในไฟล์; แก้ที่ชีทแล้ว re-export เท่านั้น
- **Step 4.5 term table เพิ่มคอลัมน์ `ที่มา`** — ทุกคำต้องระบุว่ามาจาก `glossary` / `fallback` / `user`; แถวที่ไม่มีที่มา = คำที่ถูกคิดขึ้นเอง ต้องถอดออก
- กติกาเต็ม: [`references/tc-glossary.md`](references/tc-glossary.md) · ลิงก์ชีท + `gid`: [`references/ols-project-guide.md`](references/ols-project-guide.md)

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
