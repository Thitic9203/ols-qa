# Post-Mortem Report #0098 — smoke บน training69 ล็อกอินด้วยรหัสผ่านเอง 37 ครั้งผ่าน fixture self-heal

**ระบบ:** OLS QA workspace — ชุดเทสต์ E2E (`ols-qa-e2e`) · smoke-test-workflow
**สภาพแวดล้อมที่ได้รับผลกระทบ:** training69 (hands-off env — รันได้เพราะเจ้าของงานสั่งยกเว้นในแชทรอบนี้)
**วันที่เกิดเหตุ:** 2026-09-21
**วันที่ค้นพบ:** 2026-09-21
**วันที่จัดทำรายงาน:** 2026-09-21
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — AI ถูกห้ามล็อกอินด้วยรหัสผ่านทุกกรณี แต่ชุดเทสต์ที่ AI สั่งรันกลับยิงรหัสผ่านบัญชี dev เข้าหน้า sign-in ของ env ที่มีผู้ใช้จริง 37 ครั้ง
**ประเภท:** เดาแล้วพูดเหมือนรู้ (ข้ออ้างเชิงลบที่ไม่ได้ตรวจทางเรียกจริง) + ทำเกินขอบเขตที่อนุญาต

---

## สรุปสั้น (Executive Summary)

เจ้าของงานสั่ง smoke บน training69 และล็อกอินเก็บ session ด้วยมือ 5 บัญชี AI รันชุดเทสต์ด้วย `--no-deps` เพื่อไม่ให้ setup
project ล็อกอินเอง และบอกเจ้าของงานว่า "spec ใน smoke ไม่ได้ใช้บัญชี creatorC2/fixtureOwnerF1 จึงไม่ต้องล็อกอินเพิ่ม" จากการ
grep ชื่อใน specs/fixtures เท่านั้น แต่ fixture self-heal (`fixtures/test.ts:173` → `setup/mint.ts`) เรียก `mintState` ทุกครั้งที่
state ของบัญชีใดหายหรือใช้ไม่ได้ และตารางบัญชีผูกทุก env กับบัญชี dev จึงยิงรหัสผ่าน dev เข้า sign-in ของ training69 37 ครั้ง
(fixtureOwnerF1 30 · creatorC1 7) ทุกครั้งได้ 401 · แก้แล้วด้วย guard ใน `mintState` ที่ปฏิเสธบน training ก่อนอ่าน credential
ใดๆ + gate `gate:nomint` ที่รันพิสูจน์สองทาง

---

## 1. ปัญหา (Problem Statement)

- `run.log` ของรอบ `training69-smoke-2026-09-21` มี `login-with-email fixtureOwnerF1 → HTTP 401` 30 บรรทัด และ
  `login-with-email creatorC1 → HTTP 401` 7 บรรทัด — timestamp ฝั่ง server ไม่ซ้ำกัน 37 ค่า (`"path":"/auth/login-with-email"`)
- บรรทัดที่ยิง: `tests/e2e/setup/mint.ts` (`login.fillCredentials(email, password)` → submit) เรียกจาก
  `tests/e2e/fixtures/test.ts:173` เมื่อ `openAndCheck` ตอบว่าไม่ได้ล็อกอิน
- ก่อนรัน AI ตอบเจ้าของงานว่าไม่ต้องล็อกอินเพิ่ม โดยอ้าง `grep` ชื่อ `creatorC2|fixtureOwnerF1` ใน `tests/e2e/specs` +
  `tests/e2e/fixtures` ที่เจอแค่คอมเมนต์ — ไม่ได้ไล่ทางที่ fixture เลือกบัญชีผ่าน helper
- ตารางบัญชี `tests/e2e/config/accounts.ts` ไม่แยกตาม env — ทุก env ได้บัญชี dev pool

**สิ่งที่ควรจะเป็น:** AI ไม่ล็อกอินด้วยรหัสผ่านไม่ว่ากรณีใด (กฎความปลอดภัยของเซสชัน · memory
`feedback_no-scripted-password-login-for-agents`) — บน training session มาจากคนเก็บด้วยมือเท่านั้น state ที่หายหรือหมดอายุต้องทำให้
เคส fail ไม่ใช่ล็อกอินเอง · ข้ออ้างเชิงลบ ("ไม่ได้ใช้ X") ต้องแนบคำสั่งค้น + ขอบเขต (CLAUDE.md §0)

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-21 ~18:05 | เจ้าของงานล็อกอินเก็บ session 5 บัญชี training69 ด้วยมือ · `session_verify.js` 5/5 ok |
| ก่อนรัน | AI เสนอเปิดหน้าต่างล็อกอินเพิ่มสำหรับ creatorC2/fixtureOwnerF1 · เจ้าของงานเลือกข้อนั้น |
| ก่อนรัน | **AI ตอบว่าไม่ต้องล็อกอินเพิ่ม เพราะ spec ไม่ได้ใช้ 2 บัญชีนั้น — จาก grep ชื่อเท่านั้น** แล้วสั่งรัน `--no-deps` |
| 18:08:58 | 401 ครั้งแรกของ `fixtureOwnerF1` บน training69 (timestamp ฝั่ง server) |
| 18:12:59 | รอบจบ: 86 passed · 25 failed · 15 skipped |
| หลังจบ | AI เห็น `mint.ts:86` ใน log ขณะอ่านผล → นับ 37 ครั้ง → แจ้งเจ้าของงานก่อนรายงานผล + แถว OPEN ใน PENDING.md |
| หลังจากนั้น | guard + gate เขียว (`57889a8` บน branch `fix/training-never-mint` ใน ols-qa-e2e) |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไมมีการล็อกอินด้วยรหัสผ่านบน training69?** — เพราะ fixture self-heal เรียก `mintState` เมื่อ state ของ fixtureOwnerF1
   ไม่มี session training และเมื่อ creatorC1 ถูกตัดสินว่าไม่ได้ล็อกอิน
2. **ทำไม `--no-deps` ไม่กัน?** — เพราะ `--no-deps` ตัดแค่ setup project ส่วน self-heal อยู่ใน fixture ที่ทุกเคสใช้ AI คิดว่าการ
   ข้าม setup = ไม่มีการล็อกอิน โดยไม่ได้อ่านว่า `mintState` ถูกเรียกจากที่ไหนบ้าง
3. **ทำไม AI ถึงบอกว่า 2 บัญชีนั้นไม่ถูกใช้?** — เพราะค้นแค่ชื่อบัญชีในโฟลเดอร์ specs/fixtures แล้วสรุปเป็นข้อเท็จจริง ทั้งที่
   เคสเลือกบัญชีผ่าน helper/ข้อมูล fixture ที่ไม่ได้เขียนชื่อบัญชีตรงๆ — ข้ออ้างเชิงลบที่ขอบเขตการค้นแคบกว่าสิ่งที่อ้าง
4. **ทำไม self-heal ล็อกอินด้วยบัญชี dev บน training ได้?** — เพราะ `accounts.ts` ผูกทุก env กับบัญชี dev pool และ `mintState`
   ไม่มีเงื่อนไขเรื่อง env เลย
5. **ทำไมไม่มีอะไรบังคับ?** — root cause: ชุดเทสต์ไม่มีแนวคิด "env ที่ห้ามล็อกอินด้วยเครื่อง" — การไม่ยิงรหัสผ่านบน training
   พึ่งความระวังของคนสั่งรันล้วนๆ ขณะที่ทางล็อกอินอัตโนมัติเปิดอยู่ทุก env

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** `require_target.js` (ปฏิเสธ host ที่มีคำว่า training) ครอบแค่เครื่องมือใน
`ols-qa-testing-bot/capture/` ไม่ครอบชุดเทสต์ · `@safe` write-block บล็อกเฉพาะการเขียนข้อมูลคอนเทนต์ ไม่ได้บล็อก POST ล็อกอิน ·
hook ของ ols-qa ไม่ได้ดูคำสั่ง `playwright test` · ไม่มีชั้นไหนครอบ `mintState` บน training เลย

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่มีบัญชีใดเข้าระบบได้ (401 ทั้ง 37 ครั้ง เพราะบัญชี dev ไม่มีบน training69) · ไม่มีการเขียนข้อมูล · มีคำขอ login ที่ล้มเหลว 37 รายการใน log ฝั่ง training69 |
| เจ้าของงาน | ต้องอ่านเหตุการณ์และตัดสินใจเพิ่ม · ผลรอบนี้ 10+ เคสเป็นผลจากบัญชี ไม่ใช่ตัวแอป |
| ข้อมูล / ระบบ | ไม่มีข้อมูลเสียหาย · ไม่มีบัญชีถูกล็อก (บัญชีที่ยิงไม่มีอยู่บน env นั้น) |
| ความเชื่อถือของงานรอบนั้น | 86 เคสที่ผ่านยังใช้ได้ (ใช้ session ที่คนเก็บ) · เคสที่ fail ต้อง triage ใหม่ทุกเคส — กำลังทำจากไฟล์ผล ไม่รันซ้ำ |

---

## 5. แนวทางการแก้ไข (Fix)

- `tests/e2e/setup/mint.ts` — `mintState` โยน error บน `TARGET_ENV === 'training'` ก่อนอ่าน credential/เปิด context ใดๆ พร้อมบอกให้
  เก็บ session ด้วยมือแทน (commit `57889a8`, ols-qa-e2e branch `fix/training-never-mint`)
- `scripts/ci-assert-training-never-mints.ts` + `npm run gate:nomint` — รัน `mintState` จริงใน 3 โปรเซส: training ต้องปฏิเสธ ·
  dev และ preprod ต้องไม่ถูก guard นี้ปฏิเสธ

**ยืนยันแล้วด้วย:** `npm run gate:nomint` → `OK — training refuses before reading a credential; dev and preprod are not refused
(3 probes)` · ถอด guard ชั่วคราว → gate `FAILED — training must refuse … got other:[secrets]` (กลายพันธุ์ถูกจับ) แล้วคืนโค้ด ·
`npx tsc --noEmit` ผ่าน · `npx eslint` ผ่าน

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `mintState` ปฏิเสธบน training ก่อนอ่าน credential | เครื่องมือ | ทำแล้ว (`57889a8`) |
| P2 | `gate:nomint` รันพิสูจน์สองทาง + ผ่านการทดสอบกลายพันธุ์ | เทส | ทำแล้ว · ยังไม่ได้ต่อเข้า CI (แก้ workflow ต้องถามเจ้าของงาน) |
| P3 | ข้ออ้างเชิงลบเรื่อง "เคสไม่ใช้บัญชี X" ต้องมาจากการนับบัญชีที่ใช้จริงต่อเคส (ผลรัน/`run.json` หรือไล่ทางเรียก `openAuthed`) ไม่ใช่ grep ชื่อ | กฎ | ทำแล้ว — ในรายงานนี้ + archive |
| P4 | แยกตารางบัญชีตาม env ใน `accounts.ts` (training ใช้บัญชี `*_training`) | เครื่องมือ | ค้าง — แตะ config ร่วม ต้องถามเจ้าของงาน |

**กฎที่เพิ่มจากเหตุนี้:** ก่อนรันชุดเทสต์บน env ที่ห้ามล็อกอินด้วยเครื่อง ต้องหาทุกทางที่ไปถึงการล็อกอิน (setup project **และ**
self-heal ใน fixture) ไม่ใช่แค่ทางที่เห็นชัด · และการ "ข้ามขั้น" ด้วยธงของเครื่องมือ ไม่ใช่หลักฐานว่าพฤติกรรมข้างในหายไป —
ต้องมี guard ที่รันพิสูจน์ได้ ซึ่งตอนนี้คือ `gate:nomint`

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** AI เองขณะอ่านผล — เห็น `at setup/mint.ts:86` ใน log แล้วนับบรรทัด 401
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** หลังรอบจบ (~4 นาทีหลังครั้งแรก) — ระหว่างรันไม่มีอะไรหยุดมัน
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** guard ใน `mintState` หยุดตั้งแต่ครั้งแรกและทำให้เคสนั้น fail ด้วยข้อความที่บอกทางแก้

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- แจ้งเจ้าของงานก่อนรายงานตัวเลขผล และเปิดแถว OPEN ในเทิร์นเดียวกัน
- แก้ด้วย guard ที่ตำแหน่งเดียวที่ทุกทางล็อกอินต้องผ่าน (`mintState`) แทนการไล่ปิดทีละผู้เรียก

### สิ่งที่ต้องปรับปรุง
- ถ้าอ่าน `fixtures/test.ts` ว่า `mintState` ถูกเรียกจากไหนก่อนตอบว่า "ไม่ต้องล็อกอินเพิ่ม" เหตุนี้จะไม่เกิด
- ตอนที่เจ้าของงานปฏิเสธขั้นตอนตัดรหัสผ่านออกจากที่เก็บ secrets ชั่วคราว AI ควรถามทางกันแบบอื่นก่อนรัน แทนที่จะรันโดยไม่มีตัวกัน

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | guard `mintState` บน training + `gate:nomint` | Claude | High | Done (`57889a8`) |
| 2 | เปิด PR ของ branch `fix/training-never-mint` | Claude (รอเจ้าของงานสั่ง) | High | Open |
| 3 | ต่อ `gate:nomint` เข้า CI | เจ้าของงานตัดสิน | Medium | Open |
| 4 | ตารางบัญชีแยกตาม env สำหรับ training | เจ้าของงานตัดสิน | Medium | Open |
| 5 | triage 25 เคสที่ไม่ผ่านจากไฟล์ผล | Claude | High | Open (กำลังทำ) |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน (ols-qa-e2e):**
- `tests/e2e/setup/mint.ts` — guard ปฏิเสธบน training
- `scripts/ci-assert-training-never-mints.ts` — gate ใหม่
- `package.json` — `gate:nomint`

**Commit:** `57889a8` (ols-qa-e2e, branch `fix/training-never-mint`)

**หลักฐาน:**
```
   7 login-with-email creatorC1 → HTTP 401
  30 login-with-email fixtureOwnerF1 → HTTP 401
[training-never-mints] OK — training refuses before reading a credential; dev and preprod are not refused (3 probes).
```
