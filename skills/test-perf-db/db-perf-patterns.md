# Database Performance Patterns

## EXPLAIN ANALYZE Reading Guide

```
Seq Scan on users  (cost=0.00..99.00 rows=5000 width=80)
                    (actual time=0.03..45.2 rows=5000 loops=1)
  Filter: (status = 'active')
  Rows Removed by Filter: 3000
```

| Term | Meaning |
|------|---------|
| `cost=X..Y` | X = startup cost, Y = total cost (arbitrary units) |
| `actual time=X..Y` | X = first row ms, Y = last row ms |
| `rows=N` | estimated rows (compare to actual — large gap = stale stats) |
| `loops=N` | N > 1 with Nested Loop = possible N+1 |
| `Seq Scan` | full table scan — may need index |
| `Index Scan` | good: using index |
| `Index Only Scan` | best: all data from index |
| `Hash Join` | good for large joins |
| `Nested Loop` | good for small outer set; bad if outer set is large |

## Index Decision Matrix

| Query pattern | Index type |
|--------------|-----------|
| `WHERE col = ?` | B-tree on col |
| `WHERE col > ? AND col < ?` | B-tree on col |
| `ORDER BY col` | B-tree on col |
| `WHERE a = ? AND b = ?` | Composite B-tree (a, b) |
| `WHERE col LIKE 'prefix%'` | B-tree on col |
| `WHERE col LIKE '%suffix'` | GIN + pg_trgm extension |
| Full-text search | GIN + tsvector |
| Partial filter `WHERE active = true` | Partial index `WHERE active = true` |
| JSON path queries | GIN on jsonb column |

## N+1 Detection

### Signs in query logs
```
# N+1 pattern: 1 query + N repeated queries
SELECT * FROM orders LIMIT 10;
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE id = 2;
... (repeated 10 times)
```

### ORM fixes

**Prisma:**
```typescript
// ❌ N+1
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.user = await prisma.user.findUnique({ where: { id: order.userId } });
}

// ✅ Include
const orders = await prisma.order.findMany({
  include: { user: true },
});
```

**TypeORM:**
```typescript
// ✅ Eager relations in query
const orders = await orderRepo.find({
  relations: ['user'],
});
```

**Sequelize:**
```js
// ✅ Eager loading
const orders = await Order.findAll({ include: User });
```

## Connection Pool Settings

| DB | Pool setting | Default | Recommended |
|----|-------------|---------|-------------|
| PostgreSQL (pg) | `max` | 10 | cores × 2 (+ 2 buffer) |
| MySQL (mysql2) | `connectionLimit` | 10 | cores × 2 |
| Prisma | `connection_limit` | 5 | cores × 2 |
| Redis | `maxRetriesPerRequest` | 20 | 3–5 |

## Statistics Maintenance (PostgreSQL)

Stale statistics = bad query plans:
```sql
-- Check table stats freshness
SELECT relname, last_analyze, last_autoanalyze, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Manual ANALYZE when needed
ANALYZE VERBOSE users;

-- Check bloat (dead tuples > 20% = VACUUM candidate)
SELECT relname,
       n_dead_tup::float / NULLIF(n_live_tup, 0) AS dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_ratio DESC;
```

## Index Creation Safety

```sql
-- ✅ PostgreSQL: non-blocking index creation
CREATE INDEX CONCURRENTLY idx_orders_status_created
ON orders(status, created_at DESC)
WHERE status IN ('pending', 'processing');  -- partial for hot rows only

-- ⚠️ Without CONCURRENTLY: blocks writes (use only on new/empty tables)
CREATE INDEX idx_name ON table(col);
```
