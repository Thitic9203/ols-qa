# Risk Identification Patterns

## Top 10 Technical Risks พร้อม Detection Signals

| Risk | Detection Signal | Severity |
|------|-----------------|---------|
| N+1 Query | loop ที่ query DB ข้างใน | High |
| Missing index | filter/sort บน field ที่ไม่มี index | High |
| Race condition | shared state + async operations | High |
| Auth bypass | endpoint ใหม่ที่ไม่มี middleware | Critical |
| Secret in code | hardcoded URL/key/password | Critical |
| Unbounded query | ไม่มี limit/pagination | Medium |
| Missing migration rollback | schema change ไม่มี down() | High |
| Dependency vulnerability | package อายุ > 1 ปีไม่ได้ update | Medium |
| Free tier overflow | ใช้ service ที่มี quota โดยไม่เช็ค | High |
| Breaking API change | เปลี่ยน response shape โดยไม่แจ้ง | High |

## Risk Severity Matrix

```
         | Low Impact | Med Impact | High Impact |
---------|-----------|-----------|------------|
High Prob| MEDIUM    | HIGH      | CRITICAL   |
Med Prob | LOW       | MEDIUM    | HIGH       |
Low Prob | LOW       | LOW       | MEDIUM     |
```

**Critical** → ต้องแก้ก่อน start dev
**High** → ต้องมี mitigation plan ก่อน start
**Medium** → บันทึกไว้ใน risk register + monitor
**Low** → log ไว้เฉยๆ

## Cost Traps ที่ดูฟรีแต่ไม่ฟรี

| Service | Free Limit | Overflow Cost | Detection |
|---------|-----------|--------------|-----------|
| Firestore (Blaze) | 50k reads/day | $0.06/100k | เช็ค daily read ใน console |
| GitHub Actions | 2000 min/month | $0.008/min | ดู billing ใน repo settings |
| Vercel | 100GB bandwidth | $0.15/GB | ดู usage dashboard |
| SendGrid | 100 emails/day | pay-per-email | เช็ค send volume |
| Cloudinary | 25k transforms | pay-per-transform | ดู usage report |

**วิธีตรวจ**: ถามตัวเองก่อนใช้ service ใหม่ทุกครั้ง:
1. free limit คือเท่าไหร่?
2. load ที่คาดว่าจะเกิด = กี่ % ของ limit?
3. ถ้าเกิน limit → cost per unit คือเท่าไหร่?

## Mitigation ที่ดี vs ไม่ดี

❌ ไม่ดี: "ระวังเรื่อง performance"
✅ ดี: "เพิ่ม index บน user_id และ created_at ก่อน deploy ป้องกัน full-table scan"

❌ ไม่ดี: "ตรวจสอบ auth ด้วย"
✅ ดี: "เพิ่ม requireAuth middleware บน /api/admin/* ทุก route และเขียน test ครอบ unauthorized access"
