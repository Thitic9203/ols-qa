# Bug-Fix Loop Reference

## Round 1: Logic & Correctness (20 checks)

1. Function return ถูก type/shape ไหม?
2. Error path return ชัดเจนไหม (ไม่ return undefined โดยบังเอิญ)?
3. Null/undefined check ทุก external input ไหม?
4. Array index access มี bounds check ไหม?
5. Async function มี await ครบไหม?
6. Promise error มี catch ไหม?
7. Loop termination condition ถูกต้องไหม?
8. Off-by-one error ใน slice/index ไหม?
9. Business rule ทุกข้อ implement ครบไหม?
10. Default values ถูกต้องไหม?
11. Conditional logic ครอบคลุม all branches ไหม?
12. Mutation ของ input parameter (side effect ที่ไม่ตั้งใจ)?
13. Type coercion ที่ไม่ตั้งใจ (== vs ===, string + number)?
14. Date/timezone handling ถูกต้องไหม?
15. Floating point precision issue?
16. Regular expression ทำงานถูกต้องกับ edge cases?
17. Recursive function มี base case ไหม?
18. Early return ทุกจุดถูกต้องไหม?
19. State ถูก reset/clear อย่างถูกต้องไหม?
20. Log/debug statement ที่ไม่ควรอยู่ใน production?

## Round 2: Integration & Side Effects (15 checks)

1. Data format ระหว่าง module A→B ตรงกันไหม?
2. API response shape ตรงกับ consumer ที่ใช้อยู่ไหม?
3. Database transaction ครอบคลุมทุก operation ที่ต้อง atomic ไหม?
4. Race condition: ถ้า 2 request มาพร้อมกัน ผลลัพธ์ยังถูกต้องไหม?
5. Cache invalidation: แก้ข้อมูลแล้ว cache ถูก clear ไหม?
6. Event/message ordering สำคัญไหม และ handle ถูกต้องไหม?
7. Existing feature ที่ใช้ module นี้ยังทำงานได้ไหม?
8. Foreign key / referential integrity ยังคงถูกต้องไหม?
9. Index ที่มีอยู่ยังรองรับ query pattern ใหม่ไหม?
10. Auth/permission propagate ถูกต้องผ่านทุก layer ไหม?
11. Error message ที่ return กลับไปยัง client เหมาะสมไหม (ไม่ expose internals)?
12. Timeout handling ถูกต้องไหม (ไม่ hang, มี fallback)?
13. Retry logic มี exponential backoff ไหม (ถ้ามี)?
14. Webhook/callback URL ยังถูกต้องหลังการเปลี่ยนแปลงไหม?
15. Cross-cutting concern (logging, metrics) ยังทำงานอยู่ไหม?

## Round 3: Quality & Security (15 checks)

1. Hardcoded secret / API key ไหม?
2. SQL query ใช้ parameterized query ไหม (ไม่ string concat)?
3. User input ถูก sanitize ก่อน render ไหม (XSS)?
4. File path จาก user input ถูก validate ไหม (path traversal)?
5. Authorization check ที่ endpoint ทุกตัวที่เพิ่มไหม?
6. Sensitive data (password, token) ไม่ถูก log ไหม?
7. Error message ไม่ expose stack trace / internal info ไหม?
8. Dead code ที่ comment out แล้วไหม?
9. TODO / FIXME ที่ตั้งใจแก้ใน PR นี้ทำครบไหม?
10. Build compile clean ไม่มี warning ไหม?
11. TypeScript strict mode errors ไหม?
12. Lint errors ไหม?
13. Import ที่ไม่ได้ใช้ไหม?
14. Console.log / print debug statement ไหม?
15. ไฟล์ .env หรือ secret file ถูก stage ผิดพลาดไหม?

## แยกแยะ Code Bug vs Test Bug

| Signal | ความหมาย |
|--------|---------|
| Test ล้มเหลวตั้งแต่เริ่ม (ก่อนแก้ code) | Test เขียนผิด |
| Test ผ่านใน isolation แต่ล้มเหลวรวม | Test มี shared state |
| Test logic ไม่ตรงกับ requirement | Test เขียนผิด |
| Test logic ถูกแต่ code ทำงานต่างออกไป | Code bug |
