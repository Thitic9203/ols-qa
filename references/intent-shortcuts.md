# Intent shortcuts (Helix router)

Use when the user writes **Thai or mixed language** but Helix still replies in **English**. Map intent → workflow; **skip the menu** when confidence is high.

| User intent (examples) | Route to |
|------------------------|----------|
| เขียนเทสเคสหน้าบ้าน, FE TC, AC EC, manual UI cases | `tc-fe-prep-workflow` |
| เทสเคส API, Swagger, OpenAPI, endpoint | `tc-api-prep-workflow` |
| retest, ทดสอบซ้ำ, verify fix, เช็คบั๊กแก้แล้ว | `retest-bug-workflow` |
| รัน playwright, test ticket, ทดสอบ ticket | `testing-ticket-workflow` |
| สร้างบั๊ก, file bug, open issue, log defect | `create-bug-workflow` |
| Helix, เมนู, ทำอะไรได้บ้าง | Show menu (`helix` / `/helix`) |

Extract `PROJ-123` or URLs from the same message when present.

If two workflows match, ask **one** English clarifying question — do not show the full menu unless the user asks.
