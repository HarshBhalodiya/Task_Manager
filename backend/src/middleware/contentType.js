/**
 * Content-Type enforcement middleware.
 *
 * POST and PUT requests MUST declare `Content-Type: application/json`,
 * otherwise they are rejected with a 400 BEFORE reaching any route handler.
 * All other methods (GET, DELETE, ...) pass through untouched.
 */
module.exports = function requireJsonContentType(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type') || '';

    // Compare case-insensitively ("Application/JSON" is valid per HTTP spec).
    if (!contentType.toLowerCase().includes('application/json')) {
      // End the response here — no need to call next().
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json for POST/PUT requests'
      });
    }
  }

  next();
};
