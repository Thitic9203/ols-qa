# Post-Mortem Report #0121 — กติกากลางเลนตกตัวแปร proxy preload ทำให้ `session_verify` ของ 3 เลนได้ `ENOTFOUND`

**ระบบ:** OLS QA workspace — กติกากลางเลน (`LANE_BRIEF.md` นอก repo) · `session_verify.js` (bot repo นอก repo นี้) · `tools/agent-dispatch-guard/`
**สภาพแวดล้อมที่ได้รับผลกระทบ:** เลนอัดคลิป E / F / U บน training69 (อ่านอย่างเดียว) — ไม่มีการเขียนข้อมูลบน env ใด
**วันที่เกิดเหตุ:** 2026-09-23
**วันที่ค้นพบ:** 2026-09-23
**วันที่จัดทำรายงาน:** 2026-09-23
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Low — 3 เลนเสียเวลาไม่ถึง 1 นาที (เฟลครั้งแรก 07:56:01Z ถึงเลนสุดท้ายยืนยันได้ 07:56:56Z) ไม่มีข้ออ้างผิดหลุดออกไป ไม่มีการเขียนข้อมูลบน env
**ประเภท:** อื่นๆ — ส่งคำสั่งให้ agent ด้วยสภาพแวดล้อมที่คัดลอกด้วยมือแล้วตกหล่น
**ผิดซ้ำจาก:** #0095 (brief ของ agent ระบุสภาพแวดล้อมการรันจากความจำ ไม่ได้ดึงจากสิ่งที่ใช้งานได้จริง — ครั้งนั้นคือโฟลเดอร์ session ครั้งนี้คือตัวแปร preload)

---

## สรุปสั้น (Executive Summary)

เธรดหลักเขียนกติกากลางของ 4 เลนอัดคลิป (`lanes_0923/LANE_BRIEF.md`) โดยเขียนรายการตัวแปรสภาพแวดล้อมสำหรับการรัน node ด้วยมือ และตก `NODE_OPTIONS="--require …/pw_proxy_preload.js"` ที่คำสั่ง `session_verify.js` / `session_capture.js` บน training69 ต้องใช้ ทั้งที่เธรดหลักเพิ่งรันคำสั่งที่ถูกเองเมื่อ 14:17 (3/3 verified ตามที่บันทึกใน brief)
เลน U, F, E รัน `session_verify.js` แล้วได้ `getaddrinfo ENOTFOUND <T69_OLS_HOST>` ที่ `session_verify.js:112` ภายใน 23 วินาที (07:56:01Z–07:56:24Z)
ตัวเฝ้า heartbeat เห็นบรรทัด `failed` เธรดหลักเติมหัวข้อ "UPDATE 3.0x PM #2" พร้อมคำสั่งที่ใช้ได้จริงและส่งข้อความถึงทุกเลน ทั้ง 3 เลนรันใหม่ผ่านภายใน 07:56:56Z
ต้นเหตุ: สภาพแวดล้อมการรันเป็นรายการยาวที่ต้องคัดลอกทุกครั้ง ไม่มีคำสั่งเดียวที่รวมไว้และปฏิเสธเมื่อขาดชิ้นใดชิ้นหนึ่ง
แก้แล้วด้วยสองชั้นในโค้ด: `capture/t69_env.sh` ใน bot repo (ปฏิเสธก่อน node เริ่มถ้าไม่มี preload / proxy ไม่ฟัง / ไม่มี CA) และเช็ค `PROXY_PRELOAD_MISSING` ใน `tools/agent-dispatch-guard/`

---

## 1. ปัญหา (Problem Statement)

- `LANE_BRIEF.md` บรรทัด 6–7 (หัวข้อ Hard rules) ระบุว่า "Every node run needs" ตามด้วย `PW_PROXY=… NODE_PATH=… NODE_EXTRA_CA_CERTS=… HANDS_OFF_EXCEPTION=… HANDS_OFF_EXCEPTION_TARGET=$OLS` — ไม่มี `NODE_OPTIONS` ไม่มี `pw_proxy_preload.js` · บรรทัด 8 สั่ง verify ด้วย `session_verify.js` "same env as above"
- `session_verify.js:111` สร้าง `request.newContext({ storageState })` โดยไม่มี option proxy — ตัวแปร `PW_PROXY` ไม่มีผลใดๆ ถ้าไม่มี preload เพราะ preload คือตัวที่อ่าน `PW_PROXY` แล้วใส่ proxy ให้ (หัวไฟล์ `pw_proxy_preload.js` บรรทัด 3–8)
- บันทึกสถานะของเลน (`lanes_0923/LANE_*.status.jsonl`):
  - เลน U บรรทัด 16 · `07:56:01Z` · `session_verify exit=1 getaddrinfo ENOTFOUND <T69_OLS_HOST> at session_verify.js:112`
  - เลน F บรรทัด 26 · `07:56:23Z` · `apiRequestContext.get: getaddrinfo ENOTFOUND <T69_OLS_HOST>`
  - เลน E บรรทัด 21 · `07:56:24Z` · `exit=1 apiRequestContext.get: getaddrinfo ENOTFOUND <T69_OLS_HOST> at session_verify.js:112`
- คำสั่งที่ใช้ได้จริง (เธรดหลักรันเองก่อนหน้า) ถูกเขียนลง brief ภายหลังในหัวข้อ "UPDATE 3.0x PM #2" บรรทัด 32–35 ซึ่งมี `NODE_OPTIONS="--require …/pw_proxy_preload.js"` และข้อความ "Verified command today (3/3 verified at 14:17)"

**สิ่งที่ควรจะเป็น:** สภาพแวดล้อมการรันที่ส่งให้ agent ต้องเป็นคำสั่งเดียวกับที่รันผ่านจริง ไม่ใช่รายการที่เขียนใหม่ด้วยมือ (บทเรียน #0095: ข้อมูลการรันที่ส่งให้ agent ต้องดึงจากสิ่งที่ใช้งานได้จริง ไม่ใช่จากความจำ)

---

## 2. ไทม์ไลน์ (Timeline)

เวลาจากบันทึกสถานะของเลน (UTC) · 14:17 เป็นเวลาท้องถิ่น (UTC+7) ตามที่เขียนใน brief

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-09-23 14:17 (+07) | เธรดหลักรัน `session_verify.js` ด้วยคำสั่งที่มี preload ได้ 3/3 verified (อ้างจาก brief บรรทัด 34) |
| ก่อนบรรทัดสถานะแรกของเลน (ไม่ได้วัดเวลาเขียน) | **เธรดหลักเขียน `LANE_BRIEF.md` หัวข้อ Hard rules โดยรายการตัวแปรไม่มี `NODE_OPTIONS` preload แล้วส่ง 4 เลน** |
| 07:55:50Z | เลน U เริ่ม `session_verify` 4 tag |
| 07:56:01Z | เลน U: `ENOTFOUND` exit=1 |
| 07:56:09Z | เลน U วินิจฉัยเองว่าขาด `node -r pw_proxy_preload.js` และรันใหม่ |
| 07:56:23Z – 07:56:24Z | เลน F และ E: `ENOTFOUND` exit=1 |
| ไม่เกิน 07:56:33Z (เวลาที่เธรดหลักเห็นไม่ได้วัด) | ตัวเฝ้า heartbeat เห็นบรรทัด `failed` · เธรดหลักเติม "UPDATE 3.0x PM #2" และส่งข้อความถึงทุกเลน (เลน U บรรทัด 23 `07:56:33Z` · เลน F บรรทัด 28 `07:56:35Z` บันทึกว่าได้รับ) |
| 07:56:51Z | เลน E: `3/5 verified` หลังรันใหม่พร้อม preload |
| 07:56:56Z | เลน F: `st9020 ok` · `tc9021 ok` หลังรันใหม่พร้อม preload (tag ที่เหลือ session หมดอายุจริง เป็นเรื่องแยก) |
| 15:08 (+07) | เขียนรายงานนี้ · `capture/t69_env.sh` + เช็ค `PROXY_PRELOAD_MISSING` ผ่านเทสแล้ว |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

จุดตัดสินใจที่ผิดคือการเขียนสภาพแวดล้อมการรันใน brief ใหม่ด้วยมือจากความจำ แทนการคัดลอกคำสั่งที่เพิ่งรันผ่าน ตอนนั้นดูถูกเพราะรายการมี `PW_PROXY` ซึ่งดูเหมือน "เรื่อง proxy ครบแล้ว" — แต่ `PW_PROXY` เป็นแค่ค่าที่ preload อ่าน ตัวมันเองไม่ทำอะไร

### 5 Whys

1. **ทำไม 3 เลนได้ `ENOTFOUND`?** — เพราะรัน `session_verify.js` โดยไม่มี preload ทำให้ Playwright API context resolve ชื่อ host เองแทนที่จะผ่าน proxy ที่ทำ DNS ให้
2. **ทำไมเลนรันโดยไม่มี preload?** — เพราะ brief บรรทัด 7–8 บอกว่ารายการตัวแปรนั้นคือ "ทุกอย่างที่ node ต้องการ" และให้ใช้ "same env as above" กับ `session_verify` เลนทำตามตรงตัว
3. **ทำไม brief ตก preload ทั้งที่เธรดหลักเพิ่งรันคำสั่งที่ถูก?** — เพราะรายการตัวแปรถูกเขียนขึ้นใหม่ด้วยมือ ไม่ได้คัดจากคำสั่งที่รันผ่าน และ `PW_PROXY` ในรายการทำให้ดูเหมือนครอบเรื่อง proxy แล้ว
4. **ทำไมต้องเขียนรายการด้วยมือ?** — เพราะสภาพแวดล้อมของ training69 ประกอบด้วย 6–7 ชิ้นที่กระจายอยู่ (proxy port · preload ในโฟลเดอร์รอบที่ git ignore · CA · OLS · target) ไม่มีคำสั่งเดียวที่รวมไว้ ทุก brief และทุกคนจึงต้องประกอบเอง
5. **ทำไมไม่มีอะไรปฏิเสธชุดที่ไม่ครบก่อนรัน?** — root cause: ความถูกต้องของสภาพแวดล้อมการรันขึ้นกับการคัดลอกข้อความ ไม่มีจุดเดียวในโค้ดที่ประกอบชุดนี้และปฏิเสธเมื่อขาดชิ้น (preload หาย · proxy ไม่ฟัง · CA หาย) และ guard ที่ตรวจ brief ก่อนส่ง agent ไม่มีเช็คเรื่องนี้ — ปิดคลาสได้ด้วยการทำให้ brief อ้างคำสั่งเดียวที่ตรวจตัวเอง และให้ guard ปฏิเสธ brief ที่ใช้ session tools บน training69 โดยไม่อ้างคำสั่งนั้นหรือ preload

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `tools/agent-dispatch-guard/` มี 3 เช็ค (persistence · screenshot · unbounded scan) ไม่มีเช็คเรื่องสภาพแวดล้อมการรัน
- มาตรการ P3 ของ #0095 ("brief ที่ใช้ session ระบุโฟลเดอร์จาก cwd ของ keepalive") เป็นกฎข้อความ สถานะค้างรออนุมัติ และครอบแค่โฟลเดอร์ session ไม่ครอบตัวแปรการรัน
- `pw_proxy_preload.js` เองปฏิเสธเมื่อไม่มี `PW_PROXY` (exit 2) แต่ป้องกันได้เฉพาะกรณีที่ถูกโหลด — กรณีนี้ไม่ถูกโหลดเลยจึงไม่มีอะไรดัง
- `session_verify.js` ไม่รู้ว่ากำลังรันบน env ที่ต้องมี proxy จึงรายงานเป็น error เครือข่ายธรรมดา
- ตัวเฝ้า heartbeat จับได้ แต่เป็นชั้นหลังเกิดเหตุ ไม่ใช่ชั้นกัน

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — เป็นการตรวจ session แบบอ่านอย่างเดียวก่อนอัด ไม่มีคลิปหรือผลใดส่งออก |
| เจ้าของงาน | ไม่ต้องสั่งซ้ำ · เธรดหลักใช้ 1 ข้อความเติม UPDATE + ส่งข้อความถึงเลน · เลนเสียเวลารวมไม่ถึง 1 นาทีต่อเลน |
| ข้อมูล / ระบบ | ไม่มีการเขียนบน env ใด · ไม่มีข้อมูลเสียหาย |
| ความเชื่อถือของงานรอบนั้น | ผลตรวจ session หลังรันใหม่ใช้ได้ (มาจากคำสั่งที่มี preload) · สถานะ `NEEDS_LOGIN` ของบาง tag เป็นผลจริงหลังรันใหม่ ไม่ใช่ผลจาก ENOTFOUND · ไม่มีข้ออ้างผิดที่ต้องถอน |

---

## 5. แนวทางการแก้ไข (Fix)

- เธรดหลักเติม "UPDATE 3.0x PM #2" ใน `LANE_BRIEF.md` บรรทัด 32–35 พร้อมคำสั่งที่มี `NODE_OPTIONS="--require …/pw_proxy_preload.js"` และส่งข้อความถึงทุกเลน
- ทั้ง 3 เลนรันใหม่ผ่าน: U (`07:56:19Z` ได้ผลรายบัญชี) · E (`07:56:51Z` 3/5 verified) · F (`07:56:56Z` st9020 ok · tc9021 ok)

**ยืนยันแล้วด้วย:** บรรทัดในไฟล์สถานะของเลนตามที่อ้างในไทม์ไลน์ (อ่านรอบนี้จากไฟล์บนดิสก์)

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

ชั้นที่แข็งขึ้นกว่า #0095 (ซึ่งปิดด้วยกฎข้อความที่ยังค้าง): ย้ายการประกอบสภาพแวดล้อมเข้าโค้ดที่ปฏิเสธเอง และให้ guard ปฏิเสธ brief ที่ไม่อ้างมัน

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | `capture/t69_env.sh` ใน bot repo — คำสั่งเดียวสำหรับ node บน training69: export `OLS` (training69 เท่านั้น) · `HANDS_OFF_EXCEPTION_TARGET` · `PW_PROXY` · `NODE_EXTRA_CA_CERTS` · ต่อ `--require <preload>` เข้า `NODE_OPTIONS` · ปฏิเสธ (exit 2) เมื่อไม่มีเหตุผล `HANDS_OFF_EXCEPTION` (ไม่แต่งให้เอง) · `OLS`/target ชี้ env อื่น · ไม่มี preload · ไม่มี CA · proxy port ไม่ฟัง · `--check` ตรวจอย่างเดียว · exit code ของคำสั่งที่ห่อส่งต่อ | เครื่องมือ | ทำแล้ว — bot repo `a64bbdf` · เทส `capture/t69_env.test.js` 22/22 (พอร์ตเปิด vs ปิด · preload มี vs ไม่มี · node โหลด preload จริงผ่าน `NODE_OPTIONS`) · `--check` กับ proxy จริงบนเครื่อง: `OK — proxy 127.0.0.1:18723 listening` |
| P2 | `capture/pw_proxy_preload.js` สำเนาที่ track ใน git (byte เหมือนไฟล์ของรอบ ตรวจด้วย `cmp`) ให้ค่าเริ่มต้นของ wrapper ไม่ขึ้นกับโฟลเดอร์ `out/` ที่ git ignore | เครื่องมือ | ทำแล้ว — `a64bbdf` |
| P3 | `tools/agent-dispatch-guard/` เช็คที่ 4 `PROXY_PRELOAD_MISSING` (BLOCK): brief ที่รัน `session_verify`/`session_capture` บน training69 / `PW_PROXY` แต่ไม่อ้าง `pw_proxy_preload` หรือ `t69_env.sh` → ปฏิเสธการส่ง agent · ขอบเขตแคบ: brief pre-prod และ brief อัดคลิปที่ไม่ใช้ session tools ไม่โดน | hook / เทส | ทำแล้ว — เทส 7 ข้อใหม่ (ต้องพบ 3 · ต้องไม่พบ 4 รวม hook payload 1) · ชุด 30/30 |
| P4 | guard ตาม brief ที่เป็นไฟล์: ตอนนี้ guard เห็นแค่ข้อความ prompt ของ Agent — ถ้า prompt แค่บอกให้ "อ่าน `LANE_BRIEF.md`" เช็คที่ 4 มองไม่เห็นรายการตัวแปรในไฟล์ · เสนอให้ guard อ่านไฟล์ `.md` ที่ prompt อ้าง (ภายในโฟลเดอร์งาน) แล้วประเมินรวม | hook | ค้าง — เปลี่ยนขอบเขต guard ต้องถามเจ้าของงาน · ยังไม่ตรวจว่า prompt ของเลน E/F/U รอบนี้มีรายการตัวแปรในตัวหรือแค่อ้างไฟล์ |
| P5 | แก้ `LANE_BRIEF.md` หัวข้อ Hard rules ให้ชี้ `bash capture/t69_env.sh …` แทนรายการตัวแปร | กฎ (ของรอบ) | ค้าง — ไฟล์กำลังถูกเลนใช้ เป็นงานของเธรดหลัก |

**กฎที่เพิ่มจากเหตุนี้:** สภาพแวดล้อมการรัน node บน training69 ที่ส่งให้ agent ต้องอ้างคำสั่งเดียว `bash capture/t69_env.sh <command>` (หรืออย่างน้อยมี preload) ห้ามเขียนรายการตัวแปรใหม่ด้วยมือ — บังคับด้วย `PROXY_PRELOAD_MISSING` ใน `tools/agent-dispatch-guard/dispatch_rules.js` · บันทึกในสรุปของ `docs/CLAUDE-ARCHIVE.md` § Post-mortems

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** ตัวเฝ้า heartbeat ของเธรดหลักเห็นบรรทัด `state: failed` ในไฟล์สถานะของเลน · เลน U, E, F วินิจฉัยต้นเหตุเองได้ภายใน 8–10 วินาทีจากหัวไฟล์ `pw_proxy_preload.js`
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** จากเฟลแรก 07:56:01Z ถึงเธรดหลักส่งข้อความถึงเลน (เลนบันทึกว่าได้รับ 07:56:33Z) 32 วินาที (07:56:01Z → 07:56:33Z จาก timestamp สองบรรทัด)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P3 ปฏิเสธ brief ก่อนส่ง agent เลย และถ้า brief อ้าง wrapper แต่ proxy ไม่ฟังหรือ preload หาย P1 ปฏิเสธก่อน node เริ่มพร้อมข้อความบอกวิธีแก้ ไม่ต้องรอเจอ `ENOTFOUND`

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- เลนเขียนบรรทัดสถานะลงดิสก์ทุกขั้น ทำให้ heartbeat เห็นเฟลทันทีและรายงานนี้อ้างเวลาได้ทุกจุด
- เลนหยุดวินิจฉัยตามหลักฐาน (หัวไฟล์ preload · `grep` proxy ใน `session_verify.js` = 0) ไม่ได้สรุปว่า session ตาย
- `ENOTFOUND` ไม่ถูกนับเป็น `NEEDS_LOGIN` — ผล session ที่รายงานมาจากการรันใหม่ที่ถูกเท่านั้น

### สิ่งที่ต้องปรับปรุง
- คำสั่งที่รันผ่านจริงควรถูกคัดลอกลง brief ทั้งบรรทัด ไม่ใช่เขียนรายการตัวแปรใหม่
- สภาพแวดล้อมที่มีหลายชิ้นควรมีคำสั่งเดียวที่ตรวจตัวเองตั้งแต่ครั้งแรกที่ต้องใช้ preload (21/Sep) ไม่ใช่รอให้หลุดในวันที่มีหลายเลน

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | `capture/t69_env.sh` + เทส + preload ที่ track | Claude | Medium | Done (`a64bbdf`) |
| 2 | เช็ค `PROXY_PRELOAD_MISSING` ใน agent-dispatch-guard + เทส | Claude | Medium | Done |
| 3 | ขออนุมัติให้ guard อ่านไฟล์ brief ที่ prompt อ้าง (P4) | เจ้าของงาน | Medium | Open |
| 4 | แก้ `LANE_BRIEF.md` Hard rules ให้ชี้ wrapper (P5) | Claude (เธรดหลัก) | Low | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- bot repo (นอก repo นี้) `capture/t69_env.sh` — wrapper ใหม่ · `capture/t69_env.test.js` — 22 เคส · `capture/pw_proxy_preload.js` — สำเนาที่ track
- `tools/agent-dispatch-guard/dispatch_rules.js` — เช็คที่ 4 `PROXY_PRELOAD_MISSING`
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — 7 เทสใหม่
- `tools/agent-dispatch-guard/README.md` — แถวกฎใหม่

**Commit:** bot repo `a64bbdf` · repo นี้: ดู commit ที่เพิ่มรายงานนี้ *(repo นี้ public — host ใช้ `<T69_OLS_HOST>`)*

**หลักฐาน:**
```
LANE_U.status.jsonl:16  07:56:01Z  failed  session_verify exit=1 getaddrinfo ENOTFOUND <T69_OLS_HOST> at session_verify.js:112
LANE_F.status.jsonl:26  07:56:23Z  failed  apiRequestContext.get: getaddrinfo ENOTFOUND <T69_OLS_HOST>
LANE_E.status.jsonl:21  07:56:24Z  failed  exit=1 ... ENOTFOUND <T69_OLS_HOST> at session_verify.js:112
LANE_F.status.jsonl:30  07:56:56Z  sessions: st9020 ok(CREATOR) tc9021 ok(ADMIN_CONTENT) ...
node capture/t69_env.test.js            -> t69_env: 22/22 passed   (ก่อนเขียน wrapper: 1/22)
node tools/agent-dispatch-guard/dispatch_rules.test.js -> all green — 30 test(s) ran   (ก่อนแก้: 3 failed)
bash capture/t69_env.sh --check         -> t69_env: OK — proxy 127.0.0.1:18723 listening · preload <BOT>/capture/pw_proxy_preload.js
```
