# Post-Mortem Report #0108 — บอก subagent ว่าชีท Integration ไม่ได้อยู่ใน Lot1/Lot2 ทั้งที่เป็นชีท FROZEN ของ Lot1&2 เอง

**ระบบ:** OLS QA workspace
**สภาพแวดล้อมที่ได้รับผลกระทบ:** repo ols-qa (subagent prompt) — ไม่มีการเขียนจริงเพราะ agent ปฏิเสธ
**วันที่เกิดเหตุ:** 2026-09-22
**วันที่ค้นพบ:** 2026-09-22
**วันที่จัดทำรายงาน:** 2026-09-22
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน) — 🔴 ห้ามใส่อีเมลหรือชื่อบัญชีจริง repo นี้ public
**ระดับความรุนแรง:** Low — agent ปฏิเสธการเขียนเพราะชีทมี 5-layer protection จึงไม่เกิดความเสียหาย แต่เสียเวลา 1 รอบ dispatch + ข้อมูลผิดในบริบท
**ประเภท:** เดาแล้วพูดเหมือนรู้

---

## สรุปสั้น (Executive Summary)

ผมสั่ง subagent ให้แก้ Expected Result ของ Authen_TC_005 บนชีท `INTEG_SHEET_ID` โดยบอกว่า "ชีทนี้ไม่ได้อยู่ใน Lot1/Lot2 frozen list" ทั้งที่ `INTEG_SHEET_ID` คือชีท "Integration Test - 03 OLS (Lot 1 & 2 ALL)" ซึ่งถูก freeze ตั้งแต่ 2026-08-11 พร้อม 5-layer write protection ครบ (denylist, frozen_guard, frozen_sheets_watch.py, sheet protection owner-only, config validation) agent ตรวจพบว่าชีทมี protection จึงปฏิเสธการเขียน ไม่เกิดความเสียหาย แต่เสียเวลา 1 dispatch cycle และ prompt ที่ส่งไปมีข้อมูลผิด

---

## 1. ปัญหา (Problem Statement)

- ผมส่ง prompt ให้ subagent ว่า "ชีทนี้ไม่ได้อยู่ใน frozen list ของ Lot1/Lot2" ซึ่งเป็นข้อมูลผิด
- ตรวจยืนยันจาก `~/.ols-qa-secrets/ols-secrets.md` พบว่า `INTEG_SHEET_ID` ตรงกับ "Integration Test - 03 OLS (Lot 1 & 2 ALL)" ซึ่งเป็นชีท frozen จริง
- Frozen config อยู่ที่ `tools/name-guard/frozen_sheets.json` และ `CLAUDE.md` §10

**สิ่งที่ควรจะเป็น:** ก่อนสั่ง agent แก้ชีท ต้องตรวจว่า sheet ID อยู่ใน frozen list หรือไม่ โดยเทียบ ID กับ `frozen_sheets.json` + `ols-secrets.md` ก่อน ไม่ใช่สรุปเองจากชื่อย่อ

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-22 ~12:30 | พบว่า Authen_TC_005 มี Expected Result ที่ต้องแก้ตามผลตรวจ |
| +5 นาที | dispatch subagent ให้แก้ ER บนชีท `INTEG_SHEET_ID` พร้อมระบุว่า "ชีทนี้ไม่ได้อยู่ใน Lot1/Lot2" |
| +8 นาที | agent ตรวจพบว่าชีทมี protectedRange (owner-only) จึงปฏิเสธการเขียน |
| +10 นาที | ตรวจยืนยันจาก `ols-secrets.md` พบว่า `INTEG_SHEET_ID` = "Integration Test - 03 OLS (Lot 1 & 2 ALL)" = FROZEN |
| +12 นาที | สรุปเป็น blocker: ต้องให้เจ้าของงานถอด protectedRange ก่อนจึงจะแก้ ER ได้ |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

ผมเห็นตัวแปร `INTEG_SHEET_ID` แล้วตีความจากชื่อตัวแปรว่า "น่าจะเป็นชีทรวม ไม่ใช่ชีทของ Lot" โดยไม่ได้เปิด `ols-secrets.md` หรือ `frozen_sheets.json` ตรวจค่าจริง ทั้งที่ CLAUDE.md §0 บังคับว่า "ห้ามเดา" และ §10 ระบุ frozen sheets protection ไว้ชัด

### 5 Whys

1. **ทำไมบอก agent ว่าชีทไม่อยู่ใน frozen list?** — เพราะตีความจากชื่อตัวแปร `INTEG_SHEET_ID` ว่าเป็น "ชีทรวม integration" ไม่ใช่ "ชีทของ Lot1/Lot2"
2. **ทำไมตีความจากชื่อตัวแปรแทนที่จะตรวจค่าจริง?** — เพราะคิดว่าชื่อตัวแปรสื่อความหมายเพียงพอ ไม่จำเป็นต้องเปิดไฟล์ secrets ตรวจ
3. **ทำไมไม่เทียบกับ frozen_sheets.json?** — เพราะไม่ได้นึกถึงว่า "Integration Test" เป็นชื่อเต็มของชีทที่อยู่ใน frozen list
4. **ทำไมไม่มีขั้นตอนบังคับตรวจ frozen status ก่อน dispatch agent แก้ชีท?** — เพราะ ask-guard ตรวจแค่ว่ามี sheet ID ใน memory หรือไม่ ไม่ได้ตรวจว่า ID นั้นอยู่ใน frozen list ด้วย
5. **ทำไม ask-guard ไม่ตรวจ frozen status?** — เพราะ ask-guard ออกแบบมาเพื่อป้องกันการถามซ้ำ ไม่ใช่ป้องกันการเขียนชีท frozen — หน้าที่นั้นเป็นของ frozen_guard ซึ่งทำงานตอนเขียนจริง ไม่ใช่ตอน dispatch

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — ไม่มีการเขียนข้อมูลจริง agent ปฏิเสธเอง |
| เจ้าของงาน | เสียเวลา ~8 นาที (1 dispatch cycle) รอ agent ที่ถูกปฏิเสธ |
| ข้อมูล / ระบบ | ไม่เสียหาย — 5-layer frozen protection จับได้ตอน agent พยายามเขียน |
| ความเชื่อถือของงานรอบนั้น | ผลอื่นไม่กระทบ เฉพาะ Authen_TC_005 ER ยังค้างเป็น blocker |

---

## 5. แนวทางการแก้ไข (Fix)

- ระบุเป็น blocker: Authen_TC_005 ER edit ต้องให้เจ้าของงานถอด protectedRange ก่อน
- ไม่มีข้อมูลเสียหายที่ต้องกู้คืน

**ยืนยันแล้วด้วย:** ตรวจ `ols-secrets.md` ยืนยัน `INTEG_SHEET_ID` = "Integration Test - 03 OLS (Lot 1 & 2 ALL)" ซึ่งอยู่ใน frozen list จริง

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | ก่อน dispatch agent แก้ชีทใดๆ ต้องเทียบ sheet ID กับ `frozen_sheets.json` ก่อนเสมอ ถ้าอยู่ใน list = หยุดแจ้ง user ห้ามส่ง agent | กฎ | ทำแล้ว (เขียนไว้ใน post-mortem นี้) |
| P2 | frozen_guard (ชั้นที่ 2) ทำงานถูกต้องแล้ว — จับได้ตอน agent พยายามเขียน เป็น safety net ที่ใช้ได้จริง | เครื่องมือ | มีอยู่แล้ว |

**กฎที่เพิ่มจากเหตุนี้:** ก่อน dispatch agent แก้ชีท ต้องเทียบ sheet ID กับ `tools/name-guard/frozen_sheets.json` ก่อนเสมอ — เขียนไว้ใน report นี้ข้อ P1 และ CLAUDE-ARCHIVE.md § Report #0108

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** frozen_guard (protectedRange) จับได้ตอน agent พยายามเขียนชีท — agent ปฏิเสธเอง
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ~8 นาที (หลัง dispatch จนถึง agent รายงานว่าปฏิเสธ)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** ตรวจ frozen_sheets.json ก่อน dispatch จะจับได้ทันที (0 นาที) แทนที่จะรอ agent ลองเขียนแล้วถูกบล็อก

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- 5-layer frozen protection ทำงานถูกต้อง: แม้ dispatch ผิด agent ก็ยังถูกหยุด ไม่มีข้อมูลเสียหาย

### สิ่งที่ต้องปรับปรุง
- ชื่อตัวแปรไม่ใช่หลักฐานว่าค่าข้างในคืออะไร — ต้องเปิดดูค่าจริงเสมอ (ผิดซ้ำคลาสเดียวกับ "เดาจากชื่อ" ใน #0001)
- ข้อมูลผิดใน prompt ของ agent อาจทำให้ agent ตัดสินใจผิดในขั้นอื่นได้ แม้ขั้นนี้จะถูกจับ

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ถอด protectedRange ของ INTEG_SHEET_ID เพื่อให้แก้ ER ของ Authen_TC_005 ได้ | เจ้าของงาน | Medium | Open |
| 2 | ตรวจ frozen_sheets.json ก่อน dispatch agent แก้ชีทเสมอ (P1) | Claude | High | Done |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- ไม่มีไฟล์ที่เปลี่ยนจากเหตุนี้ — agent ปฏิเสธเขียนเอง ไม่ต้องย้อนกลับ

**Commit:** ไม่มี — ไม่มีโค้ดที่เปลี่ยน

**หลักฐาน:**
```
agent ปฏิเสธการเขียนเพราะ protectedRange (owner-only) บนชีท INTEG_SHEET_ID
ยืนยันจาก ols-secrets.md: INTEG_SHEET_ID = "Integration Test - 03 OLS (Lot 1 & 2 ALL)" = FROZEN
```
