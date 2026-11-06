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
const cache = require('../cache/cache');

/**
 * GET /tasks → 200 with the full task list for authenticated user (newest first).
 *
 * Served straight from the in-memory cache when the user's list was already
 * fetched inside the TTL window (X-Cache: HIT). On a miss the list is read from
 * MongoDB and stored under tasks:<userId>.
 */
async function getAll(req, res, next) {
  try {
    const key = cache.tasksKey(req.user.userId);
    const cached = cache.read(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json({ success: true, data: cached });
    }

    res.set('X-Cache', cache.isEnabled() ? 'MISS' : 'BYPASS');

    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    cache.write(key, tasks);

    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tasks/:id → 200 with one task, or 404 when it does not exist.
 *
 * Cached separately from the collection under task:<userId>:<taskId>, so a
 * single-task read never costs a database round trip twice.
 */
async function getById(req, res, next) {
  try {
    const key = cache.taskKey(req.user.userId, req.params.id);
    const cached = cache.read(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json({ success: true, data: cached });
    }

    res.set('X-Cache', cache.isEnabled() ? 'MISS' : 'BYPASS');

    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    cache.write(key, task);

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** POST /tasks → 201 with the created task. Schema validation runs in Mongoose. */
async function create(req, res, next) {
  try {
    const task = await Task.create({ ...req.body, userId: req.user.userId });

    // The cached list is now stale — drop it so the next GET re-reads MongoDB.
    cache.invalidate(cache.tasksKey(req.user.userId));

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** PUT /tasks/:id → 200 with the updated task, or 404 when it does not exist. */
async function update(req, res, next) {
  try {
    // runValidators ensures schema rules (e.g. required title) also apply on update.
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    // Both the list and this single-task entry are stale after an update.
    cache.invalidate([
      cache.tasksKey(req.user.userId),
      cache.taskKey(req.user.userId, req.params.id)
    ]);

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/** DELETE /tasks/:id → 200 with the deleted task, or 404 when it does not exist. */
async function remove(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task with id ${req.params.id} not found`
      });
    }

    // A deleted task must disappear from the list cache and from its own key.
    cache.invalidate([
      cache.tasksKey(req.user.userId),
      cache.taskKey(req.user.userId, req.params.id)
    ]);

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove };
