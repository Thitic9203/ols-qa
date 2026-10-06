# Post-Mortem Report #0170 — อ่าน keepalive รอบเก่าเป็นจำนวน session สด แล้วสั่งรัน shadow ที่ไม่ได้ทดสอบเลย

**ระบบ:** OLS QA workspace — RTT auto-test ขั้น 7 (shadow round)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** dev (อ่านอย่างเดียว ไม่มีการเขียน Jira/Discord) · ข้อความสถานะถึงเจ้าของงาน
**วันที่เกิดเหตุ:** 2026-10-06
**วันที่ค้นพบ:** 2026-10-06
**วันที่จัดทำรายงาน:** 2026-10-06
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — ไม่มีข้อมูลเสียหาย แต่บอกสถานะผิดกับเจ้าของงาน และเสียรอบทดสอบ 4 ticket กับเวลารอ
**ประเภท:** เดาแล้วพูดเหมือนรู้ (อ่านค่าเก่าเป็นค่าสด)

## สรุปสั้น (Executive Summary)

หลังเจ้าของงานแจ้งว่าต่อ VPN แล้ว Claude ตรวจ VPN สดผ่าน แต่จำนวน session dev กลับอ่านจาก log keepalive ด้วยคำสั่งที่หยิบ "บรรทัด verified ล่าสุด" แล้วพลาดไปได้รอบ 16:40 (7/16) แทนรอบสด 18:29 (0/16) จึงบอกเจ้าของงานว่ามี session ใช้ได้ 7 บัญชี แล้วสั่งรัน shadow 4 ticket ระหว่างรอบ Wi-Fi ของเครื่องหลุด (VPN หลุดตาม) การเรียก Claude จึงไม่มีเน็ต ทั้ง 4 ticket ไม่ได้ทดสอบเลย (ถูกบันทึกเป็น runner-error / ECONNRESET) แก้แล้วด้วยด่านสดใน `shadow.py` ที่วัด VPN + session ก่อนทุก ticket

## 1. ปัญหา (Problem Statement)

- ข้อความถึงเจ้าของงาน: "dev ใช้ได้ 7/16 บัญชี" — ค่าจริง ณ เวลานั้นคือ 0/16
- รอบ shadow 18:27–18:57: OLS-843 ได้ `API connection dropped (ECONNRESET/transient) x3` · OLS-841/839/280 ได้ `Unable to connect to API (ConnectionRefused)` ในขั้นจัดประเภท — ทั้ง 4 ticket ไม่มีผลทดสอบ

**สิ่งที่ควรจะเป็น:** ก่อนบอกว่าบัญชีพร้อมหรือส่งงานทดสอบ ต้องวัด session สดในเธรดหลักเอง (`CLAUDE.md` §9 "ก่อนบอกว่าบัญชีพร้อม/ส่งเลน … เธรดหลักรัน … เอง ถาม session จากไฟล์ตรง") และสถานะต้องไม่อ่านจาก "บรรทัดสุดท้ายที่พิมพ์" (`CLAUDE.md` §0)

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ |
| :--- | :--- |
| 16:40:59 | keepalive dev รอบสุดท้ายที่ VPN ต่อ: 7/16 verified |
| หลัง 16:40:59 – ก่อน 18:29:56 | VPN ไม่ต่อ (keepalive ทุกรอบ FAIL vpn) — เกิน idle 30 นาที session ตายหมด |
| 18:26:42 | Claude รัน dev_preflight สด: PASS |
| 18:26:42–18:27:15 | Claude อ่าน log keepalive ด้วยคำสั่งที่หยิบช่วงก่อนบรรทัด `verified` ตัวท้าย ได้รอบ 16:40 แล้วรายงาน 7/16 |
| 18:27:15 | เริ่ม shadow 4 ticket |
| 18:29:56 | keepalive สด: 0/16 verified |
| 18:36:02 | Wi-Fi ของเครื่องหลุด (`en0 link INACTIVE` · IP ถูกถอด) — ไม่มีเน็ตจนถึง 22:19:38 |
| 18:37:22 | L2TP หลุดตาม (`L2TP has detected change in the network`) |
| 18:39:59 | keepalive: VPN ไม่ต่อ |
| 18:48:06 | OLS-843 จบด้วย ECONNRESET x3 ไม่มีผล |
| 18:48–18:57 | 3 ticket ที่เหลือ ConnectionRefused ตอนจัดประเภท — CLI ของ Claude รายงาน DNS lookup ล้มเหลวเป็นข้อความนี้ (ทำซ้ำได้ด้วย host ที่ resolve ไม่ได้) |
| 23:38 | สืบด้วย systematic-debugging: เรียก Claude ซ้ำได้ปกติ · พบ 0/16 ที่ 18:29 |

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. ทำไมรายงาน 7/16 ผิด — เพราะอ่านจาก log ของรอบ 16:40 ไม่ใช่การวัดสด
2. ทำไมไม่วัดสด — เพราะใช้ log keepalive เป็นทางลัดแทนการรัน `session_verify.js` เอง
3. ทำไมไม่เห็นว่ารอบเก่า — คอลัมน์อายุ (20.4h) เป็นอายุไฟล์ state ไม่ใช่เวลาของรอบ และคำสั่งไม่ได้พิมพ์บรรทัดหัวรอบ (`=== <เวลา> keepalive-dev start`) ออกมาด้วย
4. ทำไม shadow ยังรันต่อทั้งที่ไม่มี session — `shadow.py` ไม่มีด่าน VPN/session มีแค่เช็ค token Claude ครั้งเดียวตอนเริ่มรอบ
5. ทำไมเมื่อ VPN หลุดกลางรอบ ticket ที่เหลือถูกเผาทิ้ง — ไม่มีการเช็คซ้ำก่อนแต่ละ ticket และ error เครือข่ายถูกนับเป็น runner-error ที่ไม่ retry

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** กฎ §9 เป็นข้อความ ไม่มีเครื่องบังคับ · `preflight_claude` (#0169) ตรวจแค่ token ไม่ตรวจเครือข่าย dev/session · SFD ไม่ได้ครอบ shadow ที่รันมือ

## 4. ผลกระทบ (Impact)

- 4 ticket (OLS-843, 841, 839, 280) ไม่ได้ทดสอบ ต้องรันใหม่ · ขั้น 7 เลื่อนออกไป
- เจ้าของงานได้ข้อมูลสถานะผิด 1 ข้อความ
- ไม่มีการเขียน Jira / Discord / ข้อมูลบน dev (โหมด WRITE=0)

## 5. แนวทางการแก้ไข (Fix)

`rtt_autotest/shadow.py` (repo บอท off-repo):
- `live_gate()` ก่อน**ทุก** ticket: `dev_preflight.sh` ต้อง rc 0 และ `session_verify.js` ต้องอ่านผลได้และ live ≥ 1 — ไม่ผ่าน = ticket ที่เหลือทั้งหมดบันทึก `deferred` พร้อมเหตุผล + DM เจ้าของงาน + rc 4
- `with_transient_retry()`: retry เฉพาะ error เครือข่ายชั่วคราว (ConnectionRefused/ECONNRESET/…) 3 ครั้ง · auth error ไม่ retry
- `run_outcome()`: บรรทัด "API connection dropped" จาก run.sh = `deferred` ไม่ใช่ผลตัดสิน

**ยืนยันแล้วด้วย:** `test_rtt_shadow_live_gate.py` PASS 12/12 (ต้องพบ: VPN ล่ม / 0 session / อ่านไม่ได้ / rc 2 ปิดด่าน · ต้องไม่พบ: 3/16 เปิดด่าน · auth ไม่ retry) · ชุดเดิม `test_rtt_shadow_preflight.py` 5 passed · `test_rtt_scan_classify.py` all green · ด่านกับของจริง 2026-10-06 ก่อน 23:49: `CLOSED no-live-dev-session | 0/16 verified` ตรงกับ keepalive

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

- ด่านสดอยู่ในโค้ดที่รันงาน ไม่ต้องพึ่งความจำของผู้สั่ง
- เวลารายงานจำนวน session ให้เจ้าของงาน ใช้ค่าจาก `live_gate()` / `session_verify.js` ที่รันในเทิร์นนั้นเท่านั้น พร้อมเวลาที่วัด

**กฎที่เพิ่มจากเหตุนี้:** ไม่มีกฎข้อความใหม่ เพราะ §0/§9 ครอบอยู่แล้ว — ชั้นใหม่คือด่านในโค้ด `shadow.py live_gate()` ที่บังคับก่อนทุก ticket

## 7. การตรวจจับปัญหา (Detection)

พบเมื่ออ่าน ledger หลังรอบจบ: ทุก ticket ไม่มีผลตัดสิน · อ่าน `runner_error_detail` แล้วไล่ไทม์ไลน์ VPN จาก log keepalive

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ledger บันทึกรายละเอียด error ทุก ticket (จาก #0169) ทำให้หาสาเหตุได้ทันที
- โหมด WRITE=0 ทำให้ไม่มีผลกระทบภายนอก

### สิ่งที่ต้องปรับปรุง
- อย่าใช้ log ของงานตามตารางเป็นค่าสด — ต้องพิมพ์เวลาของรอบที่อ่านเสมอ หรือวัดเอง

## 9. Action Items

| # | งาน | สถานะ |
| :--- | :--- | :--- |
| 1 | ด่านสด + retry + deferred ใน shadow.py พร้อมเทสต์ | ✅ |
| 2 | รัน shadow 4 ticket ใหม่หลังเจ้าของงานล็อกอิน dev ผ่าน login_from_sheet.py | ⬜ รอคนพิมพ์รหัส |

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:** `rtt_autotest/shadow.py` · `rtt_autotest/tests/test_rtt_shadow_live_gate.py` (repo บอท off-repo)
**Commit:** `c79b5cd` (+ `2becfb2` auto-backup เก็บส่วนแรกของการแก้ไปก่อน)
**หลักฐาน:** ledger รอบ shadow 2026-10-06 · log keepalive dev รอบ 16:40:59 (7/16) และ 18:29:56 (0/16)
