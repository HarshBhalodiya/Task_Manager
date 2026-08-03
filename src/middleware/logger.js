/**
 * Global logging middleware.
 *
 * Logs the HTTP method, URL and timestamp for every incoming request.
 * Always calls next() so the request continues down the middleware stack.
 */
module.exports = function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};
