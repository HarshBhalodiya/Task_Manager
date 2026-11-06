/**
 * Shared application event emitter (Practical 10).
 *
 * A single EventEmitter instance used to decouple background side effects
 * (notifications) from the main request/response flow. It uses Node's
 * built-in `events` module, so no external dependencies are required.
 *
 * Handlers registered on this emitter run on the same Node.js process, but
 * because `emit()` invokes them in the current tick and never waits for them
 * to finish, they do not block the API response.
 */
const { EventEmitter } = require('events');

/**
 * Thin subclass so the emitter's role is clear and future domain-specific
 * behaviour (e.g. typed emit helpers) has a home.
 */
class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();
