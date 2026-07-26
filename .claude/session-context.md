# WIP — `/sync-tc-result` (System+Integration LIVE · Unit image = 2 user-clicks away · 2026-07-27)

**แผน (private):** https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/2026-07-26-sync-tc-result.md
**Real ids (off-repo):** `~/.ols-qa-secrets/ §5.1` + `~/ols-qa-testing-bot/sync_tc_config.json`. ห้ามเขียน id จริงลง repo นี้ (public) — placeholder เท่านั้น.

## งาน
Sync ผลทดสอบ: QA source sheet → 3 deliverable (System/Integration/Unit `- 03 OLS`) แยกตาม Type.
launchd ทุก 1 ชม. + `/sync-tc-result`. ทุกรอบครบ+ถูก หรือไม่เขียนเลย (5-layer gate).

## 🟢 สถานะ
- ✅ **System + Integration = LIVE** (`tc_result_sync.py --apply`, 10/10 tabs, verified, 0 restore, #REF repaired ×3). rows SYS 105·449·428·118·91 · INTEG 21·95·100·28·48.
- ✅ **Items 2,3,4,7,8 done** · guide+command+guard+plist(staged OFF)+GAS ทั้งหมด committed→main.
- 🟡 **Unit image (item 1/5)** — โค้ดเสร็จหมด รอ user click:
  - GAS committed `docs/tc-result-img/{Code.gs,appsscript.json}`: real DriveApp embed by fileId · `authorizeAndRun()` = one-shot (self-test in-cell render → embed all → install hourly trigger) · owns col I เท่านั้น · scopes = spreadsheets + drive.readonly.
  - Python matcher `tc_img_manifest.py` **สร้าง+dry-run แล้ว**: match Unit case → Drive Capture evidence (จับ TCID ปนๆ: `TC03_`, `TC_17_`, subfolder `TC_13/`, ER suffix). **coverage ~63% (73/116 · 43 no-file-match** = ไฟล์ไม่ตั้งชื่อตาม TCID หรือไม่มี shot ราย TC). manifest JSON: `~/ols-qa-testing-bot/logs/tc_img_manifest.json`.
  - clasp = local 3.3.0 (`~/ols-qa-gas-tc-img/`, `npm i` แล้ว), login ค้างตั้งแต่ 24 Jul (valid).
- 🔴 **Item 6 (Unit write) ยังไม่สร้าง** — `tc_result_sync.apply()` = S+I เท่านั้น. ต้องเพิ่ม Unit upsert (write A–H,J–N keyed col N + hidden `_img_manifest` tab จาก manifest JSON) — **production write, ต้อง approve**.

## 🔴 morning: 2 user clicks (Google security — AI ทำแทนไม่ได้ ทั้งคู่)
1. **เปิด Apps Script API:** `script.google.com/home/usersettings` → toggle **ON** → บอก AI "done"
2. AI: (a) เขียน Unit rows + `_img_manifest` ลง Unit sheet [**approve production write ก่อน**] (b) `clasp create-script --type sheets --parentId <UNIT>` + `clasp push` (headless, ได้หลัง API on)
3. **Run `authorizeAndRun` → กด Allow** (Unit sheet ▸ Extensions ▸ Apps Script) → self-test เช็ค in-cell render → embed รูป + ตั้ง trigger ราย ชม.
   - ⚠️ **data-URL-in-CellImage render ยังไม่ยืนยัน** (finding R1). self-test ตอบตอน Run ครั้งแรก. ถ้า fail → fallback = `insertImage()` over-cell (พิมพ์ได้ แต่ไม่ติด cell เป๊ะ).
- เหตุผลต้องปริ้นได้ → **ต้องรูป inline จริง** (ลิงก์ปริ้นไม่ออก) = user ยืนยัน 27 Jul.

## Write model (S+I, live)
rebuild data row 2..N sorted + timestamp tested rows + hidden key col K · clear seed/template tail ถึงก่อน formula-block · **KEEP** bottom QA summary-formula block · **repair** System `=COUNTIF(#REF!,…)` → mirror passed-count G-range. Integration failed-count เริ่ม G11/G15 (customer quirk, ไม่แตะ). snapshot `logs/tc_result_sync_snap/`.

## เปิดค้าง / decisions
- **D9 Badge 14** unmapped (OLS-225 ×5 · OLS-37 ×9) — report-only default ได้.
- **arm auto ทุก 1 ชม.?** plist staged OFF (`~/Library/LaunchAgents/…ols-tc-result-sync.plist.disabled-2026-07-26`). S+I only จน Unit เสร็จ.
- unmatched Unit 43 เคส: ไม่มีรูป auto — อาจต้อง manual link หรือยอมรับ col I ว่างเคสนั้น.
- **Drive scope discovery:** `.gcp-oauth.json` = full `auth/drive` (แผน §6 บอก "Sheets-only" ผิด) → Python อ่าน/เขียน Drive+Sheets ได้หมด. แต่ base64 data-URL ใหญ่เกิน cell 50k → script ยังต้อง DriveApp fetch เอง (เลยต้อง drive.readonly consent).

## Reuse (`~/ols-qa-testing-bot/`)
`progress_build.py`(gtok·meta·batch_get·values_batch_update·norm_status·hdr_col·LABELS) · `sheet_write.py` · `sheet_guard.py` · `drive_upload.py`(mint_token·list_folder — full drive scope). ⚠️ batch_update default USER_ENTERED → RAW. `norm_status` คืน "" ทั้ง blank+unknown.

## Prior WIP (เสร็จ)
Lot2 non-PASSED retest COMPLETE (174/174). archive `natty-doc/ols-lot2-nonpassed-retest-24jul.md`.
