# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at SkillLane.

Helix skills embedded directly — no separate install needed.

**OLS Workspace version: v1.7.0** (17 Jun 2026) — based on helix v1.5.31

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend TC (Thai) from a story — outputs Jira comment + สูงสุด 5 CSV attachments (Draft_Jira, Import_Qase, Unit_Test, Integration_Test, System_Test) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, add evidence, comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |

## OLS links

- **Jira board:** https://skilllane.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://skilllane.atlassian.net/wiki/spaces/PLUT/folder/3592814638
- **Figma:** https://www.figma.com/design/EzwBjyCfqCCof1MuPdQUsq/OLS_Working-file
- **Qase:** https://app.qase.io/project/OLS

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## Changelog

### v1.7.0 — TC FE Prep: Typed CSVs + Fast Publish + Import_Qase Sort (17 Jun 2026)

OLS-local customizations on top of helix v1.5.31.

- **ไฟล์ CSV แยกตามประเภทเทสเคส** — สร้างไฟล์แยกสำหรับ Unit Test, Integration Test, และ System Test ให้อัตโนมัติ พร้อมแนบลง Jira ทุกไฟล์
- **เนื้อหาในไฟล์ CSV ครบทุกช่อง** — ข้อมูลทุกคอลัมน์กรอกให้ถูกรูปแบบของแต่ละประเภทแล้ว; เหลือเฉพาะช่องผลการทดสอบที่ QA กรอกเองหลังทดสอบจริง
- **ไฟล์นำเข้า Qase เรียงตามประเภท** — Unit Test มาก่อน ตามด้วย Integration Test และ System Test; ภายในแต่ละกลุ่มเรียง AC ก่อน EC; หมายเลข TC รันต่อเนื่องตลอดไฟล์
- **แนบไฟล์และโพสต์ comment ลง Jira เร็วขึ้น** — ลดขั้นตอนการส่งข้อมูลขึ้น Jira ให้เสร็จในรอบเดียว ไม่ต้องรอหลายรอบ
- **หมายเลขเทสเคสเป็นตัวเลขล้วน 1, 2, 3** — ไม่มีตัวอักษรนำหน้า ทุกไฟล์ใช้รูปแบบเดียวกันสม่ำเสมอ
- **Tags ใน Qase ใช้ข้อความจาก ticket โดยตรง** — คัดลอก AC/EC พร้อมข้อความจาก ticket ทุกตัวอักษร ไม่มีการสรุปหรือแต่งเพิ่มเอง
- **ถ้าประเภทใดไม่มีเทสเคส จะแจ้งไว้ใน Jira comment** — ไม่สร้างไฟล์ว่าง; ระบุหมายเหตุในความคิดเห็นแทนว่าประเภทนั้นไม่มี TC

### v1.6.0 — TC FE Prep: Qase integration + Thai language (17 Jun 2026)

OLS-local customizations on top of helix v1.5.31.

| # | What changed |
|---|-------------|
| 1 | **ภาษาไทยเสมอ** — เนื้อหาเทสเคสทั้งหมดเป็นภาษาไทยตามราชบัณฑิตยสภา ไม่มีโหมด English-only |
| 2 | **Step 4.5 — Term gate** — หลัง coverage review ต้องโชว์ตาราง Thai↔English ให้ user ยืนยันก่อนเขียนไฟล์จริง |
| 3 | **Type column ถาวร** — `System Test` / `Unit Test` / `Integration Test` (Qase Type values) ทุก TC เสมอ |
| 4 | **2 CSV attachments ใน Jira comment** — `Draft_Jira_{ISSUE_KEY}.csv` (Jira table format) + `Import_Qase_{ISSUE_KEY}.csv` (Qase import schema); footer มี 2 clickable download links |
| 5 | **Suite gate** — ตรวจ suite tree ใน Qase OLS ก่อน; reuse ของเดิมถ้าตรง; สร้างใหม่ต้องขอ user อนุมัติ ห้ามซ้ำ |
| 6 | **qase-import-format.md** — reference ใหม่: Qase column schema, Type/Status/AC-EC field warnings |
| 7 | **ols-project-guide.md** — เพิ่ม Qase section (project URL, file naming, Type/Status/Suite rules) |

---

## ตัวอย่างผลลัพธ์ TC FE Prep

> ตัวอย่างจาก story สมมติ **OLS-142 — Admin อนุมัติหรือปฏิเสธคำขอเข้าร่วมคอร์ส**
> 3 AC/EC → 5 TCs: System Test ×3 · Integration Test ×1 · Unit Test ×1

---

### 💬 เม้นใน Jira

<details>
<summary>คลิกเพื่อดูตัวอย่าง comment ที่โพสต์ใน Jira</summary>

Draft TC FE as below

**Shared data preparation (all TCs):**

1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin
2. ไปที่เมนู **จัดการคอร์ส** → เลือกคอร์ส **OLS-Demo-Course**
3. เปิดแท็บ **คำขอเข้าร่วม**
4. ตรวจสอบว่ามีคำขอในสถานะ **รอการอนุมัติ** อย่างน้อย 1 รายการ (ถ้าไม่มี: สร้างคำขอใหม่ผ่านบัญชี test.learner01@example.com)
5. ใช้คำขอของ **test.learner01@example.com** เป็นเป้าหมายสำหรับทุกเคสด้านล่าง

**Note — Precondition column:** ทำ shared prep ข้างต้นให้ครบก่อน จากนั้น Precondition ระบุสิ่งที่ต้องมีเพิ่มเติมเฉพาะ TC นั้น

| **Acceptance Criteria** | **Services Impacted** | **TC ID** | **Test Title** | **Precondition** | **Test Data** | **Test Steps** | **Expected Result** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 1 | แสดงรายการคำขอรอการอนุมัติ | **1.** ทำ shared prep ครบแล้ว | - | **1.** ไปที่แท็บ **คำขอเข้าร่วม** | **1.** รายการคำขอแสดงผล **2.** เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | **1.** OLS Portal **2.** Enrollment Service | 2 | อนุมัติคำขอเข้าร่วมสำเร็จ | **1.** ทำ shared prep ครบแล้ว **2.** คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | **1.** คลิก **อนุมัติ** ที่แถว test.learner01 **2.** ยืนยันใน modal | **1.** สถานะเปลี่ยนเป็น **อนุมัติแล้ว** **2.** แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 3 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | **1.** ทำ shared prep ครบแล้ว **2.** modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | **1.** คลิก **ปฏิเสธ** **2.** ไม่กรอกเหตุผลใน modal **3.** คลิก **บันทึก** | **1.** ระบบแสดง error "กรุณาระบุเหตุผล" **2.** modal ยังคงเปิดอยู่ **3.** สถานะคำขอไม่เปลี่ยน | High | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | **1.** Enrollment Service **2.** Email Service | 4 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | **1.** ทำ shared prep ครบแล้ว **2.** เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | **1.** Admin อนุมัติคำขอตาม TC 2 **2.** ตรวจสอบ inbox ของ test.learner01 | **1.** ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ" **2.** email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 5 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | **1.** ทำ shared prep ครบแล้ว | reason: (ว่าง) | **1.** เรียก validateRejectionReason โดยส่งค่า reason ว่าง | **1.** ฟังก์ชันคืนค่า false **2.** ไม่มี network request ถูกส่ง | Low | Unit Test |

**Remark — Type coverage:**
- มี *System Test* 3 เคส (TC 1–3)
- มี *Integration Test* 1 เคส (TC 4)
- มี *Unit Test* 1 เคส (TC 5)

---
📎 **ไฟล์แนบ:** [Draft\_Jira\_OLS-142.csv](https://skilllane.atlassian.net/secure/attachment/11001/Draft_Jira_OLS-142.csv) · [Import\_Qase\_OLS-142.csv](https://skilllane.atlassian.net/secure/attachment/11002/Import_Qase_OLS-142.csv) · [System\_Test\_OLS-142.csv](https://skilllane.atlassian.net/secure/attachment/11003/System_Test_OLS-142.csv) · [Integration\_Test\_OLS-142.csv](https://skilllane.atlassian.net/secure/attachment/11004/Integration_Test_OLS-142.csv) · [Unit\_Test\_OLS-142.csv](https://skilllane.atlassian.net/secure/attachment/11005/Unit_Test_OLS-142.csv)

</details>

---

### 📎 ไฟล์แนบ CSV

<details>
<summary>Draft_Jira_OLS-142.csv — ตาราง 10 คอลัมน์สำหรับ Jira (ทุกประเภท รวม 5 TC)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 1 | แสดงรายการคำขอรอการอนุมัติ | 1. ทำ shared prep ครบแล้ว | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 2 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. ทำ shared prep ครบแล้ว<br>2. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 3 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. ทำ shared prep ครบแล้ว<br>2. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 4 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. ทำ shared prep ครบแล้ว<br>2. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 2<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 5 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. ทำ shared prep ครบแล้ว | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |

</details>

<details>
<summary>Import_Qase_OLS-142.csv — สำหรับนำเข้า Qase.io (เรียง Unit → Integration → System)</summary>

| AC/EC | Title | Preconditions | Priority | Type | Status | Suite | Steps – Action | Steps – Expected | Steps – Data | Tags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. ทำ shared prep ครบแล้ว | Low | Unit Test | Done | Course Management > Enrollment Requests | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | reason: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. ทำ shared prep ครบแล้ว<br>2. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Medium | Integration Test | Done | Course Management > Enrollment Requests | 1. Admin อนุมัติคำขอตาม TC 2<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Email: test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| AC_01 — Admin เห็นรายการคำขอที่รอการอนุมัติ | แสดงรายการคำขอรอการอนุมัติ | 1. ทำ shared prep ครบแล้ว | Medium | System Test | Done | Course Management > Enrollment Requests | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | - | AC_01, Admin เห็นรายการคำขอที่รอการอนุมัติ |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. ทำ shared prep ครบแล้ว<br>2. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | คำขอของ test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. ทำ shared prep ครบแล้ว<br>2. modal ปฏิเสธเปิดอยู่ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | ช่องเหตุผล: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |

</details>

<details>
<summary>System_Test_OLS-142.csv — System Test 3 TC (TC 1–3)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 1 | แสดงรายการคำขอรอการอนุมัติ | 1. ทำ shared prep ครบแล้ว | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 2 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. ทำ shared prep ครบแล้ว<br>2. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 3 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. ทำ shared prep ครบแล้ว<br>2. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |

</details>

<details>
<summary>Integration_Test_OLS-142.csv — Integration Test 1 TC (TC 4)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 4 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. ทำ shared prep ครบแล้ว<br>2. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 2<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |

</details>

<details>
<summary>Unit_Test_OLS-142.csv — Unit Test 1 TC (TC 5)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 5 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. ทำ shared prep ครบแล้ว | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |

</details>
