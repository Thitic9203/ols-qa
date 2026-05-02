# 3-Round Plan Review Checklist

## Round 1: Completeness (15 คำถาม)

1. ครบทุก functional requirement ที่ระบุไหม?
2. มี task สำหรับ error states / unhappy paths ไหม?
3. มี task สำหรับ loading / empty states (UI) ไหม?
4. มี task สำหรับ data validation ทุก input ไหม?
5. มี DB migration task ไหม (ถ้าเปลี่ยน schema)?
6. มี task สำหรับ update API documentation ไหม?
7. มี task สำหรับ update environment variables ไหม?
8. ครบทุก test type ที่ agreed ไหม (unit/integration/e2e)?
9. มี staging deploy task ก่อน production ไหม?
10. มี task สำหรับ feature ที่ใช้ร่วมกับ team อื่นไหม?
11. Out of scope ระบุชัดเจนไหม?
12. dependencies ทุกอย่างระบุไหม (external service, other PR)?
13. rollback plan มีไหม?
14. มี task สำหรับ monitoring / alerting ไหม?
15. มี task สำหรับ update CHANGELOG / release notes ไหม?

## Round 2: Technical Soundness (15 คำถาม)

1. Task order สอดคล้องกับ dependency จริงไหม?
2. Estimate สมเหตุสมผลไหม (ไม่ optimistic เกินไป)?
3. Plan สอดคล้องกับ tech stack ที่มีอยู่จริงไหม?
4. มี breaking change ที่ไม่ได้ flag ไหม?
5. DB migration ทำ zero-downtime ได้ไหม?
6. API change backward-compatible ไหม (หรือ versioned)?
7. ทุก task มี acceptance criteria testable ไหม?
8. มี task ที่ depend กัน circular ไหม?
9. Phase 1 (setup) ครบพอที่ Phase 2 จะเริ่มได้เลยไหม?
10. config/secret ที่ต้องใช้ระบุครบไหม?
11. plan รองรับ concurrent development ได้ไหม?
12. มี task ที่ซ้ำกันหรือทำ 2 ครั้งโดยไม่จำเป็นไหม?
13. test strategy ครอบคลุม happy + edge + error cases ไหม?
14. staging environment พร้อมสำหรับ plan นี้ไหม?
15. มี task ที่ต้องรอ external team/approval ไหม (ระบุไว้แล้วหรือยัง)?

## Round 3: Risk & Cost (15 คำถาม)

1. ทุก risk ใน risk register มี mitigation ไหม?
2. mitigation ทุกอันมี task ใน plan ไหม?
3. มีค่าใช้จ่ายซ่อนอยู่ใน service/tool ที่เลือกไหม?
4. free tier limit ของทุก service ที่ใช้ตรวจแล้วหรือยัง?
5. มี free alternative ที่ดีกว่าสำหรับ paid tool ที่ใช้ไหม?
6. ถ้า estimate ผิด 2x จะ impact timeline อย่างไร?
7. มี single point of failure ใน plan ไหม?
8. ถ้า task หนึ่งล่าช้า task อื่นจะ blocked ไหม?
9. security risk ทุกอันมี mitigation ไหม?
10. plan ป้องกัน breaking existing feature ได้ไหม?
11. มี performance risk ที่ยังไม่ address ไหม?
12. data integrity risk ทุกอันมี mitigation ไหม?
13. cost analysis ครบทุก service ที่เกี่ยวข้องไหม?
14. มีข้อสมมติ (assumption) ที่ยังไม่ได้ validate ไหม?
15. plan นี้ safe พอที่จะ start ได้เลยไหม?
