/**
 * ID format validation middleware.
 *
 * Runs before the PUT/DELETE route handlers and guarantees that
 * `req.params.id` is a positive integer. Invalid ids are rejected with a 400;
 * valid ids are converted to a Number so controllers can compare them safely.
 */
module.exports = function validateId(req, res, next) {
  const { id } = req.params;

  // Must be present and contain only digits (e.g. "1", "42" — not "abc", "-1", "1.5").
  if (id === undefined || !/^\d+$/.test(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid task id "${id}": must be a positive integer`
    });
  }

  req.params.id = Number(id);
  next();
};
