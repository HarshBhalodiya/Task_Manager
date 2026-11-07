/**
 * Automated API tests (Practical 12 — CI/CD).
 *
 * These tests run inside the GitHub Actions pipeline WITHOUT a live MongoDB and
 * WITHOUT real credentials, so they are fully deterministic and safe to run on
 * every push. We mock the Mongoose `Task` model and the JWT `auth` middleware
 * so the route handlers are exercised against an in-memory stand-in.
 *
 * Run locally with:  npm test  (from Task_Manager/backend)
 */
const request = require('supertest');
const app = require('../src/app');

// ---- Fakes ----------------------------------------------------------------

// Replace the Mongoose model with a stub so no database connection is needed.
jest.mock('../models/Task', () => ({
  find: jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) })),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ _id: 't1', title: 'Demo' }),
  findOneAndUpdate: jest.fn().mockResolvedValue(null),
  findOneAndDelete: jest.fn().mockResolvedValue(null)
}));

// Replace the JWT middleware so routes can be hit without signing a token.
jest.mock('../src/middleware/auth', () => (req, _res, next) => {
  req.user = { userId: 'user123', email: 'ci@example.com' };
  next();
});

// ---- Tests ----------------------------------------------------------------

describe('GET /tasks', () => {
  it('returns 200 for an authenticated request', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns the X-Cache header on a miss', async () => {
    const res = await request(app).get('/tasks');
    expect(res.headers['x-cache']).toBeDefined();
  });
});

describe('GET /cache/stats (different endpoint)', () => {
  it('returns 200 with cache counters', async () => {
    const res = await request(app).get('/cache/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.hits).toBe('number');
    expect(typeof res.body.data.misses).toBe('number');
  });
});

describe('GET /unknown-route', () => {
  it('returns 404 for an undefined route', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
