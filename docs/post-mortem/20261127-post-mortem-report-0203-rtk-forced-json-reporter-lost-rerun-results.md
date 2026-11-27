# Post-Mortem Report #0203 — rtk เปลี่ยน reporter ของ Playwright เป็น JSON บน stdout จนผลรันซ้ำ 12 เคสหาย

**ระบบ:** OLS QA workspace — ชุด E2E (`ols-qa-e2e`) ที่รันผ่าน Bash ของ Claude Code (มี rtk hook)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** dev (รันซ้ำเคส blocked จาก Qase run 11) · ไม่มีผลใดถูกส่งออกไป Qase / Jira / Discord
**วันที่เกิดเหตุ:** 2026-11-27
**วันที่ค้นพบ:** 2026-11-27
**วันที่จัดทำรายงาน:** 2026-11-27
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Low — ไม่มีผลผิดหลุดไปถึงใคร เพราะจับได้ก่อนรายงาน แต่เสียรอบรัน 10 นาทีบน dev และต้องรันซ้ำ
**ประเภท:** เฟลเงียบ / ทำผิดขั้นตอนที่บันทึกไว้แล้ว
**ผิดซ้ำจาก:** #0178 (rtk เขียน `npx` ใหม่) · คลาส #0051 / #0093 / #0116 / #0119 (output ที่ rtk เขียนใหม่ให้คำตอบผิดแบบเงียบ) · memory `reference_rtk-buffers-long-running-runs` ข้อ 14/Oct ที่บันทึกอาการนี้ไว้ตรงตัว

---

## สรุปสั้น (Executive Summary)

ตอนรันซ้ำ 12 เคส blocked ที่เจ้าของงานอนุมัติ (AXX-007/008, LSX-012, MMG×7) ผมสั่ง `npx playwright test --grep … ` ผ่าน Bash แบบ background
พร้อม `E2E_RUN_DIR` ให้ผลไปลงโฟลเดอร์แยก rtk hook เขียนคำสั่งใหม่ให้ใช้ `--reporter=json` ส่งไป stdout ซึ่ง **แทนที่ reporter ทั้งหมดใน
`playwright.config.ts`** (json file + html) โฟลเดอร์รันจึงไม่มี `results.json` และ stdout ถูก tee ของ rtk ตัดที่ 1,048,576 ไบต์
ผล 10 นาทีนั้นใช้ไม่ได้ทั้งรอบ memory 14/Oct บันทึกอาการเดียวกันและวิธีแก้ (`rtk proxy`) ไว้แล้ว แต่ผมไม่ได้เปิดดูก่อนรัน
แก้แล้วโดยรันซ้ำผ่าน `rtk proxy npx playwright test …` มาตรการใหม่ที่เสนอเป็นชั้นเครื่องมือ (config ปฏิเสธ `--reporter` จาก CLI
เมื่อกำหนดไฟล์ผล) ยังรอเจ้าของงานอนุมัติ

---

## 1. ปัญหา (Problem Statement)

- คำสั่งที่ผมพิมพ์: `E2E_RUN_DIR=<run dir> TARGET_ENV=dev npx playwright test --grep "(AXX-00[78]|LSX-012|MMG-00[12356]|MMG-008|MMG-108)\b"`
- output ที่ได้ขึ้นต้นด้วย JSON ของ config และ `[RTK:PASSTHROUGH] Output truncated (62934403 chars → 2000 chars)` ตามด้วย `playwright exit=1`
- โฟลเดอร์รันมีแค่ `console.log` + `test-results/` (`ls -la` 14:37) — ไม่มี `results.json` ไม่มี `report/`
  ทั้งที่ `tests/e2e/config/runDir.ts:20-24` กำหนดให้ `E2E_RUN_DIR` set → `results.json` + `report/` อยู่ในโฟลเดอร์นั้น
- สำเนาเต็มที่ rtk เก็บ (`~/Library/Application Support/rtk/tee/<id>_playwright.log`) ขนาด 1,048,612 ไบต์ ลงท้าย
  `--- truncated at 1048576 bytes ---` → `JSON.parse` ล้ม (`Unexpected EOF`)

**สิ่งที่ควรจะเป็น:** ทุก Playwright run ที่ผลต้องใช้ ต้องรันผ่าน `rtk proxy npx playwright test …` แล้วยืนยันว่าไฟล์ JSON มีอยู่และ parse
ได้ก่อนรายงาน — memory `reference_rtk-buffers-long-running-runs` ข้อ 14/Oct ("How to apply")

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (วัดจาก mtime) | เหตุการณ์ |
|------|-----------|
| 2026-11-27 14:27 | เริ่มรัน 12 เคสบน dev (โฟลเดอร์ `blocked-rerun-20261127` สร้าง) โดยไม่มี `rtk proxy` |
| 14:37 | รันจบ (`console.log` mtime) — output เป็น JSON ที่ถูกตัด, `playwright exit=1` |
| 14:37–14:39 | ผมพยายาม parse สำเนา tee → `Unexpected EOF` · ตรวจ `runDir.ts` และ `.env` ไม่พบ `E2E_JSON_OUT` · สรุปว่า rtk บังคับ `--reporter=json` |
| 14:39 | เริ่มรันซ้ำผ่าน `rtk proxy` (โฟลเดอร์ `blocked-rerun-20261127b`) · แจ้งเจ้าของงานในแชทว่าเป็นการผิดซ้ำ |
| 14:50 | เจ้าของงานสั่งเขียน post-mortem |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

rtk hook (PreToolUse ระดับ global) เขียนคำสั่ง `npx playwright test` ใหม่เพื่อลด token และใส่ `--reporter=json` ให้ Playwright
ตาม semantic ของ Playwright, `--reporter` จาก CLI **แทนที่** รายการ `reporter` ใน config ทั้งหมด ไม่ได้เพิ่ม — json reporter ที่ไม่มี
`outputFile` เขียนลง stdout, rtk เก็บ stdout ไว้จนจบ แล้วตัด tee ที่ 1 MiB

### 5 Whys

1. **ทำไมผลรันซ้ำหาย?** — เพราะไม่มี `results.json` และ stdout ที่เป็น JSON ถูกตัดที่ 1 MiB
2. **ทำไมไม่มี `results.json`?** — เพราะ rtk ใส่ `--reporter=json` ทาง CLI ซึ่งแทนที่ reporter ใน config รวมถึง json file reporter ของ `runDir.ts`
3. **ทำไมคำสั่งถูก rtk เขียนใหม่?** — เพราะผมพิมพ์ `npx playwright test` ตรงๆ ไม่ใช่ `rtk proxy npx playwright test`
4. **ทำไมผมไม่ใช้ `rtk proxy` ทั้งที่ memory บันทึกไว้?** — เพราะไม่ได้เปิด memory rtk ก่อนรัน · ชื่อ memory ("buffers long-running runs") และ
   บรรทัดดัชนีไม่ได้บอกเรื่อง reporter ถูกแทนที่ · และไม่มีอะไรบังคับตอนรัน: กฎอยู่ในความจำเท่านั้น
5. **ทำไมไม่มีอะไรบังคับ?** — มาตรการของ #0178 และ memory 14/Oct เป็น "คำเตือน" ทั้งคู่ ไม่มีชั้นเครื่องมือที่ทำให้ run ที่ถูกเขียน reporter ใหม่
   **ล้มดังตั้งแต่วินาทีแรก** — root cause ของคลาสนี้คือ config ยอมรับ `--reporter` จาก CLI ทับไฟล์ผลที่ run ประกาศไว้ (E2E_RUN_DIR / E2E_JSON_OUT) แบบเงียบ

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- memory 14/Oct — เป็นข้อความ ไม่ถูกโหลดอัตโนมัติตอนรัน (ดัชนีเป็นชื่อสั้น)
- #0178 — ปิดเฉพาะกรณี `npx` เรียกผิด binary ไม่ครอบคลุม reporter
- `playwright.config.ts` — ไม่ตรวจว่า reporter ถูกแทนที่
- ผมเองตรวจ "ไฟล์ JSON มีอยู่และ parse ได้" ก่อนรายงาน — ชั้นนี้ทำงาน (จับได้ก่อนส่งผลไป Qase) แต่จับได้หลังเสียรอบรันแล้ว

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — รันบน dev ผลไม่ได้ถูกส่งออก |
| เจ้าของงาน | ผลเคส blocked ช้าไป ~12 นาที (14:27 → 14:39 เริ่มใหม่) · เจ้าของงานถามสถานะระหว่างนั้น |
| ข้อมูล / ระบบ | เคส MMG ที่เขียนข้อมูลรัน 2 รอบบน dev — ข้อมูลทดสอบบน dev เพิ่มเป็น 2 ชุด (dev อนุญาตให้เตรียม/เขียนข้อมูลทดสอบ) |
| ความเชื่อถือของงานรอบนั้น | ผลรอบแรกทิ้งทั้งหมด · ใช้เฉพาะรอบ `rtk proxy` ที่มี `results.json` |

---

## 5. แนวทางการแก้ไข (Fix)

- รันซ้ำด้วย `E2E_RUN_DIR=<run dir> TARGET_ENV=dev rtk proxy npx playwright test --grep …` (โฟลเดอร์ `blocked-rerun-20261127b`, 14:39)
- ก่อนใช้ผล: ยืนยันว่า `<run dir>/results.json` มีอยู่และ `JSON.parse` ผ่าน

**ยืนยันแล้วด้วย:** การยืนยันไฟล์ผลของรอบใหม่ทำเมื่อรันจบ (ดู Action item 1)

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

ผิดซ้ำ → มาตรการต้องเป็นชั้นใหม่ที่แข็งกว่าคำเตือน

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `ols-qa-e2e/playwright.config.ts`: เมื่อ `E2E_RUN_DIR` หรือ `E2E_JSON_OUT` ถูกตั้ง และ `process.argv` มี `--reporter` → `throw` ทันทีพร้อมข้อความ "reporter ถูกแทนที่จาก CLI (rtk?) — ใช้ `rtk proxy`" · run ล้มก่อนเปิด browser ไม่เสียรอบ · ต้องมี SDD + เทสต์ | เครื่องมือ (config guard) | ค้าง — รอเจ้าของงานอนุมัติ |
| P2 | rtk registry: passthrough สำหรับ `npx playwright test` / `playwright test` (เหมือนที่ปล่อย `npm test` ผ่านอยู่แล้ว) | เครื่องมือ (global) | ค้าง — แตะ global tool ต้องถามเจ้าของงานก่อน (กฎ global ข้อ 23) |
| P3 | แก้ชื่อ/คำอธิบาย memory rtk ให้บอกอาการ "reporter ถูกแทนที่ → ไม่มีไฟล์ผล" ในบรรทัดดัชนี | memory | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** ไม่มีกฎข้อความใหม่ — กฎ `rtk proxy` มีอยู่แล้วใน memory การเพิ่มคำเตือนซ้ำไม่นับเป็นการป้องกัน มาตรการจริงคือ P1/P2

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** ผมเองตอนจะ parse ผล — ไม่มี `results.json` ในโฟลเดอร์รัน และสำเนา tee parse ไม่ได้
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** 10 นาที (14:27 → 14:37) คือเวลารันทั้งรอบ
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 — config ล้มในวินาทีแรกเมื่อ reporter ถูกแทนที่

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ไม่รายงานตัวเลขจาก output ที่ถูกตัด · ตรวจไฟล์ผลก่อน · หาเหตุจาก `runDir.ts` + `.env` แทนการเดา แล้วรันใหม่ทันที

### สิ่งที่ต้องปรับปรุง
- ก่อนรัน Playwright ที่ผลต้องใช้ ต้องเปิด memory เครื่องมือที่เกี่ยวข้อง (rtk) — แต่ข้อนี้คือคำเตือน ชั้นที่แก้จริงคือ P1/P2

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ยืนยัน `results.json` ของรอบ `rtk proxy` แล้วส่งผลเข้า Qase ตาม `report:qase` | Claude | High | Open |
| 2 | ขออนุมัติ P1 (config guard ใน ols-qa-e2e) | Claude → เจ้าของงาน | Medium | Open |
| 3 | ขออนุมัติ P2 (rtk passthrough สำหรับ playwright) | Claude → เจ้าของงาน | Medium | Open |
| 4 | P3 อัปเดตบรรทัดดัชนี memory rtk | Claude | Low | Done |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `docs/post-mortem/20261127-post-mortem-report-0203-rtk-forced-json-reporter-lost-rerun-results.md` — รายงานนี้
- `docs/post-mortem/PENDING.md`, `docs/post-mortem/README.md`, `docs/CLAUDE-ARCHIVE.md` — แถว/สรุป

**หลักฐาน:**
```
[RTK:PASSTHROUGH] Output truncated (62934403 chars → 2000 chars)
playwright exit=1
-rw-r--r--  1048612  …/rtk/tee/<id>_playwright.log
--- truncated at 1048576 bytes ---
SyntaxError: JSON Parse error: Unexpected EOF
tests/e2e/config/runDir.ts:23  jsonFile: env.E2E_JSON_OUT ?? (dir ? join(dir, 'results.json') : 'test-results/results.json'),
```
