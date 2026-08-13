/**
 * Task controllers — the only layer that talks to MongoDB via Mongoose.
 *
 * Every response uses the same JSON envelope:
 *   success: { success: true,  data: <payload> }
 *   failure: { success: false, error: <message> }
 *
 * All handlers are async and wrapped in try/catch; unexpected errors are
 * forwarded to the global error handler with next(err).
 */
const Task = require('../../models/Task');

/** GET /tasks → 200 with the full task list (newest first). */
async function getAll(req, res, next) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
}

/** GET /tasks/:id → 200 with one task, or 404 when it does not exist. */
async function getById(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** POST /tasks → 201 with the created task. Schema validation runs in Mongoose. */
async function create(req, res, next) {
  try {
    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** PUT /tasks/:id → 200 with the updated task, or 404 when it does not exist. */
async function update(req, res, next) {
  try {
    // runValidators ensures schema rules (e.g. required title) also apply on update.
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** DELETE /tasks/:id → 200 with the deleted task, or 404 when it does not exist. */
async function remove(req, res, next) {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
