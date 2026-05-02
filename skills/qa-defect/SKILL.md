---
name: qa-defect
description: "[QA Process · Defect Management] Defect report creation — severity/priority classification, root cause analysis, reproduction steps, and impact assessment. Use when a test fails or a bug is found."
---

# Helix — Defect Report

> 📚 **Knowledge References** (loaded automatically):
> `qa-defect-patterns.md` — severity/priority matrices, root cause analysis (5-Whys, fishbone), defect lifecycle, reproduction step templates

A defect report is the primary communication artifact between QA and development. A well-written defect gets fixed faster and prevents recurrence.

## Step 1: Classify Defect

### Severity (How bad is the impact?)
| Severity | Definition | Example |
|----------|-----------|---------|
| **P0 — Critical** | System unusable / data loss / security breach | Payment fails, login broken |
| **P1 — High** | Core feature broken, no workaround | Search returns no results |
| **P2 — Medium** | Feature works but degraded, workaround exists | Export slow, pagination skips |
| **P3 — Low** | Cosmetic / minor / edge case | Button misaligned, typo |

### Priority (How urgent to fix?)
| Priority | Definition |
|----------|-----------|
| **Immediate** | Fix before current release (P0/P1) |
| **This sprint** | Fix in current sprint (P2) |
| **Backlog** | Schedule in future sprint (P3) |

## Step 2: Root Cause Analysis

Use **5-Whys** for systematic root cause:
```
Problem: [defect description]
Why 1: Why did this happen?
Why 2: Why did that happen?
Why 3: Why did that happen?
Why 4: Why did that happen?
Why 5: Root cause identified
```

## Step 3: Defect Report Template

```markdown
## Defect — [DEF-001] [Title]

**Severity:** P0/P1/P2/P3
**Priority:** Immediate / This sprint / Backlog
**Status:** Open / In Progress / Fixed / Verified / Deferred
**Found in:** [version/commit]
**Found by:** [tester / automated test / exploratory session]

### Summary
One-line description of what's wrong.

### Steps to Reproduce
1. Go to [URL/page]
2. Click [element]
3. Enter [value]
4. Observe: [what happens]
5. Expected: [what should happen]

### Environment
- OS: [e.g. macOS 14, Ubuntu 22.04]
- Browser: [e.g. Chrome 124]
- Device: [e.g. Desktop / iPhone 15]
- Test environment: [staging / local]

### Evidence
- Screenshot: [link]
- Video: [link]
- Console errors: [paste or link]
- Test case: [test name / file]

### Root Cause
[5-Whys analysis or hypothesis]

### Impact
[Who is affected, how many users, business impact]
```

## Step 4: Output

Save individual defects to `docs/qa/defects/DEF-YYYYMMDD-001.md`
Update defect log in `docs/qa/defect-log.md`
Commit to repo.

## Done

Present defect summary: severity, priority, root cause, recommended fix approach.

## Self-Evaluation Loop

```
1. Reproduction steps ชัดพอให้ dev ทำซ้ำได้ไหม?
2. Severity/priority ถูกต้องตาม matrix ไหม?
3. Root cause วิเคราะห์ถึงต้นเหตุจริงไหม?
4. Evidence ครบ (screenshot/log) ไหม?
```
