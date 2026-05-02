---
name: deploy
description: "Deployment workflow — staging-first deployment, smoke tests, production deployment, and post-deploy verification. Use when code is tested and ready to ship."
---

# Dev Orchestrator — Deploy Phase

ดูแล deployment ครบวงจร staging → verify → production

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด?
2. deploy ไปที่ environment ไหน? (staging / production / ทั้งคู่)
3. มี smoke test checklist แล้วหรือยัง?
```

## Pre-Deploy Checklist

ตรวจก่อน deploy เสมอ:

```
[ ] All tests pass (unit + integration + E2E)?
[ ] No lint / type errors?
[ ] Secrets / environment variables ครบ?
[ ] DB migrations ready (tested locally)?
[ ] Breaking change checklist ผ่าน?
[ ] Rollback plan พร้อม?
```

ถ้าข้อไหน fail → หยุด + แจ้ง user ก่อน **ห้าม deploy ถ้า checklist ไม่ผ่าน**

## Staging Deploy

```bash
# ตัวอย่าง — ปรับตาม tech stack จริง
git checkout main && git pull origin main
# run deploy script ของ staging
```

หลัง deploy staging:
1. รัน smoke tests บน staging URL
2. ตรวจ error logs
3. ตรวจ performance metrics
4. แจ้ง user ผล + รอ approval ก่อนไป production

## Production Deploy

**รอ explicit approval จาก user ก่อนเสมอ:**
```
Staging ✅ พร้อมแล้ว
→ ต้องการ deploy ไป production ไหมคับ?
```

หลัง approve → deploy production → verify ซ้ำ

## Post-Deploy Verification

```
[ ] Service responds correctly (health check)?
[ ] Key user flows ทำงานได้?
[ ] Error rate ปกติ (ไม่ spike)?
[ ] Performance metrics ปกติ?
[ ] Logs ไม่มี unexpected errors?
```

## Environment Separation Audit

ทุกครั้งหลัง deploy ให้ตรวจ:

| Item | Staging | Production | Match? |
|------|---------|-----------|--------|
| Project ID | — | — | ✅/❌ |
| Secrets | — | — | ✅/❌ |
| DB connection | — | — | ✅/❌ |
| Feature flags | — | — | ✅/❌ |

## Cost Check

ก่อน deploy ตรวจ:
- มีการเปลี่ยน infra ที่อาจทำให้เกิน free tier ไหม?
- ถ้ามี → แจ้ง user + cost estimate ก่อนเสมอ

## Output

รายงาน deployment status ทั้งสอง env แล้วถามว่าต้องการต่อไป `/helix:review` หรือปิดงานเลย
