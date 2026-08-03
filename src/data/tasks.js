/**
 * In-memory task store.
 *
 * No database is used — tasks live in this array for as long as the server
 * process is running and are lost on restart (by design for this assignment).
 */

// Seed with two example tasks so the API isn't empty on first run.
const tasks = [
  { id: 1, title: 'Learn REST APIs', done: false },
  { id: 2, title: 'Build a task manager', done: false }
];

// Auto-increment counter used to generate new task ids (1, 2, 3, ...).
let nextId = tasks.length + 1;

/** Return every task. */
function getAll() {
  return tasks;
}

/** Find a task by id, or undefined when it does not exist. */
function getById(id) {
  return tasks.find((task) => task.id === id);
}

/** Create and store a new task, then return it. */
function create(title, done = false) {
  const task = { id: nextId, title, done };
  nextId += 1;
  tasks.push(task);
  return task;
}

/**
 * Update an existing task with the given fields.
 * Only fields present in `fields` are overwritten.
 * Returns the updated task, or null when the task is not found.
 */
function update(id, fields) {
  const task = getById(id);
  if (!task) return null;

  if (fields.title !== undefined) task.title = fields.title;
  if (fields.done !== undefined) task.done = fields.done;

  return task;
}

/**
 * Delete a task by id.
 * Returns the removed task, or null when it is not found.
 */
function remove(id) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  return tasks.splice(index, 1)[0];
}

module.exports = { getAll, create, update, remove };
