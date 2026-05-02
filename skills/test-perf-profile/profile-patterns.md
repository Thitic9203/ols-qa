# CPU & Memory Profiling Patterns

## Flamegraph Reading Guide

```
Wide bar at top  = lots of CPU time in that function
Narrow bar       = fast function — usually OK
Flat top (plateau) = CPU bottleneck — optimize this function
Tall stack       = deep call chain (not necessarily a problem)
```

**Reading order:** Start at the widest bars in the upper half.
Those are your optimization targets — not the bottom of the stack (those are usually framework/runtime).

## Node.js: clinic.js Quick Reference

```bash
# Install once
npm i -g clinic

# Doctor: comprehensive — run this first
clinic doctor -- node server.js
# Look for: "I/O bottleneck", "Event Loop blocked", "GC pressure"

# Flame: CPU flamegraph
clinic flame -- node server.js
# Run load test while this runs, then Ctrl+C

# Bubbleprof: async waterfall (find await bottlenecks)
clinic bubbleprof -- node server.js
```

## Node.js Common Bottleneck Patterns

| Flamegraph pattern | Cause | Fix |
|-------------------|-------|-----|
| `JSON.parse` wide | Large payload parsing | Stream parsing, smaller payloads |
| `JSON.stringify` wide | Large response serialization | Partial serialization, pagination |
| `crypto` functions wide | bcrypt/argon2 in hot path | Move to worker thread |
| `Buffer.from` wide | Frequent buffer allocation | Reuse buffers, use streams |
| DB driver callbacks wide | Slow query / missing index | See `test-perf-db` |
| GC pause markers | Memory pressure | Check for leaks via soak test |
| `require` / `import` | Cold start issue | Lazy load, bundle optimization |

## V8 CPU Profile Interpretation

```bash
node --prof app.js
# (run load test)
node --prof-process isolate-*.log > profile.txt
```

Key sections in profile.txt:
```
[Bottom up (heavy) profile]:
  ticks  total  nonlib   name
  1200   45.2%   48.1%  Function: processItem  ← OPTIMIZE THIS
   800   30.1%   32.0%  LazyCompile: serialize
```

High `total%` in non-system functions = your bottleneck.

## Python: py-spy Patterns

```bash
# Attach to running process (no code changes needed)
py-spy record -o profile.svg --pid $(pgrep -f "python app.py")

# Subcommand: top (live view)
py-spy top --pid $(pgrep -f "python app.py")

# For async Python (asyncio)
py-spy record -o profile.svg --native --pid <pid>
```

**memray for memory:**
```bash
memray run -o output.bin python app.py
memray flamegraph output.bin   # opens HTML report
memray stats output.bin        # text summary
```

## Heap Snapshot Comparison Workflow

1. Start app → take Snapshot 1
2. Run load for 10 min
3. Force GC: `global.gc()` (requires `--expose-gc` flag)
4. Take Snapshot 2
5. In DevTools: Snapshot 2 → "Comparison" view → sorted by "# New"

**What to look for:**
```
Detached DOM trees    = UI components not cleaned up
(closure)             = closures holding old data
Array, Object (many)  = caches or event queues growing
```

## Go pprof Common Patterns

```bash
# CPU 30s profile
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30

# Allocation profile (what's being allocated, not necessarily leaked)
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/allocs

# Heap (live objects)
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/heap

# Goroutine leaks (count should be stable)
curl http://localhost:6060/debug/pprof/goroutine?debug=1 | head -20
```

## Quick Win: Event Loop Lag (Node.js)

```js
// Measure event loop lag — add to app for live monitoring
let lastTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag = now - lastTime - 100;  // expected 100ms
  if (lag > 50) console.warn(`Event loop lag: ${lag}ms`);
  lastTime = now;
}, 100);
```

Lag > 50ms consistently = CPU-bound work blocking the loop → offload to worker thread or cluster.
