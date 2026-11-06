/**
 * Event listeners (Practical 10).
 *
 * This module is required once at server startup so all listeners are
 * registered before the first request can be handled. These listeners run on
 * the same Node.js process as the API, but their work is scheduled
 * asynchronously (via setTimeout) so it never blocks the response path.
 */
const taskEvents = require('./events');

/**
 * task-created listener.
 *
 * A 2-second artificial delay (setTimeout) makes the asynchronous ordering
 * visible in the console: the `[API]` response timestamp in the controller
 * prints before this `[Notification]` completion timestamp, even though both
 * run on the same process. The delay simulates the cost of a real background
 * notification pipeline (email, push, etc.).
 */
taskEvents.on('task-created', ({ task, user }) => {
  setTimeout(() => {
    try {
      if (!task || !task.title) {
        throw new Error('task-created event received a task without a title');
      }
      console.log(
        `[Notification] Task "${task.title}" created at ${new Date().toISOString()} | assigned to ${user.email}`
      );
    } catch (err) {
      // Any error thrown inside this handler is caught and handed to the
      // 'error' listener below instead of crashing the process.
      taskEvents.emit('error', err);
    }
  }, 2000);
});

/**
 * task-deleted listener.
 *
 * A separate event with its own listener and a distinct log message
 * (Supplementary problem 1).
 */
taskEvents.on('task-deleted', ({ task, user }) => {
  console.log(
    `[Notification] Task "${task.title}" deleted at ${new Date().toISOString()} | by ${user.email}`
  );
});

/**
 * error listener.
 *
 * Catches and logs any error thrown inside other listeners (Supplementary
 * problem 2). Registering an 'error' listener also prevents Node's default
 * "unhandled 'error' event" behaviour, which would otherwise crash the
 * process if a listener threw.
 */
taskEvents.on('error', (err) => {
  console.error(
    `[Error] ${err instanceof Error ? err.message : String(err)}`
  );
});
