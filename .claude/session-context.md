# WIP — `/sync-tc-result` (System+Integration LIVE · Unit rows+images DONE · 2026-07-27)

**แผน (private):** https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/2026-07-26-sync-tc-result.md
**Real ids off-repo:** `~/.ols-qa-secrets/ §5.1` · `~/ols-qa-testing-bot/sync_tc_config.json`. Repo นี้ public → placeholder เท่านั้น.

## 🟢 สถานะ (ทำเสร็จคืน 26→27 Jul, user ไปนอน สั่งทำครบเอง)
- ✅ **System + Integration = LIVE** (10/10 tabs, verified, #REF repaired).
- ✅ **Unit deliverable = เขียนครบ**: `unit_apply.py --write` → **116 rows / 9 tabs** (TC001·002·004·005·006·007·008·010·012). cols A–N, Python owns A–H+J–N, Apps Script owns col I.
- ✅ **รูป Unit**: matcher `tc_img_manifest.py` → **manifest 66 images** (Passed/PWMI + มีรูป ER); multi-shot → **composite แนวตั้ง gray-gap** (Pillow) → `_composites` folder (33 ไฟล์); rowH คำนวณให้อ่านออก. Apps Script `<UNIT_SCRIPT_ID>` (owner <QA_ACCOUNT>) push แล้ว + **hourly trigger ติดตั้ง** → embed col I (idempotent marker-skip, self-heal ข้ามรอบ). data-URL render + marker readback = **พิสูจน์แล้ว** (TC012 user เห็นรูปจริง).
- 🔎 **ยัง verify ไม่ได้ = image RENDER ครบ 66**: Sheets REST API มองไม่เห็น CellImage (คืน {} เสมอ) + รัน Apps Script เองไม่ได้ → ต้อง**ดูตา** หรือ run `verifyImages` (ยังไม่เขียน). trigger จะ embed ให้ภายในไม่กี่รอบ ชม.

## Logic (เคาะกับ user)
- **Image** เฉพาะ `Passed`/`Passed with minor` + มีรูป ER. หลายรูป → ต่อแนวตั้ง gray-gap เป็นรูปเดียว. อื่น → script เขียน **TBC** ("TBC – จะแนบภาพหลักฐานหลังทดสอบผ่าน") ใน col I.
- **K Test Date** = createdTime ไฟล์รูป (วัน capture) DD/MM/YYYY สำหรับ tested (Passed/PWMI/Failed มีรูป); **cell-history API เข้าไม่ได้** (Drive Activity 403 · revisions เหลือ 1 pruned) → capture date จริงสุดที่ได้. ไม่มีรูป/ยังไม่เทส/ข้าม/blocked → **TBC**.
- **L Test By** = QA owner ชื่อแรกอังกฤษ (source col K → `Firstname` (ต.ย.); ตัด `.k`/`(Nick)`); not-tested → TBC.
- Row layout = flat rebuild (label rows "Function:/Sub Function:" เดิมถูก unmerge ทิ้ง — decision "we own"). C=Test Title · D=Acceptance Criteria (source ไม่มี Scenario/Description แยก) · B Sub Function = ว่าง.

## Bugs แก้แล้ว (systematic-debug, ไม่เดา)
1. **merged-cell collapse** — Unit tabs มี merged band (Function/Sub-Function label เดิม) → เขียนลง merged row ยุบเหลือ top-left = ว่าง. Fix: `unmergeCells` ก่อนเขียน.
2. **URL 404 บน tab มี `/`** (TC007) — `urllib.parse.quote` default `safe='/'` ไม่ encode `/` → path พัง. Fix: `safe=''`.
3. **owner `.k`** — email handle → ตัด `.`/`@`/`,` ด้วย.

## Off-repo tools (`~/ols-qa-testing-bot/`)
- `unit_apply.py` — orchestrator (route→evidence→date→composite→write rows+manifest). `--write` / `--tab TC0NN`.
- `tc_img_manifest.py` — matcher (confidence HIGH/MULTI/FOLDER, correctness-first) + composite (Pillow, W=460, gray gap 22, rowH cap 1400).
- `tc_result_sync.py` — route/S+I apply (เพิ่ม `ac`,`owner` ใน placement).
- clasp login = <QA_ACCOUNT> (`~/.clasprc.json`); push ผ่าน **Apps Script API ตรง** (clasp CLI 3.3.0 token bug → 404, ใช้ API `projects/{id}/content` แทน).

## Shares ที่ทำ (ผ่าน <DRIVE_OWNER> .gcp-oauth = เจ้าของ)
Capture folder + Unit sheet → share ให้ **<QA_ACCOUNT>** (script รันเป็น qa ต้องเข้าถึงรูป+sheet). `_composites` folder อยู่ใน Capture root → qa inherit.

## เหลือ / ควรทำต่อ
- **ดูรูปจริง** ว่า embed ครบ 66 + ขนาด/gap โอเค (user เห็น TC012 แล้ว OK).
- Content ยังหยาบ: B Sub Function ว่าง · C/D = Title/AC. ถ้าลูกค้าอยากได้ grouping → refine.
- Image coverage ~63% (unmatched passed → TBC date + no image; naming ไฟล์ Drive ปนกัน). 43 เคสไม่มีรูป auto.
- Sys/Integ automation plist staged OFF · commit code files · D9 Badge 14 (report-only).

## Prior WIP (เสร็จ)
Lot2 non-PASSED retest COMPLETE (174/174). archive `natty-doc/ols-lot2-nonpassed-retest-24jul.md`.
