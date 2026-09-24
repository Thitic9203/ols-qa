# Post-Mortem Report #0143 — บรีฟสั่ง subagent ให้ grep ไฟล์เก็บรหัสผ่านหาบัญชี แล้วตัวกรองหลุด พิมพ์บรรทัดรหัสผ่านเข้า session

**ระบบ:** OLS QA workspace — การจ่ายงาน subagent ตรวจเคสค้างเชิงโค้ด (ชุด A) รอบ training69 VDO
**สภาพแวดล้อมที่ได้รับผลกระทบ:** transcript ของ session บนเครื่องเจ้าของงาน (ไม่แตะ env ของ OLS ไม่แตะ repo)
**วันที่เกิดเหตุ:** 2026-09-24
**วันที่ค้นพบ:** 2026-09-24
**วันที่จัดทำรายงาน:** 2026-09-24
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — รหัสผ่านบัญชีทดสอบ 1 บรรทัดอยู่ใน transcript ภายในเครื่อง ไม่ได้ออกไปที่ไฟล์ repo หรือคำตอบ แต่ transcript ถูกบีบอัด/ค้นซ้ำได้
**ประเภท:** แตะของห้ามแตะ — ข้อมูลลับเข้าบริบทของ agent เพราะบรีฟชี้ไปที่แหล่งที่มีรหัสผ่าน
**กฎที่เพิ่มจากเหตุนี้:** `agent-dispatch-guard` check 5 `SECRETS_STORE_IN_BRIEF` — บรีฟที่อ้างที่เก็บ secrets ของเจ้าของงาน = ปฏิเสธ · ใช้รายชื่อบัญชีที่ไม่มีรหัสผ่าน `capture/accounts_<env>.json` แทน · เทสต์ 32/32

---

## สรุปสั้น (Executive Summary)

ตอนสั่งให้ตรวจ Authen_TC_006 ว่ามีบัญชีผู้เรียนบน training69 ตัวไหนที่ใช้ได้ บรีฟของเธรดหลักเขียนว่า "Account list: grep `~/.ols-qa-secrets/ols-secrets.md` for training69; never print passwords" subagent ทำตาม แต่ตัวกรองหลุด บรรทัดที่มีรหัสผ่าน 1 บรรทัดจึงถูกพิมพ์เข้า transcript agent รายงานความผิดนี้เองในคำตอบสุดท้าย โดยไม่ได้เขียนรหัสผ่านลงไฟล์หรือลงคำตอบ ทั้งที่มีรายชื่อบัญชีที่ไม่มีรหัสผ่านอยู่แล้ว คือ `capture/accounts_training69.json` (มี 10 แถว ฟิลด์ email/env/role_ols/row/tag) ต้นเหตุคือบรีฟชี้ไปที่แหล่งที่ผิด และไม่มีตัวตรวจที่ขอบการจ่ายงาน รอบนี้เพิ่ม check 5 ใน `agent-dispatch-guard` พร้อมเทสต์

## 1. ปัญหา (Problem Statement)

- **สิ่งที่ควรเกิด:** agent ได้รายชื่อบัญชี training69 (tag/role) โดยไม่มีรหัสผ่านผ่านเข้าบริบทเลย
- **สิ่งที่เกิดจริง:** บรรทัดรหัสผ่าน 1 บรรทัดเข้า transcript ของ subagent
- **ขอบเขต:** transcript ในเครื่องเท่านั้น ไม่ได้อยู่ในไฟล์ผล (`deep_A_0924.md`) ไม่ได้อยู่ในคำตอบ และไม่ได้เข้า repo

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ |
|------------|-----------|
| ~09:5x | เจ้าของงานสั่งให้ตรวจเคสค้างถึงระดับโค้ด · เธรดหลักจ่ายงาน 3 ชุด · บรีฟชุด A มีบรรทัด grep ไฟล์ secrets |
| ~10:00 | subagent ชุด A จบ รายงานเองว่าพิมพ์บรรทัดรหัสผ่าน 1 บรรทัดเข้า session |
| ~10:00 | เปิดแถว PM-2026-09-24-11 |
| 10:04 | เพิ่ม check 5 + เทสต์ 2 ข้อ · ชุดเทสต์ 32/32 |

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไมรหัสผ่านเข้า session?** — เพราะ subagent grep ไฟล์ secrets และตัวกรองไม่ได้ตัดคอลัมน์รหัสผ่าน
2. **ทำไม subagent grep ไฟล์นั้น?** — เพราะบรีฟสั่งให้ทำตรงๆ ("grep … for training69")
3. **ทำไมบรีฟสั่งแบบนั้น?** — เพราะเธรดหลักนึกถึงไฟล์ secrets ในฐานะแหล่งรายชื่อบัญชี โดยไม่ได้ค้นว่ามีรายชื่อที่ไม่มีรหัสผ่านอยู่แล้ว (`capture/accounts_training69.json`)
4. **ทำไมคำว่า "never print passwords" ไม่พอ?** — เพราะเป็นคำเตือน ไม่ใช่ข้อจำกัด เครื่องมืออ่านไฟล์คืนทั้งบรรทัด ความถูกต้องจึงขึ้นกับตัวกรองที่ agent เขียนเองแต่ละครั้ง
5. **ทำไมไม่มีชั้นใดหยุดก่อนจ่ายงาน?** — (root cause) `agent-dispatch-guard` ตรวจการเขียนผลลงดิสก์ ภาพหน้าจอ การสแกนไม่มีขอบเขต และ preload ของ proxy แต่ไม่ตรวจว่าบรีฟชี้ agent ไปที่ข้อมูลลับหรือไม่

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `agent-dispatch-guard` — มี 4 checks ไม่มี check ด้านข้อมูลลับ (ก่อนแก้ `grep -c -i secret dispatch_rules.js` = 0)
- `issue-creation-guard` · `investigation-guard` — คนละเรื่อง
- `scripts/check-no-secrets.sh` / pre-commit — ตรวจเฉพาะสิ่งที่จะเข้า repo ไม่ได้ตรวจบริบทของ agent

## 4. ผลกระทบ (Impact)

- รหัสผ่านบัญชีทดสอบ 1 รายการอยู่ใน transcript ของเครื่องเจ้าของงาน
- ไม่มีการรั่วออกนอกเครื่อง: ไม่อยู่ในไฟล์ผล repo หรือคำตอบถึงผู้ใช้ (ตามที่ agent รายงาน · เธรดหลักค้นค่ารหัสผ่านที่ดึงได้จากไฟล์ secrets 2 ค่าในไฟล์ `deep_*` 6 ไฟล์ พบ 0 — ตัวดึงค่าจับได้เพียง 2 ค่า จึงยืนยันได้เฉพาะ 2 ค่านั้น)

## 5. แนวทางการแก้ไข (Fix)

- บรีฟชุดต่อไปใช้ `capture/accounts_<env>.json` หรือระบุ tag ตรงๆ
- เจ้าของงานพิจารณาเปลี่ยนรหัสผ่านของบัญชีทดสอบนั้น ถ้าต้องการ (transcript อยู่ในเครื่องเท่านั้น)

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

1. **check 5 `SECRETS_STORE_IN_BRIEF` ใน `tools/agent-dispatch-guard/dispatch_rules.js`** — บรีฟที่มี `.ols-qa-secrets` หรือ `ols-secrets.md` = BLOCK พร้อมบอกทางที่ถูก
2. **เทสต์:** ต้องพบ 1 ข้อ (ถ้อยคำจริงของบรีฟที่เกิดเหตุ) · ต้องไม่พบ 1 ข้อ (บรีฟที่ใช้ `accounts_training69.json`) · รวม 32/32

## 7. การตรวจจับปัญหา (Detection)

- subagent รายงานเองในคำตอบสุดท้าย · ไม่มีชั้นเครื่องจับได้ก่อน

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- agent ไม่เขียนรหัสผ่านต่อลงไฟล์หรือคำตอบ และรายงานความผิดเองทันที

### สิ่งที่ต้องปรับปรุง
- ก่อนชี้แหล่งข้อมูลให้ agent ค้นหาแหล่งที่ไม่มีข้อมูลลับก่อนเสมอ

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | check 5 + เทสต์ใน `agent-dispatch-guard` | Claude | High | Done (32/32) |
| 2 | พิจารณาเปลี่ยนรหัสผ่านบัญชีทดสอบที่หลุดเข้า transcript | เจ้าของงาน | Low | Open |

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- `tools/agent-dispatch-guard/dispatch_rules.js` — `SECRETS_STORE_RE` + check 5
- `tools/agent-dispatch-guard/dispatch_rules.test.js` — เทสต์ 2 ข้อ
- `docs/post-mortem/20260924-post-mortem-report-0143-brief-sent-agent-to-secrets-store-password-line-printed.md` — รายงานนี้
- `docs/post-mortem/README.md` · `docs/post-mortem/PENDING.md` · `docs/CLAUDE-ARCHIVE.md`

**หลักฐาน:** *(repo public — ไม่มีรหัสผ่าน อีเมล หรือ host)*
```
# ถ้อยคำในบรีฟชุด A
Account list: grep `~/.ols-qa-secrets/ols-secrets.md` for training69; never print passwords.

# แหล่งที่ไม่มีรหัสผ่านที่มีอยู่แล้ว
capture/accounts_training69.json : list 10 แถว · keys = email, env, role_ols, row, tag

# หลังแก้
node tools/agent-dispatch-guard/dispatch_rules.test.js -> all green — 32 test(s) ran
  ok PM-2026-09-24-11 incident wording (grep the secrets store) is BLOCKED
  ok PM-2026-09-24-11 brief using the password-free account list passes
```
