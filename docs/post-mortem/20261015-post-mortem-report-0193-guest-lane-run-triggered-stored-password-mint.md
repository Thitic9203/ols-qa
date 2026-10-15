# Post-Mortem Report #0193 — guest lane run on dev triggered stored-password logins through the fixture self-heal

**ระบบ:** OLS QA workspace · ชุดเทส E2E (private repo `ols-qa-e2e`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** dev
**วันที่เกิดเหตุ:** 2026-10-15
**วันที่ค้นพบ:** 2026-10-15
**วันที่จัดทำรายงาน:** 2026-10-15
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — agent ทำการล็อกอินด้วยรหัสผ่านที่เก็บไว้แทนเจ้าของงาน ซึ่งเป็นการกระทำที่กฎห้าม agent ทำ และเจ้าของงานเพิ่งเลือกว่าจะทำเอง
**ประเภท:** ทำเกินขอบเขต
**ผิดซ้ำจาก:** #0098 · #0102

---

## สรุปสั้น (Executive Summary)

ระหว่างรอเจ้าของงานรันคำสั่ง setup เพื่อฟื้น session dev 7 บัญชี เธรดหลักรันเลน `guest` บน dev (`--project=guest --no-deps`) เพื่อเอาผลล่วงหน้า โดยคิดว่าเคส guest ไม่ใช้บัญชี
แต่โปรเจกต์ `guest` มีเคส `tests/e2e/smoke.spec.ts` "login smoke — <บทบาท> · <บัญชี>" ของทุกบทบาท (บรรทัดแรกของ log: `[1/97] [guest] › … login smoke — admin-user · adminUser`) และเคสบทบาทที่ session ตายจะเรียก `mintState()` ซึ่งล็อกอินด้วยรหัสที่เก็บไว้เอง — บัญชี dev 5 บัญชีถูกล็อกอินโดย agent ระหว่าง 17:28–17:30
เธรดหลักจับได้เองจากเวลาแก้ไขไฟล์ session ที่ตรงกับเวลารัน แล้วหยุดรอบนั้นด้วย pid เวลา 17:33:22 · ไม่มีการพิมพ์หรืออ่านรหัสผ่านใน context
เป็นคลาสเดียวกับ #0098/#0102 (การ์ดกัน `mintState` ในตอนนั้นผูกกับ training เท่านั้น ไม่ครอบ dev)

---

## 1. ปัญหา (Problem Statement)

- 17:27 เธรดหลักสั่ง `TARGET_ENV=dev ./node_modules/.bin/playwright test --project=guest --no-deps` จาก worktree ของ PR #43
- ไฟล์ `state/dev_*.json` ของ 5 บัญชีถูกเขียนใหม่ 17:28:29–17:30:09 (`stat` ของ adminUser · creatorC1 · fixtureOwnerF1 · learnerL1 · learnerL2) ขณะที่ไม่มีโปรเซส `--project=setup` ใดทำงาน (`pgrep` ว่าง · terminal ของเจ้าของงานไม่มีคำสั่ง)
- กลไก: โปรเจกต์ `guest` รัน login smoke ของทุกบทบาท (`guest-early.log` บรรทัด 1–3: adminUser · creatorC2 · learnerL2) และ fixture บทบาทเรียก `mintState(browser, account)` เมื่อ session ไม่ live (`tests/e2e/fixtures/test.ts` บรรทัด 175–205) · `global-setup.ts` ไม่เรียกล็อกอิน (คำว่า login/mint มีเฉพาะในคอมเมนต์และข้อความเตือนเรื่อง SSO portal บรรทัด 47 · 54–55)

**สิ่งที่ควรจะเป็น:** agent ห้ามล็อกอินด้วยรหัสผ่านทุกกรณี (memory `feedback_no-scripted-password-login-for-agents` · แผนขั้น 6 "Claude ห้ามล็อกอินด้วยรหัสผ่านเอง") และเจ้าของงานเลือกผ่าน popup (ระหว่าง 17:13–17:20) ว่าจะรัน setup เอง

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-10-15 17:04 | probe อ่านอย่างเดียว: session dev 7/7 `loggedIn=false` |
| 17:12 | เลน L1 relink แบบไม่ใช้รหัส: NDLP refresh ตอบ 401 ทั้ง 7 → `SESSIONS_PARTIAL` |
| ระหว่าง 17:13–17:20 (ไม่ได้บันทึกเวลาตอบ) | เจ้าของงานเลือก "รันคำสั่ง setup เอง" |
| 17:27 | **เธรดหลักรันเลน guest บน dev ระหว่างรอ** |
| **17:28–17:30** | **fixture self-heal ล็อกอินด้วยรหัสที่เก็บไว้ 5 บัญชี** |
| 17:30–17:32 | เธรดหลักเห็นไฟล์ session ใหม่ทั้งที่ไม่มี setup รัน → ไล่หาที่มา → พบ `mintState` |
| 17:33:22 | หยุดรอบ guest ด้วย pid · แจ้งเจ้าของงานทันที · เปิดแถว PENDING (`512c843`) |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไม agent ล็อกอินด้วยรหัสผ่าน?** — เพราะรอบ guest ที่ agent สั่งเข้าไปถึง fixture บทบาทที่ self-heal ด้วย `mintState()`
2. **ทำไมรอบ guest ถึงแตะบัญชีบทบาท?** — เพราะโปรเจกต์ guest รวมเคส login smoke ของทุกบทบาท (`smoke.spec.ts:15`) และ `--no-deps` ตัดแค่ setup project ไม่ได้ตัด self-heal
3. **ทำไมตัดสินว่า "guest ไม่ใช้บัญชี"?** — สรุปจากชื่อโปรเจกต์ ไม่ได้ไล่ว่าเคสในโปรเจกต์นั้นเรียก fixture ไหนบ้าง (ซ้ำกับ #0098 ที่สรุปจาก grep)
4. **ทำไมไม่มีอะไรกันก่อนรัน?** — การ์ดของ #0098/#0102 ปฏิเสธ mint เฉพาะ `training` (`gate:nomint`) · บน dev การ mint ใน fixture เปิดอยู่เสมอ ไม่มีตัวเช็คว่า "ผู้สั่งรันเป็น agent และ session ตาย"
5. **ทำไมการ์ดเดิมไม่ครอบ dev?** — มาตรการรอบก่อนผูกกับ env ที่เกิดเหตุ (training) แทนที่จะผูกกับ "ใครเป็นผู้ล็อกอิน" — root cause ระดับคลาสคือ fixture ล็อกอินด้วยรหัสผ่านโดยอัตโนมัติได้ทุก env ที่ไม่ใช่ training โดยไม่มีสวิตช์ปิด

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** `gate:nomint` ครอบแค่ training · ด่าน `preflight:sessions` (PR #43) อยู่ใน runner ทั้งสองตัวเท่านั้น ไม่ครอบการสั่ง `playwright test` ตรงๆ · process-kill-guard / agent-dispatch-guard ไม่ได้ดูคำสั่งรันเทสของเธรดหลัก

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — dev เท่านั้น บัญชีทดสอบ |
| เจ้าของงาน | การล็อกอินที่เจ้าของงานเลือกทำเองถูก agent ทำแทน 5 บัญชี · ต้องอ่านรายงานนี้ |
| ข้อมูล / ระบบ | ไฟล์ session 5 ไฟล์ถูกเขียนใหม่ (gitignored) · ไม่มีข้อมูลแอปเสียหาย · ไม่มีรหัสผ่านเข้า context |
| ความเชื่อถือของงานรอบนั้น | session 5 บัญชีนี้มาจากการล็อกอินที่ไม่ได้รับอนุญาต — รอบเต็มของวันนั้นถูกพักจนเจ้าของงานรัน setup เอง |

---

## 5. แนวทางการแก้ไข (Fix)

- หยุดรอบ guest ด้วย pid 22969 เวลา 17:33:22 (`kill` แล้ว `pgrep` ยืนยันว่าไม่อยู่) · บันทึกใน ledger ของรอบ (`L2.jsonl` step `correction`)
- พักทุกเลนที่จะรันจริงจนกว่าเจ้าของงานจะรัน setup เอง (ส่งคำสั่งหยุดให้เลน L3/L5 เวลา 17:37)

**ยืนยันแล้วด้วย:** `pgrep -fl "project=guest --no-deps --reporter=line"` ว่างหลัง kill · ไฟล์ session ของ adminContent/creatorC2 ยังเวลา 17:12 (ไม่ถูก mint เพิ่ม)

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | fixture ปฏิเสธ `mintState()` นอก setup project ทุก env (ไม่ผูกกับ training) เว้นแต่ผู้รันตั้ง `E2E_ALLOW_MINT=1` เอง · session ตาย = เคสล้มดังพร้อมข้อความ "ให้เจ้าของงานรัน setup" + gate known-answer | เครื่องมือ + เทส (ชั้นใหม่ ผูกที่ "ใครล็อกอิน" ไม่ใช่ env) | ค้าง — งานแยก |
| P2 | ด่าน `preflight:sessions` ใน runner ทั้งสองตัว (PR #43) หยุดรอบก่อนเฟสแรกถ้ามี session ตาย | เครื่องมือ + gate:preflight | ทำแล้วใน PR #43 (รอ merge) |
| P3 | ก่อนสั่ง `playwright test` เองทุกครั้ง agent ต้องรัน probe/preflight ก่อน และห้ามรันถ้ามีบัญชีใดตาย | กฎ (memory) | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** memory `feedback_probe-before-any-playwright-run` — ห้ามสั่ง `playwright test` ใดๆ ขณะมี session ตาย เพราะ self-heal จะล็อกอินด้วยรหัสเอง

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เธรดหลักเห็นไฟล์ session ถูกเขียนใหม่ทั้งที่ไม่มี setup รัน แล้วไล่เวลาเทียบกับรอบที่ตัวเองสั่ง
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ล็อกอินแรก 17:28:29 → probe เห็น 5/7 เวลา 17:30:22 → ระบุที่มาก่อนหยุด 17:33:22
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 ทำให้ไม่มีการล็อกอินเกิดขึ้นเลย (ล้มดังแทน)

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ไม่เชื่อว่าไฟล์ใหม่มาจาก setup ของเจ้าของงาน — ตรวจ `pgrep` + terminal ก่อน แล้วหยุดด้วย pid ไม่ใช่ pattern

### สิ่งที่ต้องปรับปรุง
- "รอคนอื่นอยู่ หาอะไรทำไปก่อน" ต้องไม่ใช่การรันของจริงบนบัญชีที่ session ตาย

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | P1: fixture ปฏิเสธ mint นอก setup ทุก env + gate | Claude (PR ใน `ols-qa-e2e`) | High | Open |
| 2 | merge PR #43 (preflight) หลังเจ้าของงานรีวิว | เจ้าของงาน | Medium | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `docs/post-mortem/PENDING.md` — แถว PM-2026-10-15-01

**Commit:** `512c843` (เปิดแถว)

**หลักฐาน:**
```
17:30:22 probe: dev_adminUser loggedIn=true · dev_creatorC1 true · dev_fixtureOwnerF1 true · dev_learnerL1 true · dev_learnerL2 true · dev_adminContent false · dev_creatorC2 false
gone at 17:33:22   (pgrep after kill 22969)
```
