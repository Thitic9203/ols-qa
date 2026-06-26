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
| 1 | Creator | [เข้าสู่ระบบและโหลดหน้าแรก](smoke-test-2026-06-25.md#tc1) | `/` → `/creator` | ✅ ผ่าน |
| 2 | Creator | [เมนูหลักและ Navigation](smoke-test-2026-06-25.md#tc2) | `/creator/*` | ✅ ผ่าน |
| 3 | Creator | [หน้าสร้าง/จัดการสื่อและคอร์ส](smoke-test-2026-06-25.md#tc3) | `/creator/media`, `/creator/course` | ⚠️ Low |
| 4 | Creator | [หน้าตั้งค่าช่องของฉัน](smoke-test-2026-06-25.md#tc4) | `/creator/settings` | ✅ ผ่าน |
| 5 | Learner | [เข้าสู่ระบบและโหลดหน้าแรก](smoke-test-2026-06-25.md#tc5) | `/trending` | ❌ High |
| 6 | Learner | [เมนูหลักและ Navigation](smoke-test-2026-06-25.md#tc6) | `/learning-path`, `/content` | ✅ ผ่าน |
| 7 | Learner | [เรียกดูรายการคอร์สและสื่อ](smoke-test-2026-06-25.md#tc7) | `/content` | ✅ ผ่าน |
| 8 | Learner | [เข้าเนื้อหาสื่อการเรียนรู้](smoke-test-2026-06-25.md#tc8) | `/content/media/:id` | ✅ ผ่าน |

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

## สถานะ Deep Test (อัปเดต — รวม รอบ 2 + รอบ 3 + รอบ 4)

> รายละเอียด: [smoke-test-2026-06-25.md](smoke-test-2026-06-25.md#deep-test--รอบ-2-25-มิย-2569)  
> รอบ 3 (26 มิ.ย.): 12 agents hit session limit — ผลจาก screenshots ที่ capture ก่อน limit  
> รอบ 4 (26 มิ.ย.): Creator agent — `claude_in_chrome__computer` ล้มเหลว (extension conflict) ใช้ได้แค่ navigate/read_page  
> รอบ 4b (26 มิ.ย.): Learner + Guest agent — `claude_in_chrome__computer` + `javascript_tool` ทำงานได้ ทดสอบ G01-G02, L01-L07 ครบ

### Creator

| TC | Topic | สถานะ | รอบ |
|----|-------|--------|-----|
| C00 | Login | ✅ ผ่าน | R2 |
| C02 | Sidebar nav | ⚠️ Partial — hamburger layout (Bug Medium #3) | R3 |
| C03 | Topbar | ✅ ผ่าน (visual confirm) | R3 |
| C04 | Media list, filters, search | ✅ ผ่าน (พบ 2 bugs) | R2 |
| C06 | Media filter dropdowns | ✅ Filters แสดงครบ 5 dropdowns | R3 |
| C09 | Media item grid | ✅ 12 items, pagination 2 หน้า | R3 |
| C07 | Media search (functional) | ⏳ ยังไม่ได้ทำ (R4: blocked — ไม่สามารถ login เป็น Creator ได้ เพราะ JS exec ล้มเหลว) | - |
| C08 | Upload/สร้างสื่อ flow | ⏳ ยังไม่ได้ทำ (R4: blocked) | - |
| C10 | Course list | ⏳ ยังไม่ได้ทำ (R4: blocked) | - |
| C11 | Create new course | ⏳ ยังไม่ได้ทำ | - |
| C12 | Course detail/edit | ⏳ ยังไม่ได้ทำ | - |
| C13 | LP management | ⏳ ยังไม่ได้ทำ (R4: blocked) | - |
| C14 | Settings (all tabs) | ⏳ ยังไม่ได้ทำ | - |
| C15 | Notifications | ⏳ ยังไม่ได้ทำ | - |
| C16 | User profile/account | ⏳ ยังไม่ได้ทำ | - |
| C17 | Switch Creator → Learner | ⏳ ยังไม่ได้ทำ (R4: blocked) | - |
| C18 | 404 handling | ⏳ ยังไม่ได้ทำ | - |
| C19 | Auth boundary test | ✅ ผ่าน — Learner ถูก redirect กลับ `/` เมื่อเข้า `/creator/*` | R4 |

### Learner

| TC | Topic | สถานะ | รอบ |
|----|-------|--------|-----|
| G01 | Guest — Landing page (OLS-21 / OLS-18 AC_06) | ✅ ผ่าน — homepage โหลดสมบูรณ์ ไม่ต้อง login | R4b |
| G02 | Guest — เรียกดูคลังสื่อ /content (OLS-50 AC_01) | ✅ ผ่าน — 4,500 รายการ, metadata ครบ, ไม่มี login prompt | R4b |
| L01 | Login (OLS-18 AC_01) | ✅ ผ่าน | R2/R4b |
| L02 | Trending bug (OLS-35 area) | ❌ Bug High — Cannot GET /trending, retry redirect ผิด | R2/R3 |
| L03 | Session boundary — Learner เข้า /creator | ✅ ผ่าน R4 — Learner redirect กลับ `/` (อาจแก้แล้ว จาก R3 ที่พบ bug) | R3→R4 |
| L05 | LP list hero (OLS-26 entry) | ⚠️ hero โหลด / list ยังไม่ยืนยันสมบูรณ์ | R2 |
| L06 | LP Detail (OLS-26 AC_01,AC_05,AC_06) | ✅ ผ่าน (มีข้อสังเกต) — title, goal, course list, instructor ครบ; ไม่มีรูปปก; enroll state auto-enrolled | R4b |
| L07 | LP Enrollment CTA (OLS-26 AC_02) | ⚠️ ยังไม่ยืนยัน — learner auto-enrolled ทำให้ไม่เห็น "ลงทะเบียนเรียนทันที" | R4b |
| L08 | Catalog default (OLS-50 AC_01) | ✅ ผ่าน | R2 |
| L09 | Catalog initial load (OLS-50 AC_01) | ⚠️ โหลดได้ แต่พบ Creator button ใน Learner UI (Bug #6) | R3/R4 |
| L10 | Catalog search (OLS-50 AC_02) | ❌ Bug High — search ไม่กรองผล (4,500 คงเดิมทุก query) | R4b |
| L11 | Media type filter tab (OLS-50 AC_03) | ❌ Bug Medium — ไม่มี type filter tab ใน implementation | R4b |
| L12 | Catalog filter modal (OLS-50 AC_04-08) | ⏳ modal เปิดได้ — interaction ยังไม่ทดสอบ | - |
| L13 | Course Detail (OLS-27 AC_01, AC_05) | ✅ ผ่าน (มีข้อสังเกต) — title, lessons, instructor, achievements ครบ; enroll state auto-enrolled | R4b |
| L14 | Course Enrollment CTA (OLS-27 AC_02) | ⚠️ ยังไม่ยืนยัน — learner auto-enrolled | R4b |
| L15 | Enroll Course flow (OLS-28 AC_01-03) | ⏳ ยังไม่ได้ทดสอบ full flow | - |
| L16 | Video page/player (OLS-48 AC_01, AC_04) | ✅ ผ่าน — player โหลด, metadata ครบ; JS play() blocked by autoplay policy | R2/R4b |
| L04 | Goal sub-categories | ⏳ ยังไม่ได้ทำ | - |
| L17 | Video player controls (play/seek/volume) | ⚠️ ยังไม่ยืนยัน — ต้องการ real user gesture | R4b |
| L18 | Video tabs | ⏳ ยังไม่ได้ทำ | - |
| L19 | Comments | ⏳ ยังไม่ได้ทำ | - |
| L20 | PDF content | ⏳ ยังไม่ได้ทำ | - |
| L21 | My Learning page | ⏳ ยังไม่ได้ทำ | - |
| L22 | Following / watchlist | ⏳ ยังไม่ได้ทำ | - |
| L23 | Profile page | ⏳ ยังไม่ได้ทำ | - |
| L24 | Notifications | ⏳ ยังไม่ได้ทำ | - |
| L25 | Switch Learner → Creator | ⏳ ยังไม่ได้ทำ | - |
| L26 | 404 page | ⏳ ยังไม่ได้ทำ | - |
| L27 | Live stream page | ⏳ ยังไม่ได้ทำ | - |

---

## Sprint 2–5 Jira Ticket Mapping (อ้างอิงสำหรับ smoke test)

> ดึงจาก board: https://skilllane.atlassian.net/jira/software/projects/OLS/boards/818/backlog

### Sprint 2 (17 Jun – 26 Jun) — Active

| Ticket | Summary | เชื่อมกับ TC | สถานะ test |
|--------|---------|-------------|-----------|
| OLS-18 | SSO Login via NDLP | G01/G02/L01 | ✅ ผ่าน (mock token) |
| OLS-21 | Guest Browse | G01/G02 | ✅ ผ่าน |
| OLS-22 | Create video/YouTube media | C08 | ⏳ pending Creator login |
| OLS-23 | Create course | C11 | ⏳ pending |
| OLS-25 | Learner — ดูสื่อของ Creator ที่ติดตาม | L22 | ⏳ pending |
| OLS-26 | LP Detail | L06/L07 | ✅⚠️ R4b |
| OLS-27 | Course Detail | L13/L14 | ✅⚠️ R4b |
| OLS-28 | Enroll Course & Learn | L15 | ⏳ pending full flow |
| OLS-29 | Enroll LP & Learn | - | ⏳ pending |
| OLS-42 | Creator Content Management | C08 | ⏳ pending |
| OLS-43 | Create Digital Book media | C08 | ⏳ pending |
| OLS-44 | Update media | - | ⏳ pending |
| OLS-45 | Delete media | - | ⏳ pending |
| OLS-46 | Creator profile — my media list | C16 | ⏳ pending |
| OLS-47 | Learner Bookmark list | L22 | ⏳ pending |
| OLS-48 | Media Detail (Video/PDF/ePub/Article) | L16/L17 | ✅⚠️ R4b |
| OLS-50 | View Media List (คลังสื่อ) | L08-L11/G02 | ⚠️ search ไม่ทำงาน (Bug #8), ไม่มี type filter (Bug #9) |
| OLS-51 | Unpublish/Republish media | - | ⏳ pending |
| OLS-52 | Update course | C10 | ⏳ pending Creator login |
| OLS-53 | Delete course | - | ⏳ pending |
| OLS-54 | Unpublish/Republish course | - | ⏳ pending |

### Sprint 3 (29 Jun – 10 Jul) — Not started

| Ticket | Summary | หมายเหตุ |
|--------|---------|---------|
| OLS-20 | Session Management | ยังไม่ deploy |
| OLS-24 | Create LP | ยังไม่ deploy |
| OLS-30 | Social Interaction (Learner) | ยังไม่ deploy |
| OLS-31 | User Moderation | ยังไม่ deploy |
| OLS-32 | Admin Moderation | ยังไม่ deploy |
| OLS-34 | NDLP Integration (Creator) | ยังไม่ deploy |
| OLS-35 | Feed page (Learner) | ❌ /trending ยัง error (Bug #1) |
| OLS-36 | Learner Onboard | ยังไม่ deploy |
| OLS-55–57 | LP Update/Delete/Unpublish | ยังไม่ deploy |

### Sprint 4 (13 Jul – 24 Jul) — Not started

| Ticket | Summary |
|--------|---------|
| OLS-33 | Creator Live Streaming |
| OLS-37 | Admin Rewards Engine |

### Sprint 5 (27 Jul – 7 Aug) — Not started

_(4 work items — ยังไม่โหลด details)_

---

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
