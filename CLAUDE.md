# CLAUDE.md — ols-qa (ฉบับย่อ)

> ฉบับเต็มทุกกฎ + เหตุผล + post-mortem ทุกฉบับ: [`docs/CLAUDE-ARCHIVE.md`](docs/CLAUDE-ARCHIVE.md) — ค้นด้วย grep ตามหัวข้อ ไม่ต้องอ่านทั้งไฟล์
> ทุกบรรทัดด้านล่างคือกฎบังคับ ตัดคำอธิบายออกเท่านั้น ไม่ได้ตัดกฎ

@CONTEXT.md

> ค่าคอนฟิก OLS (Jira/ชีท/Drive/env/field id/เครื่องมือ sync) อยู่ที่ [`references/ols-project-guide.md`](references/ols-project-guide.md) — ไม่ auto-load (109 KB) **ต้อง grep หัวข้อที่เกี่ยวก่อนทำงาน OLS ทุกครั้ง** และก่อนถามค่าใดๆ กับ user

## 0. ห้ามเดา (ใหญ่สุด)
- มี 3 สถานะเท่านั้น: **ตรวจแล้ว** (แนบ path:line / คำสั่ง+output / API / commit) · **ยังไม่ตรวจ** (บอกตรงๆ แล้วไปตรวจ) · **ตรวจไม่ได้** (บอกว่าติดอะไร ต้องมีอะไร แล้วหยุดถาม)
- ห้ามใช้คำกลบการเดา: manifest · canonical · by design · น่าจะ · อาจจะ · likely · should be · "ตามสเปก/Figma/AC" ที่ยังไม่เปิด · ห้ามปั้นตัวเลข/ชื่อ/id/field/hash
- memory · session context · WIP note · ผล subagent · คอมเมนต์ในโค้ด · CLAUDE.md = จริง ณ ตอนเขียน ต้อง re-verify รอบนี้
- ข้อสรุปจาก triage/ไฟล์สรุปรอบก่อน/บรรทัด ledger ของเลน ห้ามพูดเป็นข้อเท็จจริง (ต้องมี VERIFY แยก) · ตำแหน่งข้อความไม่ใช่หลักฐานว่าใครเขียน (เช็ค `model` ด้วย `replyAuthor()`)
- ข้ออ้างเชิงลบ ("ไม่มี X"/"ต้องสร้างใหม่") ต้องแนบคำสั่งค้น + ขอบเขต + จำนวน · "ตรวจแล้ว" ต้องบอกว่าวัดอะไร ผ่าน/ไม่ผ่าน/ยังไม่วัด กี่จากกี่
- ตัวเลขจากคิวรีต้องแนบคิวรี+ตัวหาร · บรรทัดสรุปของเครื่องมือไม่ใช่คำตอบจนพิสูจน์ว่าวัดสิ่งเดียวกัน · "ตรวจไม่ได้" ห้ามนับรวม "ไม่ผ่าน"
- สถานะโปรเซส/งาน: ห้ามอ่านจากรหัสจบผ่าน pipe · บรรทัดสุดท้ายที่พิมพ์ · mtime/stat · ผลว่างของ grep → ใช้ `pgrep -f`+รหัสจบ, `wc -c` สองครั้ง, ไฟล์ผลบนดิสก์
- เวลาต้องวัด (`date` / timestamp จริง) ห้ามประมาณ ห้าม `~` · ข้อความ "ข้อจำกัด" ที่สั่งให้คนทำอะไรต้องวัดแล้วเท่านั้น · สมมติฐานเขียน "สมมติฐาน: … (จะตรวจด้วย …)"
- เครื่องมือวัดที่เขียนเองต้องผ่านตัวอย่างที่รู้คำตอบ (ต้องพบ 1 · ต้องไม่พบ 1) ก่อนเชื่อ · ห้าม `fps=1/N` เพื่อถามว่าเวลานั้นมีอะไรบนจอ · ผลเราขัดคนอื่น สงสัยเครื่องมือตัวเองก่อน
- ความสามารถที่วัดบน env หนึ่ง ไม่ใช่ข้อเท็จจริงของ env อื่น (ระบุ env ในประโยค)

## 1. post-mortem — ทุกความผิดพลาดต้องมีรายงาน ห้ามผิดซ้ำ
- นับ: พูดสิ่งที่ยังไม่ตรวจ · ตัดสินผลผิด · เปิด/ปิดบั๊กผิด · ผิดปลายทาง/ฟอร์แมต · แตะของห้ามแตะ · ทำเกิน/ขาดโดยไม่บอก · ต้องย้อนงาน · workflow เฟลเงียบ · gate เขียวทั้งที่วัดไม่ครบ · ไม่แน่ใจ = นับ
- ลำดับ: (1) บอกเจ้าของงานทันที (2) แถว `OPEN` ใน `docs/post-mortem/PENDING.md` เทิร์นนั้นเลย (3) แก้ต้นเหตุ+หลักฐาน (4) รายงานจาก `TEMPLATE.md` ครบ 5 Whys ชื่อ `<YYYYMMDD>-post-mortem-report-<NNNN>-<slug>.md` เลขรันไม่ข้ามไม่ซ้ำ + แถวดัชนี `docs/post-mortem/README.md` + PENDING→`DONE` (5) สรุปสั้นต่อท้าย `## Post-mortems` ใน `docs/CLAUDE-ARCHIVE.md` (6) `node tools/postmortem-guard/check.js` ผ่าน แล้ว merge main ทันที
- ผิดซ้ำ = ใส่ `**ผิดซ้ำจาก:** #N` + มาตรการต้องเป็นชั้นใหม่/แข็งขึ้น ไม่ใช่คำเตือนซ้ำ · `WONTFIX` เฉพาะเจ้าของงานสั่ง · ไม่มี flag ปิดชั้นใด (10 ชั้น: ดู README)
- repo public: รายงานห้ามมีรหัสผ่าน อีเมล host tenant id path ชื่อผู้ใช้
- ข้อย่อยจากรายงาน: คอมเมนต์ในเครื่องมือห้ามอ้างสถานะระบบที่มองไม่เห็น (#0001) · checker ห้าม `filter()` ทิ้งเงียบ; รหัสจบไม่ใช่หลักฐาน ประกาศข้อความที่คาดก่อน; ชั้นที่พึ่งข้อสมมติเดียว = ชั้นเดียว; ทุกชุดเทสต์แตะของจริงบนดิสก์ ≥1 ข้อ (#0002) · shell: ค่าที่อ่านไม่ได้ห้ามเข้า `-gt`; ตัดสินที่โมดูลเดียว; ปิดคลาสต้องไล่ไฟล์ข้างเคียงรอบเดียวกัน (#0003) · การ์ดเรียกโปรแกรมนอกต้องอ่านรหัสจบ + สถานะ "ตรวจไม่ได้" → ปฏิเสธ; fallback ผูกรหัสจบไม่ใช่ `-z` (#0005) · นับสิ่งที่วัดจริง ศูนย์ = ปฏิเสธ ข้อความผ่านต้องมีตัวเลข; ของ 2 ชิ้นหน้าที่เดียวกันต้องผูกกัน (#0006/#0010/#0012) · ปิดคลาสต้องมีตัวเลขที่นับได้
- ไฟล์ ` M` ที่ไม่รู้ที่มา: รัน `bash scripts/whose-change.sh` — `STALE` = ของค้าง คืนค่าได้ · `EDITED` = มีคนพิมพ์ ห้ามแตะ (#0007)

## 2. ตรวจสอบปัญหา = `superpowers:systematic-debugging` เท่านั้น (investigation-guard)
- prompt เรื่องพัง/ค้าง/เฟล/error/ผลไม่ตรง/ทำไม → เรียกสกิล (เธรดหลักหรือ subagent) ห้ามไล่เดาก่อน · Stop hook บล็อกถ้าไม่เรียก · ธงผิดจริง: `node tools/investigation-guard/check.js --not-an-investigation "เหตุผล"`
- 5 ขั้นห้ามข้าม: (1) สืบจนมีหลักฐาน (2) รายงาน 4 หัวข้อ: ปัญหาจริง · สาเหตุจริง · ทางแก้ดีสุด · การป้องกัน (3) ถามแล้วรอ (4) ทำตามขอบเขตที่ยืนยัน (5) รีวิว+รันเทสต์ทั้งชุด
- คำขอ "แนะนำ" เรื่องความล้มเหลว = งานตรวจสอบ เริ่มขั้น 1
- เจอปัญหากลางงาน → บอก user → แยก Agent background 1 ตัว/ปัญหา สั่งเรียกสกิลนี้ prompt ครบ (อาการ verbatim · คำสั่ง+cwd · ไฟล์ · ที่ลองแล้ว · ห้ามแตะ) → main ทำต่อ → verify ผลเองก่อนเชื่อ

## 3. ถามเจ้าของงาน (ask-guard)
- ก่อนถามข้อมูลอ้างอิง (เธรด · webhook · ลิงก์ · ID · บัญชี · env · ชีท · token) ต้องค้น episodic memory ในเทิร์นนั้น + `ROUND_DECISIONS.md` ของรอบ · เจอ = ใช้+ยกเป็น memory · ไม่เจอ = ถามพร้อมบอกว่าค้นอะไร · อ่านบันทึกไม่ได้: `node tools/ask-guard/check.js --unverifiable-ok "เหตุผล"`
- ลิงก์/URL: ดู `~/.ols-qa-secrets/ols-secrets.md` → `references/ols-project-guide.md` → `references/*-guide.md` ก่อนถาม · ได้ค่าใหม่: placeholder ลง guide, ค่าจริงลง secrets
- กฎที่มีข้อยกเว้น อ่านให้จบทั้งข้อก่อนใช้ · คำตัวอย่าง (ประมาณว่า/ไรงี้/เช่น/e.g.) = template ไม่ใช่ข้อมูล ค่าที่วัดได้ต้องวัดเอง

## 4. Git / worktree ร่วม (git-staging-guard · pre-push)
- stage ระบุไฟล์ทีละตัว ห้าม `git add -A` / `.` / `<dir>/` / `commit -a` · ไฟล์ไม่ใช่ของเรา = ปล่อยไว้ (ห้ามลบ/stash/rebase ทับ)
- pre-push รันเทสต์บน commit ที่จะขึ้น · ห้าม `--no-verify` ทุกกรณี · กวาดของคนอื่นติดไป = ห้าม force-push ให้คอมมิตเสริม+เขียนเหตุในข้อความ
- งานยาว/ชนไฟล์ → `git worktree` ของตัวเองใต้ `.worktrees/` · push ตอนมีงานค้าง → worktree ชั่วคราว cherry-pick
- สคริปต์จาก git hook ที่รัน git ที่อื่น ต้อง source `scripts/git-env-clean.sh` + `git_env_clean` และยืนยัน `--show-toplevel`
- Pull main ก่อนเริ่มงาน · commit แบบ conventional (feat:/fix:/docs:) · แก้ `tools/**/*.js` ต้องเขียวก่อน commit + เพิ่ม test คู่กฎใหม่:

```bash
bash scripts/run-test-suites.sh
```

## 5. repo นี้ PUBLIC — ห้ามข้อมูลบริษัท
- ห้าม commit: password/token/key · อีเมลบัญชีจริง · host ภายใน · Sheet/Drive/Figma/Confluence/Jira-tenant id · Discord id · ชื่อลูกค้า/พนักงาน · `/Users/<name>` — รวม commit message · ใช้ `<ORG>` `{ISSUE_KEY}` `<QA_TRACKING_SHEET_ID>` ฯลฯ ค่าจริงอยู่ `~/.ols-qa-secrets/` เท่านั้น
- ลิงก์หลักฐานอยู่ในชีทเท่านั้น · secret หลุด = rewrite history + rotate + แจ้ง user ทันที · guard เป็นตาข่าย ไม่ใช่ใบอนุญาต
- `ols-qa` public · `helix` + `ols-qa-evidence` private (ถือเหมือน public) · เอกสารที่มีข้อมูลลูกค้าอยู่ `ols-qa-evidence` ห้ามย้ายกลับ
- helix sync: commit ไฟล์ร่วมใน `skills/` `references/` `commands/` → post-commit sync+deploy helix อัตโนมัติ · logic generic ลงไฟล์ร่วม โครงสร้าง OLS ลง guide เป็น placeholder · secret ใหม่: เติม `~/.helix-ols-denylist` → gen hash → `check-no-secrets.sh`

## 6. หลักฐาน / verdict
- หลักฐานต้องเป็นหน้าจอ FE จริงเท่านั้น: ห้าม JSON ดิบ · DevTools/console · terminal · โปรแกรมอื่น · หน้าว่าง/โหลดค้าง (ตรวจเฟรมสุดท้ายทุกคลิป) · แก้คลิปเดิมด้วย `cliptool.py` ก่อน ตัดเกิน 60% หรือเนื้อหาหายค่อยอัดใหม่ · ชื่อ test data แนว QA = ผ่าน · แถบ URL ที่ตัวอัดฉีด = ผ่าน (`WEB_ADDRESS` เลิกใช้ตัดสิน) · ไม่มีจอรองรับ = BLOCKED ถาม PO
- ผูกคลิปกับชีทได้ต่อเมื่อมี `<stem>.capture.json` ของตัวอัดสกิล + `verify-video.py` ผ่าน · ห้าม Playwright `recordVideo`
- รายงานสถานะจริง (BLOCKED/PWMI/FAILED/PASSED) · ปลายทางไม่มีสถานะนั้น → อ่าน dropdown จริงแล้วถาม ห้ามแมปเอง · `skipped` = `BLOCKED` ห้ามเขียนเป็นข้อจำกัด
- Priority/verdict ตาม [bug-priority-matrix](references/bug-priority-matrix.md) เท่านั้น: Lowest/Low/Medium → **PWMI** · High/Highest → **FAILED** · coverage gap ไม่ใช่ defect
- ก่อนส่งมอบ ไล่หัวข้อ "ข้อจำกัด" ทีละบรรทัด ทำเองได้ = ยังส่งไม่ได้

## 7. ห้ามเปิดบั๊กที่ไม่ใช่บั๊ก
- บั๊ก = แอปต่างจากสเปก **ที่ยืนยันแล้ว** (Figma/PRD/AC/PO อ่าน char-exact ทั้ง 2 ฝั่ง) · ห้ามใช้คำทับศัพท์/ชื่อฟีเจอร์เป็น label · hedge ใน expected = หยุดไปยืนยัน · สเปกไม่ชัด = BLOCKED/ถาม PO
- ก่อนสรุปว่าเป็นบั๊ก ตรวจ 3 ชั้น: ticket ที่เกี่ยวข้องทุกคอมเมนต์ · ผล regression (`OLS: TC List (Lot1/Lot2)`) · โค้ดใน `ols-monorepo`
- STALE_ER (สเปกล้าสมัย) ใช้ 3 ชั้นเดียวกัน: ทุก ticket ทุกคอมเมนต์ + path:line ใน `ols-monorepo` origin/main → แก้ ER ในไฟล์ `(ALL)` ได้เลย ห้ามแตะ `(Only)` ห้ามทิ้งร่องรอย AI (ไม่มีหมายเหตุ/คำว่าแก้ไข/ชื่อเครื่องมือ) หลักฐานเก็บนอก repo · หลักฐานไม่พอ = ถาม PO · evidence ต้องมี ticket key + path:line
- เคสขัดกันเอง (guest แต่ต้อง login ฯลฯ) = แสดงจุดขัด+ข้อความเสนอ แล้วถามก่อนแก้ ห้าม PASSED · แก้ช่องใดของเคส ต้องอ่านทั้งแถว ความขัดที่เราทำให้เกิดต้องถาม
- blocker "รอ deploy" ต้องมาจาก `git tag --contains <commit>` เทียบประกาศ deploy ของ env ห้ามใช้สถานะ Jira · blocker บนบอร์ดเทียบ dossier ของเราก่อนเผยแพร่

## 8. Jira / Confluence
- เขียน Jira ทุกชนิดผ่าน API token ของเจ้าของงาน (`command curl` + `--cacert` ตาม secrets) ห้ามเขียนผ่าน Atlassian MCP (อ่านได้) · ก่อนเขียนครั้งแรกยืนยัน `GET /rest/api/3/myself` · token เสีย = หยุดถาม
- สร้าง ticket/issue/หน้าใหม่ = แสดงร่างแล้วถามทุกครั้ง (jira-ticket-guard: `check.js --confirm`)
- เรียก Jira issue ว่า "ticket" ห้ามใช้ "ตั๋ว" · improvement ≠ issue/bug
- QA Task (ไม่รวม Bug): summary `[QA Task][OLS][<Component>]` ห้าม `[Improve]` · 5 หัวข้อ: ปัญหา (ปิดด้วยตรวจที่ไหน/เมื่อไหร่/อย่างไร) · สาเหตุ · แนวทางแก้ (ใครทำอะไร) · ป้องกัน (ใครทำอะไร) · หมายเหตุ (bullet สุดท้าย = ผลกระทบต่อผู้ใช้หากไม่แก้) · แนบรูป+log · กระชับ 1 ประเด็น 1 bullet · ตัวอย่าง OLS-599/605
- ตัวเลขเป็นเลขอารบิกเว้นวรรคเสมอ ห้ามสะกดคำไทย (ทุกช่องทาง)
- Bug: custom field เดิม (Actual/Expected เป็น bullet + `!image!`) ตาม `references/ols-project-guide.md`
- Jira table: ห้าม `<br>` · ห้ามขึ้น cell ด้วย `1.` ใช้ `**1.**` · v2 wiki ห้าม markdown (`**` `---` `| --- |`) ใช้ `||h||` · escape `{word}` · footer ลิงก์ไฟล์แนบ · แก้คอมเมนต์ in place ห้ามลบโพสต์ใหม่ · ร่างตามคอมเมนต์ล่าสุดของโปรเจกต์
- แนบไฟล์ (interactive เท่านั้น): `Control_Chrome__execute_javascript` + FormData `/rest/api/3/issue/KEY/attachments` `.then()` ไม่มี await · bot headless ใช้ REST
- Confluence: อ่าน restriction ด้วย `content/{id}?expand=restrictions.read…,restrictions.update…` ห้ามใช้ `restriction/byOperation` · descendants ใส่ `depth` · space permission วน `_links.next` · เขียนหน้าที่มีอยู่ใช้ ADF หรือ storage REST v2 ห้าม `html` · baseline+นับ element ก่อน/หลัง ต้องไม่ลด · แก้ section ไล่ข้อความอ้างอิงบนหน้าให้ครบ · `body-format=view` ไม่เท่ากับเห็นด้วยตา

## 9. Environment / login / session
- ยืนยัน env + account กับ user ก่อนเทสทุกครั้ง ห้ามเลือกเอง (dev/pre-prod ต้อง VPN · training ห้ามเลือกเพราะไม่ต้อง VPN) · ระบุแล้วในรอบ = แจ้งแล้วใช้เลย
- เครื่องมือที่เลือก env ห้ามมีค่าเริ่มต้น · ค่าปลายทาง/ตัวตนต้องมีชื่อ env ในตัว · คำสั่งที่ยกให้คนอื่นรัน ต้องเทียบ env ก่อนส่ง (`session_capture_prod.sh` = production เท่านั้น)
- **training ห้ามแตะทุกกรณี** (ไม่สแกน ไม่เขียน ไม่ probe) · env อื่นนอก pre-prod ยืนยันก่อน
- agent ห้ามพิมพ์รหัสผ่านทุกบัญชี · ใช้ saved session `capture/state_<tag>.json` (`accounts_sync.py` · `session_capture.js` · `session_status.js` · `session_verify.js` · `session_refresh.js`) · หลังเก็บต้อง `session_verify.js`
- คุกกี้ auth 24 ชม. นับเฉพาะ 4 ตัว (access/refresh/user_proof/session_id) · refresh = `POST <AUTH_API>/auth/refresh-token` สำเร็จแล้วต้องเซฟ storageState ทันที (หมุนโทเคน) · ห้ามยิงแบบ "สำรวจ" · ห้ามเปิดเว็บ NDLP/auth API ด้วยไฟล์ session · dev ยังไม่มีหลักฐานว่า refresh ได้ → ล็อกอินมือผ่าน `SIGNIN_URL=<OLS>/?signIn=1`
- ก่อนบอกว่าบัญชีพร้อม/ส่งเลน: ชี้ keepalive ที่ยังมีชีวิตที่ดูแล tag นั้น + เธรดหลักรัน `recording_preflight.js` เอง ถาม session จากไฟล์ตรง ไม่ผ่านการโหลดหน้า · ห้ามปิด keepalive เพื่อประสิทธิภาพ (idle ตัด 30 นาที)
- หยุดโปรเซสด้วย pid ที่รู้ที่มาเท่านั้น ห้าม `pkill -f`/`killall` เมื่อมีตัวจริงรัน · ตัวทดสอบห้ามชื่อไฟล์เดียวกับตัวจริง
- หน้าต่างให้คนกรอก: ยืนยันหน้าล็อกอินจริง (status < 400) + อยู่หน้าสุด + ไม่เล็กกว่า viewport + element อยู่ในกรอบ ก่อนบอก "พร้อม" · รหัสผ่านในคำสั่งใช้ `read -rs`
- ข้อมูลบัญชีอ้างจากชีทบัญชีของรอบเท่านั้น ("ไม่มี session" ≠ "ไม่มีบัญชี")
- ข้อยกเว้นเขียน production: เฉพาะแผน smoke test 2026-09 (อนุมัติ 2026-09-03) — ไม่รวม env อื่น/RGS/ค่าใช้จ่าย · ลบข้อมูลที่สร้างให้หมด (LP→course→media ขณะ DRAFT) · ห้ามร่องรอย QA ในชื่อ · destructive fixture มีคู่คืนสภาพใน ledger · หมดอายุเมื่อรอบปิด · `write_guard.js` ยัง deny ทุก env

## 10. ข้อมูล / ไฟล์ที่ห้ามแตะ
- โฟลเดอร์ `… (Only)` = แช่แข็ง ห้าม automation ทุกชนิดเขียน/ลบ/ทับ อัปเดตเข้า `(ALL)` เท่านั้น · verify config ไม่มี id ของ Only · regenerate = manual ตาม user สั่ง
- เนื้อหาที่มี `RGS` = ของลูกค้า (HI) ห้ามเปลี่ยนชื่อ/ลบ/ยกเลิกเผยแพร่/เอาขึ้นเป็นงาน · โนติ name-guard ต้องมี remark RGS ทุกฉบับ · นิยามที่ `tools/name-guard/customer_content.js` ที่เดียว
- `write_guard.js` 8 ชั้น: ผ่อน/ปิดชั้น/เพิ่ม env = ต้องถาม · แก้ hooks/config · ลบ/rename skill dir = ต้องถาม
- คำสั่งลบห้ามอยู่บรรทัดเดียวกับคำสั่งสร้าง · ผลลัพธ์ของตัวรัน (report/test-results) คัดลอกเข้าโฟลเดอร์งานทันทีที่จบ
- โฟลเดอร์งานถาวร `~/ols-qa-testing-bot/out/<งาน>/` สร้างก่อนไฟล์แรก ทุกอย่างของรอบอยู่ในนั้น `/private/tmp` เฉพาะของสร้างใหม่ได้ในวินาที · มี `ROUND_DECISIONS.md` เก็บมติเจ้าของงาน
- endpoint ที่มีผลถาวร ต้องเตรียมที่เก็บผลก่อนยิง · สคริปต์คลิกที่เขียนข้อมูลต้องยืนยันเป้าด้วยชื่อ/รหัสบนจอก่อนคลิก · ขออนุมัติเขียน/ลบต้องอ่านสถานะสดทุกรายการ ใส่ในคำถาม และชี้เงื่อนไขในโค้ดที่อนุญาตทุกขั้น
- ก่อนทำตามรายการงานที่เขียนไว้ อ่านสถานะจริงจากไฟล์สถานะก่อนแต่ละรายการ · ห้ามพิสูจน์เครื่องมือที่ส่งออกไปหาคนอื่นด้วยอินพุตปลอม (ต้องมีโหมดซ้อม)

## 11. Test data / ปก
- ใช้ `ols-data-prep.md` (ols-qa-evidence) เท่านั้น: intake §0.0 → reuse §5–6 → gate §7+§8 → report §11 · เครื่องมือ off-repo `~/ols-qa-testing-bot/` ห้ามเขียนใหม่ · ไม่ผ่าน gate = ห้ามใช้/อัป/บอกเสร็จ
- ชื่อ+คำอธิบายเป็นเนื้อหาจริง: ห้าม QA/test/ทดสอบระบบ/placeholder/dummy · ห้ามวงเล็บสถานะท้ายชื่อ · ชื่อซ้ำ = หยุดแจ้ง user ก่อน
- ปก = ภาพถ่าย Draw Things (API `:7860` เปิดเองก่อน · ไม่มีแอป = บอก user ลง · เปิดไม่ได้ = BLOCKED) + คำไทย overlay โปรแกรม · ห้ามพื้นเรียบ/gradient/PIL/doodle/pattern · สูตร §5.7.2 · reuse `.dt_bg_cache` ก่อน · 1536×896 · subject เดี่ยวใกล้กล้อง ไม่มีตัวอักษร ไม่ deform · โทนตาม PALETTE ไม่น้ำตาลล้วน · คม = res/unsharp ไม่แตะโทน · shrink-to-fit · ตัดคำไทยไม่พรากคำประสม · ซูม 100% ตรวจ · ตัวอย่างให้ user อนุมัติก่อน · จด comment ทุกข้อ
- gate ปก 5 ชั้น (แหล่ง · ตรงเนื้อหา · ไม่มี text โมเดล · คำไทยถูก · เทียบ lot จริง) + gate ปกติดจริง 5 ชั้น (`coverImageKey` ทุกชิ้น · readback ไม่ null · URL 200 image · sweep null=0 · guest เห็นจริง) · LP PUBLISHED: `PATCH request-edit` → `PUT` → `POST publish` ห้ามค้าง PENDING_EDIT
- วิดีโอ = motion-graphics (§5.7.2F) เสียง `th-TH-NiwatNeural` ≤25MB ห้ามสไลด์นิ่ง

## 12. Agent / เลน / บอร์ด
- คำสั่ง agent ต้องสั่งเขียนผลแต่ละชิ้นลงดิสก์ก่อน tool ถัดไป (ไฟล์+append+จังหวะต่อเคส หรือ `PERSIST-BEFORE-PRINT`) — agent-dispatch-guard บล็อก · ห้ามดึงภาพหน้าจอเข้า context · context ต่อ agent < 300k · ห้ามคำสั่งเดียวเกิน ~3 นาที · heartbeat ทั้งไฟล์และ stdout · ถูกฆ่าแล้วอ่านของเดิมก่อนทำต่อ
- resume subagent ด้วยงานใหม่ที่ขัด Forbidden list เดิม ต้องมีข้อความสดจากเจ้าของงาน · ตัวเลข "เสร็จ" นับรายการที่ผ่านนิยาม ไม่ใช่ `len(array)` · คำถามค้างใน manifest ยกขึ้น Blockers ทันที
- เลนเสร็จ → มอบงานถัดไปที่ไม่ชน (ไฟล์ · บัญชี · ทรัพยากร · ลำดับ) ทันที ไม่มี = บอกว่าว่างรออะไร
- เปิด session = สร้าง live artifact board ทันที ฟอร์แมตเดิมเท่านั้น (`board/build_board.js` + `check_theme.js` exit 0) · 6 เลนเสมอ · updated stamp `3/Sep/2026 6.30 PM` จากเวลาเขียนจริง · สรุป ผ่าน/ไม่ผ่าน/ยังไม่ทดสอบ เป็น % ของทั้งหมด · % ต่อเลนนับงานผ่านรีวิว · Blockers แยก · Corrections · timeline ใหม่→เก่า ผูกหลักฐาน · ภาษาคนไม่ใช่สายเทค · `capabilities:{db:{}}` + `onSnapshot` · เขียน db ด้วย `file_path` · แก้ของฝังต้องบอกรีเฟรช · อัปเดตทันทีที่เปลี่ยน ห้ามเงียบ · ยืนยันจากฝั่งที่คนเห็น ก่อนบอกว่าอัปเดตแล้ว · ข้อมูลฝังในหน้าต้องตรวจชนิดทุกช่อง อาเรย์ศูนย์ = ปฏิเสธ
- ก่อนจบ session เรียก `/catch-ai` · รายงานความคืบหน้าเป็นจังหวะ ห้ามเงียบ

## 13. Discord / SFD
- โนติ QA: ฟอร์แมต canonical (`🔔 **QA Review Requested**` + count line ตัวหนา + bullet + link + owner) ผ่าน `discord_qa_notify.py` เท่านั้น ห้ามปรับ/เติมบรรทัดเอง · escape `_ * ~~ \` |` · `--dry-run` + เทียบข้อความล่าสุดในช่องทีละบรรทัด · owner จาก Jira `customfield_12120` สดด้วย accountId ห้าม Reporter · `--registry` · แก้ผิดด้วย PATCH ไม่ลบโพสต์
- ทางสำรองห้ามเปลี่ยน "ใครพูด/ที่ไหน" · ไบนารีภายนอกหาด้วย path สัมบูรณ์
- โนติ `Needs fix` = แก้เองจนจบบน pre-prod (reversible ก่อน ลบเมื่อทางเดียว) แล้ว PATCH `Fixed` เมื่อสแกนสดยืนยัน · แก้ไม่ได้ใส่ FYI · ไม่รวม RGS/training
- SFD: ทุก workflow ห้ามเฟลเงียบ · job ใหม่ลง `sfd/workflows.json` (+`trap_wired`, `max_stale_s`) · plist `StandardErrorPath` = `StandardOutPath` · watchdog > timeout+retry · network token retry 4 ครั้ง · ห้าม `|| true` · เลิก job ต้องถอด label · แตะ plist: backup + `plistlib` ห้าม `plutil -extract` ไม่มี `-o -` · ได้ alert = root cause → fix → rerun → บันทึก · แจ้งทาง DM user คนเดียว · รายละเอียดระดับ: archive
- job ตามตารางต้องพิสูจน์ว่าล้มแล้วดังจริง รหัสจบต้องเป็นของงานจริง · `log_file` ชี้ไฟล์ที่มีไบต์จริง · alert ต้องบอกผลกระทบ ไม่ใช่ exit code
- ชีท: อ้างแท็บด้วย gid/case-insensitive คอลัมน์จาก header (PM-010) ห้ามสร้างแท็บเมื่อไม่เจอแบบ exact

## 14. โทน / ขอบเขต (global)
- คุย user ภาษาไทยสุภาพ เต็มประโยค ลงท้าย "ครับ" สั้น 2–5 บรรทัด ห้ามสั่ง/ห้าม user · ถามผ่าน AskUserQuestion ชุดละ ≤4 ข้อ ข้อแนะนำอยู่ข้อแรก
- ทำเฉพาะที่สั่ง · ติดตั้งถาวร (launchd/hook/profile/global config) หรือสร้างของใหม่ในระบบภายนอก = ถามก่อน · ห้ามใช้เงินองค์กร · staging ก่อน production
- skill/command files ภาษาอังกฤษ · link references แบบ relative ตามความลึกไฟล์ (WORKFLOW.md ใต้ deprecated ใช้ `../../../references/`)

## Architecture (ย่อ)
- `skills/helix/SKILL.md` router → `skills/<name>/SKILL.md` stub → `skills/deprecated/<name>/WORKFLOW.md` (ใช้งานจริง) · `commands/` · `references/` (routing: `skill-routing.md`; preamble; must-never; evidence gates; bug matrix)
- โค้ด: `tools/name-guard/` (scan อ่านอย่างเดียว exit 0/1/2 · write_guard · alert dedup) · `tools/retest-guard/` (กฎคอมเมนต์รีเทสอยู่ที่ `retest_rules.js` ที่เดียว) · `tools/portability/` · `scripts/check-no-secrets.sh` · CI `.github/workflows/tests.yml` · ไม่มี build, Node ≥18
- Hooks: SessionStart `inject-context.sh` · PreCompact `pre-compact.sh` · guards ใน `.claude/settings.json`

## Post-mortems
ดัชนีและสรุปทุกฉบับ (PM-001–PM-010, Report #0001 เป็นต้นไป): [`docs/post-mortem/README.md`](docs/post-mortem/README.md) และ `docs/CLAUDE-ARCHIVE.md` § Post-mortems — อ่านก่อนแตะ surface ที่เคยพลาด
