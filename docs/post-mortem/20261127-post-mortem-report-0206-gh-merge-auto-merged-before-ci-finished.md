# Post-Mortem Report #0206 — `gh pr merge --auto` merge ทันทีก่อน CI จบ ทั้งที่เจ้าของงานสั่ง "merge เมื่อ CI เขียว"

**ระบบ:** GitHub PR merge จากเธรดหลัก (repo `Thitic9203/ols-qa`, `Thitic9203/pluton-ai-agent`)
**สภาพแวดล้อมที่ได้รับผลกระทบ:** branch `main` ของ ols-qa (PR #316) และ pluton-ai-agent (PR #999)
**วันที่เกิดเหตุ:** 2026-11-27
**วันที่ค้นพบ:** 2026-11-27
**วันที่จัดทำรายงาน:** 2026-11-27
**ผู้จัดทำ:** Claude (ในเซสชันของเจ้าของงาน)
**ระดับความรุนแรง:** Medium — งานขึ้น main ก่อนเงื่อนไขที่เจ้าของงานกำหนดครบ (CI เขียว) ผลสุดท้ายเขียวทั้ง 2 PR จึงไม่มีโค้ดเสียขึ้น main แต่เป็นเพราะโชค ไม่ใช่เพราะมีชั้นกัน
**ประเภท:** ทำผิดเงื่อนไขที่สั่ง / เชื่อพฤติกรรมเครื่องมือโดยไม่ตรวจ

---

## สรุปสั้น (Executive Summary)

เจ้าของงานสั่ง "merge เลยเมื่อ CI เขียว" ผมใช้ `gh pr merge <n> --auto --merge` โดยคิดว่า GitHub จะรอ CI ให้ แต่ทั้ง ols-qa และ pluton-ai-agent
ตั้ง `allow_auto_merge=false` และ `main` ของ ols-qa ไม่มี branch protection (`Branch not protected`) — `gh` จึง merge ทันที
PR #316 (ols-qa) merge ตอน `node-tests:IN_PROGRESS` / `sdd-gate:QUEUED` · PR #999 (pluton-ai-agent) merge 06:53:06Z หลัง check จบ
06:52:49Z เพียง 17 วินาที (เขียวโดยบังเอิญ) ภายหลัง CI ของ #316 เขียวทั้ง 2 check จึงไม่ต้อง revert มาตรการ: ก่อน merge ต้องอ่าน
`statusCheckRollup` ว่าทุก check `COMPLETED/SUCCESS` ในคำสั่งเดียวกับการ merge และห้าม `--auto` ใน repo ที่ `allow_auto_merge=false`

---

## 1. ปัญหา (Problem Statement)

- `gh pr merge 316 --repo Thitic9203/ols-qa --auto --merge` → อ่านสถานะทันที: `MERGED auto=false node-tests:IN_PROGRESS/ sdd-gate:QUEUED/`
- `gh api repos/Thitic9203/ols-qa` → `allow_auto_merge=false` · `…/branches/main/protection` → `Branch not protected`
- `gh api repos/Thitic9203/pluton-ai-agent` → `allow_auto_merge=false` · PR #999: `merged 2026-11-27T06:53:06Z` · `Tests SUCCESS 2026-11-27T06:52:49Z`
  (ตอนนั้นผมรัน `--auto` กับ #999 และ #1000 พร้อมกัน — #1000 ได้ error `Auto merge is not allowed for this repository` แต่ #999 merge ทันที)
- ภายหลัง: #316 `node-tests:COMPLETED/SUCCESS sdd-gate:COMPLETED/SUCCESS` (17:02:45)

**สิ่งที่ควรจะเป็น:** merge ได้ต่อเมื่อทุก check `COMPLETED/SUCCESS` ณ เวลาที่ merge (คำสั่งเจ้าของงาน · CLAUDE.md §0 ข้อ contemporaneous #0105 ·
global ข้อ 18 เทสต์ไม่ผ่านห้าม deploy)

---

## 2. ไทม์ไลน์ (Timeline)

| เวลา | เหตุการณ์ |
|------|-----------|
| 2026-11-27 06:51–06:53Z | `--auto` กับ #999/#1000 · #999 merge ทันที (check จบก่อน 17 วินาที) · #1000 ได้ error → ผมเช็ค CI แล้ว merge เองภายหลัง |
| 16:58 (เวลาไทย) | เจ้าของงานสั่ง "merge เลยเมื่อ CI เขียว" สำหรับ #316 → `--auto` → **merge ทันทีขณะ CI ยังรัน** |
| 16:58 | อ่านสถานะเห็น `MERGED` + `IN_PROGRESS` → แจ้งเจ้าของงานทันที |
| 17:02 | CI ของ #316 เขียวทั้ง 2 check · ตรวจ `allow_auto_merge` / branch protection ได้สาเหตุ |

---

## 3. สาเหตุโดยละเอียด (Root Cause Analysis)

### 5 Whys

1. **ทำไม merge ก่อน CI จบ?** — เพราะ `gh pr merge --auto` merge ทันที
2. **ทำไม `--auto` ไม่รอ?** — repo ตั้ง `allow_auto_merge=false` และไม่มี required checks — ไม่มีอะไรให้ "รอ" จึงเป็น merge ปกติ
3. **ทำไมผมใช้ `--auto`?** — ผมคิดว่า `--auto` = "รอ CI แล้ว merge" โดยไม่ได้ตรวจการตั้งค่า repo
4. **ทำไมไม่เห็นตั้งแต่ #999?** — #999 merge สำเร็จและเช็คย้อนหลังว่า check เขียว ผมสรุปว่าปลอดภัย แต่ไม่ได้เทียบเวลา merge กับเวลาที่ check จบ
5. **root cause:** เงื่อนไข "เขียวก่อน merge" ถูกฝากไว้กับพฤติกรรมของเครื่องมือที่ไม่ได้ตรวจ แทนที่จะตรวจเองใน **คำสั่งเดียวกับการ merge**

**ทำไมชั้นป้องกันที่มีอยู่ถึงไม่จับ:** repo ไม่มี branch protection / required checks · ไม่มี guard ฝั่งเราที่ตรวจ `statusCheckRollup` ก่อน `gh pr merge`

---

## 4. ผลกระทบ (Impact)

| ด้าน | ผลกระทบ |
|------|---------|
| ผู้ใช้งานจริง / ลูกค้า | ไม่ถึง — เป็นเอกสาร post-mortem (#316) และสเปก (#999) |
| เจ้าของงาน | คำสั่งที่ให้ไว้ไม่ถูกทำตาม ต้องตัดสินใจเพิ่มว่าจะให้ทำอะไรต่อ |
| ข้อมูล / ระบบ | ไม่มีความเสียหาย — CI ของทั้ง 2 PR เขียวภายหลัง |
| ความเชื่อถือของงานรอบนั้น | PR อื่นในรอบ (#314, #315, #1000, ols-qa-e2e#381/382/383) merge หลังอ่านว่าทุก check `SUCCESS` แล้ว — ไม่ได้รับผล |

---

## 5. แนวทางการแก้ไข (Fix)

- ตรวจ CI ของ #316 หลัง merge: `node-tests:COMPLETED/SUCCESS sdd-gate:COMPLETED/SUCCESS` → ไม่ต้อง revert
- #999: `Tests SUCCESS` ทั้ง 2 รายการก่อน merge 17 วินาที → ไม่ต้อง revert

---

## 6. แนวทางการป้องกันไม่ให้เกิดปัญหาซ้ำ (Prevention)

| # | มาตรการ | ชนิด | สถานะ |
|---|---------|------|-------|
| P1 | สคริปต์ `merge-if-green` (อ่าน `statusCheckRollup` แล้ว merge เฉพาะเมื่อทุก check `COMPLETED/SUCCESS` และมีอย่างน้อย 1 check · ไม่งั้นปฏิเสธพร้อมรายชื่อ check) ใช้แทน `gh pr merge` ตรงๆ | เครื่องมือ | ค้าง — รอเจ้าของงานอนุมัติ (repo ไหน / global) |
| P2 | PreToolUse hook ปฏิเสธ `gh pr merge … --auto` ใน repo ที่ `allow_auto_merge=false` | hook (global) | ค้าง — แตะ `~/.claude/settings.json` ต้องขออนุมัติ |
| P3 | (ทางเลือกฝั่ง repo) เปิด branch protection + required checks บน `main` ของ ols-qa / pluton-ai-agent ให้ GitHub กันเอง | การตั้งค่า repo | ค้าง — เจ้าของงานตัดสิน (กระทบ workflow ของ bot อื่นที่ push main) |
| P4 | memory: `--auto` ไม่ได้แปลว่ารอ CI ใน repo ที่ปิด auto-merge — เช็ค `allow_auto_merge` ก่อนเสมอ | memory | ทำแล้ว |

**กฎที่เพิ่มจากเหตุนี้:** memory `feedback_merge-only-after-checks-read-green` (P4) — ชั้นที่บังคับจริงคือ P1/P2/P3 ซึ่งรออนุมัติ

---

## 7. การตรวจจับปัญหา (Detection)

- **ใครจับได้ / จับได้ยังไง:** ผมอ่านสถานะ PR ทันทีหลังสั่ง merge แล้วเห็น `MERGED` คู่กับ `IN_PROGRESS`
- **ใช้เวลาเท่าไหร่กว่าจะรู้:** #316 ทันที · #999 ไม่รู้จนวิเคราะห์ #316 (ตอนนั้นอ่านว่า "MERGED" และ check เขียว โดยไม่เทียบเวลา)
- **รอบหน้าอะไรจะจับได้เร็วกว่านี้:** P1 — ปฏิเสธก่อน merge

---

## 8. บทเรียนที่ได้ (Lessons Learned)

### สิ่งที่ทำได้ดี
- อ่านสถานะหลัง merge ทันทีและแจ้งเจ้าของงานตรงๆ · ตรวจ CI จนจบก่อนสรุปว่าไม่ต้อง revert

### สิ่งที่ต้องปรับปรุง
- เงื่อนไขที่เจ้าของงานกำหนด ต้องตรวจเองในคำสั่งเดียวกับการกระทำ ไม่ฝากไว้กับ flag ของเครื่องมือ

---

## 9. Action Items

| # | Action | ผู้รับผิดชอบ | ความสำคัญ | สถานะ |
|---|--------|--------------|-----------|-------|
| 1 | ยืนยัน CI #316 เขียว | Claude | High | Done |
| 2 | ขออนุมัติ P1 / P2 / P3 | Claude → เจ้าของงาน | Medium | Open |
| 3 | P4 memory | Claude | Low | Done |

---

## 10. Technical Appendix

**หลักฐาน:**
```
gh pr merge 316 --auto --merge  →  MERGED auto=false node-tests:IN_PROGRESS/ sdd-gate:QUEUED/
allow_auto_merge=false (ols-qa) · allow_auto_merge=false (pluton-ai-agent)
{"message":"Branch not protected", …}
#999 merged 2026-11-27T06:53:06Z · Tests SUCCESS 2026-11-27T06:52:49Z
#316 later: node-tests:COMPLETED/SUCCESS sdd-gate:COMPLETED/SUCCESS
```
