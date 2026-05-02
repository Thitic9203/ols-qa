---
name: full
description: "Complete end-to-end software development workflow — from requirements intake to deployment. Runs all phases sequentially: analyze → plan → execute → test → deploy → finalize. Use when starting a new feature or system from scratch."
---

# Dev Orchestrator — Full Workflow

ครบทุก phase ตั้งแต่ต้นจนจบ ทำตามลำดับโดยอัตโนมัติ

## STEP 0: Initial Intake

ถามก่อนทำทุกครั้ง:
```
1. ทำที่ repo ใด? (ลิงก์ GitHub หรือ local path)
2. ต้องการพัฒนาอะไร? (บอกพอสังเขป)
```
รอจนได้คำตอบทั้ง 2 ข้อก่อน

## STEP 1: Repo Access Check

```bash
gh repo view <owner/repo> --json name,defaultBranchRef,visibility
git checkout main && git pull origin main
```

กรณีเข้าไม่ได้ → แจ้ง user + รอคำสั่งก่อน ห้ามดำเนินการต่อ

## STEP 2: Analyze

→ invoke `helix:analyze` เพื่อทำ requirement breakdown + risk analysis ครบ 5 มิติ

## STEP 3: Plan

→ invoke `helix:plan` เพื่อสร้าง development plan + review 3 รอบ
→ รอ user confirm + upload plan ก่อน

## STEP 4: Execute

→ invoke `helix:execute` เพื่อ implement ตาม plan
→ อัปเดตทุก 10 นาที จนครบทุก task
→ **หลัง implement เสร็จ: วน bug-fix loop 3 รอบ (Logic / Integration / Security) ก่อนออกจาก step นี้เสมอ**

## STEP 5: Test

→ invoke `helix:test`
→ ถาม user เลือกประเภท tests → run → แก้จน pass ทั้งหมด

## STEP 6: Deploy

→ invoke `helix:deploy`
→ staging → verify → รอ approval → production

## STEP 7: Finalize

อัปเดต MD plan ไฟล์เดิม:
- ติ๊ก completed tasks ทั้งหมด
- เพิ่มผล test summary
- อัปเดต Risk Register
- เพิ่ม deployment records

Final recheck:
```
✅ Build clean? ✅ All tests pass? ✅ Staging verified?
✅ Production verified? ✅ Docs updated? ✅ MD plan updated?
✅ No breaking changes? ✅ All scope completed?
```

แจ้ง user:
```
✅ งานเสร็จสมบูรณ์ตาม plan แล้วคับ

สรุปสิ่งที่ทำ: [รายการ]
ผลการทดสอบ: [สรุป]
Deployment: Staging ✅ | Production ✅

มีอะไรให้ทำเพิ่มเติมไหมคับ?
```

---

## Core Rules (บังคับทุก step)

| Rule | รายละเอียด |
|------|-----------|
| Cost Policy | ทุกแนวทางที่มีค่าใช้จ่าย → แจ้ง + cost estimate + รอ approval ก่อนเสมอ |
| Decision Policy | ไม่แน่ใจ → ถาม ไม่ตัดสินใจเอง |
| Scope Policy | ห้ามทำเกิน scope ที่ confirm กัน |
| Safety Policy | ทุกการแก้ไขต้องไม่ทำให้ feature อื่นพัง |
| Problem Policy | เจอปัญหานอก scope → แจ้ง + ถาม user ก่อนแก้ |
| Progress Policy | อัปเดตทุก 10 นาที ในรูปแบบตาราง |
| Deployment Policy | Staging first เสมอ → ห้าม deploy ตรงไป production |
| Skill Policy | External skill → แนะนำ + ถาม user ก่อนติดตั้งเสมอ |
