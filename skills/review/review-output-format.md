# Review Output Format Reference

## Standard Output Structure

Every review MUST follow this exact structure. No exceptions.

```markdown
## Review Summary — [PR/Branch/Files reviewed]
**Reviewer**: Helix  
**Date**: [date]  
**Scope**: [what was reviewed]

---

### ✅ Good
- [Specific thing done well — be concrete, not generic]
- [Another positive finding]

### 🚫 Must Fix (blocking merge)
- **[Category]**: [Issue description]  
  📍 `path/to/file.ts:42`  
  💬 [Explanation of why this is a problem]  
  🔧 Fix: [Specific remediation — show code if helpful]

### ⚠️ Should Fix (strongly recommended)
- **[Category]**: [Issue description]  
  📍 `path/to/file.ts:87`  
  💬 [Why this matters]  
  🔧 Fix: [Recommended approach]

### 💡 Suggestions (non-blocking)
- **[Category]**: [Suggestion]  
  📍 `path/to/file.ts:15`  
  💬 [Optional context]

---

### 📊 Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Files changed | X | — | — |
| Cyclomatic complexity (max) | X | ≤ 10 | ✅/❌ |
| Test coverage | X% | ≥ 80% | ✅/❌ |
| Security issues (critical) | X | 0 | ✅/❌ |
| Security issues (high) | X | 0 | ✅/❌ |
| Lint errors | X | 0 | ✅/❌ |
| Type errors | X | 0 | ✅/❌ |

---

### 🏁 Decision
**[ ] Approved** — Ready to merge  
**[ ] Approved with suggestions** — Merge after addressing non-blocking items  
**[ ] Changes requested** — Must-fix items above must be resolved first  
**[ ] Blocked** — Critical security or breaking change, needs architecture discussion
```

---

## Finding Classification Guide

### 🚫 Must Fix (blocking)
Anything that would:
- Cause a security vulnerability (injection, auth bypass, exposed secrets)
- Break existing functionality (API contract change, type mismatch, null dereference)
- Fail compliance requirements
- Introduce data loss risk
- Have incorrect business logic

### ⚠️ Should Fix (strongly recommended)
- Performance issue that will cause user-visible slowness at scale
- Missing error handling for a likely failure path
- Code duplication that will cause maintenance burden
- Missing test for a critical path
- Non-obvious code with no explanation

### 💡 Suggestions (non-blocking)
- Readability improvements
- Better naming
- Optional refactoring
- Nice-to-have test coverage
- Style preferences

---

## Writing Good Finding Descriptions

### Bad (vague, not actionable)
```
❌ "This could be more efficient"
❌ "Error handling needs improvement"  
❌ "Security issue found"
❌ "Consider refactoring"
```

### Good (specific, actionable)
```
✅ "N+1 query: getUserPosts() calls DB once per post in the loop at line 47. 
    Fix: replace with a single JOIN query or batch fetch."

✅ "SQL injection risk: raw user input concatenated into query at line 23. 
    Fix: use parameterized query: db.query('SELECT * FROM users WHERE id = ?', [userId])"

✅ "Missing null check: user.profile.name will throw if profile is null 
    (which happens for OAuth users). Fix: use user.profile?.name ?? 'Anonymous'"
```

---

## Category Labels

Use these consistent labels in findings:

| Label | Use for |
|-------|---------|
| `Security` | OWASP issues, secrets, auth/authz |
| `Performance` | N+1, missing index, memory leak |
| `Logic` | Incorrect business logic, wrong condition |
| `Types` | Type safety, any, casting |
| `Error Handling` | Missing catch, swallowed errors |
| `Testing` | Missing tests, weak assertions |
| `Naming` | Unclear identifiers |
| `DRY` | Duplication |
| `Complexity` | Deep nesting, long functions |
| `Breaking Change` | API/schema/interface changes |
| `Dead Code` | Unreachable or unused code |
| `Documentation` | Missing or outdated docs/comments |

---

## Self-Evaluation Before Submitting Review

Before sending the review output, answer:

```
1. Is every "Must Fix" item truly blocking? (Am I nitpicking at blocking level?)
2. For each finding: did I provide a concrete fix, not just identify the problem?
3. Did I acknowledge things done well? (Not just a list of problems)
4. Are my metrics numbers filled in, not left as "—"?
5. Is my decision consistent with the findings? (e.g., no "Approved" with open Must-Fix items)
6. Would a developer be able to act on this review without asking clarifying questions?
```
