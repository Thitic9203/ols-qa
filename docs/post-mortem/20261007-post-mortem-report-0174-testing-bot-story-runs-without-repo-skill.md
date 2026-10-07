# Post-Mortem Report #0174 — บอทเทส Story โดยไม่ได้ใช้สกิลใน repo เพราะ prompt ชี้ไปไฟล์ SOP ที่ไม่มีอยู่จริง

**ระบบ:** OLS QA testing bot (`<BOT_DIR>/run.sh` + `prompt.md` / `prompt-retest.md` / `prompt-autotest.md`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** การรันเทสแบบไม่มีคน (on-demand จาก Discord และรอบตั้งเวลา) · ผลที่เขียนลงชีท/Drive/Discord ของรอบ Story
**วันที่เกิดเหตุ:** 2026-10-07 (รอบที่ยืนยันได้จาก log) — วันที่เริ่มเสียจริงตรวจไม่ได้ ดูหัวข้อ 3
**วันที่ค้นพบ:** 2026-10-07
**วันที่จัดทำรายงาน:** 2026-10-07
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — ticket ประเภท Story ถูกเทสโดยไม่ได้อ่าน SOP ของ repo (`testing-ticket-workflow`) จึงไม่มีหลักประกันว่ากฎ evidence / verdict / design compare ถูกใช้ และไม่มีอะไรเตือนเลย
**ประเภท:** เฟลเงียบ

---

## สรุปสั้น (Executive Summary)

`run.sh` ส่ง ticket ที่ไม่ใช่ Bug ไปที่ `prompt.md` ซึ่งขั้นแรกสั่งให้อ่าน `<REPO>/docs/ai-assisted-testing-template.md` — ไฟล์นี้ไม่มีใน ols-qa (อยู่ใน repo evidence) และขั้นเดียวกันยังชี้ `<REPO>/docs/ols-login-runbook.md` ที่ไม่มีอยู่จริงเช่นกัน
รอบ Story วันที่ 2026-10-07 (OLS-829, OLS-778) จึงไม่ได้ใช้สกิล `testing-ticket-workflow` ของ repo และไม่มีชั้นไหนตรวจว่า prompt ชี้ไฟล์ที่มีจริงหรือหยิบสกิลถูกตัว
แก้ด้วยแนวป้องกัน 12 ชั้น: แผนที่ mode → สกิลจุดเดียว · run.sh ปฏิเสธก่อนเริ่มถ้า WORKFLOW.md หาย / prompt ไม่ชี้ / มี path ที่ไม่มีจริง / ประเภท ticket ใน Jira ไม่ตรง mode · session ต้องเขียน `SKILL_LOADED: <path> <sha256>` และ run.sh ตรวจหลังรัน · บรรทัดผลมี `skill=` · Discord บอกชื่อสกิล · เทสใน repo บอทและใน ols-qa
สถานะ: โค้ดและเทสเขียวทั้งสอง repo · มีผลกับการรันครั้งถัดไป · listener ต้อง restart เพื่อให้ข้อความ Discord ใหม่ทำงาน

---

## 1. ปัญหา (Problem Statement)

- `<BOT_DIR>/run.sh` เลือก prompt จาก issuetype: Bug → `prompt-retest.md` (อ่าน `retest-bug-workflow/WORKFLOW.md` — ถูก) · ประเภทอื่น → `prompt.md` · autotest → `prompt-autotest.md`
- `prompt.md` Step 0 ข้อ 1 ชี้ `<REPO>/docs/ai-assisted-testing-template.md` — `git ls-tree` ของ ols-qa ไม่มีไฟล์นี้ ไฟล์อยู่ที่ `<EVIDENCE_REPO>/docs/`
- ชั้น L4 ที่เขียนใหม่ตรวจ prompt ทั้ง 3 ไฟล์แล้วเจอเพิ่มอีก 1 จุด: `prompt.md` และ `prompt-retest.md` ชี้ `<REPO>/docs/ols-login-runbook.md` ซึ่งไม่มีใน ols-qa (มีใน `<EVIDENCE_REPO>/docs/`) — ผล: `FAIL L4 1/4 referenced paths missing` ทั้งสองไฟล์
- `bot.log` วันที่ 2026-10-07: `flow mode: test -> prompt.md` ที่ 11:31:24, 13:18:04 (OLS-778), 13:30:35 (OLS-829), 13:59:04 (OLS-778)

**สิ่งที่ควรจะเป็น:** เจ้าของงานสั่ง (2026-10-07) ให้ "ใช้สกิลใน ols-qa repo เสมอ" และ "หยิบสกิลให้ถูกอัน": Story → `skills/deprecated/testing-ticket-workflow/WORKFLOW.md` · Bug → `skills/deprecated/retest-bug-workflow/WORKFLOW.md` (บันทึกใน `references/skill-routing.md` § Jira issue type → skill)

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+07) | เหตุการณ์ |
|------|-----------|
| ไม่ทราบ | prompt.md ชี้ SOP และ runbook ที่ path ใน ols-qa — ไฟล์ทั้งสองไม่อยู่ใน ols-qa (ประวัติ git ของ ols-qa เคยถูก rewrite จึงระบุวันที่ย้ายไม่ได้) |
| 2026-10-07 11:31:24 | รอบ test mode เริ่มด้วย `prompt.md` |
| 13:18:04 / 13:30:35 | **OLS-778 และ OLS-829 รันด้วย `prompt.md` ที่ชี้ SOP ที่ไม่มีอยู่จริง** |
| 13:58:15 | เธรดหลักสำรอง `prompt.md` แล้วแก้ Step 0 ให้ชี้ `testing-ticket-workflow/WORKFLOW.md` |
| 13:59:04 | OLS-778 รันใหม่ (ยังมี path runbook ที่ไม่มีจริงอยู่ใน prompt) |
| 14:09 | เริ่มสร้างแนวป้องกัน 12 ชั้น · L4 เจอ path runbook ที่ไม่มีจริงใน prompt 2 ไฟล์ |
| 14:19:22 | commit แนวป้องกันใน repo บอท (`06f12bc`) — เทสเขียว |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไมรอบ Story ไม่ได้ใช้สกิลของ repo?** — เพราะ `prompt.md` สั่งให้อ่าน SOP ที่ path ใน ols-qa ซึ่งไม่มีไฟล์อยู่ ไม่ได้ชี้ `testing-ticket-workflow/WORKFLOW.md`
2. **ทำไม prompt ชี้ไฟล์ที่ไม่มีได้?** — เพราะเอกสารถูกย้ายไป repo evidence แต่ prompt ของบอทอยู่นอก repo และไม่มีอะไรผูกสองฝั่งไว้
3. **ทำไม session ไม่หยุดเมื่ออ่านไฟล์ไม่เจอ?** — เพราะ prompt ไม่ได้บังคับให้พิสูจน์ว่าโหลดสกิลแล้ว session headless จึงเดินต่อจากความรู้ทั่วไป
4. **ทำไม run.sh ไม่จับ?** — เพราะ run.sh ตรวจแค่ว่าไฟล์ prompt อ่านได้ ไม่ตรวจว่า prompt ชี้สกิลที่ถูกและไฟล์ที่ชี้มีจริง และไม่ตรวจผลหลังรันว่าโหลดสกิลแล้ว
5. **ทำไมไม่มีชั้นไหนเลย?** — เพราะไม่มีแหล่งความจริงจุดเดียวว่า mode/ประเภท ticket ใดต้องใช้สกิลไหน การเลือกสกิลจึงเป็นข้อความใน prompt ที่ไม่มีใครตรวจ — นี่คือ root cause ที่ต้องปิดทั้งคลาส

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** ไม่มีชั้นไหนครอบเลย — guard เดิมของบอทดูแลเรื่อง false alarm, lock, VPN, การเขียนชีท/Drive แต่ไม่มีชั้นที่ดูว่าใช้สกิลถูกตัว

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึงระบบลูกค้าโดยตรง — บอทไม่เขียน Jira ใน test mode · ผลอยู่ในชีท/Drive/Discord ภายใน |
| เจ้าของงาน | ต้องสั่งแก้และสั่งสร้างแนวป้องกันเอง |
| ข้อมูล / ระบบ | ไม่มีข้อมูลเสียหายจากการแก้นี้ · ผลที่รอบ Story เขียนไว้ยังไม่ได้ตรวจในรายงานนี้ |
| ความเชื่อถือของงานรอบนั้น | ผลรอบ Story ที่รันด้วย prompt เดิมไม่มีหลักประกันว่าใช้ SOP ของ repo — ควรตรวจซ้ำก่อนใช้ (Action #2) |

---

## 5. แนวทางการแก้ไข (Fix)

- `prompt.md` Step 0 ชี้ `testing-ticket-workflow/WORKFLOW.md` (เธรดหลักแก้ 13:58) · path runbook ใน `prompt.md` และ `prompt-retest.md` แก้ไปที่ repo evidence
- แนวป้องกัน 12 ชั้น (หัวข้อ 6) ใน repo บอท commit `06f12bc` และใน ols-qa commit เดียวกับรายงานนี้

**ยืนยันแล้วด้วย:** `skill_guard.py preflight` ทั้ง 3 mode → `SKILL_GUARD OK` และ `PASS L4 4/4` · `test_skill_guard.py` 29 ผ่าน · `test_runsh_skill_guard.sh` 17 ผ่าน 0 ไม่ผ่าน · `test_skill_label.js` 6 ผ่าน · `tools/skill-routing-guard/skill_routing_map.test.js` 10 ผ่าน และเฟลจริงเมื่อย้ายไฟล์ WORKFLOW.md ออก (known-answer)

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| L1 | `skill_routing.json` = แหล่งความจริงจุดเดียว mode → prompt + WORKFLOW.md · ตรวจว่าไม่ขัดกฎเจ้าของงานและตรงกับ prompt ที่ run.sh เลือก | เครื่องมือ | ทำแล้ว |
| L2 | run.sh ปฏิเสธก่อนเริ่ม ถ้า WORKFLOW.md ที่ต้องใช้ไม่มีหรือว่าง | เครื่องมือ | ทำแล้ว |
| L3 | ปฏิเสธ ถ้า prompt ไม่ได้ชี้ WORKFLOW.md ของ mode นั้น | เครื่องมือ | ทำแล้ว |
| L4 | ปฏิเสธ ถ้า path แบบเต็มใต้โฟลเดอร์ repo ที่ prompt ชี้มีตัวใดไม่มีจริง | เครื่องมือ | ทำแล้ว |
| L5 | อ่านประเภท ticket จาก Jira (GET อย่างเดียว) ก่อนเริ่ม เทียบกับ mode ที่ listener ส่งมา ไม่ตรง/อ่านไม่ได้ = ปฏิเสธ | เครื่องมือ | ทำแล้ว |
| L6 | prompt ทุกไฟล์: ขั้นแรกต้องเขียน `SKILL_LOADED: <path> <sha256>` และตรวจประเภท ticket ไม่ตรง = HARNESS_FAIL | กฎใน prompt | ทำแล้ว |
| L7 | run.sh ตรวจ receipt หลังรัน ไม่มี/ผิด = บรรทัด FAIL แยก (ความล้มเหลวของ harness ไม่ใช่ผลของ ticket) | เครื่องมือ | ทำแล้ว |
| L8 | บรรทัดผลใน results.log มี `skill=<name>` และ run.sh ตรวจว่าตรงกับสกิลของรอบ | เครื่องมือ | ทำแล้ว |
| L9 | ข้อความเริ่มรันใน Discord บอกชื่อสกิล | เครื่องมือ | ทำแล้ว (รอ restart listener) |
| L10 | เทสใน repo บอท: Story / Bug / Task / ประเภทไม่รู้จัก / WORKFLOW หาย / prompt ไม่ชี้ / prompt ชี้ path ที่ไม่มี (ต้องเจอ 1 · ต้องไม่เจอ 1) | เทส | ทำแล้ว |
| L11 | เทสใน ols-qa ตรวจว่า WORKFLOW.md ทั้งสองไฟล์มีจริงและ `references/skill-routing.md` แมป Story/Bug ถูก — อยู่ในชุด `bash scripts/run-test-suites.sh` และ pre-push เดิม | เทส | ทำแล้ว |
| L12 | รายงานนี้ + กฎหนึ่งบรรทัดใน `docs/AGENT_BOARD.md` | กฎ | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** `docs/AGENT_BOARD.md` — การรันแบบไม่มีคนต้องใช้สกิลของ repo ตาม `references/skill-routing.md` § Jira issue type → skill และพิสูจน์ด้วยบรรทัด `SKILL_LOADED`

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** เธรดหลักไล่ดูว่ารอบ Story อ่าน prompt อะไร แล้วพบว่าไฟล์ SOP ไม่มีอยู่จริง
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ตรวจไม่ได้ว่าเริ่มเสียเมื่อไหร่ (หัวข้อ 2)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** L2–L5 ปฏิเสธตั้งแต่ก่อนเริ่ม session · L7/L8 จับหลังรัน · L11 ทำให้การย้ายไฟล์สกิลใน ols-qa เฟลที่ pre-push ทันที

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- ชั้น L4 ถูกทดสอบกับ prompt จริงก่อนเชื่อ และเจอ path ที่เสียเพิ่มอีกจุดทันที

### สิ่งที่ต้องปรับปรุง
- ไฟล์ที่ระบบนอก repo พึ่งพา (prompt ของบอท) ต้องมีเทสผูก path ไว้ตั้งแต่วันแรก การย้ายเอกสารระหว่าง repo ต้องไล่ผู้ใช้ทุกตัว

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | restart Discord listener เพื่อให้ข้อความ L9 ทำงาน | เจ้าของงาน | Medium | Open |
| 2 | ตรวจผลรอบ Story ที่รันด้วย prompt เดิม (2026-10-07 และก่อนหน้า) ว่าต้องรันใหม่ไหม | เจ้าของงาน | High | Open |
| 3 | ตัดสินว่า Task / Epic / Sub-task ใช้สกิลไหน (ตอนนี้คงเส้นทางเดิมและบันทึก `skill=` ไว้) | เจ้าของงาน | Medium | Open |
| 4 | การปฏิเสธที่ preflight แจ้งแค่ macOS + results.log ไม่ส่ง Discord — ตัดสินว่าต้องแจ้งเธรดไหม | เจ้าของงาน | Low | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน (repo บอท, private):** `skill_routing.json` · `skill_guard.py` · `run.sh` · `prompt.md` · `prompt-retest.md` · `prompt-autotest.md` · `listener/index.js` · `listener/skill_label.js` · `tests/test_skill_guard.py` · `tests/test_runsh_skill_guard.sh` · `tests/test_skill_label.js` · `tests/test_rtt_apply_notify.py` · `.gitignore`

**ไฟล์ที่เปลี่ยน (ols-qa):** `references/skill-routing.md` · `tools/skill-routing-guard/skill_routing_map.test.js` · `docs/AGENT_BOARD.md` · รายงานนี้และดัชนี

**Commit:** repo บอท `06f12bc` · ols-qa: commit เดียวกับรายงานนี้

**หลักฐาน:**
```
FAIL L4 1/4 referenced paths missing: <REPO>/docs/ols-login-runbook.md   (prompt.md, ก่อนแก้)
FAIL L4 1/4 referenced paths missing: <REPO>/docs/ols-login-runbook.md   (prompt-retest.md, ก่อนแก้)
PASS L4 4/4 referenced paths exist · SKILL_GUARD OK skill=testing-ticket   (หลังแก้)
FAIL  skills/deprecated/retest-bug-workflow/WORKFLOW.md exists and is non-empty   (known-answer: ย้ายไฟล์ออกชั่วคราว)
```
