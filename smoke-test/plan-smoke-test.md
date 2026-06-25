# Smoke Test Plan — OLS Web Dev

**ผลการทดสอบ:** [smoke-test-2026-06-25.md](smoke-test-2026-06-25.md)

---

## Context

ทดสอบ smoke test เว็บแอป OLS ที่ `https://ols-web-dev.ndlp.go.th/` ครอบคลุมทั้ง 2 roles (Creator + Learner)  
Login ผ่าน JavaScript fetch ใน browser console (mock NDLP token) ไม่ใช่ form login ทั่วไป  
ผลลัพธ์เป็น MD file ภาษาไทย ตาราง: No. / Role / Topic / Result / Severity

## Approach

ใช้ `mcp__plugin_superpowers-chrome_chrome__use_browser` drive browser โดยตรง (site อยู่บน private network — cloud browser เข้าไม่ถึง)

- Login ผ่าน `eval` JS fetch → wait → navigate เพื่อ apply session
- Screenshot แต่ละ TC ด้วย `screenshot` action (fullpage)
- Judge ด้วย vision ของ Claude เอง
- บันทึกผลเป็น `smoke-test/smoke-test-2026-06-25.md`

## Login Pattern

### Creator
```javascript
await fetch("https://ols-api-dev.ndlp.go.th/api/auth/link/ndlp", {
  method: "PUT",
  credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accessToken: "mock-ndlp-creator-token" }),
});
location.reload();
```

### Learner
```javascript
await fetch("https://ols-api-dev.ndlp.go.th/api/auth/link/ndlp", {
  method: "PUT",
  credentials: "include",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ accessToken: "mock-ndlp-learner-token" }),
});
location.reload();
```

> **หมายเหตุ:** Cookie ถูก set เป็น HttpOnly จึงไม่ปรากฏใน `document.cookie` แต่ browser ส่งไปกับ request โดยอัตโนมัติ — ยืนยัน session โดย navigate ไปยัง protected route เช่น `/creator`

## Smoke Test Scenarios

| No. | Role | Topic | URL | ผลลัพธ์ |
|-----|------|-------|-----|--------|
| 1 | Creator | เข้าสู่ระบบและโหลดหน้าแรก | `/` → `/creator` | ✅ ผ่าน |
| 2 | Creator | เมนูหลักและ Navigation | `/creator/*` | ✅ ผ่าน |
| 3 | Creator | หน้าสร้าง/จัดการสื่อและคอร์ส | `/creator/media`, `/creator/course` | ⚠️ Low |
| 4 | Creator | หน้าตั้งค่าช่องของฉัน | `/creator/settings` | ✅ ผ่าน |
| 5 | Learner | เข้าสู่ระบบและโหลดหน้าแรก | `/trending` | ❌ High |
| 6 | Learner | เมนูหลักและ Navigation | `/learning-path`, `/content` | ✅ ผ่าน |
| 7 | Learner | เรียกดูรายการคอร์สและสื่อ | `/content` | ✅ ผ่าน |
| 8 | Learner | เข้าเนื้อหาสื่อการเรียนรู้ | `/content/media/:id` | ✅ ผ่าน |

## Severity Scale

| Severity | เมื่อใช้ |
|----------|---------|
| **Critical** | หน้าไม่โหลด / crash / 5xx |
| **High** | ฟีเจอร์หลักทำงานผิด |
| **Medium** | ทำงานได้แต่มี error/friction |
| **Low** | ปัญหาเล็กน้อย (thumbnail, UI glitch) |
| **-** | ผ่าน ไม่พบปัญหา |

## ข้อจำกัดที่พบระหว่างรัน

- **Site อยู่บน private network** → cloud browser (Browser Use) เข้าไม่ถึง ต้องใช้ local browser
- **Browser Use v2 API** → key ที่ได้จาก device auth มีแค่ v3 scopes ไม่รองรับ v2 tasks
- **Claude in Chrome extension** → ไม่ได้ต่อ MCP ขณะทดสอบ
- **Control_Chrome execute_javascript** → ใช้ไม่ได้กับ tab ที่อยู่ต่าง window

**แก้ด้วย:** `mcp__plugin_superpowers-chrome_chrome__use_browser` — full browser control รองรับ navigate/eval/screenshot

## คำแนะนำสำหรับรอบหน้า

### 1. แบ่ง agent ให้รันคู่ขนาน (ลดเวลา ~40–50%)

site อยู่บน private network → ใช้ได้แค่ `superpowers-chrome` (cloud browser ไม่ถึง)  
แต่สามารถ spawn 2 subagent พร้อมกันได้ — แต่ละตัวมี browser session แยก + login ของตัวเอง

```
Agent 1 (Creator) → TC1–TC4
Agent 2 (Learner) → TC5–TC8
```

ใช้ `Agent tool` ใน Claude Code พร้อมกัน 2 call → รอทั้งคู่เสร็จ → รวมผล

**ข้อควรระวัง:**
- แต่ละ agent ต้อง login เองก่อนทดสอบ (session ไม่ share ข้ามกัน)
- RAM/CPU เพิ่มขึ้น — เปิด 2 browser พร้อมกัน
- ถ้าเครื่องหนักให้ลด เป็น sequential แต่แยก agent ไว้เผื่อขยายทีหลัง

### 2. ย้าย screenshots เข้า smoke-test/ ด้วย

ตอนนี้ screenshots อยู่ที่ `reports/screenshots/` แยกจาก MD ไฟล์  
รอบหน้าให้เก็บรวมไว้ใน `smoke-test/screenshots/{date}/` จะได้ทุกอย่างอยู่ที่เดียว

### 3. เพิ่ม TC สำหรับ /trending retry

TC5 พบว่า `/trending` ขึ้น error — รอบหน้าหลัง dev แก้แล้ว ให้เพิ่ม sub-step:
1. กด "ลองอีกครั้ง" → ตรวจว่าโหลดสำเร็จ
2. Reload page → ตรวจว่า error ไม่กลับมา

### 4. ตรวจ thumbnail แยก TC

เพิ่ม TC สั้นๆ ตรวจเฉพาะ thumbnail โหลดได้ไหม (ตอนนี้รวมอยู่ใน TC3 ซึ่งทำให้ severity ปนกัน)

---

## Screenshots

บันทึกไว้ที่: `reports/screenshots/smoke-2026-06-25/`

| ไฟล์ | TC |
|------|----|
| `tc1-00-landing.png` | TC1 |
| `tc3-creator-course-mgmt.png` | TC3 |
| `tc3-creator-courses.png` | TC3 |
| `tc4-creator-settings.png` | TC4 |
| `tc5-learner-trending.png` | TC5 |
| `tc6-learner-nav-learning-path.png` | TC6 |
| `tc7-learner-catalog.png` | TC7 |
| `tc8-learner-content-video.png` | TC8 |
