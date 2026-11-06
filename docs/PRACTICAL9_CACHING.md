# Practical 9 — In-Memory Caching and Query Optimization

Server-side response caching for the Task Management API using `node-cache`, with cache
invalidation on every write and an empirical before/after response-time comparison.

---

## 1. Objective

Reduce the cost of repeated reads on `GET /tasks` by serving a cached response for a short
TTL, while guaranteeing that `POST`, `PUT` and `DELETE` never leave stale data behind.

## 2. Request flow

```
GET /tasks
   |
   v
cache.read(tasks:<userId>)  ── HIT ──> return cached list (no MongoDB round trip)
   |
  MISS
   |
   v
Task.find({ userId }).sort({ createdAt: -1 })
   |
   v
cache.write(tasks:<userId>, tasks)  ──> return fresh list

POST / PUT / DELETE /tasks[/:id]
   |
   v
write to MongoDB
   |
   v
cache.invalidate(tasks:<userId>[, task:<userId>:<id>])
```

## 3. Implementation

| File | Role |
|------|------|
| `backend/src/cache/cache.js` | Shared `NodeCache` instance, TTL, per-user key helpers, hit/miss counters |
| `backend/src/controllers/taskController.js` | Cache read/write in the GET handlers, invalidation in the write handlers |
| `backend/src/app.js` | `GET /cache/stats` debug endpoint, exposes the `X-Cache` header through CORS |
| `backend/scripts/measure-response-time.js` | Reproducible 3-reading measurement script |

Details:

- **Library:** `node-cache@5.1.2` — a plain in-process key/value store with per-entry TTL.
- **TTL:** `CACHE_TTL_SECONDS=60` (override through `.env`). Entries also expire early when
  the key is invalidated by a write.
- **Keys are namespaced per user** (`tasks:<userId>`, `task:<userId>:<taskId>`), so one
  user's cached list can never be returned to another user.
- **Invalidation:** `create` drops `tasks:<userId>`; `update` and `remove` drop both the
  list key and the single-task key. Invalidation happens *after* MongoDB confirms the
  write, so a failed write does not evict a still-valid entry.
- **Observability:** every GET answers with `X-Cache: HIT | MISS | BYPASS`, and
  `GET /cache/stats` returns:

  ```json
  {
    "enabled": true,
    "ttlSeconds": 60,
    "keyCount": 1,
    "keys": ["tasks:6ae2df0558d3bca0531c4305"],
    "hits": 4,
    "misses": 5,
    "totalLookups": 9,
    "hitRate": 0.444
  }
  ```

- **Kill switch:** `CACHE_ENABLED=false` disables lookups and writes without touching the
  code, which is how the uncached half of the comparison below was recorded on the exact
  same build.

## 4. Measurement method

`scripts/measure-response-time.js` logs in, performs one warm-up request (excluded from the
results, it populates the cache), then performs **3 measured `GET /tasks` requests** and
prints status, `X-Cache` and wall-clock duration for each.

```bash
cd backend

# with cache
node scripts/measure-response-time.js

# without cache (same code, cache switched off)
CACHE_ENABLED=false node scripts/measure-response-time.js
```

Environment used: Node.js v24.21.0, local Express server on port 5000, MongoDB Atlas
(`taskmanager.d8boig9.mongodb.net`), 3 task documents for the demo user.

## 5. Results

### Without cache (`CACHE_ENABLED=false`)

```
#   status   X-Cache   time
1   200      BYPASS    94.46 ms
2   200      BYPASS    79.12 ms
3   200      BYPASS    76.12 ms

summary  min 76.12  median 79.12  avg 83.23  max 94.46 ms
```

### With cache (`CACHE_ENABLED=true`, TTL 60 s)

```
#   status   X-Cache   time
1   200      HIT       5.38 ms
2   200      HIT       3.59 ms
3   200      HIT       3.07 ms

summary  min 3.07  median 3.59  avg 4.01  max 5.38 ms
```

### Comparison

| Reading | Without cache | With cache |
|---------|---------------|------------|
| 1 | 94.46 ms | 5.38 ms |
| 2 | 79.12 ms | 3.59 ms |
| 3 | 76.12 ms | 3.07 ms |
| **Average** | **83.23 ms** | **4.01 ms** |
| Median | 79.12 ms | 3.59 ms |

- Average speed-up: **20.8×** (83.23 ms → 4.01 ms)
- Response time removed: **95.2 %**
- A cache **miss** still costs the full database round trip — the cold request that
  populated the cache measured **130.8 ms (MISS)**, in line with the uncached readings.
  The gain comes from the repeated reads, which is exactly the workload the task targets.

## 6. Correctness: stale-data check

A cache that is never invalidated would keep returning the old list for up to 60 s. The
following sequence was executed against the running server to prove that writes invalidate:

| Step | Request | Result |
|------|---------|--------|
| 1 | `GET /tasks` twice | second response `X-Cache: HIT`, 3 tasks |
| 2 | `POST /tasks` (new task) | `201`, id `6ae2e4bc5004c1ff95355656` |
| 3 | `GET /tasks` | `X-Cache: MISS`, **4 tasks**, new task present |
| 4 | `GET /tasks/:id` twice | second response `X-Cache: HIT` |
| 5 | `PUT /tasks/:id` (rename + complete) | `200` |
| 6 | `GET /tasks` | `X-Cache: MISS`, title shows the **updated** value |
| 7 | `DELETE /tasks/:id` | `200` |
| 8 | `GET /tasks` | `X-Cache: MISS`, **3 tasks**, deleted task gone |

`GET /cache/stats` after the sequence: `hits: 4, misses: 5, hitRate: 0.444` — every write is
followed by a miss, which is the invalidation working.

## 7. TTL and design trade-offs

- **Why invalidate on writes?** Without it a user could create, edit or delete a task and
  keep seeing the old list until the TTL expires — the write would appear to have been
  lost. Invalidation makes the cache correct by construction; the TTL is then only a
  safety net for data changed by something other than this API (e.g. a manual edit in
  Atlas).
- **Why 60 s?** It is long enough that a user clicking between screens hits the cache, and
  short enough that a stale entry cannot survive long even if an invalidation path is
  missed. Shorter TTLs trade hits for freshness; longer TTLs trade freshness for speed.
- **Why is node-cache not enough for multiple servers?** The cache lives in one process's
  heap. With two instances behind a load balancer, a `POST` handled by instance A only
  clears A's cache; instance B keeps serving the old list. The fix is a shared store
  (Redis/Memcached) that all instances read and invalidate.

## 8. Known limitations

- The cache is process-local, so a server restart starts cold — the first request after a
  restart is always a `MISS`. This is expected for in-memory caching.
- The cached documents are the same objects Mongoose returned; they are stored and returned
  as-is (read-only), which is safe here because no handler mutates task documents in place.
- Cache statistics are reset on restart and are not persisted.

## 9. Reproduction

```bash
cd backend
npm install                # node-cache is already in package.json
npm start                  # CACHE_ENABLED=true, TTL 60 s (from .env)

node scripts/measure-response-time.js
curl -H "Authorization: Bearer <token>" http://localhost:5000/cache/stats
```

To reproduce the uncached column, start the server with `CACHE_ENABLED=false` and run the
same script.
