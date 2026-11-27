# Post-Mortem Report #0204 — แก้ไฟล์ hook ของ rtk เองจน integrity check ล้ม และ rtk หยุดรันทุกคำสั่ง

**ระบบ:** เครื่องมือของเครื่อง QA — rtk 0.36.0 และ hook `PreToolUse` ของ Claude Code (`~/.claude/hooks/rtk-rewrite.sh`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** Mac เครื่อง QA (ทุก session ที่ใช้ Bash ผ่าน hook ตัวเดียวกัน) · ไม่มีผลกับ env ทดสอบ / Jira / Qase
**วันที่เกิดเหตุ:** 2026-11-27
**วันที่ค้นพบ:** 2026-11-27
**วันที่จัดทำรายงาน:** 2026-11-27
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — ช่วงที่ hook ถูกแก้ ทุกคำสั่งที่ถูกเขียนใหม่เป็น `rtk …` ล้มทั้งเครื่อง (รวม session อื่นที่ใช้ hook เดียวกัน) แต่คืนไฟล์ได้และไม่มีข้อมูลเสีย
**ประเภท:** ทำเกินขอบเขต / แตะของที่มีตัวป้องกันโดยไม่อ่านก่อน
**ผิดซ้ำจาก:** ใกล้เคียงคลาส #0178 / #0203 (พฤติกรรมของ rtk ที่ไม่ได้ตรวจก่อนลงมือ)

---

## สรุปสั้น (Executive Summary)

ตอนทำมาตรการ P2 ของ #0203 (ให้ rtk ไม่เขียน `playwright test` ใหม่) ผมพบว่า `exclude_commands` ใน `config.toml` จับแค่คำแรกของคำสั่ง
แล้วผมแก้ `~/.claude/hooks/rtk-rewrite.sh` เพิ่มเงื่อนไขข้าม Playwright โดยไม่ได้ตรวจว่า rtk เก็บ hash ของ hook ไว้ตรวจความถูกต้อง
(`~/.claude/hooks/.rtk-hook.sha256`) rtk จึงขึ้น `hook integrity check FAILED … RTK will not execute` และทุกคำสั่งที่ hook เขียนเป็น
`rtk …` ล้ม ผมคืนไฟล์จาก backup ทันทีที่เห็น `rtk verify` กลับมา `PASS` (145/145) P2 ทำผ่านทางที่ rtk รองรับแทน คือ
`exclude_commands` + `"npx"` ส่วนรูปแบบที่ขึ้นต้นด้วย `VAR=…` ปิดด้วย P1 (config guard ใน ols-qa-e2e, PR ols-qa-e2e#383)

---

## 1. ปัญหา (Problem Statement)

- ผมเพิ่มบล็อก `if printf '%s' "$CMD" | grep -Eq '…playwright…test…'; then exit 0; fi` ก่อน `rtk rewrite` ใน `rtk-rewrite.sh`
  (backup: `rtk-rewrite.sh.bak-20261127-pm0203`)
- output ของคำสั่งที่ผ่าน rtk หลังจากนั้น: `rtk: hook integrity check FAILED · Expected hash: 742418d70728fc3b... · Actual hash: 35316c5e45db30d2...
  · The hook at ~/.claude/hooks/rtk-rewrite.sh has been modified. This may indicate tampering. RTK will not execute.`
- คืนไฟล์ด้วย `cp -p` จาก backup → `shasum` = `742418d70728fc3b` · `rtk verify` → `PASS hook integrity verified` · `145/145 tests passed`
- หลังคืนไฟล์ มีคำสั่งหนึ่งรายงานกลับด้าน (`Expected 35316c… / Actual 742418…`) แปลว่าไฟล์ hash ถูกเขียนเป็นค่าของไฟล์ที่ผมแก้ไปช่วงหนึ่ง แล้วกลับเป็น
  `742418…` (mtime ของ `.rtk-hook.sha256` = 15:55 แล้ว 15:56:05) — **ยังไม่ทราบว่าอะไรเขียนไฟล์นี้** (ตรวจไม่ได้จากหลักฐานที่มี)

**สิ่งที่ควรจะเป็น:** ก่อนแก้ไฟล์ของเครื่องมือภายนอก ต้องอ่านว่ามันมีตัวป้องกัน (integrity/lock/generated) หรือไม่ และใช้ช่องทางที่เครื่องมือรองรับ
(กฎ global ข้อ 7: แก้ที่ config ไม่ hack · ข้อ 5: ของที่ถูกใช้ร่วมต้องระวัง)

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-11-27 (ก่อน 15:55, เวลาแก้ไม่ได้วัดไว้) | เจ้าของงานอนุมัติ P2 · แก้ `config.toml` (ไม่กระทบ integrity) แล้วแก้ `rtk-rewrite.sh` |
| ก่อน 15:55 | ทดสอบ hook ด้วย input จำลอง ผ่านตามที่ตั้งใจ — แต่ทดสอบโดยเรียก `bash $H` ตรงๆ ซึ่ง rtk rewrite ยังทำงาน จึงไม่เห็นว่า `rtk <cmd>` ถูกปฏิเสธ |
| **ก่อน 15:55** | **คำสั่งที่ผ่าน rtk ล้มด้วย integrity check (เห็นใน output ของ push ที่รันอยู่เบื้องหลัง)** |
| 15:55–15:56 | คืน hook จาก backup · `rtk verify` PASS · พบรายงานกลับด้านหนึ่งครั้ง แล้วยืนยันอีกรอบว่า PASS |
| ต่อมา | P2 ใช้ `exclude_commands` + `"npx"` แทน · แจ้งเจ้าของงานในแชท |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไม rtk หยุดรัน?** — เพราะ hash ของ `rtk-rewrite.sh` ไม่ตรงกับ `.rtk-hook.sha256`
2. **ทำไม hash ไม่ตรง?** — เพราะผมแก้ไฟล์ hook ตรงๆ
3. **ทำไมแก้ไฟล์ hook?** — เพราะ `exclude_commands` จับแค่คำแรก และผมเลือกทางที่ "ใช้ได้แน่" โดยไม่ได้หาว่าเครื่องมือรองรับทางไหน
4. **ทำไมไม่รู้ว่ามี integrity check?** — ไม่ได้อ่าน `rtk --help` (มี `verify` และ `hook-audit` ชัดเจน) และไม่ได้ `ls -la` โฟลเดอร์ hook (มี `.rtk-hook.sha256` แบบ read-only)
5. **ทำไมการทดสอบไม่จับ?** — ผมทดสอบเฉพาะ "hook เขียนคำสั่งใหม่ถูกไหม" ไม่ได้ทดสอบ "คำสั่ง `rtk …` ยังรันได้ไหมหลังแก้" — root cause:
   **แก้ของเครื่องมือภายนอกที่ใช้ร่วมทั้งเครื่อง โดยไม่ตรวจกลไกป้องกันและไม่ทดสอบผลจริงของเส้นทางที่มันคุม**

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับก่อน:** integrity check ของ rtk คือชั้นที่จับได้ — มันทำงานถูก (ปฏิเสธ hook ที่ถูกแก้) แต่จับหลังผลกระทบเกิดแล้ว
ไม่มีชั้นใดในฝั่งเราที่ห้ามแก้ไฟล์ใต้ `~/.claude/hooks/`

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง |
| เจ้าของงาน | ต้องรอการคืนค่า · session อื่นบนเครื่องเดียวกันที่รันคำสั่งผ่าน rtk ช่วงนั้นอาจล้ม (ไม่ได้ตรวจ session อื่น) |
| ข้อมูล / ระบบ | ไม่มีข้อมูลเสีย · hook คืนเป็นไฟล์เดิม byte-for-byte (hash เดิม) |
| ความเชื่อถือของงานรอบนั้น | push ของ #0203 รอบแรกล้มส่วนหนึ่งจากเหตุนี้ — push ใหม่ผ่านแล้ว (PR #314) |

---

## 5. แนวทางการแก้ไข (Fix)

- คืน `~/.claude/hooks/rtk-rewrite.sh` จาก `rtk-rewrite.sh.bak-20261127-pm0203` → `rtk verify` = `PASS` · `145/145 tests passed`
- P2 ทำผ่านทางที่ rtk รองรับ: `config.toml` `[hooks] exclude_commands = ["find", "ls", "grep", "diff", "wc", "npx"]` (backup `config.toml.bak-20261127-pm0203`)
  · `rtk rewrite "npx playwright test --grep X"` → ไม่เขียนใหม่ (rc=1) · `git status` / `npm run lint` ยังเขียนใหม่ตามเดิม
- รูปแบบ `VAR=… npx playwright test` ที่ `exclude_commands` ไม่จับ → ปิดด้วย P1 (ols-qa-e2e R14b, merged `1009984a`)

**ยืนยันแล้วด้วย:** `rtk verify` PASS หลังคืนค่า · `rtk rewrite` ตามรายการด้านบน

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | ห้ามแก้ไฟล์ใต้ `~/.claude/hooks/` ที่เป็นของเครื่องมือภายนอก — ปรับพฤติกรรมผ่าน config ที่เครื่องมือรองรับเท่านั้น ถ้าไม่มีช่องทาง = รายงานเจ้าของงาน | memory | ทำแล้ว (`reference_rtk-buffers-long-running-runs`) |
| P2 | หลังเปลี่ยนอะไรก็ตามที่เกี่ยวกับ rtk ต้องรัน `rtk verify` และรันคำสั่งจริงที่ผ่าน rtk หนึ่งคำสั่ง ก่อนบอกว่าเสร็จ | ขั้นตอน | ทำแล้วในรอบนี้ |
| P3 | หาว่าอะไรเขียน `.rtk-hook.sha256` เป็นค่าของไฟล์ที่ถูกแก้ระหว่าง 15:55–15:56 | สืบต่อ | ค้าง |

**กฎที่เพิ่มจากเหตุนี้:** memory rtk เพิ่มข้อ "ห้ามแก้ `rtk-rewrite.sh` — มี integrity hash ใช้ `exclude_commands` + P1 guard" — integrity check ของ rtk คือชั้นบังคับที่มีอยู่แล้ว

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** ผมเห็นข้อความ integrity FAILED ใน output ของ push ที่รันเบื้องหลัง
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ไม่ได้วัด (เวลาแก้ hook ไม่ได้บันทึก)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P2 — `rtk verify` ทันทีหลังเปลี่ยน

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ทำ backup ก่อนแก้ทั้ง hook และ config จึงคืนค่าได้ทันทีแบบ byte-for-byte · แจ้งเจ้าของงานทันที

### สิ่งที่ต้องปรับปรุง
- อ่าน `--help` / ดูไฟล์ข้างเคียงก่อนแก้ของเครื่องมือ · ทดสอบเส้นทางจริงที่เครื่องมือคุม ไม่ใช่แค่ส่วนที่ตัวเองแก้

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | คืน hook + `rtk verify` PASS | Claude | High | Done |
| 2 | P2 ผ่าน `exclude_commands` | Claude | Medium | Done |
| 3 | สืบว่าอะไรเขียน `.rtk-hook.sha256` (P3) | Claude → เจ้าของงานตัดสิน | Low | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน (นอก repo):** `~/.claude/hooks/rtk-rewrite.sh` (แก้แล้วคืนเป็นไฟล์เดิม) · rtk `config.toml` (`exclude_commands` + `"npx"`)

**หลักฐาน:**
```
rtk: hook integrity check FAILED
  Expected hash: 742418d70728fc3b...
  Actual hash:   35316c5e45db30d2...
PASS  hook integrity verified  sha256:742418d70728fc3b…   145/145 tests passed
exclude_commands = ["find", "ls", "grep", "diff", "wc", "npx"]
npx playwright test --grep X  → (no rewrite) [rc=1]
```
