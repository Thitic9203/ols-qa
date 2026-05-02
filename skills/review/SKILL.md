---
name: review
description: "Code review and security audit. Use when you need a thorough review of code changes — covering quality, security vulnerabilities, performance, and breaking changes."
---

# Dev Orchestrator — Review Phase

ทำ code review + security audit อย่างละเอียดก่อน merge หรือ deploy

## Input ที่ต้องการ

ถามผู้ใช้:
```
1. ทำที่ repo ใด?
2. review อะไร? (PR number / branch / specific files)
3. ต้องการ review มิติไหนบ้าง?

   [ ] Code quality & readability
   [ ] Security vulnerabilities
   [ ] Performance
   [ ] Breaking changes
   [ ] Test coverage
   [ ] Architecture
```

## External Skill Discovery สำหรับ Review

ตรวจก่อนว่า skill เหล่านี้ติดตั้งอยู่ไหม:

| มิติ | External Skill | Marketplace | Trust | Fallback |
|------|---------------|-------------|-------|---------|
| Code quality | `code-review` | `claude-plugins-official` ⭐⭐⭐ | — | `fullstack-dev-skills:code-reviewer` |
| Differential | `differential-review` | `trailofbits` ⭐⭐ | — | `review` |
| Security (general) | `security-guidance` | `claude-plugins-official` ⭐⭐⭐ | — | `security-review` |
| Security (deep) | `agentic-actions-auditor` | `trailofbits` ⭐⭐ | — | `fullstack-dev-skills:secure-code-guardian` |
| Insecure defaults | `insecure-defaults` | `trailofbits` ⭐⭐ | — | `security-review` |
| Entry points | `entry-point-analyzer` | `trailofbits` ⭐⭐ | — | `diagnose` |
| PR review | `pr-review-toolkit` | `claude-plugins-official` ⭐⭐⭐ | — | `superpowers:requesting-code-review` |

ถ้าไม่ได้ติดตั้ง → แนะนำ + ถาม user ก่อนเสมอ

## Review Checklist

### Code Quality
```
[ ] Naming ชัดเจน สื่อความหมาย?
[ ] ไม่มี dead code / commented-out code?
[ ] ไม่มี hardcoded values / magic numbers?
[ ] Error handling ครบถ้วน?
[ ] DRY principle — ไม่ซ้ำซ้อน?
[ ] ไม่ซับซ้อนเกินจำเป็น?
```

### Security
```
[ ] ไม่มี SQL injection / XSS / command injection?
[ ] Auth/Authz ถูกต้อง?
[ ] Sensitive data ไม่ถูก expose ใน logs / responses?
[ ] Secrets ไม่ถูก hardcode ใน code?
[ ] Input validation ครบ?
[ ] Dependencies ไม่มีช่องโหว่รู้จัก?
```

### Performance
```
[ ] ไม่มี N+1 query?
[ ] Missing indexes?
[ ] Unbounded loops / queries?
[ ] Memory leaks ที่เห็นได้ชัด?
```

### Breaking Changes
```
[ ] API signature เปลี่ยนไหม?
[ ] DB schema เปลี่ยนไหม?
[ ] Exported types / interfaces เปลี่ยนไหม?
[ ] Feature flags / env vars ถูกลบ/เปลี่ยนไหม?
```

## Output Format

สรุปผล review ในรูปแบบ:

```
## Review Summary

### ✅ Good
- [สิ่งที่ดี]

### ⚠️ Must Fix (blocking)
- [issue] — [แนวทางแก้ไข]

### 💡 Suggestions (non-blocking)
- [ข้อเสนอแนะ]

### 📊 Metrics
- Complexity score: —
- Test coverage: —%
- Security issues: X critical, Y warnings
```

แจ้ง user ว่า review เสร็จแล้ว พร้อม list สิ่งที่ต้องแก้ก่อน merge
