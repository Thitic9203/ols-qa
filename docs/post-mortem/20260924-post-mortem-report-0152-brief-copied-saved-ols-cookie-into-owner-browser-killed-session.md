# Post-Mortem Report #0152 — brief สั่งให้ใส่คุกกี้ OLS จากไฟล์ state ลงเบราว์เซอร์ NDLP ของเจ้าของงาน จน session ที่เซฟไว้ถูกปิด

**ระบบ:** OLS QA workspace (งาน VDO evidence รอบ training69 · เคส Integration NDLP_TC_003)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** training69 (session OLS ของบัญชี QA tc9020) · เวลาของเจ้าของงาน
**วันที่เกิดเหตุ:** 2026-09-24
**วันที่ค้นพบ:** 2026-09-24
**วันที่จัดทำรายงาน:** 2026-09-24
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — session ที่เซฟไว้ถูกปิดถาวร เจ้าของงานต้องล็อกอินใหม่ และคิวอัด NDLP_TC_005 ต้องรอ · ไม่มีข้อมูลเนื้อหาเสียหาย
**ประเภท:** แตะของที่ห้ามแตะ (ใช้ไฟล์ session นอก context ของตัวเอง) / สั่งงานผิด
**ผิดซ้ำจาก:** #0073 (เลนอัดเปิดเว็บ NDLP ด้วยไฟล์ session ที่บันทึกไว้ เว็บต่ออายุ login เองโดยไม่เซฟกลับ) — คลาสเดียวกัน: นำ session ที่เซฟไว้ไปใช้ในเบราว์เซอร์/บริบทอื่นที่ระบบจะหมุนหรือปิด session โดยไม่เซฟกลับ

---

## สรุปสั้น (Executive Summary)

ผมเขียน brief ให้ agent แก้สคริปต์ NDLP_TC_003 โดยแนะนำว่า "เพิ่มคุกกี้ OLS ของ tc9020 จาก `T.stateOf('tc9020')` ลงเบราว์เซอร์ CDP ของเจ้าของงาน" agent ทำตาม (ใส่เฉพาะ `__Host-ols-auth.session_token`) แล้วรัน dry ตอน 11:37:46Z
เบราว์เซอร์นั้นมีคุกกี้ `access_token` ของ NDLP ของเจ้าของงานซึ่งไม่ตรงกับที่ผูกไว้กับ session → OLS ถือว่า session ค้าง (`isSessionStale`) → proxy สั่ง link ใหม่ → `rotate(previousToken)` ปิด session เดิมในฐานข้อมูล keepalive เห็น session ตายตอน 11:40:28Z
แก้แล้ว: เจ้าของงานล็อกอินใหม่ (keepalive pid ใหม่) · เพิ่มด่าน agent-dispatch-guard ข้อ 8 บล็อก brief ที่ย้ายคุกกี้จากไฟล์ state ไปบริบทอื่น (41 เทสเขียว)

---

## 1. ปัญหา (Problem Statement)

- brief ของผม (dispatch ครั้งที่ 2 ของงาน NDLP_TC_003) มีบรรทัด "add the tc9020 OLS cookies from T.stateOf('tc9020') to that context, add a new tab"
- `tc9020_keepalive.jsonl`: i=4 11:33:27Z get-session 200 ผู้ใช้ tc9020_training · i=5 11:40:28Z get-session 200 ผู้ใช้ว่าง, profile 401 → fatal
- ols-monorepo origin/main: `apps/api/src/modules/auth/application/session.service.ts:60-68` (`rotate()` เรียก `endByTokenHash(previousToken)`) · `:83-90` (`isSessionStale` เมื่อ token NDLP ที่ส่งมาไม่ตรง → null) · `apps/web/src/lib/proxy/with-ndlp-link.proxy.ts:135-152` (โหลดหน้าที่ไม่มี user + มีคุกกี้ NDLP → link ใหม่)
- VPN หลุดช่วงเดียวกัน แต่ไม่ใช่สาเหตุ: OLS ถูก pin ไป IP สาธารณะ และ server ยังตอบ 200/401 จริง (การปิด session ต้องเป็นการเขียนฝั่ง server)

**สิ่งที่ควรจะเป็น:** session ที่เซฟไว้ใช้เฉพาะใน context ที่สร้างจากไฟล์ state เอง และเซฟกลับด้วย `T.safeSave` (`t69_lib_v2.js`) · เบราว์เซอร์ของเจ้าของงานเปิด OLS แบบไม่คัดลอกคุกกี้ OLS ใดๆ (กฎที่มาจาก #0073)

**จุดที่ยังขาดหลักฐานตรง:** ยังไม่ได้เห็น log ฝั่ง API ของ `PUT /api/auth/link/ndlp` ช่วง 11:37:46–55Z (ไม่มีสิทธิ์อ่าน log server) — กลไกยืนยันจากโค้ดและลำดับเวลา

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-24 18:33 (+07) | ผม dispatch agent แก้ NDLP_TC_003 · **brief แนะนำให้ใส่คุกกี้ OLS จาก state ลงเบราว์เซอร์ CDP ของเจ้าของงาน** |
| 11:33:27Z | keepalive tc9020 ยังดี |
| 11:37:46Z | agent รัน dry (ใส่ session_token ลงเบราว์เซอร์เจ้าของงาน · เปิด OLS) |
| 11:39:28Z | dry รอบ 2 · get-session ในเบราว์เซอร์นั้นยังเป็น tc9020 (session ใหม่ที่ link แล้ว) |
| 11:40:28Z | **keepalive ตรวจเจอ session ของ state ตาย** |
| 18:40–18:43 | ผมสรุปผิดครั้งแรกว่า "ยังพิสูจน์ไม่ได้" จาก http 0 → วัดใหม่ยืนยันตาย → ส่ง agent สืบต้นเหตุ |
| 18:4x | เจ้าของงานล็อกอิน tc9020 ใหม่ · agent รายงานกลไก · ผมเปิดโค้ดยืนยัน |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไม session ของ tc9020 ตาย?** — เพราะ OLS link session ใหม่ให้เบราว์เซอร์เจ้าของงาน แล้ว `rotate()` ปิด session เดิมที่ถูกใส่เข้าไป
2. **ทำไม session เดิมไปอยู่ในเบราว์เซอร์เจ้าของงาน?** — เพราะสคริปต์ใส่ `session_token` จากไฟล์ state ลงไป ตาม brief ของผม
3. **ทำไม brief แนะนำแบบนั้น?** — เพราะผมต้องการให้ OLS กับ NDLP อยู่ในแท็บเดียวเพื่ออัดทุกขั้นบนกล้อง และคิดแค่ว่าต้องมี session OLS ในเบราว์เซอร์นั้น ไม่ได้ตรวจว่า OLS ผูก session กับ token NDLP
4. **ทำไมไม่นึกถึง #0073?** — เพราะ #0073 เขียนเป็น "ห้ามเปิดเว็บ NDLP ด้วยไฟล์ session" ซึ่งผมอ่านเป็นเรื่องฝั่ง NDLP ไม่ใช่ทิศกลับ (เอา session OLS ไปใส่เบราว์เซอร์ที่มี NDLP อื่น)
5. **ทำไมไม่มีด่านจับ?** — root cause: ไม่มีด่านเชิงเครื่องบน brief ที่ตรวจการย้ายคุกกี้ session จากไฟล์ state ไปบริบทอื่น ทุกชั้นที่มีเป็นข้อความเตือน

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** agent-dispatch-guard ข้อ 1–7 ไม่มีข้อเรื่องคุกกี้ · สคริปต์ของ agent บล็อก non-GET ทุกตัวของ OLS แต่การ link ใหม่เกิดฝั่ง server ระหว่างโหลดหน้า (GET) route guard จึงกันไม่ได้

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่มี (บัญชี QA บน training69) |
| เจ้าของงาน | ต้องล็อกอิน tc9020 ใหม่ 1 ครั้ง · งานอัดที่ต้องใช้ tc9020 เลื่อนราว 10 นาที |
| ข้อมูล / ระบบ | session 1 แถวถูกปิด · ไม่มีข้อมูลเนื้อหาถูกแก้ (ndlpWritesTotal 0 · OLS non-GET 0) |
| ความเชื่อถือของงานรอบนั้น | ผลตัดสินเคสอื่นไม่ได้รับผล |

---

## 5. แนวทางการแก้ไข (Fix)

- เจ้าของงานล็อกอิน tc9020 ใหม่ (`relogin_tc9020_0924e.log`: SAVED tc9020 · KEEPALIVE pid ใหม่)
- NDLP_TC_003 ไม่ใช้แนวทางย้ายคุกกี้อีก (และพบว่า NDLP แก้สื่อที่เผยแพร่ผ่านหน้าจอไม่ได้อยู่แล้ว ดู #0151)

**ยืนยันแล้วด้วย:** `git show origin/main:apps/api/src/modules/auth/application/session.service.ts | sed -n 55,92p` และ `with-ndlp-link.proxy.ts | sed -n 128,155p` ใน ols-monorepo

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | agent-dispatch-guard ข้อ 8 `SESSION_COOKIE_TRANSPLANT`: บล็อก brief ที่มีบรรทัดย้าย/ใส่คุกกี้คู่กับไฟล์ state (ยกเว้นบรรทัดที่เป็นข้อห้าม) · เทส 3 ข้อ (บรรทัดจริงของเหตุนี้ต้องถูกบล็อก · ข้อห้ามต้องไม่ถูกบล็อก · ใช้ T.newCtx ปกติต้องไม่ถูกบล็อก) | เครื่องมือ + เทส | ทำแล้ว |
| P2 | memory: session ที่เซฟไว้ใช้ได้เฉพาะ context ที่สร้างจากไฟล์เอง + safeSave · ห้ามใส่ลงเบราว์เซอร์ที่มี NDLP อื่น | memory | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** agent-dispatch-guard ข้อ 8 `SESSION_COOKIE_TRANSPLANT` (`tools/agent-dispatch-guard/dispatch_rules.js`) + memory `feedback_saved-session-only-in-own-context.md` · ชั้นใหม่เทียบ #0073: #0073 มีแต่กฎข้อความ ฉบับนี้เพิ่มด่านเชิงเครื่องที่บล็อกก่อน dispatch

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** keepalive (fatal ที่ i=5) และการรัน cleanup ของผมที่หยุดเพราะไม่มี session
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ราว 3 นาทีหลัง dry
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 บล็อกตั้งแต่ตอน dispatch

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- สคริปต์ของ agent ลบคุกกี้ที่ใส่ออกหลังจบ และไม่เขียนข้อมูลใดๆ
- แยก agent สืบต้นเหตุจนได้กลไกระดับโค้ด แล้วเธรดหลักเปิดโค้ดยืนยันเอง

### สิ่งที่ต้องปรับปรุง
- ก่อนแนะนำให้ใช้ session ในบริบทใหม่ ต้องอ่านว่าระบบ auth ผูก session กับอะไรบ้าง
- ครั้งแรกผมสรุปจาก http 0 ว่าอาจไม่ตาย แล้วส่งข้อความถอนให้ agent ก่อนวัดซ้ำ ควรวัดซ้ำก่อนส่งข้อความใดๆ

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ขอ log ฝั่ง API ของ `PUT /api/auth/link/ndlp` 11:37–11:40Z ถ้าต้องการปิดจุดขาดหลักฐาน | เจ้าของงาน / ทีม Dev | Low | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `tools/agent-dispatch-guard/dispatch_rules.js` — ข้อ 8 `SESSION_COOKIE_TRANSPLANT`
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — เทส 3 ข้อ

**หลักฐาน:**
```
{"ts":"2026-09-24T11:33:27.737Z","i":4,"status":200,"touch":200,"user":"tc9020_training",...}
{"ts":"2026-09-24T11:40:28.953Z","i":5,"status":200,"touch":401,"user":"",...}
{"ts":"2026-09-24T11:40:28.954Z","i":5,"fatal":"session not valid for tc9020"}
```
