# Post-Mortem Report #0173 — สั่งรอบ shadow ทับ run.sh ที่กำลังรัน บรรทัดล็อกปฏิเสธถูกนับเป็นผลแล้วฆ่า session สด

**ระบบ:** OLS QA workspace — RTT auto-test ขั้น 7 (shadow round) · `rtt_autotest/shadow.py` · `run.sh` ชั้น L5 (repo บอท off-repo)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** การรันทดสอบ OLS-829 บน dev ที่ listener สั่ง · `results.log` / `bot.log` ของบอท · ไม่มีการเขียน Jira/Sheet/Drive/Discord
**วันที่เกิดเหตุ:** 2026-10-07
**วันที่ค้นพบ:** 2026-10-07
**วันที่จัดทำรายงาน:** 2026-10-07
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — งานทดสอบ OLS-829 หายไป 30 นาที 12 วินาที และ bot.log บันทึกว่า success ทั้งที่ไม่มีผล ไม่มีการแจ้งเจ้าของงาน แต่ไม่มีข้อมูลถูกเขียนครึ่งๆ กลางๆ และ listener จะสั่งรันใหม่ 1 ครั้ง
**ประเภท:** ทำโดยไม่ตรวจสถานะสด / เฟลเงียบ (ผลเท็จว่าสำเร็จ)
**ผิดซ้ำจาก:** #0170 · #0171

---

## สรุปสั้น (Executive Summary)

11:31:24 listener สั่ง run.sh ของ OLS-829 ซึ่งถือ `.run.lock` ไว้ 11:58:21 เธรดหลักสั่งรอบ shadow 3 โดยไม่ตรวจล็อก ไม่ตรวจ `pgrep run.sh` และไม่ดู bot.log ก่อน shadow.py เรียก run.sh ของ OLS-841 แล้ว run.sh ตัวนั้นถูกล็อกปฏิเสธ ระหว่างนั้นมันเขียน `SKIPPED | run already in progress` ลง results.log ไฟล์เดียวกันตอน 12:00:02 ชั้น L5 ของ run.sh ตัดสินว่ามีผลแล้วด้วยการนับจำนวนบรรทัดอย่างเดียว จึงนับบรรทัดนั้นเป็นผลของ OLS-829 แล้วฆ่า session สดตอน 12:01:36 และบันทึกว่า success ตอน 12:01:39 งานที่หายคือ 11:31:24–12:01:36 = 30 นาที 12 วินาที (ยังไม่ได้รัน TC เลย) ไม่มีช่องทางใดแจ้งเจ้าของงาน แก้แล้ว 3 commit ในโค้ด (shadow รอล็อก · listener ถือว่าล็อกค้างเฉพาะเมื่อ PID เจ้าของตาย · รอบที่ไม่มีผลเลยต้อง DM) ส่วน patch ที่ run.sh (บรรทัดของการถูกล็อกปฏิเสธ + run id) ยังค้าง

---

## 1. ปัญหา (Problem Statement)

- **11:31:24** listener สั่ง run.sh ของ OLS-829 (วัดแล้ว: `listener.out.log:2135` "autopoll drain: launched run.sh OLS-829 mode=test") run นี้ถือ `.run.lock`
- **11:58:21** เธรดหลักสั่ง `shadow.py --only` 4 ticket (วัดแล้ว: transcript เธรดหลัก `04:58:21.778Z`) ใน tool call ของเธรดหลักตั้งแต่ 04:45Z ถึง 04:58:22Z ไม่มีการตรวจ `.run.lock`, `pgrep run.sh` หรือ bot.log (วัดแล้ว: รายงานเลน L5c §5)
- **11:58:31** แถวแรกของรอบ 3 ใน ledger shadow (วัดแล้ว: `out/rtt-autotest/shadow-2026-10-07/ledger.jsonl` แถว 13)
- **11:59:38** ledger: OLS-841 `stage=run` ทำให้ shadow.py เรียก run.sh OLS-841 (วัดแล้ว: ledger แถว 14 · `rtt_autotest/shadow.py:263-268`)
- **12:00:02** run.sh ตัวที่ 2 ถูกล็อกปฏิเสธ: `bot.log:842` "LOCKED: another testing run is already in progress" และ `logs/results.log` บรรทัด 11 `SKIPPED | run already in progress (requested OLS-841)` ซึ่งเขียนโดย `run.sh:129`
- **12:00:05** `bot.log:843` "L5 verdict detected at 1710s but process still alive -> allowing 90s grace"
- **12:01:36** `bot.log:844` "L5 process lingered >90s after the verdict -> reaping subtree … run already succeeded."
- **12:01:39** `bot.log:846` "Run completed; process lingered, reaped after 90s grace (L5) — success [OLS-829]."
- ตอนถูกฆ่า session ของ OLS-829 เพิ่งตรวจ role เสร็จและกำลังอ่านแท็บ TC รัน TC ไปแล้ว 0 ข้อ ยังไม่มีผลตัดสินใดๆ (วัดแล้ว: L5c §2 จาก transcript ของ session นั้น)

**สิ่งที่ควรจะเป็น:** `CLAUDE.md` §0 ข้อสุดท้าย (#0105) กำหนดให้วัดหลักฐานในช่วงเวลาเดียวกับการกระทำ ก่อนลงมือทันที · บทเรียน #0170 ระบุว่า shadow ต้องตรวจสถานะสดก่อนทุก ticket · memory `feedback_dont-refresh-sessions-in-use-by-other-round` (5/Oct) ห้ามแตะของที่รอบอื่นใช้อยู่ ก่อนสั่งรอบที่เรียก run.sh จึงต้องตรวจว่าไม่มี run.sh ตัวอื่นถือล็อกอยู่ ถ้ามีก็ต้องรอ

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ | แหล่งที่วัด |
| :--- | :--- | :--- |
| 2026-10-07 11:07:30 | run รอบแรกของ OLS-829 จบด้วย `FAIL(NET)` | `bot.log:822` · `results.log:9` |
| 11:31:24 | listener สั่ง auto-resume แล้วเรียก run.sh OLS-829 ซึ่งถือ `.run.lock` | `listener.out.log:2135` · `bot.log:836` |
| 11:52:42 | เธรดหลักสั่งรอบ shadow 2 ครั้งแรกของวัน ทุก ticket ได้ `live_gate deferred` จึงไม่ถึง run.sh | transcript เธรดหลัก · ledger แถว 9–12 |
| **11:58:21** | **เธรดหลักสั่งรอบ shadow 3 โดยไม่ตรวจล็อกหรือ run.sh ที่กำลังรัน** | transcript เธรดหลัก `04:58:21.778Z` |
| 11:58:31 | ledger แถวแรกของรอบ: OLS-843 classify | ledger แถว 13 |
| 11:59:38 | ledger: OLS-841 `stage=run` shadow.py เรียก run.sh | ledger แถว 14 |
| **12:00:02** | **run.sh OLS-841 ถูกล็อกปฏิเสธ เขียน `SKIPPED` ลง results.log ไฟล์เดียวกัน** | `bot.log:842` · `results.log` บรรทัด 11 · `run.sh:129` |
| 12:00:05 | L5 ของ run OLS-829 นับบรรทัดนั้นเป็นผลตัดสิน | `bot.log:843` |
| **12:01:36** | **L5 ฆ่า session สดของ OLS-829** | `bot.log:844` |
| 12:01:39 | บันทึก "success [OLS-829]" และ L6 audit รายงานว่า clean | `bot.log:846` · `bot.log:848` |
| 12:01:45 | shadow ได้ล็อกที่ว่างแล้ว เริ่มรัน OLS-280 | `bot.log:849` |
| 12:06:18 | subagent ของเธรดหลักเขียนข้อสันนิษฐานครั้งแรกว่าบรรทัดล็อกปฏิเสธถูกนับเป็นผลตัดสิน และยืนยันตอน 12:08:36 | transcript subagent `05:06:18.632Z` · `05:08:36.836Z` |
| 12:14:01 | commit `d9d1e4f` (รอบที่ไม่มีผลเลยต้อง DM) | `git show --stat` repo บอท |
| 12:26:26 | commit `2d81761` (shadow รอล็อก run.sh) | `git show --stat` repo บอท |
| 12:26:42 | commit `1845c51` (listener ถือว่าล็อกค้างเฉพาะเมื่อ PID เจ้าของตาย) | `git show --stat` repo บอท |

งานที่หาย = 11:31:24 → 12:01:36 = 30 นาที 12 วินาที คำนวณจาก `listener.out.log:2135` และ `bot.log:844`

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

จุดที่ตัดสินใจผิดคือคำสั่งตอน 11:58:21 เธรดหลักมองว่า shadow เป็นงานแยกที่ไม่เขียนอะไร เพราะรันด้วย `OLS_AUTOTEST_WRITE=0` แต่ shadow เรียก run.sh ตัวเดียวกับที่ listener ใช้ ซึ่งใช้ `.run.lock`, `results.log` และ `bot.log` ร่วมกัน รอบ 11:52:42 ก่อนหน้าไม่ถึง run.sh เพราะถูกด่าน `live_gate` หยุดไว้ทุก ticket จึงไม่เห็นการชน พอรอบ 3 ผ่าน live_gate ได้ การชนจึงเกิดจริง

### 5 Whys

1. **ทำไม session ของ OLS-829 ถูกฆ่า?** — เพราะ L5 ของ run.sh เห็นว่า results.log มีบรรทัดเพิ่ม จึงถือว่ามีผลตัดสินแล้ว รอ 90 วินาทีแล้วจึงฆ่า (`run.sh:353-378`)
2. **ทำไมบรรทัดของ run อื่นถูกนับเป็นผลของ OLS-829?** — เพราะ `verdict_written_since` (`run.sh:418-422`) เทียบแค่จำนวนบรรทัด `[ "$after" -gt "$before" ]` ไม่กรองด้วยรหัส ticket สถานะ หรือ run id และ run.sh ที่ถูกล็อกปฏิเสธก็เขียนลงไฟล์เดียวกัน (`run.sh:129`) ซึ่งเป็นคลาสเดียวกับ #0171 ที่ #0171 แก้ไว้เฉพาะบรรทัดที่ process ตัวเองเขียน
3. **ทำไมมี run.sh ตัวที่ 2 เกิดขึ้นขณะที่ตัวแรกยังรัน?** — เพราะ shadow.py เรียก run.sh โดยไม่ตรวจล็อกก่อน (`shadow.py:263-268`) ในขณะที่ `drainTick` ของ listener ตรวจ (`listener/index.js:481`)
4. **ทำไมเธรดหลักสั่งรอบโดยไม่ตรวจ?** — เพราะด่านสดของ #0170 (`live_gate()`) ตรวจแค่ VPN และ session dev ไม่ได้ตรวจว่ามี run.sh ใช้ล็อกอยู่หรือไม่ เธรดหลักจึงเชื่อว่าด่านในโค้ดครอบสถานะสดครบแล้ว
5. **ทำไมไม่มีอะไรขวางหรือแจ้งเตือน?** — สัญญาณ "มีผลแล้ว" ตัวเดียว (นับบรรทัด) ถูกใช้ซ้ำทั้งใน L5 (ฆ่า), L2 (บันทึก success · `run.sh:492-494`), L4 (ระงับการแจ้งเตือน · `run.sh:434-437`) และ L6 audit ที่หาแค่คู่ success+ไม่มีผล (`run.sh:448-452`) ชั้นทั้งหมดจึงพึ่งข้อสมมติเดียว ซึ่งตาม POSTMORTEM_RULE (#0002) นับเป็นชั้นเดียว พอสัญญาณนี้ผิด ทุกชั้นก็ผิดพร้อมกันอย่างเงียบๆ

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `live_gate()` ของ #0170 ไม่ได้ตรวจล็อก run.sh
- การแก้ของ #0171 (`result()` เลื่อน baseline) ครอบเฉพาะบรรทัดที่ process เดียวกันเขียน ไม่ครอบบรรทัดจาก run.sh ตัวอื่น
- L6 audit รายงาน "clean" (`bot.log:848`) เพราะไม่ได้ตรวจว่าบรรทัดที่นับเป็นผลนั้นเป็นของ ticket ไหน
- heartbeat รายงานว่า healthy ทั้งหมด (12:06:02–12:21:05) และ FAILURES.md / FALSE_ALARMS.md ไม่มีแถวของ OLS-829 (วัดแล้ว: L5c §3)

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง เพราะไม่มีการเขียน Jira, Sheet, Drive หรือ Discord (วัดแล้ว: L5c §2 ใน transcript ไม่มี POST/PUT ไป Jira และไม่มีการเขียนชีท · Jira GET 12:22:31 วันนี้มีคอมเมนต์ 0 และไฟล์แนบ 0) |
| เจ้าของงาน | ไม่ได้รับการแจ้ง ช่องทางสุดท้ายที่เจ้าของงานเห็นสำหรับ OLS-829 คือข้อความ "started" (วัดแล้ว: L5c §3) |
| ข้อมูล / ระบบ | งาน 30 นาที 12 วินาทีหาย (ตรวจ role + ล็อกอินแล้ว TC 0 ข้อ) · `bot.log:846` บันทึก success ที่ไม่จริง · results.log ไม่มีบรรทัดของ OLS-829 สำหรับ run นี้ |
| ความเชื่อถือของงานรอบนั้น | บรรทัด "success" ใน bot.log ที่มาจาก L5 เชื่อไม่ได้ ถ้าช่วงเวลานั้นมี run.sh ตัวอื่นเขียน results.log · listener ไม่อ่านบรรทัดนั้น (ตัดสินจาก `scan_eligible.py`) OLS-829 จึงยังไม่ถูกมองว่าเสร็จ และจะถูก auto-resume 1 ครั้ง (ครั้งที่ 2 จากสูงสุด 2) (วัดแล้วจากโค้ด: รายงานเลน L5e · ยังไม่ได้รัน `scan_eligible.py` สด) |

---

## 5. แนวทางการแก้ไข (Fix)

- `2d81761` (12:26:26) — shadow.py รอให้ล็อก run.sh ว่างก่อนเรียกแต่ละ ticket ไม่ชนกับ run ที่กำลังรัน · `rtt_autotest/shadow.py` +57 · เทสต์ใหม่ `rtt_autotest/tests/test_rtt_shadow_run_lock.py` (133 บรรทัด)
- `1845c51` (12:26:42) — listener ถือว่าล็อกค้างเฉพาะเมื่อ PID เจ้าของตายแล้ว ส่วนกฎเดิมที่ดูแค่อายุไฟล์จะถูก log ไว้ · `listener/run_lock.js` + `listener/run_lock.test.js` · listener ที่รันอยู่ตอนนี้ยังเป็นโค้ด `7de790d` (วัดแล้ว: L5e) commit นี้จึงจะมีผลเมื่อ listener ถูก restart
- `d9d1e4f` (12:14:01) — digest อ่านบรรทัด AUTOTEST ล่าสุด และรอบ shadow ที่ไม่มีผลตัดสินเลยจะ DM แล้วจบด้วยรหัส 5 · เทสต์ `test_rtt_shadow_silent_round.py` · `test_rtt_digest_last_autotest.py`
- **ค้าง (pending):** patch ของ run.sh ให้ run ที่ถูกล็อกปฏิเสธไม่เขียนลง results.log ที่ใช้ร่วมกันเป็นบรรทัดที่นับเป็นผลได้ และให้ L5/L2/L4 นับเฉพาะบรรทัดที่มี run id ของ run ตัวเอง เตรียมไว้ในสำเนา scratchpad แล้ว แต่ยังไม่ได้ใช้กับ repo บอท

**ยืนยันแล้วด้วย:** `git -C <repo บอท> show --stat 2d81761 1845c51 d9d1e4f` (ไฟล์และเวลา commit ตามรายการด้านบน) · อ่าน `bot.log:842-846`, `results.log` บรรทัด 11, `listener.out.log:2135`, ledger แถว 13–15 ในเทิร์นที่เขียนรายงานนี้ · เลนนี้ไม่ได้รันเทสต์ของ repo บอทเอง

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

#0170 เพิ่มด่านสดในโค้ด แต่ครอบแค่ VPN/session ส่วน #0171 แก้ baseline ได้เฉพาะใน process ตัวเอง เหตุนี้ผ่านช่องว่างของทั้งสองชั้น ชั้นใหม่จึงต้องเป็นของในโค้ดที่ปิด 2 ทาง คือ (ก) ไม่ให้เกิด run ซ้อนจากทุกทางที่สั่งได้ และ (ข) ผลตัดสินต้องผูกกับ run ที่เป็นเจ้าของ ไม่ใช่นับบรรทัด

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | shadow.py รอล็อก run.sh ก่อนเรียกทุก ticket (`2d81761`) | เครื่องมือ + เทสต์ (repo บอท) | ทำแล้ว |
| P2 | ล็อกเก็บ PID เจ้าของ และ listener ถือว่าล็อกค้างเฉพาะเมื่อ PID ตายแล้ว (`1845c51`) | เครื่องมือ + เทสต์ (repo บอท) | ทำแล้ว · มีผลหลัง restart listener |
| P3 | รอบ shadow ที่ไม่มีผลตัดสินเลยต้อง DM เจ้าของงาน (`d9d1e4f`) | เครื่องมือ + เทสต์ (repo บอท) | ทำแล้ว |
| P4 | run.sh: run ที่ถูกล็อกปฏิเสธต้องไม่เขียนบรรทัดที่ L5 นับได้ลง results.log ที่ใช้ร่วมกัน · ทุกบรรทัดผลมี run id และ `verdict_written_since` นับเฉพาะบรรทัดของ run id ตัวเอง (ปิดทั้ง L5/L2/L4/L6 ที่ใช้สัญญาณเดียวกัน) | เครื่องมือ + เทสต์ (repo บอท) | ค้าง — patch เตรียมใน scratchpad ยังไม่ได้ใช้ |
| P5 | เทสต์ที่จำลอง 2 run ซ้อนกันจริง (run A ถือล็อก run B ถูกปฏิเสธ) แล้วยืนยันว่า run A ไม่ถูกฆ่าและไม่ถูกบันทึกว่า success | เทสต์ (repo บอท) | ค้าง — มาพร้อม P4 |

**กฎที่เพิ่มจากเหตุนี้:** ก่อนสั่งงานใดที่เรียก run.sh (shadow, ON-DEMAND, รันมือ) ต้องตรวจ `.run.lock` + PID เจ้าของในเทิร์นเดียวกับที่สั่ง ถ้าถืออยู่ = รอ ไม่ใช่สั่งทับ ตอนนี้กฎนี้อยู่ในโค้ดของ shadow.py (P1) แล้ว และสรุปไว้ใน `docs/CLAUDE-ARCHIVE.md` § Post-mortems หัวข้อ Report #0173 · P4/P5 เป็นงานในโค้ดของ repo บอท

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** subagent ที่เธรดหลักจ่ายให้รีวิว L5 ตั้งข้อสันนิษฐานไว้ตอน 12:06:18 และยืนยันตอน 12:08:36 ไม่ใช่ระบบแจ้งเตือนของบอท เพราะทุกชั้นรายงานว่า clean/healthy
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** 4 นาที 42 วินาทีหลังการฆ่า (12:01:36 → 12:06:18 ข้อสันนิษฐาน) และ 7 นาทีหลังการฆ่า (→ 12:08:36 ยืนยัน)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 ทำให้การชนไม่เกิดจากทาง shadow · P4 ทำให้ L5 ไม่นับบรรทัดของ run อื่น และ P3 ทำให้รอบที่ไม่มีผลถูก DM เอง

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ไม่มีการเขียนครึ่งๆ กลางๆ บน Jira/Sheet/Drive/Discord เพราะ session ยังอยู่ช่วงเตรียมการ
- จับได้ภายใน 7 นาทีโดยการรีวิวเชิงรุก และมี commit แก้ 3 ตัวภายใน 25 นาที 6 วินาทีหลังการฆ่า (12:01:36 → 12:26:42)
- listener ตัดสินว่าเสร็จจาก `scan_eligible.py` ไม่ใช่จากบรรทัด success จึงจะรัน OLS-829 ใหม่

### สิ่งที่ต้องปรับปรุง
- ด่านสดต้องครอบทรัพยากรที่ใช้ร่วมกันทุกตัว (ล็อก, ไฟล์ผล, บัญชี) ไม่ใช่แค่สิ่งที่เหตุครั้งก่อนเจอ
- การแก้คลาส "นับบรรทัดเป็นผล" ต้องปิดทุกผู้เขียน ไม่ใช่เฉพาะ process ตัวเอง

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | P4 + P5 — ใช้ patch run.sh (writer ของ run ที่ถูกล็อกปฏิเสธ + run id) พร้อมเทสต์ 2 run ซ้อนกัน | Claude (เลนที่มีสิทธิ์แก้ repo บอท เมื่อเจ้าของงานสั่ง) | High | Open |
| 2 | restart listener ให้ `1845c51` มีผล แล้ววัดว่า PID ในล็อกถูกอ่าน | เจ้าของงาน → Claude | High | Open |
| 3 | ติดตามการ auto-resume ของ OLS-829 (ครั้งที่ 2 จาก 2) ถ้ายังไม่ได้เริ่ม TC ต้องแจ้งเจ้าของงาน | Claude | Medium | Open |
| 4 | รายงานฉบับนี้ + ดัชนี + สรุปใน `CLAUDE-ARCHIVE.md` | Claude | Medium | Done |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน (repo นี้):**
- `docs/post-mortem/20261007-post-mortem-report-0173-shadow-round-launched-over-live-run-lock-reaped-session.md` — รายงานนี้
- `docs/post-mortem/README.md` · `docs/post-mortem/PENDING.md` · `docs/CLAUDE-ARCHIVE.md` — ดัชนี / ledger / สรุป

**Commit ที่อ้างถึง (repo บอท):** `2d81761` · `1845c51` · `d9d1e4f`

**หลักฐาน:**
```
listener.out.log:2135  [04:31:24.399Z] autopoll drain: launched run.sh OLS-829 mode=test; 1 left
ledger แถว 13          11:58:31 OLS-843 classify (แถวแรกของรอบ 3)
ledger แถว 14          11:59:38 OLS-841 stage=run
results.log บรรทัด 11   2026-10-07T12:00:02+0700 | SKIPPED | run already in progress (requested OLS-841)
bot.log:842            [12:00:02] LOCKED: another testing run is already in progress — aborting this invocation.
bot.log:843            [12:00:05] L5 verdict detected at 1710s but process still alive -> allowing 90s grace
bot.log:844            [12:01:36] L5 process lingered >90s after the verdict -> reaping subtree ... run already succeeded.
bot.log:846            [12:01:39] Run completed; process lingered, reaped after 90s grace (L5) — success [OLS-829].
run.sh:418-422         verdict_written_since: [ "$after" -gt "$before" ]  (นับบรรทัดอย่างเดียว)
```
