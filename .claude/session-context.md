# WIP — `/sync-tc-result` build (PLAN v6 · System+Integration LIVE · Unit blocked on user · 2026-07-26)

**อ่านแผนก่อน (private):** https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/2026-07-26-sync-tc-result.md
**Probe (real ids, gitignored):** `~/GitHub/ols-qa/natty-doc/{validate,validate2,epic_check,probe_v5}.py`
**Real ids (off-repo):** `~/.ols-qa-secrets/ §5.1` + `~/ols-qa-testing-bot/sync_tc_config.json`. ห้ามเขียน id จริงลงไฟล์ใน repo นี้ (public) — placeholder เท่านั้น.

## งาน
Sync ผลทดสอบ: TC QA source sheet → 3 deliverable (System/Unit/Integration `- 03 OLS`) แยกตาม test type.
อัตโนมัติทุก 1 ชม. (launchd) + `/sync-tc-result` (ไม่รับ arg). ทุกรอบครบ+ถูก หรือไม่เขียนเลย.

## 🟢 สถานะ (2026-07-26 pm)
- ✅ **System + Integration = APPLIED 10/10 tabs, 0 fail** (`tc_result_sync.py --apply`). rows: SYS GUASE105·LEARNER449·CREATOR428·CONTENT_ADMIN118·SYSTEM_ADMIN91 · INTEG 21·95·100·28·48. seed/template เก่าถูก clear, summary-formula block ล่างเก็บไว้, L5 readback ผ่านทุก tab → 0 restore.
- ✅ **Item 2** guard: `.gitignore` clasp/oauth; SYS/INTEG/UNIT id → off-repo denylist + `check-no-secrets.sh` HASHES (self-tested: จับ id, clean บน edits). **pending:** hash script-id หลังได้ (item 5).
- ✅ **Item 3** data files off-repo: `epic_map.json`·`role_lexicon.json`·`subtab_split.json` (61/61 parent mapped, 0 UNMAPPED backbone). title→sheetId resolve live (`resolve_targets`).
- ✅ **Item 4** `tc_result_sync.py`: dry-run (Phase A) + `--preview` (per-tab block/#REF plan) + `--apply` (Phase B, S+I) รันจริงแล้ว. bucket 165/610/159 · role fallback 3% · 0 STATUS-UNMAPPED.
- ⏳ **Item 1** gate-0 image — **user only:** `clasp login` + Run `embedUnitImages` + กด **Allow (Drive)** (OAuth, AI ทำแทนไม่ได้).
- ⏳ **Item 5** Code.gs+appsscript.json+trigger (Unit CellImage) — หลัง item 1.
- ⏳ **Item 6** Unit `--apply` (keyed upsert col N) — หลัง item 1/5.
- ⏳ **Item 7** plist ทุก 1 ชม. + `commands/sync-tc-result.md`.
- ⏳ **Item 8** update `references/ols-project-guide.md` (placeholder) + merge md → main.

## Write model (จาก DECISION user: rebuild-from-source, seed ทิ้งได้, เราเป็นเจ้าของ 3 sheet)
- **Sys/Integ = rebuild ทุกรอบ:** เขียน data row 2..N sorted (natkey) + timestamp col H (เฉพาะ row ที่ tested) + hidden key col K (`ticket|TCID`) · **clear seed/template tail** ใต้ data ถึงก่อน formula-block · **KEEP** bottom QA summary-formula block · **repair** System `=COUNTIF(#REF!,"ไม่ผ่าน")` → mirror passed-count G-range (3 tab: LEARNER/CREATOR/CONTENT_ADMIN; GUASE/SYSTEM_ADMIN ไม่ต้อง). Integration formula ไม่มี #REF ไม่แตะ.
- **Unit = keyed upsert** (hidden key col N) ให้ CellImage col I ติดแถว — via Apps Script (item 5).
- 5-layer fail-closed gate ต่อ tab (L0 snapshot→L2 re-derive status/key→L3 pre-structure→write RAW+clear+fix→L5 readback, restore-on-fail). snapshot → `~/ols-qa-testing-bot/logs/tc_result_sync_snap/`.

## NOTES / open decisions
- **Integration failed-count quirk (surfaced, ไม่แก้):** ทั้ง 5 Integration tab failed-count เริ่ม `G11/G15` ไม่ใช่ `G2` (customer template quirk, ไม่ใช่ #REF) → ปล่อยไว้. ถ้าจะแก้ต้อง user เคาะ (แตะ formula ลูกค้า).
- **D9 Badge 14** unmapped (OLS-225 ×5 config→เสนอ TC012 · OLS-37 ×9 engine→TC011/TC012) — report-only default, ยังไม่บล็อก. รวม unmapped 49 = 35 no-TOR (Profile23·Course6·LP6) + 14 Badge.
- **D1** Unit TESTING/SKIPPED = 0 เคส → default (TESTING→Not Started, SKIPPED→N/A) ไม่มีผลจริง.

## รอ user (เหลือ)
1. **clasp + Drive consent** (item 1) — Unit images เท่านั้น. Sys/Integ ไม่ต้องรอ (live แล้ว).
2. D9 Badge 14 (report-only default ได้ ถ้าไม่เคาะ).

## Reuse (`~/ols-qa-testing-bot/`)
`progress_build.py` (gtok·meta·batch_get·values_batch_update·norm_status·hdr_col·a1col·LABELS) · `sheet_write.py` (plan·snapshot·write_row RAW) · `sheet_guard.py` (Gate).
⚠️ `values_batch_update` default USER_ENTERED → บังคับ RAW. Unit tabs = plain grid. `norm_status` คืน "" ทั้ง blank+unknown → แยกเองด้วย raw (blank→NOT STARTED, non-empty→STATUS-UNMAPPED).

## Prior WIP (เสร็จ)
Lot2 non-PASSED retest = COMPLETE (174/174). archive: `natty-doc/ols-lot2-nonpassed-retest-24jul.md`
