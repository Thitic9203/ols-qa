# Post-Mortem Report #0197 — รันเทสต์โดยไม่ตั้ง TARGET_ENV แล้วระบบเลือก pre-prod ให้เงียบๆ ผลถูกบันทึกเป็นผลบน dev

**ระบบ:** ชุด E2E Playwright (`ols-qa-e2e`) · รอบงานหลายเลน wayfinder-100pct
**สภาพแวดล้อมที่ได้รับผลกระทบ:** pre-prod (อ่านอย่างเดียว) · ledger ของเลนใน `ols-qa-evidence` · PR ใน `ols-qa-e2e`
**วันที่เกิดเหตุ:** 2026-10-22
**วันที่ค้นพบ:** 2026-10-22
**วันที่จัดทำรายงาน:** 2026-10-22
**ผู้จัดทำ:** Claude (เลน L6 ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — รอบนี้กำหนดให้รันบน dev เท่านั้น แต่ 25 การรันไปที่ pre-prod และ PR 2 ใบถูก merge ด้วยหลักฐานที่มาจาก pre-prod ทั้งที่ ledger เขียนว่า dev · ไม่มีการเขียนข้อมูลลงแอป pre-prod
**ประเภท:** เฟลเงียบ / gate เขียวทั้งที่วัดไม่ครบ / ค่าเริ่มต้นของ env ไม่ปลอดภัย
**ผิดซ้ำจาก:** #0009

---

## สรุปสั้น (Executive Summary)

`normalizeEnv()` ใน `tests/e2e/config/env.ts` ของ `ols-qa-e2e` คืนค่า `'preprod'` เมื่อไม่ได้ตั้ง `TARGET_ENV` (มีมาตั้งแต่ commit `ad4f4a0` 2026-08-09) และ `.env.example:10` ตั้ง `TARGET_ENV=preprod`
วันที่ 22/Oct เลน L2 และ L3 รันโดยไม่ได้ใส่ `TARGET_ENV=dev` การรัน 25 ครั้ง (L2 8 · L3 17) จึงไปที่ pre-prod โดยไม่มีอะไรหยุด แต่ ledger บันทึกว่า `dev-run`
PR #170 และ #174 ถูก merge ด้วยหลักฐานชุดนั้น เลน L2 จับได้เองเวลา 10:00:32 (+07) ทุกเลนตรวจ log ย้อนหลัง แล้ว PR #175 (merge `c251a47` 10:11:33) ทำให้ `env.ts` หยุดรันทันทีเมื่อไม่ได้ตั้ง `TARGET_ENV`
รันซ้ำบน dev แล้ว: L2 ผ่าน 20/20 · L3 ผ่าน 187/192 (5 ครั้งที่ไม่ผ่านกำลังสืบหาสาเหตุ ดู §9)

---

## 1. ปัญหา (Problem Statement)

- `ols-qa-e2e` ก่อนแก้ (`c251a47^1`) `tests/e2e/config/env.ts:8-11` — `normalizeEnv()` คืน `'preprod'` เมื่อค่าไม่ใช่ `dev|training|preprod` รวมกรณีไม่ได้ตั้ง · `.env.example:9-10` เขียนว่า `(default: preprod)` และตั้ง `TARGET_ENV=preprod` · `scripts/run-staged.sh:30` กับ `scripts/run-staged-parallel.sh:52` ใช้ `${TARGET_ENV:-preprod}` (ดู `git diff c251a47^1 c251a47`)
- `git log -S'TARGET_ENV=preprod' -- .env.example` → ค่าเริ่มต้นเข้ามาใน `ad4f4a0` (2026-08-09 18:56:54 +0700 · Phase 0 scaffold) และถูกเอาออกใน `056d50f` (2026-10-22 10:10:40 +0700)
- `runs/wayfinder-100pct/preprod-audit.jsonl` บรรทัด 2 (`ols-qa-evidence` · 2026-10-22T03:01:31Z): log ที่มี `env=preprod` — L1 0 · L2 8 · L3 17 (b23b ×4 · b23c ×4 · b24 ×4 · p2-cnt106 ×5) · L4 0 · L6 0 · ทุกเคสที่รันติด tag `@safe` (untagged 0)
- `lanes/L3.jsonl` แถว `dev-run-start` 02:29:07Z, `dev-run` 02:44:56Z และ `dev-run` 02:53:22Z บันทึกว่าเป็นการรันบน dev แต่แถว `correction` 03:02:26Z ระบุว่า "every L3 run this session … ran env=preprod (global-setup line), TARGET_ENV unset"
- `lanes/L2.jsonl` แถว `root-cause` 02:51:25Z เขียนว่า "MMG-119 preprod mobile" แถว `runs` 02:56:22Z เขียนว่า "preprod, retries 0 workers 1 …" แปลว่ามีคำว่า pre-prod อยู่ใน ledger ก่อนที่เลนจะรู้ตัว 9 นาที
- `gh pr view` ใน `ols-qa-e2e`: #170 merge 2026-10-22T02:47:26Z (หลักฐานคือ L3 b23b/b23c ที่รันบน pre-prod) · #174 merge 03:00:17Z (หลักฐานคือ L2 fix runs บน pre-prod · แถว `env-correction` ตามมา 03:00:32Z หลัง merge 15 วินาที)

**สิ่งที่ควรจะเป็น:** รอบ wayfinder-100pct รันบน dev เท่านั้น — `runs/wayfinder-100pct/LANE_BRIEF.md:27` กำหนดคำสั่งเป็น `TARGET_ENV=dev … playwright test …` และเครื่องมือที่ยิงออกนอกเครื่องต้องไม่เลือก env ให้เองเมื่อไม่ได้ระบุ (บทเรียน #0009: ค่าเริ่มต้นของสคริปต์พา probe ไปที่ training)

---

## 2. ไทม์ไลน์ (Timeline)

เวลาทั้งหมดเป็น +07 แปลงจาก timestamp ของ ledger (Z) และ git

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-08-09 18:56:54 | `ad4f4a0` scaffold ใส่ค่าเริ่มต้น `preprod` ใน `env.ts` และ `.env.example` |
| 2026-10-22 09:29:07 | L3 `dev-run-start` b23b — รันแรกที่ไม่ได้ตั้ง `TARGET_ENV` (setup project สร้างไฟล์ session ของ pre-prod ใหม่ 6 ไฟล์ตอน 09:29) |
| 09:44:56 | L3 บันทึก `dev-run` b23c 18 เคสผ่าน — จริงๆ คือ pre-prod |
| **09:47:26** | **PR #170 ถูก merge ด้วยหลักฐานจาก pre-prod** |
| 09:49:32 | L2 `diag-run` ครั้งแรก (pre-prod) |
| 09:51:25 | L2 เขียน "preprod mobile" ใน ledger แต่ยังไม่หยุด |
| 09:56:22 | L2 บันทึก `runs` "preprod … 4/4 passed" |
| **10:00:17** | **PR #174 ถูก merge ด้วยหลักฐานจาก pre-prod** |
| 10:00:32 | L2 จับได้เอง: แถว `env-correction` "all 8 L2 runs … ran env=preprod … because TARGET_ENV was unset" |
| 10:01:09 | L1 `env-audit`: log ของ L1 ที่มี `env=preprod` = 0 ไฟล์ |
| 10:01:31 | บันทึก root cause และขอบเขตความเสียหายลง `preprod-audit.jsonl` |
| 10:02:26 | L3 `correction` + `preprod-impact`: ไม่มีการเขียนลงแอป มีแค่ไฟล์ session ในเครื่อง |
| 10:04:00 | L2 รันซ้ำบน dev (`TARGET_ENV=dev` · origin/main `fdafac0`): 5 โปรเจกต์ × 4/4 ผ่าน |
| 10:04:50 | L4 `preprod-check`: log 241 ไฟล์ พบ `env=preprod` 0 ไฟล์ · ไฟล์ JSON 5 ไฟล์พิสูจน์ env ไม่ได้ จึงรัน NAV-103 ซ้ำบน dev ได้ผ่าน 2/2 |
| 10:10:40 | commit `056d50f` fix(env): refuse to run without an explicit TARGET_ENV |
| 10:11:33 | PR #175 merge เป็น `c251a47` |
| 10:28 | เจ้าของงานสั่งให้เขียน post-mortem ฉบับนี้ |
| 10:28:38 | L3 `dev-reverify` 24 เคส ×2 ×4 โปรเจกต์บน dev: ผ่าน 187/192 |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไมการรันของ L2/L3 ไปที่ pre-prod?** — เพราะคำสั่งรันไม่ได้ใส่ `TARGET_ENV=dev` และ config ใช้ค่าเริ่มต้น `preprod` (`env.ts:8-11` ก่อนแก้)
2. **ทำไมไม่ได้ใส่ `TARGET_ENV` แล้วไม่มีอะไรหยุด?** — เพราะ `normalizeEnv()` แปลงทั้งค่าว่างและค่าที่ไม่รู้จักเป็น `'preprod'` เงียบๆ ไม่มี error ไม่มีการยืนยัน
3. **ทำไมเลนบันทึกว่าเป็นผลบน dev?** — เพราะแถว ledger เขียนจากสิ่งที่ตั้งใจจะรัน (`dev-run`) ไม่ได้อ่านจากบรรทัด `global-setup env=` ที่ Playwright พิมพ์ออกมาจริง และ L2 เขียนคำว่า preprod ลง ledger ตั้งแต่ 09:51:25 แต่ไม่ได้เทียบกับ env ที่รอบกำหนด
4. **ทำไม PR ที่ใช้หลักฐานจาก pre-prod ถึงผ่าน gate แล้ว merge ได้?** — เพราะ gate ใน CI (tsc · lint · `gate:*`) ตรวจโค้ดกับข้อมูล ไม่ได้ตรวจว่าหลักฐานใน PR มาจาก env ไหน และคน merge เชื่อแถว ledger ที่เขียนว่า dev
5. **ทำไมค่าเริ่มต้นนี้อยู่มาได้ 74 วัน?** — เพราะตอน scaffold (2026-08-09) เป้าหมายหลักของชุดเทสต์คือ regression บน pre-prod จึงใส่เป็นค่าเริ่มต้นเพื่อความสะดวก และไม่มีกฎว่า env ปลายทางต้องระบุเองทุกครั้ง (fail-closed) — เป็นคลาสเดียวกับ #0009 ที่ค่าเริ่มต้นพาเครื่องมือไปอีก env แต่ตอนนั้นแก้แค่ที่สคริปต์ตัวเดียว ไม่ได้ไล่ปิดทั้งคลาส

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `LANE_BRIEF.md:27` บอกให้ใส่ `TARGET_ENV=dev` แต่เป็นแค่ข้อความ ไม่มีอะไรบังคับเมื่อคำสั่งไม่มีค่านี้
- บรรทัด `global-setup env=preprod` พิมพ์ออกมาทุกครั้ง แต่ไม่มีขั้นไหนเทียบกับ env ที่รอบกำหนด
- `@safe` กันการเขียน (ยืนยันแล้วว่าไม่มีการเขียนลงแอป) แต่ไม่ได้กันการเลือก env ผิด
- CI ของ PR ไม่ได้ตรวจที่มาของหลักฐาน

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — pre-prod ไม่ใช่ production และทุกเคสที่รันเป็น `@safe` ไม่มีการเขียนลงแอป (L2 `env-correction` 03:00:32Z: "Pre-prod writes: none saved" · L3 `preprod-impact` 03:02:26Z: "Writes to app: none by test code") |
| เจ้าของงาน | ต้องหยุดแก้ไขรอบงาน และสั่งเขียนรายงานนี้ (10:28) ระหว่างที่ขอให้เร่งงาน |
| ข้อมูล / ระบบ | pre-prod: มีการอ่านหน้า LP manage, คิวแก้ไขสื่อ และเปิด modal ตรวจรายงานแล้วกด Escape (ไม่กดตัดสิน) · ในเครื่อง: ไฟล์ session ของ pre-prod 6 ไฟล์ถูกสร้างใหม่ 09:29 (ไม่เกี่ยวกับ session dev) |
| ความเชื่อถือของงานรอบนั้น | ผลที่ L2/L3 บันทึกว่า "dev" ช่วง 09:29–10:00 ใช้ไม่ได้ 25 การรัน · PR #170 และ #174 ถูก merge ด้วยหลักฐานผิด env · รันซ้ำบน dev แล้ว L2 ผ่าน 20/20 · L3 ผ่าน 187/192 — เคสที่ไม่ผ่านบน dev คือ MLV-115 (tablet-landscape 2/2, mobile-landscape 1/2) · MMG-151 (mobile-landscape 1/2) · PRF-123 (tablet 1/2) · L1 และ L4 ตรวจแล้วไม่มีการรันบน pre-prod (L4 รัน NAV-103 ซ้ำเพราะพิสูจน์จาก log ไม่ได้ และยังรอรัน LSX-005 ซ้ำ) · L5 ไม่อยู่ในแถวขอบเขตความเสียหายของ `preprod-audit.jsonl` |

---

## 5. แนวทางการแก้ไข (Fix)

- `ols-qa-e2e` PR #175 (merge `c251a47`, commit `056d50f`) ตาม SDD `docs/sdd/target-env-required/` (spec · plan · tasks):
  - `tests/e2e/config/env.ts` — `normalizeEnv()` throw `TARGET_ENV must be set to one of dev | preprod | training (it is unset)` เมื่อไม่ได้ตั้งหรือค่าไม่ถูกต้อง (R1 · R2)
  - `.env.example:10` — เปลี่ยนเป็น `# TARGET_ENV=` ไม่มีค่าเริ่มต้น (R3)
  - `scripts/run-staged.sh` · `scripts/run-staged-parallel.sh` — `${TARGET_ENV:?TARGET_ENV is required: dev | preprod | training}` (R4)
  - `scripts/selftest/target-env.selftest.ts` — เทสต์ 43 บรรทัด ครอบคลุม unset · ค่าว่าง · `prod` · `DEV` ต้อง throw และ `dev`/`preprod`/`training` ต้องโหลดได้
- ทุกเลนตรวจ log ย้อนหลังและบันทึกผล (L1 `env-audit` · L2 `env-correction` · L3 `correction`/`preprod-impact` · L4 `preprod-check` · `preprod-audit.jsonl`)
- รันซ้ำบน dev: L2 03:04:00Z 20/20 · L3 03:28:38Z 187/192 · L4 NAV-103 2/2

**ยืนยันแล้วด้วย:** `git diff c251a47^1 c251a47 -- tests/e2e/config/env.ts .env.example scripts/run-staged.sh scripts/run-staged-parallel.sh` (ดู §10) · `gh pr view 175` → `MERGED merged=2026-10-22T03:11:33Z`

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `env.ts` throw เมื่อไม่ได้ตั้ง `TARGET_ENV` หรือค่าผิด — ชั้นใหม่แบบ fail-closed ที่ตัวโหลด config ซึ่งทุกการรัน Playwright ต้องผ่าน (แข็งกว่า #0009 ที่แก้แค่สคริปต์ตัวเดียว) | เครื่องมือ | ทำแล้ว (`c251a47`) |
| P2 | สคริปต์รันทั้ง 2 ตัวหยุดเมื่อไม่ได้ตั้ง env ไม่ default | เครื่องมือ | ทำแล้ว (`c251a47`) |
| P3 | selftest ล็อกพฤติกรรม R1/R2 ไว้ ถ้ามีคนเอาค่าเริ่มต้นกลับมา เทสต์จะแดง | เทส | ทำแล้ว (`scripts/selftest/target-env.selftest.ts`) |
| P4 | แถว ledger ที่อ้างว่ารันบน env ใด ต้องยกบรรทัด `global-setup env=` จาก log มาเป็นหลักฐาน ไม่เขียนจากคำสั่งที่ตั้งใจรัน | กฎ | ค้าง — เสนอเพิ่มใน `LANE_BRIEF.md` ของรอบถัดไป |
| P5 | PR ที่อ้างผลรันต้องแนบบรรทัด env จาก log ก่อน main thread merge | กฎ | ค้าง |

**กฎที่เพิ่มจากเหตุนี้:** `ols-qa-e2e` `docs/sdd/target-env-required/spec.md` R1–R6 (ไม่มีค่าเริ่มต้นของ env ปลายทาง) · กฎ P4/P5 ยังไม่เขียนลงไฟล์ จึงอยู่ใน Action Items

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เลน L2 เห็น baseURL ของ pre-prod ในบรรทัด global-setup ของ log ตัวเอง แล้วบันทึก `env-correction` 03:00:32Z
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** 31 นาที 25 วินาที (รันผิดครั้งแรก 02:29:07Z → จับได้ 03:00:32Z) · PR ผิดหลักฐานถูก merge ไปก่อนแล้ว 2 ใบ
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 ทำให้การรันที่ไม่ระบุ env หยุดตั้งแต่โหลด config — ไม่ต้องรอให้ใครอ่าน log

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ทุกเคสในรอบเป็น `@safe` จึงไม่มีการเขียนลงแอป pre-prod
- พอจับได้ ทุกเลนตรวจ log ของตัวเองและบันทึกผลภายใน 4 นาที 18 วินาที (03:00:32Z → 03:04:50Z) และแก้ที่ต้นเหตุ (fail-closed) ภายใน 11 นาที (merge 03:11:33Z)

### สิ่งที่ต้องปรับปรุง
- ค่าเริ่มต้นของ env ปลายทางควรถูกห้ามตั้งแต่ #0009 ไม่ใช่แก้แค่ที่สคริปต์ตัวเดียว
- คำว่า "preprod" อยู่ใน ledger ของ L2 ตั้งแต่ 02:51:25Z — ถ้าเทียบกับ env ของรอบทุกครั้งที่บันทึกผล จะจับได้เร็วขึ้น 9 นาที และ #174 จะไม่ถูก merge
- การ merge PR ควรอ่าน env จาก log ที่แนบ ไม่ใช่จากชื่อ step ใน ledger

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | `env.ts` fail-closed + เอาค่าเริ่มต้นออกจาก `.env.example` และสคริปต์ | Claude | High | Done (`c251a47`) |
| 2 | รันเคสที่ L2/L3 รันบน pre-prod ซ้ำบน dev | Claude (L2 · L3) | High | Done (L2 20/20 · L3 187/192) |
| 3 | หาสาเหตุ 5 การรันที่ไม่ผ่านบน dev (MLV-115 · MMG-151 · PRF-123) ซึ่ง MMG-151/PRF-123 อยู่บน main แล้วจาก #170 | Claude (L1 · L2 · L5) | High | Open — เริ่มสืบ 05:00–05:01Z ตาม ledger L1/L2/L5 |
| 4 | รัน LSX-005 ซ้ำบน dev (L4 พิสูจน์ env จาก log ไม่ได้) | Claude (L4) | Medium | Open — L4 `rerun-start` 05:01:08Z |
| 5 | P4 + P5: ledger และ PR ต้องยกบรรทัด env จาก log | Claude (main thread) | Medium | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน (`ols-qa-e2e`):**
- `tests/e2e/config/env.ts` — throw เมื่อไม่ได้ตั้งหรือค่าผิด
- `.env.example` — ไม่มีค่าเริ่มต้น
- `scripts/run-staged.sh` · `scripts/run-staged-parallel.sh` — `${TARGET_ENV:?…}`
- `scripts/lib/mcp-tools.ts` — คอมเมนต์ให้ตรงพฤติกรรมใหม่
- `scripts/selftest/target-env.selftest.ts` — เทสต์ใหม่

**Commit:** `056d50f` (merge `c251a47`, PR #175)

**หลักฐาน:**
```
$ git diff c251a47^1 c251a47 -- tests/e2e/config/env.ts
   if (v === 'dev' || v === 'training' || v === 'preprod') return v;
-  return 'preprod';
+  const got = v === undefined || v === '' ? 'it is unset' : `got "${v}"`;
+  throw new Error(

$ git log --format='%h %ci %s' -S'TARGET_ENV=preprod' -- .env.example
056d50f 2026-10-22 10:10:40 +0700 fix(env): refuse to run without an explicit TARGET_ENV
ad4f4a0 2026-08-09 18:56:54 +0700 chore: scaffold ols-qa-e2e Phase 0 — standards Playwright POM skeleton

$ gh pr view <n> --json state,mergedAt   (ols-qa-e2e)
170 MERGED merged=2026-10-22T02:47:26Z
174 MERGED merged=2026-10-22T03:00:17Z
175 MERGED merged=2026-10-22T03:11:33Z

preprod-audit.jsonl:2  logs with env=preprod: L1 0, L2 8, L3 17 ... L4 0, L6 0; every test line tagged @safe (0 untagged)
```
