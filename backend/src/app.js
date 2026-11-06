/**
 * Express application assembly.
 *
 * Middleware order matters and follows the spec:
 *   1. Global logging
 *   2. Content-Type enforcement
 *   3. JSON body parsing (setup requirement)
 *   4. Routes
 *   5. 404 handler (catches undefined routes)
 *   6. Global error handler (MUST be registered last)
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');
const requireJsonContentType = require('./middleware/contentType');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const cache = require('./cache/cache');

const app = express();

// 1) Log every request (method, URL, timestamp).
app.use(logger);

// 2) Reject POST/PUT requests that do not declare Content-Type: application/json.
app.use(requireJsonContentType);

// 3) Parse incoming JSON request bodies into req.body.
app.use(cors({ exposedHeaders: ['X-Cache'] }));
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend')));

// 4) Route definitions.
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// Debug endpoint: cache configuration plus the running hit/miss counters.
// Counts only — never cached task data — so it is safe to expose.
app.get('/cache/stats', (req, res) => {
  res.status(200).json({ success: true, data: cache.stats() });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// 5) 404 handler — any request that matched no route above lands here.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// 6) Global error handler — last piece of middleware (4 args => error handler).
//    Logs the real error internally but only sends a generic message to the
//    client, so internal details and stack traces are never leaked.
app.use((err, req, res, _next) => {
  // Mongoose validation failures (e.g. missing title) become a clean 400 with
  // per-field messages instead of leaking the raw ValidationError object.
  if (err.name === 'ValidationError') {
    const details = {};
    for (const field in err.errors) {
      details[field] = err.errors[field].message;
    }
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details
    });
  }

  // Mongoose cast failures (e.g. a field with the wrong type) are client errors too.
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid value for field "${err.path}"`
    });
  }

  // Safely log non-Error throws too (e.g. a handler throwing a string).
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[${new Date().toISOString()}] Unhandled error: ${detail}`);

  // Client errors (e.g. malformed JSON from express.json()) carry a 4xx status.
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 ? 'Internal server error' : 'Invalid request';

  res.status(status).json({ success: false, error: message });
});

module.exports = app;
