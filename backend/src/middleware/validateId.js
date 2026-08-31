/**
 * ID format validation middleware.
 *
 * Runs before the :id route handlers and guarantees that `req.params.id`
 * is a valid MongoDB ObjectId (a 24-character hex string). Invalid ids are
 * rejected with a 400 so a malformed id never reaches Mongoose (which would
 * otherwise raise a CastError).
 */

// MongoDB ObjectIds are 24-character hex strings (e.g. "507f1f77bcf86cd799439011").
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

module.exports = function validateId(req, res, next) {
  const { id } = req.params;

  if (id === undefined || !objectIdPattern.test(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid task id "${id}": must be a valid ObjectId`
    });
  }

  next();
};
