# Post-Mortem Report #0125 — ผิดซ้ำจาก #0098: ใช้ `--grep` คิดว่าจะไม่มีการล็อกอินด้วยรหัสผ่าน แต่ project setup ที่เป็น dependency mint session ด้วยรหัสผ่านจริง

**ระบบ:** OLS QA workspace — ชุด e2e (repo `ols-qa-e2e`, Playwright project `setup` + `learner`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** OLS dev (บัญชีครีเอเตอร์ทดสอบของชุด e2e — tag C2) · ไฟล์ trace ของ Playwright บนเครื่อง
**วันที่เกิดเหตุ:** 2026-09-23
**วันที่ค้นพบ:** 2026-09-23
**วันที่จัดทำรายงาน:** 2026-09-23
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — agent ทำการล็อกอินด้วยรหัสผ่านที่กฎห้ามไว้ 1 ครั้ง (ล้มเหลว) บน dev · ไม่มีรหัสผ่านหลุดใน trace (สแกนแล้ว 0 quarantined) และไฟล์ state ไม่ถูกเขียนทับ
**ประเภท:** ทำเกินขอบเขต — ข้ามกฎ "agent ห้ามล็อกอินด้วยสคริปต์รหัสผ่าน" เพราะคาดผลของคำสั่งโดยไม่ตรวจ dependency
**ผิดซ้ำจาก:** #0098

---

## สรุปสั้น (Executive Summary)

เธรดหลักต้องการรันเคส auth ของผู้เรียนบน dev โดยไม่ให้เกิดการล็อกอินด้วยรหัสผ่าน จึงสั่ง `--project=setup --project=learner --grep "auth learner…"`
แต่ไม่ได้ตรวจก่อนว่า project `setup` เป็น dependency ที่ Playwright รันทุกเคสของมันโดยไม่สน `--grep` — session ของบัญชีครีเอเตอร์ tag C2 หมดอายุอยู่ ขั้น setup จึง mint ใหม่ด้วยรหัสผ่านจริง 1 ครั้ง (ล้มเหลวด้วย `__name is not defined`)
ไฟล์ state ไม่ถูกเขียนทับ (mtime 13:50:21 เดิม) และ trace ของเคสนั้นสแกนแล้วไม่มีรหัสผ่าน (0 quarantined)
คลาสเดียวกับ #0098 (บอกว่าเคสไม่ล็อกอินจากการอ่านคำสั่ง/grep ชื่อ แต่กลไก self-heal/setup ล็อกอินด้วยรหัสผ่าน) — แก้ด้วยการย้าย mint ไปรันใน child process + scrub trace บน branch `fix/mint-in-child-process` ของ `ols-qa-e2e` (ยังไม่ merge main)

---

## 1. ปัญหา (Problem Statement)

- คำสั่งที่รัน: `--project=setup --project=learner --grep "auth learner…"` (ตามแถว PM-2026-09-23-12)
- ผล: setup ของบัญชีครีเอเตอร์ tag C2 ทำงาน → mint session ด้วยรหัสผ่านจริง 1 ครั้ง → ล้มเหลว `__name is not defined`
- ไฟล์ state ของบัญชีนั้นไม่ถูกเขียนทับ (mtime 13:50:21 เท่าเดิม) · สแกน trace ของเคสนั้นแล้วได้ 0 quarantined

**สิ่งที่ควรจะเป็น:** กฎ "agent ห้ามล็อกอินด้วยสคริปต์รหัสผ่าน" (CLAUDE.md §9 · memory `no-scripted-password-login-for-agents`) — ก่อนรันต้องพิสูจน์ว่าไม่มีเส้นทางใดใน run นั้นเรียก mint ด้วยรหัสผ่าน ไม่ใช่คาดจาก `--grep`

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-23 (เวลาไม่ได้วัดไว้ในแถว) | เธรดหลักวางแผนรันเคส auth learner บน dev โดยตั้งใจไม่ให้มีการล็อกอินด้วยรหัสผ่าน |
| ถัดมา | สั่ง `--project=setup --project=learner --grep "auth learner…"` |
| ถัดมา | **setup ของบัญชี tag C2 (session หมดอายุ) mint ด้วยรหัสผ่านจริง 1 ครั้ง** — ล้มเหลว `__name is not defined` |
| ถัดมา | เธรดหลักเห็นผลของ setup ตรวจ mtime ของ state (ไม่เปลี่ยน) และสแกน trace (0 quarantined) · เปิดแถว PM-2026-09-23-12 |
| ถัดมา | commit `a8ab249` "mint in a child process so no trace can record the password" และ `24fc131` "scan the HTML report's trace copies" บน branch `fix/mint-in-child-process` |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

`--grep` กรองเฉพาะเคสใน project ที่เลือก แต่ project ที่ถูกประกาศเป็น `dependencies` จะรันทั้ง project ก่อนเสมอ การตัดสินว่า "run นี้ไม่ล็อกอิน" จึงดูจากรูปคำสั่งอย่างเดียว ไม่ได้ดูกราฟ dependency ของ config

### 5 Whys

1. **ทำไมเกิดการล็อกอินด้วยรหัสผ่าน?** — เพราะ project `setup` รันและพบ session ของบัญชี tag C2 หมดอายุ จึงเรียก mint
2. **ทำไม setup รันทั้งที่ใส่ `--grep`?** — เพราะ setup เป็น dependency ของ learner และ Playwright รัน dependency ทั้งชุดโดยไม่สน `--grep`
3. **ทำไมเธรดหลักไม่รู้ก่อนรัน?** — เพราะไม่ได้เปิด `playwright.config` ดู `dependencies` และไม่ได้รัน `--list` เพื่อดูว่าเคสไหนจะรันจริง
4. **ทำไมไม่มีอะไรหยุดการ mint?** — เพราะการ mint ด้วยรหัสผ่านบน dev ยังเป็นเส้นทางปกติของชุด e2e ไม่มีด่านที่ถามว่า "ผู้รันเป็น agent หรือไม่" ก่อน mint (guard ของ #0098 ครอบเฉพาะ training)
5. **ทำไมบทเรียน #0098 ไม่ครอบ?** — เพราะ #0098 ปิดด้วยด่านเฉพาะ env (training) ไม่ได้ปิดทั้งคลาส "agent รันชุดที่มีเส้นทาง mint ด้วยรหัสผ่านโดยไม่รู้ตัว" (root cause: ไม่มีด่านในโค้ดที่ปฏิเสธการ mint ด้วยรหัสผ่านเมื่อไม่มีคำยืนยันชัดว่าเป็นคนรัน)

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** guard ของ #0098 (`mintState` ปฏิเสธบน training + `gate:nomint`) ผูกกับ env training เท่านั้น · กฎห้ามล็อกอินด้วยรหัสผ่านเป็นข้อความ · ไม่มีขั้น `--list` บังคับก่อนรัน

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — บัญชีทดสอบบน dev |
| เจ้าของงาน | ต้องรับรู้การละเมิดกฎล็อกอิน 1 ครั้ง และตรวจงานแก้ใน `ols-qa-e2e` |
| ข้อมูล / ระบบ | ล็อกอินล้มเหลว state ไม่เปลี่ยน · trace สแกนแล้ว 0 quarantined · ไม่มีรหัสผ่านหลุดเท่าที่สแกนได้ |
| ความเชื่อถือของงานรอบนั้น | ผลเคส auth learner ของ run นั้นต้องแยกจากผลที่มี setup ล้มเหลว |

---

## 5. แนวทางการแก้ไข (Fix)

- `ols-qa-e2e` commit `a8ab249` — ย้ายการ mint ไปรันใน child process เพื่อไม่ให้ trace ใดบันทึกรหัสผ่านได้
- `ols-qa-e2e` commit `24fc131` — สแกนสำเนา trace ใน HTML report ด้วย และไม่ throw
- ทั้งสองอยู่บน branch `fix/mint-in-child-process` ยังไม่อยู่บน `main` (ตรวจด้วย `git log --oneline main -3` ไม่พบ 2 commit นี้)

**ยืนยันแล้วด้วย:** `git log --oneline -5 fix/mint-in-child-process` เห็น `a8ab249` และ `24fc131` · mtime ของ state 13:50:21 และผลสแกน 0 quarantined ตามแถว `PENDING.md` (รายงานนี้ไม่ได้วัดซ้ำ)

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

การแก้ของ #0098 ผูกกับ env · ชั้นใหม่ต้องผูกกับ "ผู้รัน" และ "กราฟ dependency"

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | mint ใน child process + scrub trace (ลดผลเสียเมื่อ mint เกิด) | เครื่องมือ | ทำแล้วบน branch · ยังไม่ merge main |
| P2 | `mintState` ปฏิเสธการ mint ด้วยรหัสผ่านทุก env เว้นแต่มีตัวแปรยืนยันว่าคนเป็นผู้รัน (เช่น `ALLOW_PASSWORD_MINT=human`) — agent ไม่ตั้งค่านี้ | เครื่องมือ | ยังไม่ได้ทำ |
| P3 | ก่อนรันชุดใดที่อ้างว่า "ไม่ล็อกอิน" ต้องรัน `--list` แล้วพิสูจน์ว่าไม่มีเคสของ project setup อยู่ในรายการ | กฎ + สคริปต์ | ยังไม่ได้ทำ |

**กฎที่เพิ่มจากเหตุนี้:** ยังไม่มีกฎที่เขียนลงไฟล์ — ข้อเสนอ P2/P3 ต้องแก้ใน `ols-qa-e2e` ซึ่งเป็นอีก repo จึงต้องให้เจ้าของงานตัดสินก่อน

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เธรดหลักเห็นผล setup ใน output ของ run เอง
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ภายใน run เดียวกัน (ไม่มี timestamp วัดไว้)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P2 จะปฏิเสธก่อนส่งรหัสผ่าน · P3 จะเห็นเคส setup ตั้งแต่ `--list`

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ตรวจ mtime ของ state และสแกน trace ทันที จึงยืนยันได้ว่าไม่มีรหัสผ่านหลุดเท่าที่สแกน
- แก้ที่กลไก (child process) ไม่ใช่แค่ลบ trace

### สิ่งที่ต้องปรับปรุง
- `--grep` ไม่ได้กรอง dependency — ต้องดูว่าอะไรจะรันจริงก่อนอ้างว่าไม่มีการล็อกอิน

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ขอรีวิวและ merge `fix/mint-in-child-process` | เจ้าของงาน | High | Open |
| 2 | เสนอ P2 (ด่านผู้รัน) และ P3 (`--list` ก่อนรัน) ให้เจ้าของงานตัดสิน | Claude | High | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `ols-qa-e2e` (อีก repo) — การ mint ย้ายเข้า child process และตัวสแกน trace (commit ด้านล่าง)

**Commit:** `a8ab249` · `24fc131` (branch `fix/mint-in-child-process` ของ `ols-qa-e2e`)

**หลักฐาน:**
```
--project=setup --project=learner --grep "auth learner…"
setup: mint <creator account C2> -> __name is not defined   (1 ครั้ง)
state mtime 13:50:21 (ไม่เปลี่ยน) · trace scan: 0 quarantined
```
