# Post-Mortem Report #0165 — เลนรีเช็คตัดสินว่าป้ายสถานะทับชื่อสื่อ "ตามดีไซน์" จากคอมเมนต์ในโค้ด โดยไม่ได้เปิด Figma

**ระบบ:** OLS QA workspace — เลนรีเช็คผลที่ไม่ผ่าน (non-pass challenge gate) · testing-ticket Dev
**สภาพแวดล้อมที่ได้รับผลกระทบ:** ไฟล์ผลรีเช็คและคิวรันใหม่ของรอบทดสอบ Dev 1/Oct · ไม่มีการเขียนข้อมูลบน env · ไม่มีอะไรออกไปถึง Jira หรือชีท
**วันที่เกิดเหตุ:** 2026-10-01
**วันที่ค้นพบ:** 2026-10-01
**วันที่จัดทำรายงาน:** 2026-10-01
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Low — แก้ภายใน 1 นาที 41 วินาที ก่อนเลนทดสอบใช้คำสั่งที่ผิด และไม่มีผลใดออกไปถึงปลายทาง แต่ถ้าไม่จับได้ ข้อค้นพบหนึ่งข้อจะหายไปจากผลทดสอบ
**ประเภท:** เดาแล้วพูดเหมือนรู้ (ใช้เจตนาในโค้ดแทนสเปกที่ยืนยันแล้ว)
**ผิดซ้ำจาก:** #0067

---

## สรุปสั้น (Executive Summary)

เลนรีเช็คตรวจ ER4 ของ OLS-325 TC_21 (มือถือ 375×812) ที่ตัวตรวจพบว่าป้าย "เนื้อหานี้ประมวลผลวีดีโอไม่สำเร็จ" ทับชื่อสื่อบนการ์ด แล้วตัดสินว่า "ไม่ใช่ defect · ตามดีไซน์" โดยอ้าง AC_03 ของ OLS-265 และคอมเมนต์/โค้ดใน `content-status-overlay.tsx:21-27` ทั้งที่ AC_03 บอกแค่ว่าการ์ดต้องแสดงข้อความนี้ ไม่ได้บอกตำแหน่ง และยังไม่ได้เปิด Figma ของ OLS-265
เลนเขียนข้อสรุปลง `recheck_325.jsonl` (07:57:15) และสั่งเลนทดสอบในคิวรันใหม่ให้ตัด overlay ออกจากตัวตรวจทับซ้อน (07:57:15) แล้วแก้เองเป็น CONFLICT รอ Figma พร้อมบรรทัด WITHDRAW ในคิว (07:58:56)
ต้นเหตุคือคำสั่งงานของเลนรีเช็คให้อ่านแค่ "Figma notes ที่เลนบันทึกไว้" ไม่มีข้อห้ามสรุปว่า "ตามดีไซน์" โดยไม่ได้เปิด node ของ Figma
แก้แล้ว: เพิ่มกฎ `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` ใน agent-dispatch-guard บล็อกคำสั่งงานที่ให้ agent ตัดสิน verdict แต่ไม่มีข้อกำหนดว่า "ตามดีไซน์ / ไม่ใช่ defect" ต้องเปิด node ของ Figma ก่อน · ทดสอบกับไฟล์คำสั่งงานจริงของรอบนี้แล้วถูกบล็อก

---

## 1. ปัญหา (Problem Statement)

- `recheck/recheck_325.jsonl` บรรทัด 20 (ts 07:57:15) evidence: "ER4 not a defect: OLS-265 AC_03 … content-status-overlay.tsx:21-27,42-44 light scrim … + centered pill over the whole phone row card by design" และ note: "ER4 overlap is the designed status overlay → exclude ContentStatusOverlay pill/scrim from the overlap detector"
- `recheck/rerun_queue.jsonl` บรรทัด 39 (ts 07:57:15): สั่งเลน r325 ให้ "exclude the status overlay … it covers the row card by design"
- `recheck/recheck_325.jsonl` บรรทัด 25 (ts 07:58:56): แก้เป็น "placement over the title is UNVERIFIED, not 'by design'" · ER4 = CONFLICT รอ Figma node ของ OLS-265 · `rerun_queue.jsonl` บรรทัด 43 (07:58:56): "WITHDRAW my 07:57 instruction"
- `RECHECK_BRIEF.md` ข้อ 12 ให้ "Read Figma notes the lane recorded (`figma_check`)" — ไม่มีข้อใดห้ามสรุป "ตามดีไซน์" โดยไม่ได้เปิด node

**สิ่งที่ควรจะเป็น:** `CLAUDE.md` §7 — บั๊ก/ไม่ใช่บั๊กตัดสินจากสเปกที่ยืนยันแล้ว (Figma/PRD/AC/PO อ่านทั้ง 2 ฝั่ง) · §0 ห้ามใช้ "by design" / "ตามสเปก/Figma" ที่ยังไม่เปิด · AC_03 ไม่ระบุตำแหน่ง และไม่ได้เปิด Figma → ต้องเป็น CONFLICT ตั้งแต่แรก

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ |
|------|-----------|
| 2026-10-01 07:54:05 | lane-325a รันใหม่: ER4 false — 4 จุดทับ = ชื่อการ์ด × "เนื้อหานี้ประมวลผลวี…" |
| 07:57:15 | **เลนรีเช็คเขียน "ER4 not a defect … by design" ลง `recheck_325.jsonl` และสั่งเลน r325 ในคิวรันใหม่ให้ตัด overlay ออกจากตัวตรวจ** |
| 07:57:52 | lane-325a รันใหม่ บันทึกตำแหน่งจริง: ป้ายกว้าง 205px ที่ x 85–290 ทับชื่อบรรทัด 2 (x 129–342) |
| 07:58:56 | เลนรีเช็คแก้เองเป็น CONFLICT รอ Figma node ของ OLS-265 + บรรทัด WITHDRAW ในคิว (1 นาที 41 วินาทีหลังข้อสรุปผิด) |
| 08:18:31 | lane-325a ยังวัด ER4 ต่อ ได้ `ok:null` รอ Figma — ตรงกับข้อแก้ (บรรทัด 29 ของ `recheck_325.jsonl`) |
| 2026-10-01 | เพิ่ม `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` + เทสต์ · ชุดเทสต์ทั้ง repo เขียว 44/44 ชุด |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

จุดตัดสินใจที่ผิดคือการอ่านโค้ด `content-status-overlay.tsx` ที่จัดป้ายไว้กลางการ์ด แล้วถือว่า "โค้ดตั้งใจทำแบบนี้" = "ดีไซน์กำหนดแบบนี้" ตอนนั้นดูถูกเพราะ AC_03 ของ OLS-265 พูดถึงข้อความเดียวกันจริง และโค้ดมี commit ที่ตั้งใจทำ แต่ทั้งสองอย่างไม่ได้บอกตำแหน่งที่ดีไซน์กำหนด

### 5 Whys

1. **ทำไมเลนรีเช็คบอกว่าป้ายทับชื่อ "ตามดีไซน์"?** — เพราะโค้ดจัดป้ายไว้กลางการ์ดโดยตั้งใจ และ AC_03 พูดถึงข้อความนี้ เลนจึงรวมสองอย่างเป็น "ดีไซน์"
2. **ทำไมเจตนาในโค้ดถูกนับเป็นดีไซน์?** — เพราะเลนไม่ได้เปิด Figma ของ OLS-265 (node ที่ ticket อ้างเป็น Reference UI) จึงไม่มีแหล่งที่บอกตำแหน่งจริงให้เทียบ
3. **ทำไมไม่เปิด Figma ก่อนสรุป?** — เพราะคำสั่งงานให้อ่านแค่ "Figma notes ที่เลนทดสอบบันทึกไว้" และไม่มีข้อใดระบุว่าข้อสรุป "ตามดีไซน์ / ไม่ใช่ defect" ต้องมี node ของ Figma ที่เปิดแล้ว
4. **ทำไมคำสั่งงานไม่มีข้อนั้น?** — เพราะกฎอยู่แค่ใน `CLAUDE.md` §0/§7 เป็นข้อความ เธรดหลักไม่ได้คัดลงคำสั่งงาน และไม่มีอะไรตรวจคำสั่งงานก่อนส่ง
5. **ทำไมไม่มีอะไรตรวจ ทั้งที่เคยพลาดเรื่องอนุมานจากคอมเมนต์โค้ดแล้ว (#0067)?** — มาตรการของ #0067 เป็นการทบทวนด้วย `/catch-ai` หลังทำ ไม่ใช่ด่านก่อนส่งงาน agent-dispatch-guard ตรวจ 9 เรื่อง แต่ไม่มีเรื่องข้อสรุป "ตามดีไซน์" ในคำสั่งงานที่ให้ agent ตัดสิน verdict

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `CLAUDE.md` §0 (ห้าม "by design" ที่ยังไม่เปิด) และ §7 — เป็นข้อความ เลนไม่ได้รับมาในคำสั่งงาน
- `references/non-pass-challenge-gate.md` ที่คำสั่งงานอ้าง — ให้ตรวจ ticket/regression/โค้ด แต่การที่โค้ดเป็นชั้นหนึ่งทำให้ "โค้ดตั้งใจ" ดูเหมือนหลักฐานพอ
- agent-dispatch-guard — ไม่มีเช็คนี้ (เช็คที่ 1–9 ผ่านทั้งหมด)
- ที่จับได้คือเลนรีเช็คเองเมื่อเห็นตำแหน่งจริง (07:57:52) — เป็นการจับหลังเกิด ไม่ใช่ด่าน

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — ไม่มีอะไรออกไปที่ Jira / ชีท / Discord |
| เจ้าของงาน | ไม่ต้องสั่งซ้ำ แก้ภายในเลนเอง · ต้องมีรายงานฉบับนี้ |
| ข้อมูล / ระบบ | ไม่เสียหาย · คำสั่งตัด overlay ถูกถอนใน 1 นาที 41 วินาที และ lane-325a ยังวัด ER4 ต่อ (08:18:31 `ok:null`) |
| ความเชื่อถือของงานรอบนั้น | ผลรีเช็คอื่นที่อ้าง "by design" จากโค้ดควรตรวจซ้ำ (Action Item 3) |

---

## 5. แนวทางการแก้ไข (Fix)

- ER4 ของ TC_21 เปลี่ยนเป็น CONFLICT รอ Figma node ของ OLS-265 และถอนคำสั่งตัด overlay ในคิว (`recheck_325.jsonl` บรรทัด 25 · `rerun_queue.jsonl` บรรทัด 43 · 07:58:56)
- เพิ่มเช็คที่ 10 `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` ใน `tools/agent-dispatch-guard/dispatch_rules.js` — คำสั่งงานที่ให้ agent ตัดสิน verdict (REAL_FAIL / STALE_ER / HARNESS / non-pass-challenge-gate / decide verdict) ต้องมีข้อกำหนดว่า "by design / ตามดีไซน์ / not a defect" ต้องเปิด node ของ Figma ก่อน ไม่งั้นบล็อก
- เพิ่มเทสต์ 4 ข้อ (ต้องบล็อก: ถ้อยคำจากคำสั่งงานจริง · ต้องผ่าน: มีข้อกำหนด · ต้องไม่ติด: คำสั่งงานที่ไม่ได้ตัดสิน verdict · ไฟล์จริงบนดิสก์ผ่าน `check.js --file`)

**ยืนยันแล้วด้วย:** `node tools/agent-dispatch-guard/dispatch_rules.test.js` → all green · `bash scripts/run-test-suites.sh` → `เขียวครบ 44 ชุด` (exit 0) · `check.js --file <round>/RECHECK_BRIEF.md` (คำสั่งงานจริงของเหตุนี้) → `BLOCK DESIGN_CLAIM_WITHOUT_FIGMA_RULE`

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` บล็อกคำสั่งงานตัดสิน verdict ที่ไม่มีข้อกำหนด "ตามดีไซน์ต้องเปิด Figma node" ตอน PreToolUse บน `Agent` | hook / เครื่องมือ | ทำแล้ว |
| P2 | เทสต์ 4 ข้อ (รวมไฟล์จริงบนดิสก์) ใน `run-test-suites.sh` + CI | เทส / CI | ทำแล้ว |
| P3 | ข้อความ fix ของกฎให้ประโยคพร้อมใช้: โค้ดและคอมเมนต์ในโค้ด = เจตนาของโค้ดเท่านั้น ไม่มี node = CONFLICT | เครื่องมือ | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** `tools/agent-dispatch-guard/dispatch_rules.js` เช็คที่ 10 `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` · ตารางกฎใน `tools/agent-dispatch-guard/README.md`
ชั้นนี้ใหม่และแข็งกว่า #0067 ซึ่งพึ่งการทบทวนหลังทำ: ครั้งนี้คำสั่งงานแบบเดียวกันส่งไม่ออก

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เลนรีเช็คเอง เมื่อผลรันใหม่ 07:57:52 ให้พิกัดจริงของป้ายกับชื่อ แล้วกลับไปอ่าน AC_03 ซ้ำ
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** 1 นาที 41 วินาที (07:57:15 → 07:58:56)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** ด่าน `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` บล็อกคำสั่งงานก่อนส่ง เลนจึงได้ข้อกำหนดตั้งแต่ต้น

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- เลนเขียนทุกข้อสรุปลงไฟล์พร้อมเวลา ทำให้ถอนคำสั่งได้ตรงบรรทัด และพิสูจน์ได้ว่าเลนทดสอบไม่ได้ทำตามคำสั่งที่ผิด
- ข้อแก้ระบุชัดว่าโค้ดเป็น "code intent only" และระบุ node ของ Figma ที่ต้องเปิด

### สิ่งที่ต้องปรับปรุง
- "ตามดีไซน์" ต้องมาจาก node ของ Figma ที่เปิดแล้วเท่านั้น โค้ดบอกได้แค่ว่าแอปทำอะไร ไม่ได้บอกว่าควรทำอะไร
- คำสั่งงานของเลนที่ตัดสิน verdict ต้องคัดกฎนี้ลงไปด้วย ไม่ใช่พึ่ง `CLAUDE.md`

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ER4 ของ TC_21 = CONFLICT รอ Figma + ถอนคำสั่งในคิว | Claude (เลนรีเช็ค) | High | Done |
| 2 | เช็ค `DESIGN_CLAIM_WITHOUT_FIGMA_RULE` + เทสต์ 4 ข้อ | Claude | High | Done |
| 3 | ตรวจบรรทัดอื่นใน `recheck_325.jsonl` ที่สรุป "by design" / "not a defect" ว่ามี node ของ Figma ที่เปิดแล้วหรือไม่ | Claude (เธรดหลัก) | Medium | Open |
| 4 | เปิด Figma node ของ OLS-265 เพื่อตัดสิน ER4 ของ TC_21 / TC_22 | Claude (เธรดหลัก) | Medium | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `tools/agent-dispatch-guard/dispatch_rules.js` — เช็คที่ 10 `DESIGN_CLAIM_WITHOUT_FIGMA_RULE`
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — เทสต์ 4 ข้อ
- `tools/agent-dispatch-guard/README.md` — แถวกฎใหม่
- `docs/post-mortem/README.md` · `docs/post-mortem/PENDING.md` · `docs/CLAUDE-ARCHIVE.md`

**Commit:** ดู `git log` ของไฟล์นี้

**หลักฐาน:** (ไฟล์อยู่ในโฟลเดอร์งานนอก repo `<round>/recheck/`)
```
recheck_325.jsonl:20  ts 07:57:15  "ER4 not a defect: … centered pill over the whole phone row card by design"
rerun_queue.jsonl:39  ts 07:57:15  "exclude the status overlay … it covers the row card by design"
recheck_325.jsonl:25  ts 07:58:56  "placement over the title is UNVERIFIED, not 'by design'" → CONFLICT
rerun_queue.jsonl:43  ts 07:58:56  "WITHDRAW my 07:57 instruction to exclude the status overlay"
check.js --file <round>/RECHECK_BRIEF.md → BLOCK DESIGN_CLAIM_WITHOUT_FIGMA_RULE
```
