/**
 * Practical 9 — cache invalidation check.
 *
 * Proves that the cache never serves stale data after a write:
 *   1. prime the list cache and confirm the second read is a HIT
 *   2. POST a task   → next GET must be a MISS and must include the new task
 *   3. prime the single-task cache
 *   4. PUT the task  → next GET must be a MISS and must show the new title
 *   5. DELETE it     → next GET must be a MISS and must not contain the task
 *
 * Every step prints PASS/FAIL; the script exits non-zero if any check fails.
 *
 *   node scripts/check-cache-invalidation.js
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const EMAIL = process.env.EMAIL || 'demo.p8@example.com';
const PASSWORD = process.env.PASSWORD || 'Demo@1234';
const TITLE = 'Cache invalidation check (temporary)';

let token = '';
let failures = 0;

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  const body = await res.json().catch(() => ({}));
  return { status: res.status, cache: res.headers.get('x-cache') || '-', body };
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!res.ok) throw new Error(`Login failed with status ${res.status}`);
  const body = await res.json();
  token = body.data.token;
}

async function main() {
  await login();
  console.log('');
  console.log('Practical 9 — cache invalidation check');
  console.log(`Endpoint: ${BASE_URL}`);
  console.log('');

  // 1) Prime list cache.
  await api('/tasks');
  const warm = await api('/tasks');
  check('second GET /tasks served from cache', warm.cache === 'HIT', `X-Cache: ${warm.cache}`);

  // 2) POST → list cache must be dropped.
  const created = await api('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: TITLE, description: 'Created by the invalidation check' })
  });
  const taskId = created.body.data && created.body.data._id;
  check('POST /tasks created a task', created.status === 201, `status ${created.status}, id ${taskId}`);

  const afterCreate = await api('/tasks');
  const presentAfterCreate = (afterCreate.body.data || []).some((t) => t.title === TITLE);
  check('GET after POST is a cache miss', afterCreate.cache === 'MISS', `X-Cache: ${afterCreate.cache}`);
  check('new task visible immediately', presentAfterCreate, `${afterCreate.body.data.length} tasks returned`);

  // 3) Prime the single-task cache.
  await api(`/tasks/${taskId}`);
  const warmOne = await api(`/tasks/${taskId}`);
  check('second GET /tasks/:id served from cache', warmOne.cache === 'HIT', `X-Cache: ${warmOne.cache}`);

  // 4) PUT → list + single-task cache must be dropped.
  const updatedTitle = `${TITLE} — updated`;
  const updated = await api(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ title: updatedTitle, completed: true })
  });
  check('PUT /tasks/:id accepted', updated.status === 200, `status ${updated.status}`);

  const afterUpdate = await api('/tasks');
  const currentTitle = (afterUpdate.body.data || []).find((t) => t._id === taskId)?.title;
  check('GET after PUT is a cache miss', afterUpdate.cache === 'MISS', `X-Cache: ${afterUpdate.cache}`);
  check('updated title served, not the stale one', currentTitle === updatedTitle, `title: ${currentTitle}`);

  const afterUpdateOne = await api(`/tasks/${taskId}`);
  check('single-task cache was dropped too', afterUpdateOne.cache === 'MISS', `X-Cache: ${afterUpdateOne.cache}`);

  // 5) DELETE → task must disappear from the list.
  const removed = await api(`/tasks/${taskId}`, { method: 'DELETE' });
  check('DELETE /tasks/:id accepted', removed.status === 200, `status ${removed.status}`);

  const afterDelete = await api('/tasks');
  const stillThere = (afterDelete.body.data || []).some((t) => t._id === taskId);
  check('GET after DELETE is a cache miss', afterDelete.cache === 'MISS', `X-Cache: ${afterDelete.cache}`);
  check('deleted task no longer returned', !stillThere, `${afterDelete.body.data.length} tasks returned`);

  const stats = await api('/cache/stats');
  console.log('');
  console.log('cache stats:', JSON.stringify(stats.body.data));
  console.log('');
  console.log(failures === 0 ? 'RESULT: all checks passed' : `RESULT: ${failures} check(s) failed`);
  console.log('');

  if (failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Check failed:', err.message);
  process.exit(1);
});
