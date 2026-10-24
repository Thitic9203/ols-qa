# Intent shortcuts (Helix router)

Use when the user writes **Thai, informal, or mixed language**. Map intent → workflow; **skip the menu** when confidence is high. Reply in **the user's language** ([user-communication.md](user-communication.md)). Each workflow's number, command, and ols-qa-only status: [skill-routing.md § Primary menu](skill-routing.md#primary-menu).

| User intent (examples) | Route to |
|------------------------|----------|
| เขียนเทสเคสหน้าบ้าน, FE TC, AC EC, manual UI cases | `tc-fe-prep-workflow` |
| เทสเคส API, Swagger, OpenAPI, endpoint | `tc-api-prep-workflow` |
| retest, ทดสอบซ้ำ, verify fix, เช็คบั๊กแก้แล้ว | `retest-bug-workflow` |
| รัน playwright, test ticket, ทดสอบ ticket | `testing-ticket-workflow` |
| สร้างบั๊ก, file bug, open issue, log defect | `create-bug-workflow` |
| ตรวจงานตัวเองอีกรอบ, audit this, review my work, check yourself, CatchAI | `catch-ai-workflow` |
| รีวิวเทสเคส, review TC sheet, check TC coverage against AC, review test case document | `tc-review-workflow` |
| ซ่อนคอนเทนต์, เอาคอนเทนต์ลง, content takedown, hide content | `content-takedown-workflow` (ols-qa workspace only) |
| รีวิวผลเทส, ตรวจคลิปหลักฐาน, review result, review evidence clips | `review-result-workflow` (ols-qa workspace only) |
| สโม้คเทส, smoke test, เช็ค build ใหม่หลัง deploy | `smoke-test-workflow` (ols-qa workspace only) |
| เตรียมเทสดาต้า, สร้างข้อมูลทดสอบ, test data prep, seed test data | `test-data-prep-workflow` (ols-qa workspace only) |
| Helix, เมนู, ทำอะไรได้บ้าง | Show menu (`helix` / `/helix`) |

Extract `PROJ-123` or URLs from the same message when present.

If two workflows match, ask **one** clarifying question in the user's language — do not show the full menu unless the user asks.
