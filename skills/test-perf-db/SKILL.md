---
name: test-perf-db
description: "[Tier 3 — Non-Functional: Performance Efficiency · ISO 25010] Database performance test workflow — slow queries, missing indexes, and N+1 patterns via EXPLAIN ANALYZE. Use when API latency is high and the database is suspected. Requires a running environment."
---

# Helix — Database Performance Test

> 📚 **Knowledge References** (loaded automatically):  
> `db-perf-patterns.md` — EXPLAIN ANALYZE patterns, index strategies, N+1 detection, connection pool tuning

วิเคราะห์ slow queries, missing indexes, N+1 patterns — 80% ของ perf issues จริงมาจากที่นี่

## Step 1: Identify DB Type & Access

```bash
# ตรวจ DB ที่ใช้
cat package.json | grep -E "pg|mysql|mongoose|prisma|typeorm|sequelize|drizzle"
cat .env* 2>/dev/null | grep -E "DATABASE|DB_|POSTGRES|MYSQL|MONGO" | grep -v PASSWORD
```

**รองรับ:** PostgreSQL, MySQL/MariaDB, SQLite, MongoDB

## Step 2: Enable Slow Query Logging

**PostgreSQL:**
```sql
-- ดู slow queries (ค่า default log_min_duration_statement)
SHOW log_min_duration_statement;

-- เปิด slow log ชั่วคราว (>100ms)
SET log_min_duration_statement = 100;

-- ดู top slow queries จาก pg_stat_statements
SELECT query,
       calls,
       mean_exec_time::int AS avg_ms,
       total_exec_time::int AS total_ms,
       rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**MySQL:**
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.1;  -- 100ms

-- ดู top slow queries
SELECT * FROM performance_schema.events_statements_summary_by_digest
ORDER BY avg_timer_wait DESC LIMIT 20;
```

## Step 3: EXPLAIN ANALYZE ทุก Slow Query

```sql
-- PostgreSQL: format verbose เพื่อ detail สูงสุด
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.*, p.* FROM users u
JOIN posts p ON p.user_id = u.id
WHERE u.status = 'active'
ORDER BY p.created_at DESC
LIMIT 100;
```

**สัญญาณที่ต้องดู:**
```
Seq Scan        → ขาด index (ถ้า rows มาก)
Hash Join       → อาจ OK แต่ดู cost
Nested Loop     → อาจเป็น N+1 ถ้า loop ซ้ำมาก
Sort            → ขาด index บน ORDER BY column
cost=0..99999   → cost สูง = ปัญหา
actual rows >> estimated rows → statistics เก่า
```

## Step 4: Detect N+1 Queries

**ตรวจใน ORM logs:**
```bash
# Prisma
DATABASE_URL=... DEBUG="prisma:query" node app.js 2>&1 | grep -c "SELECT"

# TypeORM
# เปิด logging: true ใน DataSource config
```

**สัญญาณ N+1:**
```
Query: SELECT * FROM users LIMIT 10           → 1 query
Query: SELECT * FROM posts WHERE user_id = 1  → )
Query: SELECT * FROM posts WHERE user_id = 2  →  10 เพิ่มเติม = N+1!
Query: SELECT * FROM posts WHERE user_id = 3  → )
```

**วิธีแก้:**
```typescript
// ❌ N+1
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// ✅ Eager loading
const users = await User.findAll({ include: Post });
```

## Step 5: Index Analysis

**PostgreSQL — ตรวจ missing + unused indexes:**
```sql
-- Missing indexes (sequential scan ที่ cost สูง)
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Unused indexes (สิ้นเปลือง write performance)
SELECT indexrelid::regclass AS index_name,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index usage
SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**เพิ่ม index:**
```sql
-- ทำบน staging ก่อน ตรวจ lock behavior
-- PostgreSQL: CONCURRENTLY ไม่ block writes
CREATE INDEX CONCURRENTLY idx_users_status
ON users(status)
WHERE status = 'active';  -- partial index ถ้าเหมาะสม
```

## Step 6: Connection Pool Analysis

```sql
-- PostgreSQL: ดู connections ปัจจุบัน
SELECT state, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Max connections setting
SHOW max_connections;
```

**Target:**
- Pool size ≈ (CPU cores × 2) + effective_io_concurrency
- Active connections ไม่ควรเกิน 80% ของ max_connections

## Step 7: Report

```
🗄️ DB Performance Report — [timestamp]

Slow Queries Found: X
| Query (truncated)           | Avg ms | Calls | Issue          |
|-----------------------------|--------|-------|----------------|
| SELECT * FROM orders WHERE… | 890ms  | 1200  | Missing index  |
| SELECT u.*, p.* FROM…       | 340ms  | 800   | N+1 detected   |

Indexes Added: Y
| Table    | Column(s)     | Type    | Expected gain |
|----------|---------------|---------|---------------|
| orders   | status, date  | BTREE   | 890ms → ~20ms |

N+1 Issues Fixed: Z
Connection Pool: 45/100 (45%) ✅
```

## Done

สรุป improvements แล้วแนะนำ:
- แก้ query แล้ว → re-run `test-perf-load` เพื่อ verify ผล
- ยังมี perf ปัญหา → `test-perf-profile` เพื่อ CPU/heap analysis

## HTML Report

```bash
# AI collect slow query results → normalized format
# suite = ชื่อ table, test = แต่ละ query (status: passed/failed ตาม threshold)
node scripts/helix-report.mjs --input=test-results/results.json --title="DB Performance"
open playwright-report/index.html
```

---

## Self-Evaluation Loop

ก่อนส่ง output ให้ user ทำ self-check ทุกครั้ง:

```
1. Output ครบถ้วนตาม scope ที่รับมาไหม?
2. มีจุดไหนที่ยังไม่แน่ใจ ควรถามก่อนไหม?
3. Format ถูกต้องตามที่กำหนดในสกิลไหม?
4. มีอะไรที่อาจทำให้งานพัง / เกิด side effect ที่ไม่ตั้งใจไหม?
```

ตอบ "ไม่ใช่" ข้อไหน → **แก้ก่อนส่ง** เสมอ
