/**
 * AI route tests (Practical 13).
 *
 * The real upstream OpenAI call is replaced by mocking aiService so tests run
 * offline and never touch a real API or key. We verify the two behaviors the
 * practical cares about:
 *   1. Graceful degradation — when the AI call fails, the API still answers
 *      200 with fallback:true (no crash, app keeps working).
 *   2. Rate limiting — the second request for the same task within a minute
 *      is answered 429 without hitting the AI service again.
 */
const request = require('supertest');
const app = require('../src/app');
const { generateDescription } = require('../src/services/aiService');

jest.mock('../src/services/aiService', () => ({
  generateDescription: jest.fn()
}));

// Mock the JWT middleware exactly like the task tests do, so the AI routes can
// be exercised without signing a real token or setting JWT_SECRET.
jest.mock('../src/middleware/auth', () => (req, _res, next) => {
  req.user = { userId: 'u1', email: 'a@b.com' };
  next();
});

const makeAuth = () => `Bearer fake-token`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/ai/generate-description', () => {
  test('returns a description when the AI service succeeds', async () => {
    generateDescription.mockResolvedValue('Write a short description for the demo.');
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', makeAuth())
      .send({ title: 'Demo task one' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fallback).toBe(false);
    expect(res.body.data.description).toContain('description');
  });

  test('gracefully degrades (200 + fallback) when the AI call fails', async () => {
    generateDescription.mockResolvedValue(null); // e.g. bad key / timeout
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', makeAuth())
      .send({ title: 'Demo task two' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fallback).toBe(true);
    expect(res.body.data.description).toBe('');
  });

  test('rate-limits a second request for the same task within a minute', async () => {
    generateDescription.mockResolvedValue('ignored');
    const auth = makeAuth();
    const title = 'Repeated task';

    await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', auth)
      .send({ title });

    const second = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', auth)
      .send({ title });

    expect(second.statusCode).toBe(429);
    expect(second.body.rateLimited).toBe(true);
    // The AI service should only have been called once.
    expect(generateDescription).toHaveBeenCalledTimes(1);
  });

  test('rejects a request with no title', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', makeAuth())
      .send({ title: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Note: the 401 path is not tested here because the 'auth' middleware is
  // mocked app-wide (same approach as tasks.test.js), so every request
  // appears authenticated.
});
