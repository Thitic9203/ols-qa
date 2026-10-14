# Post-Mortem Report #0191 — commit บน branch ของ PR ที่ยังไม่ merge ถูก sync ขึ้น helix main และออก release เอง

**ระบบ:** ols-qa post-commit hook → `scripts/sync-skills-to-helix.sh` → helix (plugin) release
**สภาพแวดล้อมที่ได้รับผลกระทบ:** repo helix (`main` + release v1.5.121 / v1.5.122) · เครื่องที่เปิด auto-update ของ helix · repo ols-qa (PR #21 · #23)
**วันที่เกิดเหตุ:** 2026-10-14
**วันที่ค้นพบ:** 2026-10-14
**วันที่จัดทำรายงาน:** 2026-10-14
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** High — skill ที่ยังไม่ผ่านรีวิวถูกปล่อยเป็น release ล่าสุดของ helix และถูกติดตั้งอัตโนมัติถึงเครื่องที่ใช้งานจริง ข้ามด่านรีวิวของ PR ทั้งหมด
**ประเภท:** ทำเกินขอบเขต / workflow ปล่อยของออกเงียบ
**ผิดซ้ำจาก:** #0063

---

## สรุปสั้น (Executive Summary)

- เลนที่แก้ skill ใน worktree ของตัวเองคอมมิต `c70d32e` (branch ของ PR #21) และ `e06375e` (branch ของ PR #23) — post-commit hook sync ไฟล์ร่วมขึ้น helix main ทันที (`6c22a6c`, `1c78dfb`) แล้ว workflow ของ helix ออก release v1.5.121 และ v1.5.122 (Latest)
- ต้นเหตุ: `scripts/hooks/post-commit:10-19` ทำงานกับทุก commit ทุก branch ทุก worktree ด่านมีแค่ `HELIX_SYNC` และ path filter · สคริปต์ sync ตรวจแค่ว่า checkout ของ helix อยู่บน main ไม่เคยตรวจว่า ols-qa อยู่บน main · เทสต์ `tools/helix-sync/sync_env.test.js` ยัง **ยืนยัน** ว่าคอมมิตบน branch `wt` ใน worktree ต้องถึง helix
- เหตุร่วม: เธรดหลักสั่งเลนแก้ไฟล์ skill ร่วมใน worktree โดยไม่ได้สั่งให้ตั้ง `HELIX_SYNC=0` (มีเลนเดียวใส่เอง)
- แก้แล้วฝั่ง helix: revert ทั้งสองคอมมิตเป็น `500cfe1` ออก v1.5.123 ไฟล์ 4 ตัวกลับตรงกับ ols-qa origin/main · ฝั่ง ols-qa: PR #24 จำกัดการ sync ให้ส่งเฉพาะจาก main และจากเนื้อหาที่คอมมิตแล้ว merge เข้า main เป็น `526491e` · ช่องใหม่ที่เกิดจากการแก้: PR ที่ merge แล้วไม่ถึง helix อัตโนมัติ ต้อง sync เองจาก main ล่าสุด (บันทึกใน PR #24 · ดู P5)
- ผิดซ้ำจาก #0063: พื้นผิวเดียวกัน (sync จาก linked worktree) รายงานนั้นทำให้คอมมิตจาก worktree ส่งเข้า helix ได้ แต่ไม่ได้ตั้งคำถามว่า branch ไหนควรส่ง

---

## 1. ปัญหา (Problem Statement)

- คอมมิตต้นทางทั้งสองไม่อยู่ในประวัติของ ols-qa origin/main: `git merge-base --is-ancestor c70d32e origin/main` → exit 1 · `git merge-base --is-ancestor e06375e origin/main` → exit 1
- helix origin/main:
  ```
  1c78dfb 2026-10-14 17:08:18 +0700 chore(sync): pull shared skill updates from ols-qa
  6c22a6c 2026-10-14 17:02:42 +0700 chore(sync): pull shared skill updates from ols-qa
  ```
  ห่างจากคอมมิตต้นทาง 10 วินาที (`c70d32e` 17:02:32) และ 2 วินาที (`e06375e` 17:08:16)
- blob ของไฟล์ใน helix `6c22a6c` ตรงกับ `c70d32e` และ `1c78dfb` ตรงกับ `e06375e` ทุกตัว ขณะที่ ols-qa origin/main มี blob อื่น (ผลตรวจของเลน X1 ขั้น 4 — ไฟล์ WORKFLOW ของ testing-ticket และ retest-bug + reference 2 ไฟล์)
- release v1.5.121 (2026-10-14T10:03:11Z) และ v1.5.122 Latest (10:08:42Z) ออกจากสองคอมมิตนี้ · เครื่องนี้ auto-update จาก 1.5.120 เป็น 1.5.122 (installed_plugins `lastUpdated 2026-10-14T10:33:11Z`)
- `scripts/hooks/post-commit:10-19` — ด่านมีแค่ `[ "${HELIX_SYNC:-1}" = "1" ]` และ `grep -qE '^(skills|references|commands)/'` ไม่มีการตรวจ branch
- `tools/helix-sync/sync_env.test.js:135-141` — `check('a commit from a linked worktree reaches helix …')` สร้าง branch `wt` แล้ว assert ว่าส่งถึง helix

**สิ่งที่ควรจะเป็น:** helix เป็นปลายทางของสิ่งที่ merge แล้วเท่านั้น — การแก้ skill ต้องผ่าน PR และรีวิวก่อนถึงเครื่องผู้ใช้ (`CLAUDE.md` §4 "งานยาว/ชนไฟล์ → worktree ของตัวเอง" + §5 helix sync · global ข้อ 2 staging-first: ของที่ยังไม่ verify ห้ามขึ้น production · global ข้อ 5 ห้ามทำให้ของเดิมเสียหาย)

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา (+0700) | เหตุการณ์ |
|------|-----------|
| 2026-10-14 ก่อน 17:02 | เธรดหลักสั่งเลน F1/F2 แก้ skill testing-ticket / retest-bug ใน worktree ของตัวเอง แล้วเปิด PR — brief ไม่ได้ให้ตั้ง `HELIX_SYNC=0` |
| 17:02:32 | เลนคอมมิต `c70d32e` (branch ของ PR #21) |
| 17:02:42 | **post-commit sync ขึ้น helix main เป็น `6c22a6c` → release v1.5.121 (17:03:11)** |
| 17:08:16 | เลนคอมมิต `e06375e` (branch ของ PR #23) |
| 17:08:18 | **sync ขึ้น helix เป็น `1c78dfb` → release v1.5.122 Latest (17:08:42)** |
| 17:32–17:35 | เลน X1 สืบสาเหตุ: ยืนยัน blob ตรงกัน · release ออกแล้ว · เครื่องนี้ติดตั้ง 1.5.122 แล้ว (17:33:11) |
| 18:04:37 | เปิดแถว PM-2026-10-14-02 ใน `PENDING.md` (`61e4a9a`) |
| 18:04:46 | เลน H2 revert บน helix เป็น `500cfe1` |
| 18:08:03 | push helix + release v1.5.123 Latest · ไฟล์ 4 ตัวกลับตรงกับ ols-qa origin/main · เครื่องนี้ `describe --tags` = v1.5.123 |
| 18:20:34 | H2 คอมมิต `49a4564` เปิด PR #24 (sync เฉพาะจาก main) |
| 18:32:28 | PR #24 merge เข้า ols-qa main เป็น `526491e` (`gh pr view 24` → MERGED 2026-10-14T11:32:28Z) |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

กลไก: post-commit อ่าน `git diff HEAD~1 HEAD` ของ worktree ที่คอมมิต แล้วเรียก `sync-skills-to-helix.sh` ซึ่งคัดลอกไฟล์จาก **working tree** ของ worktree นั้นไป helix แล้ว push `HEAD:main` ของ helix → pre-commit ของ helix bump version → workflow release ออก release อัตโนมัติ → เครื่องผู้ใช้ auto-update · ไม่มีจุดไหนถามว่าคอมมิตต้นทางอยู่บน main ของ ols-qa หรือไม่ ตอนที่ #0063 แก้เส้นทางนี้ คอมมิตเกือบทั้งหมดของ repo เกิดบน main การ sync จาก worktree จึงดูเหมือนแค่ "ทำให้ worktree ใช้ได้เหมือน main" ไม่ได้เห็นว่าเป็นการเปิดทางให้ branch ที่ยังไม่รีวิวออก release

### 5 Whys

1. **ทำไม skill ที่ยังไม่รีวิวถึงเครื่องผู้ใช้?** — เพราะ helix ออก release v1.5.121/v1.5.122 จากคอมมิต sync และ auto-update ดึงไปติดตั้ง
2. **ทำไม helix มีคอมมิตจาก branch ที่ยังไม่ merge?** — เพราะ post-commit ของ ols-qa sync ทุกคอมมิตที่แตะไฟล์ร่วม ไม่ว่าอยู่บน branch ไหน
3. **ทำไม post-commit ไม่ตรวจ branch?** — เพราะออกแบบตาม "commit ที่นี่ = ส่ง helix" (`CLAUDE.md:55` และ `docs/CLAUDE-ARCHIVE.md:912` ไม่มีเงื่อนไข branch) และ #0063 ขยายให้ worktree ส่งได้ด้วย โดยเทสต์ตรึงพฤติกรรมนั้นไว้ (`sync_env.test.js:135-141`)
4. **ทำไมช่องนี้ไม่เคยแสดงผลจนวันนี้?** — เพราะเพิ่งมีรอบที่เธรดหลักสั่งหลายเลนแก้ skill ร่วมใน worktree พร้อม PR และ brief ไม่ได้ปิด sync — ทางกันมีแค่ env `HELIX_SYNC=0` ที่ต้องจำตั้งเองทุกคอมมิต (มีเลนเดียวตั้งเอง)
5. **ทำไมทางกันถึงเป็นแค่ env ที่ต้องจำ?** — root cause: ด่านการปล่อยของออกไปยังผู้ใช้ถูกผูกไว้กับ **เหตุการณ์ commit** แทน **เหตุการณ์ merge เข้า main** ทำให้ทุก commit ที่ไหนก็ตามเป็นการ release ได้ และค่าเริ่มต้นคือส่ง (`HELIX_SYNC:-1`) — ด่านที่ค่าเริ่มต้นคือ "ปล่อย" ปิดได้ด้วยความจำของคนเท่านั้น

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:**
- `sync-skills-to-helix.sh:94-99` ตรวจว่า checkout ของ **helix** อยู่บน main — ถูกต้องแต่ผิดฝั่ง ไม่มีการตรวจฝั่ง ols-qa
- secret-guard ของ helix ตรวจความลับ ไม่ได้ตรวจว่าเนื้อหาผ่านรีวิวหรือยัง
- pre-push / CI ของ ols-qa ทำงานกับ PR แต่ sync เกิดตอน commit ก่อน push จะเกิดเสียอีก
- เทสต์ `sync_env.test.js` ไม่จับ — มันยืนยันพฤติกรรมที่ผิดไว้ (ผล #0063)
- brief ของเลนจากเธรดหลักไม่มีบรรทัด `HELIX_SYNC=0` และไม่มีเครื่องมือตรวจ brief ว่าเลนที่แตะ `skills/ references/ commands/` ได้ปิด sync หรือไม่

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึงระบบ OLS ของลูกค้า · แต่ผู้ใช้ helix ที่เปิด auto-update ได้ skill testing-ticket / retest-bug ฉบับยังไม่รีวิวช่วง 17:02–18:08 (+0700) อย่างน้อย 1 เครื่อง (เครื่องนี้ ยืนยันด้วย hash-object ตรงกัน) · เครื่องอื่นตรวจไม่ได้จากที่นี่ |
| เจ้าของงาน | ต้องเปิดเลนสืบ (X1) และเลนแก้ (H2) เพิ่ม · release v1.5.121–v1.5.123 สามตัวในประวัติ helix ที่ไม่มีเนื้อหาใหม่สุทธิ |
| ข้อมูล / ระบบ | ย้อนได้ — revert แบบเดินหน้า (`500cfe1`) ไม่ลบ tag/release · ไฟล์ 4 ตัวกลับตรงกับ ols-qa origin/main แล้ว |
| ความเชื่อถือของงานรอบนั้น | งานที่รันด้วย helix 1.5.121–1.5.122 ช่วงนั้นใช้ skill ฉบับ PR ไม่ใช่ฉบับ main · พบอีก 2 ไฟล์ใน helix (`references/defect-report-completeness.md`, `skills/catch-ai-workflow/reference.md`) ที่มาจากคอมมิต ols-qa `ca7903b` (2026-09-12) ซึ่งไม่อยู่บน main — คลาสเดียวกันเกิดมาก่อนแล้วโดยไม่มีใครเห็น รอเจ้าของงานตัดสินว่าจะจัดให้ตรงหรือไม่ |

---

## 5. แนวทางการแก้ไข (Fix)

- helix: revert `6c22a6c` + `1c78dfb` เป็นคอมมิตเดียว `500cfe1` ให้ version เดินหน้าเป็น 1.5.123 (revert ตรงๆ จะคืน VERSION เป็น 1.5.120 ซึ่งมี release แล้ว) · gates ของ helix rc=0 · release v1.5.123 Latest 2026-10-14T11:08:03Z
- ols-qa: PR #24 (`49a4564`) "fix(helix-sync): deploy only from ols-qa main, from committed content" — post-commit ข้ามเมื่อไม่ได้อยู่บน main · สคริปต์ sync ปฏิเสธเมื่อ ols-qa ไม่ได้อยู่บน main และคัดลอกจากเนื้อหาที่คอมมิตแล้ว · `sync_env.test.js` 14/14 ผ่าน และกับสคริปต์เก่า 5/14 ตก (ทั้ง 5 คือเคสใหม่) · `run-test-suites.sh` rc=0 "54 suites green" — merge แล้วเป็น `526491e`

**ยืนยันแล้วด้วย:** `git -C <helix-clone> log origin/main -4` แสดง `500cfe1 … revert: undo unmerged ols-qa branch syncs 6c22a6c and 1c78dfb` · `git merge-base --is-ancestor 526491e origin/main` → exit 0 · `gh pr view 24` → `MERGED 2026-10-14T11:32:28Z` · log ของเลน H2: "4 files EQUAL ols-qa origin/main"

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

ชั้นใหม่และแข็งกว่า #0063 — ย้ายด่านจาก "จำปิด env" ไปเป็น "เครื่องปฏิเสธเอง"

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | post-commit ส่ง helix เฉพาะเมื่อ `git symbolic-ref --short HEAD` = `main` · branch อื่นพิมพ์ว่าเลื่อนไปจนกว่าจะ merge | hook | ทำแล้ว (`526491e`) |
| P2 | `sync-skills-to-helix.sh` ปฏิเสธเองเมื่อ ols-qa ไม่ได้อยู่บน main (defence-in-depth แม้ถูกเรียกตรง) และคัดลอกจากเนื้อหาที่คอมมิตแล้ว ไม่ใช่ working tree | เครื่องมือ | ทำแล้ว (`526491e`) |
| P3 | กลับด้านเทสต์ที่ตรึงพฤติกรรมผิด: คอมมิตบน branch `wt` ต้อง **ไม่** เปลี่ยน helix · คอมมิตบน main จาก worktree ของ main ยังส่งได้ · พิสูจน์ด้วยการรันกับสคริปต์เก่าแล้วตก 5/14 | เทส | ทำแล้ว (`526491e`) |
| P4 | ตรวจว่า helix ไม่มีเนื้อหาที่ไม่อยู่บน ols-qa main: เทียบไฟล์ร่วมระหว่าง helix origin/main กับ ols-qa origin/main แล้วรายงานจำนวนที่ต่าง (วันนี้ 6 → 2 หลัง revert) — ทำให้ drift แบบ `ca7903b` ที่ค้างมาตั้งแต่ 2026-09-12 มองเห็นได้ | เครื่องมือ / CI | ค้าง (Action #3) |
| P5 | ช่องใหม่จาก P1: PR ที่ merge แล้วไม่ถึง helix อัตโนมัติ ต้องรัน `scripts/sync-skills-to-helix.sh` เองจาก main ที่ pull ล่าสุด — ถ้าลืม helix จะล้าหลัง main เงียบๆ · P4 จับความต่างนี้ได้ · ทางถาวรคือ trigger ตอน merge (เช่น post-merge บน main หรือ workflow บน push เข้า main ซึ่งต้องใช้ token ข้าม repo = ต้องรีวิวค่าใช้จ่าย/secret ก่อน) | เครื่องมือ / กฎ | ค้าง (Action #5) |

**กฎที่เพิ่มจากเหตุนี้:** helix รับเฉพาะเนื้อหาที่อยู่บน ols-qa main แล้ว — ด่านอยู่ในเครื่อง (P1–P3) ไม่ใช่ env ที่ต้องจำ · บันทึกใน `docs/CLAUDE-ARCHIVE.md` § Post-mortems (Report #0191) · ข้อความ "commit ที่นี่ = ส่ง helix" ใน `CLAUDE.md` §5 ล้าสมัยหลัง `526491e` ต้องแก้ (Action #2a)

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** พบในเซสชันเดียวกัน แล้วเลน X1 สืบยืนยันด้วยการเทียบ blob และรายการ release
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** ไม่เกิน 30 นาทีจากคอมมิตแรก (17:02:42 → X1 เริ่ม 17:32:20)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1–P2 ไม่ให้เกิดเลย · P4 ทำให้ drift ที่หลุดทางอื่นเห็นได้โดยไม่ต้องมีคนสังเกต

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- แก้ helix แบบ revert เดินหน้า ไม่ลบ tag/release ที่เครื่องผู้ใช้ติดตั้งไปแล้ว และจัด version ไม่ให้ชน release เก่า
- เทสต์ใหม่ถูกพิสูจน์ว่าตกกับโค้ดเก่าก่อนเชื่อว่าจับได้จริง

### สิ่งที่ต้องปรับปรุง
- การแก้ #0063 ควรถามว่า "worktree ไหนควรส่ง" ไม่ใช่แค่ "worktree ส่งได้ไหม" — เทสต์ที่ยืนยันพฤติกรรมใหม่ต้องมีเคสปฏิเสธคู่กันเสมอ
- ด่านที่ค่าเริ่มต้นคือปล่อยของออก production ต้องไม่พึ่ง env ที่คนต้องจำตั้ง

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | revert helix + ออก v1.5.123 | Claude (เลน H2) | High | Done (`500cfe1`) |
| 2 | merge PR #24 | Claude (เลน H2) | High | Done (`526491e`) |
| 2a | แก้ `CLAUDE.md` §5 จาก "commit = ส่ง helix" เป็น "merge เข้า main แล้ว sync จาก main = ส่ง helix" | Claude | Medium | Open |
| 3 | เครื่องมือเทียบไฟล์ร่วม helix ↔ ols-qa main (P4) | Claude | Medium | Open |
| 4 | ตัดสินว่าจะจัด 2 ไฟล์ที่มาจาก `ca7903b` ให้ตรง main หรือไม่ | เจ้าของงาน | Low | Open |
| 5 | ทางส่ง helix หลัง merge (P5) — เสนอแบบที่ไม่มีค่าใช้จ่ายให้เจ้าของงานเลือก | Claude → เจ้าของงาน | High | Open |

---

## 10. Technical Appendix

**ไฟล์ที่เปลี่ยน:**
- helix: `skills/procedures/testing-ticket-workflow/WORKFLOW.md`, `skills/procedures/retest-bug-workflow/WORKFLOW.md`, `references/figma-design-comparison.md`, `references/non-pass-challenge-gate.md` — คืนเป็นเนื้อหาตาม ols-qa origin/main ใน `500cfe1`
- ols-qa (PR #24 → `526491e`): `scripts/hooks/post-commit`, `scripts/sync-skills-to-helix.sh`, `tools/helix-sync/sync_env.test.js`

**Commit:** ต้นทาง `c70d32e` · `e06375e` (ไม่อยู่บน ols-qa main) → helix `6c22a6c` · `1c78dfb` → revert `500cfe1` · ols-qa PR #24 `49a4564` → merge `526491e`

**หลักฐาน:**
```
$ git merge-base --is-ancestor c70d32e origin/main; echo $?
1
$ git merge-base --is-ancestor e06375e origin/main; echo $?
1
$ git -C <helix-clone> log origin/main --format='%h %ci %s' -4
500cfe1 2026-10-14 18:04:46 +0700 revert: undo unmerged ols-qa branch syncs 6c22a6c and 1c78dfb
1c78dfb 2026-10-14 17:08:18 +0700 chore(sync): pull shared skill updates from ols-qa
6c22a6c 2026-10-14 17:02:42 +0700 chore(sync): pull shared skill updates from ols-qa
$ sed -n 10,19p scripts/hooks/post-commit
[ "${HELIX_SYNC:-1}" = "1" ] || exit 0
…
if printf '%s\n' "$CHANGED" | grep -qE '^(skills|references|commands)/'; then
  bash "$ROOT/scripts/sync-skills-to-helix.sh" …
```
