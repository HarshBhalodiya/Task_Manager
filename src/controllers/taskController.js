/**
 * Task controllers — the only layer that talks to the task store.
 *
 * Every response uses the same JSON envelope:
 *   success: { success: true,  data: <payload> }
 *   failure: { success: false, error: <message> }
 */
const store = require('../data/tasks');

/** GET /tasks → 200 with the full task list. */
function getAll(req, res) {
  res.status(200).json({ success: true, data: store.getAll() });
}

/** POST /tasks → 201 with the created task. Validates the request body first. */
function create(req, res) {
  const { title, done } = req.body || {};

  // Title is required and must be a non-empty string.
  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Task title is required and must be a non-empty string'
    });
  }

  // "done" is optional; when provided it must be a boolean.
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: '"done" must be a boolean when provided'
    });
  }

  const task = store.create(title.trim(), done === true);
  res.status(201).json({ success: true, data: task });
}

/** PUT /tasks/:id → 200 with the updated task, or 404 when the task does not exist. */
function update(req, res) {
  const { id } = req.params;
  const { title, done } = req.body || {};

  // Same field-level validation as POST (fields are optional on update).
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      success: false,
      error: 'Task title must be a non-empty string'
    });
  }
  if (done !== undefined && typeof done !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: '"done" must be a boolean when provided'
    });
  }

  // Build the fields object with only what the client actually sent.
  const fields = {};
  if (title !== undefined) fields.title = title.trim();
  if (done !== undefined) fields.done = done;

  const task = store.update(id, fields);
  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task with id ${id} not found`
    });
  }

  res.status(200).json({ success: true, data: task });
}

/** DELETE /tasks/:id → 200 with the deleted task, or 404 when it does not exist. */
function remove(req, res) {
  const task = store.remove(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: `Task with id ${req.params.id} not found`
    });
  }

  res.status(200).json({ success: true, data: task });
}

module.exports = { getAll, create, update, remove };
