/**
 * Practical 9 — response time measurement.
 *
 * Logs in, then calls GET /tasks a number of times and prints the status code,
 * the X-Cache header and the wall-clock duration of every request. The first
 * call is a warm-up (it populates the cache), so the reported readings are all
 * cache hits.
 *
 * Run it once with the cache enabled and once with it disabled, then compare:
 *
 *   node scripts/measure-response-time.js
 *   CACHE_ENABLED=false node scripts/measure-response-time.js
 *
 * Environment:
 *   BASE_URL   default http://localhost:5000
 *   EMAIL      default demo.p8@example.com
 *   PASSWORD   default Demo@1234
 *   RUNS       number of measured readings (default 3)
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const EMAIL = process.env.EMAIL || 'demo.p8@example.com';
const PASSWORD = process.env.PASSWORD || 'Demo@1234';
const RUNS = Number(process.env.RUNS) || 3;

const pad = (value, width) => String(value).padEnd(width);

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });

  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }

  const body = await res.json();
  return body.data.token;
}

async function timedGet(path, token) {
  const started = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const duration = performance.now() - started;

  // Drain the body so the measurement includes the full response.
  await res.json();

  return {
    status: res.status,
    cache: res.headers.get('x-cache') || '-',
    ms: duration
  };
}

async function main() {
  const token = await login();

  // Warm-up call: populates the cache (or, with the cache disabled, simply
  // pays the first-request cost) and is excluded from the readings.
  await timedGet('/tasks', token);

  const readings = [];
  for (let i = 0; i < RUNS; i += 1) {
    readings.push(await timedGet('/tasks', token));
  }

  const sorted = [...readings].sort((a, b) => a.ms - b.ms);
  const avg = readings.reduce((sum, r) => sum + r.ms, 0) / readings.length;
  const median = sorted[Math.floor(sorted.length / 2)].ms;

  console.log('');
  console.log('Practical 9 — GET /tasks response time');
  console.log(`Endpoint : ${BASE_URL}/tasks`);
  console.log(`Readings : ${RUNS} (after 1 warm-up call, excluded)`);
  console.log('');
  console.log(`${pad('#', 4)}${pad('status', 9)}${pad('X-Cache', 10)}time`);
  readings.forEach((r, index) => {
    console.log(
      `${pad(index + 1, 4)}${pad(r.status, 9)}${pad(r.cache, 10)}${r.ms.toFixed(2)} ms`
    );
  });
  console.log('');
  console.log(
    `summary  min ${sorted[0].ms.toFixed(2)}  median ${median.toFixed(2)}  ` +
      `avg ${avg.toFixed(2)}  max ${sorted[sorted.length - 1].ms.toFixed(2)} ms`
  );
  console.log('');
}

main().catch((err) => {
  console.error('Measurement failed:', err.message);
  process.exit(1);
});
