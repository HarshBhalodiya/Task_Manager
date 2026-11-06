/**
 * Shared in-memory cache (node-cache) for the Task Management API.
 *
 * The cache lives in this process's heap, so it disappears on restart and is
 * not shared between server instances. That is acceptable for this lab (one
 * server process serves every request) but it is the main reason node-cache
 * does not scale to a multi-instance deployment: each instance would keep its
 * own copy and could serve stale data after a write that landed on another
 * instance.
 *
 * Keys are namespaced per user, so one user's cached list can never leak into
 * another user's response:
 *   tasks:<userId>          → result of GET /tasks
 *   task:<userId>:<taskId>  → result of GET /tasks/:id
 *
 * CACHE_ENABLED=false turns lookups/writes off without touching the code, which
 * is how the "before" (uncached) half of the response-time comparison is taken.
 */
const NodeCache = require('node-cache');

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 60;

const cache = new NodeCache({
  stdTTL: DEFAULT_TTL_SECONDS,
  checkperiod: Math.max(10, Math.floor(DEFAULT_TTL_SECONDS / 2))
});

// Cache-hit / cache-miss counters, exposed through GET /cache/stats.
const counters = { hits: 0, misses: 0 };

/** Caching can be disabled at runtime with CACHE_ENABLED=false. */
function isEnabled() {
  return String(process.env.CACHE_ENABLED ?? 'true').toLowerCase() !== 'false';
}

const tasksKey = (userId) => `tasks:${userId}`;
const taskKey = (userId, taskId) => `task:${userId}:${taskId}`;

/**
 * Look a key up and keep the hit/miss counters in sync.
 * Returns `undefined` on a miss so callers can fall through to MongoDB.
 */
function read(key) {
  if (!isEnabled()) return undefined;

  const value = cache.get(key);

  if (value === undefined) {
    counters.misses += 1;
    return undefined;
  }

  counters.hits += 1;
  return value;
}

/** Store a value under a key (no-op while caching is disabled). */
function write(key, value) {
  if (isEnabled()) {
    cache.set(key, value);
  }
}

/**
 * Drop one or more keys. Every write handler calls this after MongoDB confirms
 * the write, so a stale list can never be served inside the TTL window.
 */
function invalidate(keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const removed = cache.del(list);
  return { removed, keys: list };
}

/** Snapshot for GET /cache/stats. */
function stats() {
  const keys = cache.keys();
  const total = counters.hits + counters.misses;

  return {
    enabled: isEnabled(),
    ttlSeconds: DEFAULT_TTL_SECONDS,
    keyCount: keys.length,
    keys,
    hits: counters.hits,
    misses: counters.misses,
    totalLookups: total,
    hitRate: total === 0 ? 0 : Number((counters.hits / total).toFixed(3))
  };
}

/** Clear all entries and counters — used between measurement runs. */
function flush() {
  cache.flushAll();
  counters.hits = 0;
  counters.misses = 0;
}

module.exports = {
  cache,
  read,
  write,
  invalidate,
  stats,
  flush,
  tasksKey,
  taskKey,
  isEnabled
};
