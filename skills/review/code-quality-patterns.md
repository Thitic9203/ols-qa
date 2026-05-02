# Code Quality Patterns Reference

## The 5 Quality Dimensions

### 1. Readability
Code reads like well-written prose — a new engineer understands intent without asking questions.

**Good signals:**
- Function names describe what they do, not how
- Variables named after domain concepts, not implementation details
- Short functions (< 20 lines) with single responsibility
- Consistent abstraction levels within a function

**Bad signals:**
```typescript
// ❌ Cryptic naming
const d = new Date();
const u = arr.filter(x => x.s === 1).map(x => x.n);

// ✅ Clear naming
const today = new Date();
const activeUsernames = users.filter(u => u.status === 'active').map(u => u.name);
```

### 2. Maintainability (DRY)
Same logic in one place. If you change the rule, you change it once.

**Signs of violation:**
- Same validation logic in 3 different API handlers
- Same formatting function copy-pasted with minor variations
- Configuration values repeated as magic numbers

**When NOT to DRY:**
- Two pieces of code that look similar but represent different domain concepts (coincidental similarity)
- When the abstraction would be more complex than the duplication
- Rule of three: duplicate once, refactor on third occurrence

### 3. Error Handling
Every failure path is handled explicitly and fails loudly enough to diagnose.

**Checklist:**
```
[ ] Every async operation has error handling
[ ] Error messages include context (what failed, with what input)
[ ] External API failures handled (timeout, 4xx, 5xx)
[ ] Database errors caught and logged
[ ] No empty catch blocks: catch(e) {}
[ ] No catch-and-swallow: catch(e) { return null; } without logging
[ ] Errors propagate to the right level (not caught too deep)
```

**Pattern: structured error context**
```typescript
// ❌ No context
catch (e) {
  throw new Error('Failed');
}

// ✅ With context
catch (e) {
  throw new Error(`Failed to create user: email=${email}, reason=${e.message}`);
}
```

### 4. Complexity
Complexity is the enemy of correctness. Simpler is always better if it works.

**Cyclomatic complexity thresholds:**
- 1–5: Simple, easy to test ✅
- 6–10: Moderate, consider refactoring ⚠️
- 11+: High complexity, refactor required ❌

**Signs of unnecessary complexity:**
```typescript
// ❌ Deep nesting (arrow code)
if (user) {
  if (user.active) {
    if (user.role === 'admin') {
      if (permissions.includes('write')) {
        // finally do the thing
      }
    }
  }
}

// ✅ Early returns flatten the logic
if (!user || !user.active) return;
if (user.role !== 'admin') return;
if (!permissions.includes('write')) return;
// do the thing
```

### 5. Dead Code
Code that can never execute or is never referenced.

**Things to check:**
```bash
# Unused exports (TypeScript)
npx ts-prune

# Unused variables/imports
npx eslint --rule '{"no-unused-vars": "error"}'

# Commented-out code (indicates uncertainty — resolve it)
grep -rn "//.*TODO\|//.*FIXME\|//.*HACK\|//.*REMOVE" --include="*.ts"
```

---

## Code Smell Catalog

| Smell | What it looks like | Fix |
|-------|-------------------|-----|
| Long method | > 30 lines, multiple responsibilities | Extract sub-functions |
| Magic number | `if (status === 3)` | Named constant: `ACTIVE_STATUS = 3` |
| Feature envy | Method uses another class's data more than its own | Move method closer to data |
| Data clump | 3+ params always appear together | Introduce parameter object |
| Speculative generality | Abstract infrastructure for "future use" | YAGNI — delete it |
| Primitive obsession | Passing `string` for email everywhere | Value type: `EmailAddress` |
| God class | Class with 20+ methods across unrelated domains | Split into focused classes |
| Shotgun surgery | One change requires edits in 10 files | Consolidate |

---

## TypeScript / JavaScript Specific

### Type Safety
```typescript
// ❌ Type escape hatches that hide bugs
const data = response as any;
const value = (obj as any).prop;
// @ts-ignore

// ✅ Proper typing
interface ApiResponse { data: User[]; total: number; }
const response: ApiResponse = await fetch(...).then(r => r.json());
```

### Null Safety
```typescript
// ❌ Optional chaining without handling missing case
const name = user?.profile?.name;  // silently undefined

// ✅ Explicit handling
const name = user?.profile?.name ?? 'Anonymous';
// or
if (!user?.profile?.name) throw new Error('User has no name');
```

### Async/Await
```typescript
// ❌ Promise chain mixed with async/await
async function getData() {
  return fetch(url).then(r => r.json()).then(data => {
    return process(data);
  });
}

// ✅ Consistent async/await
async function getData() {
  const response = await fetch(url);
  const data = await response.json();
  return process(data);
}
```

---

## Python Specific

### Pythonic Patterns
```python
# ❌ Non-pythonic
result = []
for item in items:
  if item.active:
    result.append(item.name)

# ✅ List comprehension
result = [item.name for item in items if item.active]

# ❌ String building in loop
sql = "SELECT * FROM users WHERE id IN ("
for i, id in enumerate(ids):
  sql += str(id)
  if i < len(ids) - 1:
    sql += ","
sql += ")"

# ✅ Use join + parameterization
placeholders = ",".join("?" * len(ids))
sql = f"SELECT * FROM users WHERE id IN ({placeholders})"
```

---

## Review Priority Matrix

| Impact | Effort to fix | Priority |
|--------|--------------|----------|
| High (breaks logic/security) | Any | P0 — block merge |
| Medium (degrades quality) | Low | P1 — fix now |
| Medium | High | P2 — schedule |
| Low (style/readability) | Low | P3 — address in batch |
| Low | High | P4 — document decision |
