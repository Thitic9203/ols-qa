# Impact Analysis Guide

## วิธี Trace Dependencies ก่อนแก้ Code

### Step 1: ค้นหาว่าใครใช้ function/component นี้
```bash
# หาทุกที่ที่ import หรือ call
grep -r "functionName\|ComponentName" src/ --include="*.ts" --include="*.tsx" -l

# หา indirect usage ผ่าน re-export
grep -r "export.*functionName" src/
```

### Step 2: ตรวจ Hidden Dependencies

| ประเภท | วิธีตรวจ |
|--------|---------|
| Shared state / global store | grep สำหรับ store name หรือ context |
| CSS class ที่ใช้ร่วม | grep class name ใน *.css + *.tsx |
| Event listener | grep addEventListener / emit / on() |
| Exported type/interface | grep "import.*TypeName" ทั้ง repo |
| Environment variable | grep process.env.VAR_NAME |
| Database field | grep column_name ใน migrations + queries |

### Step 3: Change Risk Categories

| Category | ตัวอย่าง | Action |
|----------|---------|--------|
| Safe (ทำคนเดียวได้) | เพิ่ม function ใหม่, เพิ่ม optional field | ทำได้เลย |
| Review first | เปลี่ยน function signature, rename | list impact + ถาม user |
| High risk | ลบ function, เปลี่ยน DB schema | ต้องการ explicit approval |
| Team check | เปลี่ยน shared component, API contract | แจ้ง team ก่อน |

## Template แจ้ง User

```
⚠️ Impact Analysis: [ชื่อการเปลี่ยน]

Files/features ที่จะได้รับผลกระทบ:
- [file1.ts] — [อธิบายว่ากระทบอย่างไร]
- [feature X] — [อธิบาย]
- [test Y] — [อาจต้อง update]

Risk level: Low / Medium / High
แนวทางที่ปลอดภัยที่สุด: [แนะนำ]

ต้องการดำเนินการต่อไหมคับ?
```

## Safe Change Patterns

**Backwards-compatible change:**
```typescript
// แทนที่จะเปลี่ยน signature ตรงๆ
// เพิ่ม overload หรือ optional param ก่อน
function process(input: string, options?: ProcessOptions) { ... }
```

**Feature flag pattern (ไม่มีค่าใช้จ่าย):**
```typescript
// ใช้ env var หรือ config แทน paid feature flag service
const useNewFeature = process.env.FEATURE_NEW_FLOW === 'true'
```
