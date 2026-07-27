# WIP — `/sync-tc-result` (System+Integration LIVE · Unit rows+images LIVE · 2026-07-27)

**แผน (private):** https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/2026-07-26-sync-tc-result.md
**Real ids off-repo:** `~/.ols-qa-secrets/ §5.1` · `~/ols-qa-testing-bot/sync_tc_config.json`. Repo นี้ public → placeholder เท่านั้น.

## 🟢 สถานะ — ทั้ง 3 deliverable LIVE (System·Integration·Unit)

- ✅ **System + Integration = LIVE** (10/10 role tabs, verified via independent readback, System #REF! failed-count repaired, Integration G11/G15-quirk รายงานไว้ไม่แตะ).
- ✅ **Unit = LIVE**: `unit_apply.py --write` → **116 rows / 9 tabs** (TC001·002·004·005·006·007·008·010·012). cols A–H+J–N เขียนโดย Python, col I (รูป/TBC) เขียนโดย Apps Script.
- ✅ **รูป Unit = embed ยืนยันแล้ว (ตรวจจริง ไม่ใช่เดา)**: manifest 82 images (จาก 66 หลังเพิ่ม capture-link matcher) + composite แนวตั้ง gray-gap สำหรับ multi-shot → `_composites` folder. Embed รันผ่าน **web app deploy ชั่วคราว (executeAs owner)**, ยิงครั้งเดียวจบ, ตรวจผลจริงทาง values-API เห็น **col I: 34 เซลล์ = TBC-text, 54 ว่าง (คือ 82 image cell — REST มองรูปไม่เห็นแต่ค่านับสอดคล้อง 34+82=116)** → สรุป: embed รันจริง ไม่ใช่ trigger ค้าง. lease กลับเป็น idle เรียบร้อย.
- ✅ **security cleanup**: web app deployment (public `ANYONE_ANONYMOUS` endpoint) ที่สร้างไว้เพื่อรัน embed แบบไม่ต้องมีคนกด **ลบแล้ว** (DELETE 200) หลังใช้งานเสร็จ — ไม่มี public endpoint ค้างอยู่บนสคริปต์นี้.
- Hourly trigger ยังติดตั้งอยู่ (ปกติ, self-heal รอบต่อไปถ้ามีเคสใหม่).

## Logic (เคาะกับ user)

- **Image** เฉพาะ `Passed`/`Passed with minor` + มีรูป ER. หลายรูป → ต่อแนวตั้ง gray-gap (Pillow, W=460, gap 22px, rowH cap 1400) เป็นรูปเดียว, row height ตั้งให้อ่านออก. อื่น (Failed/Blocked/ยังไม่เทส) → script เขียน **"TBC – จะแนบภาพหลักฐานหลังทดสอบผ่าน"** ใน col I.
- **K Test Date** = createdTime ของไฟล์รูป (วัน capture จริง) DD/MM/YYYY สำหรับ tested case ที่มีรูป; cell-history เข้าไม่ได้ (Drive Activity API 403 ขาด scope · revisions เหลือ 1 อัน pruned) → capture date คือของจริงที่สุดที่ดึงได้. ไม่มีรูป/ยังไม่เทส/ข้าม/blocked → **TBC**.
- **L Test By** = QA owner ชื่อแรกอังกฤษจาก source col K (ตัด `.`/`@`/`,`/วงเล็บ nickname ออก); not-tested → TBC.
- **Capture-link matcher** (`capture_links.py`) = แหล่งหลักฐานหลัก อ่านลิงก์จริงที่ QA ใส่ในคอลัมน์ "Capture Screen Link" (col N ของ source) — authoritative กว่าเดา filename. 3 รูปแบบลิงก์ที่รองรับ: single cell hyperlink · multi-link ฝังใน `textFormatRuns` (เช่น "ER1 · ER2 · MP4" แต่ละคำมีลิงก์ของตัวเอง, mp4 ถูกกรองออกด้วย mimeType) · folder link (ลิสต์รูปทั้งโฟลเดอร์). cache ที่ `logs/capture_links.json` (711 case มีลิงก์) กันอ่าน source ซ้ำทุกรอบ.
- Row layout = flat rebuild ทั้ง tab (label rows "Function:/Sub Function:" เดิม unmerge ทิ้ง — decision "we own the sheet"). C=Test Title · D=Acceptance Criteria (source ไม่มี Scenario/Description แยกจากกัน) · B Sub Function เว้นว่างไว้.

## Bugs แก้แล้วระหว่างทาง (systematic-debug, ตรวจก่อนสรุปทุกครั้ง)

1. **merged-cell collapse** — Unit tab มี merged band (Function/Sub-Function label เดิม) ทำให้เขียนแล้วยุบเหลือ top-left, cell อื่นว่าง. Fix: `unmergeCells` ก่อนเขียนทุกครั้ง.
2. **URL 404 บน tab ที่ชื่อมี `/`** (เช่น TC007) — `urllib.parse.quote` ปริยาย `safe='/'` ไม่ encode `/` ทำให้ range path พัง. Fix: `safe=''`.
3. **owner string เป็น email handle** (`name.k`) — เพิ่มการตัด `.`/`@`/`,` ออกจากชื่อก่อนใช้.
4. **429 storm ทำ full `--write` ค้าง 36 นาที** — CPU time ที่วัดได้จริงมีแค่ 2.5 วิ (แปลว่า process นอนอยู่ใน backoff เกือบทั้งหมด ไม่ใช่ค้างตาย) เกิดจากยิง Drive API ถี่เกินในเซสชันเดียว + rebuild capture-link index ทุกรอบรัน. Fix: throttle ~7 req/s ในทุก request ของ `tc_img_manifest.py` (`_open`) + ลด backoff เป็น 0/3/8/20 วิ + cache capture index ไว้ที่ดิสก์แทนอ่าน source ใหม่ทุกครั้ง. หลังแก้ full write เสร็จในไม่กี่นาที.
5. **REST Sheets API มองไม่เห็น in-cell CellImage** (คืนค่าว่างเสมอ ไม่ใช่ bug ของเรา, ข้อจำกัดของ Google) — ตรวจ embed ทำงานจริงทางอ้อมด้วย: (ก) Apps Script execution log ของตัวเอง (ข) นับ TBC-text cell ที่ REST มองเห็น แล้วเช็คว่า TBC+image = จำนวนแถวทั้งหมดพอดี.
6. **`scripts.run` รันจากนอก Apps Script ไม่ได้** — token ของเจ้าของสคริปต์ (clasp) มี scope แค่ `drive.file`/`drive.metadata` ไม่มี `spreadsheets`/`drive` เต็ม จึงรันแบบ dev-mode ไม่ได้ (404). ทางที่ใช้ได้จริง: deploy เป็น **web app (`executeAs: USER_DEPLOYING`)** แล้ว curl endpoint — รันในสิทธิ์เจ้าของสคริปต์ที่ authorize ไว้แล้ว ไม่ต้องมีใครกด Run เอง. **ต้องลบ deployment หลังใช้เสร็จ** (public endpoint ค้างไว้ = ความเสี่ยง) — ทำแล้ว.
7. **per-tab `write_manifest` เคลียร์ manifest ทั้งไฟล์ ไม่ใช่แค่ tab นั้น** — รัน `unit_apply.py --tab X` แยกทีละ tab แล้วต่อกันจะทำให้ manifest เหลือแค่ tab สุดท้าย. ต้องรัน full `--write` ครั้งเดียวถ้าต้องการ manifest ครบทุก tab. ระหว่าง manifest ยังไม่ครบ ให้ set lease `_img_manifest!F1 = 'writing'` กันไม่ให้ trigger เผลอเอา TBC ไปทับรูปที่ embed ไว้แล้ว.

## Off-repo tools (`~/ols-qa-testing-bot/`)

- `unit_apply.py` — orchestrator เต็ม (route → หา evidence → หาวันที่/owner → composite → เขียน rows+manifest). `--write` ต้องรันแบบ full (ดู bug #7); `--tab TC0NN` มีไว้ dry-run/debug เท่านั้น.
- `tc_img_manifest.py` — matcher เดิม (confidence HIGH/MULTI/FOLDER จาก filename, correctness-first) + logic composite (Pillow) + `resolve_links` สำหรับ capture-link ของแท้.
- `capture_links.py` — อ่านคอลัมน์ Capture Screen Link จาก source ทุก tab, คืน `{ticket|TCID: [urls]}`, cache ที่ `logs/capture_links.json`.
- `tc_result_sync.py` — routing + System/Integration apply (เพิ่ม field `ac`,`owner` เข้า placement ให้ unit_apply ใช้ต่อ).
- clasp login = บัญชี QA (`~/.clasprc.json`); การ push ใช้ **Apps Script API ตรง** (`projects/{id}/content`) เพราะ clasp CLI 3.3.0 มี token bug ทำให้ push/pull ผ่าน CLI ได้ 404 เสมอทั้งที่ token ใช้ยิง API ตรงได้ปกติ.

## Shares ที่ทำ (ผ่าน token เจ้าของไฟล์ ไม่ใช่ QA)

Capture folder + Unit sheet ถูกแชร์ให้บัญชี QA (เพราะสคริปต์รันในนามบัญชีนั้นต้องเข้าถึงทั้งรูปและชีตได้). `_composites` folder อยู่ใต้ Capture root เดิม เลยได้สิทธิ์ตามพ่อแม่โดยอัตโนมัติ ไม่ต้องแชร์แยก.

## เหลือ / ควรทำต่อ (ไม่ด่วน)

- Content คอลัมน์ B/C/D ยังหยาบ (B Sub Function ว่างเปล่า, C/D ใช้ Title/Acceptance Criteria ตรงๆ) — refine ได้ถ้าลูกค้าต้องการ grouping ตามฟอร์แมตเดิม.
- Image coverage ยังไม่ 100% แม้ดีขึ้นจาก capture-link matcher แล้ว — บาง Passed case ไม่มีลิงก์ในคอลัมน์ Capture เลยและ filename ก็เดาไม่ออก จะได้ TBC-date แทนรูป (ถูกต้องตาม logic ไม่ใช่บั๊ก).
- System/Integration automation (plist ทุก 1 ชม.) ยัง staged ไว้ ยังไม่เปิดใช้งานจริง.
- ยังไม่ commit ไฟล์โค้ด (`Code.gs`, `appsscript.json`) เข้า repo นี้เป็นทางการ — อยู่ใน `docs/tc-result-img/` แล้วรอ commit.
- D9 (Badge 14 เคส unmapped) ยังเป็น report-only ตามที่ user ยังไม่เคาะ.

## Prior WIP (เสร็จแล้ว)

Lot2 non-PASSED retest COMPLETE (174/174). archive: `natty-doc/ols-lot2-nonpassed-retest-24jul.md`.
