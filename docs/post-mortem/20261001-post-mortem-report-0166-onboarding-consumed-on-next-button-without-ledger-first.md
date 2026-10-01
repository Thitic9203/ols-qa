# Post-Mortem Report #0166 — เลนทดสอบทำ onboarding ครั้งเดียวของบัญชีผู้เรียน Dev หมดไปเพราะปุ่ม "ถัดไป" คือปุ่มส่ง โดยไม่ได้ลง ledger ก่อน

**ระบบ:** OLS QA workspace — เลนทดสอบ responsive (testing-ticket · Dev)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** Dev — Dev learner account 1 บัญชีของเลน C (onboarding ถูกบันทึกแล้ว ย้อนไม่ได้) · ไม่ถึงผู้ใช้จริง
**วันที่เกิดเหตุ:** 2026-10-01
**วันที่ค้นพบ:** 2026-10-01
**วันที่จัดทำรายงาน:** 2026-10-01
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — การเขียนย้อนไม่ได้บน env ทดสอบ ทำให้ TC_99 ทำบนบัญชีนี้ไม่ได้อีก และ ledger ถูกเขียนหลังเกิด แต่ไม่ถึงผู้ใช้และอยู่ในบัญชีที่แผนกำหนดให้ใช้กับขั้นนี้
**ประเภท:** ทำเกินขอบเขต (เขียนข้อมูลย้อนไม่ได้ก่อนลง ledger)
**ผิดซ้ำจาก:** #0123 · #0133

---

## สรุปสั้น (Executive Summary)

ระหว่าง TC_100 (เดิน onboarding ที่ 768×1024 แบบ "walk" ซึ่งตั้งใจหยุดก่อนปุ่มสุดท้าย) สคริปต์ `run_onb.js` ของเลน C ถือว่าปุ่ม "ถัดไป" ปลอดภัยเสมอ และรู้จักปุ่มสุดท้ายจากชื่อปุ่ม (`ยืนยัน|เสร็จสิ้น|เริ่มต้นใช้งาน|บันทึก`) เท่านั้น แต่ในขั้นที่ 3 ปุ่ม "ถัดไป" คือปุ่มส่งคำตอบ onboarding จึงถูกบันทึกจริง ทำให้ onboarding ของบัญชีใช้ไปแล้ว และเปิดหน้าสื่อ 1 หน้าโดยไม่ตั้งใจ
ledger ถูกเขียนย้อนหลัง (`late_entry: true` · 08:12:26) เลนรายงานเองทันที
ต้นเหตุคือคำสั่งงานเขียนแค่ "log in write_ledger.jsonl" ไม่ได้บอกให้ลงก่อน และไม่ได้บอกให้จับขั้นที่ย้อนไม่ได้จาก request ที่เขียนข้อมูล แทนชื่อปุ่ม
แก้แล้ว: เพิ่มกฎ `IRREVERSIBLE_STEP_NO_PRELEDGER` ใน agent-dispatch-guard บล็อกคำสั่งงานที่มีขั้นย้อนไม่ได้ (irreversible / one-time / onboarding / enrol …) โดยไม่สั่งลง ledger ก่อนขั้นนั้น และจับขั้นนั้นจาก write request · ทดสอบกับไฟล์คำสั่งงานจริงของรอบนี้แล้วถูกบล็อก

---

## 1. ปัญหา (Problem Statement)

- `lane-325c/heartbeat.log` บรรทัด 45 (08:12:26): "INCIDENT: onboarding consumed in TC_100 walk run (step 3 'ถัดไป' = submit) without ledger pre-entry; TC_99 can no longer run on this account; stray media open."
- `lane-325c/write_ledger.jsonl` บรรทัด 17 (08:12:26, `late_entry: true`): "onboarding COMPLETED during 'walk' run at 768: step 3/3 button 'ถัดไป' submitted answers (script expected a separate final button)" · `restore: none (irreversible per plan.json)` · บรรทัด 18: เปิดหน้าสื่อ 1 หน้าโดยไม่ตั้งใจ ไม่ได้กดบุ๊กมาร์ก
- `lane-325c/run_onb.js:27-28` นิยาม `nextBtn = /ถัดไป|ต่อไป|ดำเนินการต่อ/` (กดได้เสมอ บรรทัด 36) และ `finalBtn = /ยืนยัน|เสร็จสิ้น|เริ่มต้นใช้งาน|บันทึก/` · บรรทัด 41 ลง ledger ก่อนกด `finalBtn` เท่านั้น
- `LANE_BRIEF_325.md:17`: "Irreversible writes (TC_93–96 enrol, TC_99–100 onboarding) only on the lane C account; log in write_ledger.jsonl." — ไม่มีคำว่า "ก่อน" และไม่ได้กำหนดวิธีจับขั้นนั้น
- heartbeat บรรทัด 46–47 (08:12:51): TC_100 FAILED · TC_99 BLOCKED → บรรทัด 68 (08:17:37) TC_99 NOT_RUN

**สิ่งที่ควรจะเป็น:** `CLAUDE.md` §10 — endpoint ที่มีผลถาวรต้องเตรียมที่เก็บผลก่อนยิง · สคริปต์คลิกที่เขียนข้อมูลต้องยืนยันเป้าก่อนคลิก · ขั้นที่ย้อนไม่ได้ต้องมีบรรทัด ledger ก่อนเกิด ไม่ใช่หลัง

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ |
|------|-----------|
| 2026-10-01 08:11:28 | `run_onb.js` ถูกเขียนครั้งสุดท้าย (mtime) |
| ก่อน 08:11:54 | **รัน TC_100 แบบ walk ที่ 768: ขั้นที่ 3 กด "ถัดไป" ซึ่งเป็นปุ่มส่ง → onboarding ถูกบันทึก** (เวลากดที่แน่นอนไม่ได้บันทึก) |
| 08:11:54 | `m_TC_100_walk.json` ถูกเขียน (mtime) — `stoppedBeforeFinal: "บันทึก"` = สคริปต์เชื่อว่าหยุดก่อนขั้นสุดท้าย |
| 08:12:26 | เลนตรวจ `GET /api/users/onboarding-questions` พบว่าบันทึกแล้ว → ลง ledger ย้อนหลัง 2 บรรทัด + heartbeat INCIDENT + รายงานเธรดหลัก |
| 08:12:51 | TC_100 FAILED · TC_99 BLOCKED |
| 08:17:37 | TC_99 NOT_RUN |
| 2026-10-01 | เพิ่ม `IRREVERSIBLE_STEP_NO_PRELEDGER` + เทสต์ · ชุดเทสต์ทั้ง repo เขียว 44/44 ชุด |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

จุดตัดสินใจที่ผิดอยู่ในสคริปต์: แยก "ขั้นปลอดภัย" กับ "ขั้นที่ย้อนไม่ได้" ด้วยชื่อปุ่ม ซึ่งตอนเขียนดูสมเหตุสมผลเพราะ onboarding ทั่วไปมีปุ่มยืนยันแยก แต่ OLS ใช้ "ถัดไป" ในขั้นสุดท้ายเป็นปุ่มส่ง ชื่อปุ่มจึงไม่ได้บอกว่าปุ่มนั้นเขียนข้อมูลหรือไม่ — สิ่งที่บอกได้จริงคือ request ที่ปุ่มนั้นส่ง

### 5 Whys

1. **ทำไม onboarding ของบัญชีถูกใช้ไประหว่างรัน walk?** — เพราะสคริปต์กด "ถัดไป" ในขั้นที่ 3 ซึ่งส่งคำตอบ onboarding จริง
2. **ทำไมสคริปต์กดปุ่มที่ส่งข้อมูล?** — เพราะสคริปต์ถือว่า "ถัดไป" ปลอดภัยเสมอ และรู้จักขั้นสุดท้ายจากชื่อปุ่ม `ยืนยัน|บันทึก…` เท่านั้น (`run_onb.js:27-28,36`) ไม่ได้ดักจาก write request
3. **ทำไม ledger ถูกเขียนหลังเกิด?** — เพราะการลง ledger ผูกกับ `finalBtn` ตามชื่อปุ่ม (`run_onb.js:41`) เมื่อขั้นที่เขียนจริงไม่ตรงชื่อ ledger จึงไม่ถูกเขียนก่อน
4. **ทำไมสคริปต์ออกแบบแบบนี้?** — เพราะคำสั่งงานเขียนแค่ "log in write_ledger.jsonl" ไม่ได้บอกว่าต้องลงก่อน และไม่ได้บอกให้จับขั้นที่ย้อนไม่ได้จาก request (เช่น `page.route` กับ POST/PUT/PATCH แล้ว abort ถ้ายังไม่ใช่เฟส confirm)
5. **ทำไมคำสั่งงานขาดข้อนี้ ทั้งที่เคยพลาดเรื่องเขียนข้อมูลโดยไม่มี ledger แล้ว (#0123 · #0133)?** — มาตรการรอบก่อนแก้ที่สคริปต์รายตัว (เพิ่ม `ledger()` ก่อนจุดเขียนที่รู้จัก) ไม่มีด่านตรวจคำสั่งงานว่าสั่ง "ลงก่อน + จับจาก request" สคริปต์ใหม่ที่เขียนในรอบนี้จึงพลาดแบบเดิมเมื่อเจอจุดเขียนที่ไม่รู้จัก

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `CLAUDE.md` §10 — เป็นข้อความ คำสั่งงานคัดมาแค่ "log in write_ledger.jsonl"
- `write_guard.js` — ดูแลการเขียนตามนโยบาย env ไม่ได้รู้ว่าปุ่มไหนในหน้า onboarding ส่งข้อมูล
- agent-dispatch-guard — ไม่มีเช็คนี้ (คำสั่งงานจริงผ่านเช็ค 1–10)
- โหมด walk ของสคริปต์มี `stoppedBeforeFinal` แต่หยุดตามชื่อปุ่ม จึงรายงาน "หยุดก่อนขั้นสุดท้าย" ทั้งที่ข้อมูลถูกส่งไปแล้ว

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — Dev learner account ของ QA บน Dev |
| เจ้าของงาน | TC_99 ทำบนบัญชีนี้ไม่ได้ (NOT_RUN) ต้องหาบัญชีอื่นที่ยังไม่ทำ onboarding · ต้องมีรายงานฉบับนี้ |
| ข้อมูล / ระบบ | onboarding ของ 1 บัญชีถูกบันทึก (ระดับชั้น/เป้าหมาย/หมวด) ย้อนไม่ได้ตาม plan.json · เปิดหน้าสื่อ 1 หน้า อาจนับยอดดู 1 ครั้ง |
| ความเชื่อถือของงานรอบนั้น | ผล TC_100 ที่ได้ยังใช้ได้ในส่วนที่วัด · สคริปต์อื่นที่แยกขั้นเขียนด้วยชื่อปุ่ม (TC_93–96 enrol) ควรตรวจ (Action Item 3) |

---

## 5. แนวทางการแก้ไข (Fix)

- เลนลง ledger ย้อนหลัง 2 บรรทัด (`late_entry: true`) พร้อมผลตรวจจาก API · ตั้ง TC_99 เป็น NOT_RUN แทนการรันบนบัญชีที่ใช้ไปแล้ว
- เพิ่มเช็คที่ 11 `IRREVERSIBLE_STEP_NO_PRELEDGER` ใน `tools/agent-dispatch-guard/dispatch_rules.js` — บรรทัดที่มีคำของขั้นย้อนไม่ได้ (irreversible / one-time / onboarding / enrol / ย้อนไม่ได้ / ลงทะเบียนเรียน / ทำได้ครั้งเดียว) ที่ไม่มีคำปฏิเสธอยู่ข้างหน้าในระยะ 40 ตัวอักษร จะบล็อกคำสั่งงาน เว้นแต่คำสั่งงานสั่งทั้ง (ก) ลง ledger **ก่อน** ขั้นนั้น และ (ข) จับขั้นนั้นจาก write request (`page.route` / `waitForRequest` / POST·PUT·PATCH request / "not by the button label")
- ระหว่างทำ พบว่าร่างแรกของกฎปล่อยคำสั่งงานจริงผ่าน เพราะคำปฏิเสธ "never reuse" ในบรรทัดเดียวกันถูกนับ จึงจำกัดคำปฏิเสธให้อยู่ก่อนคำของขั้นย้อนไม่ได้ และแก้ regex ให้รับ `write_ledger.jsonl` — ทั้งสองข้อจับได้จากการรันกฎกับไฟล์คำสั่งงานจริง
- เพิ่มเทสต์ 5 ข้อ (ต้องบล็อก: ถ้อยคำจริง · ต้องผ่าน: ลงก่อน + จับจาก request · ต้องบล็อก: ลงก่อนแต่ยังจับจากชื่อปุ่ม · ต้องไม่ติด: คำสั่งที่ห้ามขั้นย้อนไม่ได้ · ไฟล์จริงบนดิสก์ผ่าน `check.js --file`)

**ยืนยันแล้วด้วย:** `node tools/agent-dispatch-guard/dispatch_rules.test.js` → `all green — 55 test(s) ran` · `bash scripts/run-test-suites.sh` → `เขียวครบ 44 ชุด` (exit 0) · `check.js --file <round>/LANE_BRIEF_325.md` (คำสั่งงานจริงของเหตุนี้) → `BLOCK IRREVERSIBLE_STEP_NO_PRELEDGER` · `LANE_BRIEF_810.md` (ไม่มีขั้นย้อนไม่ได้) → `brief ok`

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `IRREVERSIBLE_STEP_NO_PRELEDGER` บล็อกคำสั่งงานที่มีขั้นย้อนไม่ได้แต่ไม่สั่ง "ledger ก่อน + จับจาก write request" ตอน PreToolUse บน `Agent` | hook / เครื่องมือ | ทำแล้ว |
| P2 | รายการคำของขั้นย้อนไม่ได้ที่รู้จัก (`IRREVERSIBLE_STEP_RE`) อยู่ในโมดูลเดียว | เครื่องมือ | ทำแล้ว |
| P3 | เทสต์ 5 ข้อ (รวมไฟล์จริงบนดิสก์) ใน `run-test-suites.sh` + CI | เทส / CI | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** `tools/agent-dispatch-guard/dispatch_rules.js` เช็คที่ 11 `IRREVERSIBLE_STEP_NO_PRELEDGER` · ตารางกฎใน `tools/agent-dispatch-guard/README.md`
ชั้นนี้ใหม่และแข็งกว่า #0123 / #0133 ซึ่งแก้ที่สคริปต์รายตัว: ครั้งนี้คำสั่งงานต้องกำหนดวิธีที่ไม่พึ่งชื่อปุ่มก่อนจึงจะส่งออกได้

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เลน C เอง โดยเรียก `GET /api/users/onboarding-questions` หลังรัน แล้วรายงานเธรดหลักทันที
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ไม่เกิน 32 วินาทีหลังไฟล์ผล walk ถูกเขียน (08:11:54 → 08:12:26) · เวลากดที่แน่นอนไม่ได้บันทึก
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** คำสั่งงานที่ผ่านด่านต้องให้สคริปต์ดัก write request — request ที่เขียนข้อมูลในเฟส walk จะถูก abort ก่อนถึงเซิร์ฟเวอร์

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- เลนตรวจสถานะจริงจาก API หลังรัน แทนการเชื่อ `stoppedBeforeFinal` ของสคริปต์ และรายงานเองทันที
- ขั้นนี้รันบนบัญชีที่แผนกำหนดให้ใช้กับขั้นย้อนไม่ได้เท่านั้น ความเสียหายจึงจำกัดอยู่ที่บัญชีเดียว

### สิ่งที่ต้องปรับปรุง
- ชื่อปุ่มไม่ได้บอกว่าปุ่มเขียนข้อมูลหรือไม่ ต้องดูจาก request
- ledger ของขั้นย้อนไม่ได้ต้องเขียนก่อนทุกคลิกที่อาจส่งข้อมูล ไม่ใช่ก่อนปุ่มที่ "คิดว่า" เป็นปุ่มสุดท้าย

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ลง ledger ย้อนหลัง + TC_99 = NOT_RUN | Claude (เลน C) | High | Done |
| 2 | เช็ค `IRREVERSIBLE_STEP_NO_PRELEDGER` + เทสต์ 5 ข้อ | Claude | High | Done |
| 3 | ตรวจสคริปต์ enrol (TC_93–96) ของเลน C ว่าแยกขั้นเขียนด้วยชื่อปุ่มหรือไม่ | Claude (เธรดหลัก) | Medium | Open |
| 4 | หา Dev learner account อื่นที่ยังไม่ทำ onboarding สำหรับ TC_99 | Claude (เธรดหลัก) | Medium | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `tools/agent-dispatch-guard/dispatch_rules.js` — เช็คที่ 11 `IRREVERSIBLE_STEP_NO_PRELEDGER`
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — เทสต์ 5 ข้อ
- `tools/agent-dispatch-guard/README.md` — แถวกฎใหม่ + จำนวนเทสต์
- `docs/post-mortem/README.md` · `docs/post-mortem/PENDING.md` · `docs/CLAUDE-ARCHIVE.md`

**Commit:** ดู `git log` ของไฟล์นี้

**หลักฐาน:** (ไฟล์อยู่ในโฟลเดอร์งานนอก repo `<round>/lane-325c/`)
```
heartbeat.log:45  08:12:26 INCIDENT: onboarding consumed in TC_100 walk run (step 3 'ถัดไป' = submit) without ledger pre-entry
write_ledger.jsonl:17  "late_entry": true … step 3/3 button 'ถัดไป' submitted answers (script expected a separate final button)
run_onb.js:27-28  nextBtn /ถัดไป|ต่อไป|ดำเนินการต่อ/ · finalBtn /ยืนยัน|เสร็จสิ้น|เริ่มต้นใช้งาน|บันทึก/
LANE_BRIEF_325.md:17  "Irreversible writes (… TC_99–100 onboarding) only on the lane C account; log in write_ledger.jsonl."
check.js --file <round>/LANE_BRIEF_325.md → BLOCK IRREVERSIBLE_STEP_NO_PRELEDGER
```
