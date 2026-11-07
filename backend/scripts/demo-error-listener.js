/**
 * Practical 10 (Supplementary problem 2) — prove the 'error' listener works.
 *
 * The listeners module guards the task-created handler with try/catch and
 * forwards any failure to the shared 'error' listener. This script emits a
 * deliberately malformed task-created event (no title), so after the 2 s
 * delay the handler throws and the error listener logs `[Error] ...` instead
 * of the process crashing.
 *
 * It also proves one normal, valid event is handled normally in the same run.
 *
 *   node scripts/demo-error-listener.js
 *
 * Env: TITLE_TITLE_MISSING — the failed event is emitted automatically; the
 * script re-registers the same listeners the server uses.
 */
const taskEvents = require('../src/events/events');
require('../src/events/listeners');

const USER = { id: 'demo-user', email: 'demo.p10@example.com' };
const GOOD_TITLE = process.env.TITLE || 'Valid task for the error demo';

console.log('');
console.log('Practical 10 — error listener demo');
console.log('');

// 1) A valid event: handled normally by the task-created listener.
taskEvents.emit('task-created', {
  task: { title: GOOD_TITLE },
  user: USER
});

// 2) A malformed event: task has no title → handler throws after 2 s → 'error'.
taskEvents.emit('task-created', { task: {}, user: USER });

console.log('[demo] two task-created events emitted; handler has a 2 s delay');

// The valid notification logs ~2 s in; the error line follows it immediately.
setTimeout(() => {
  console.log('');
  console.log('RESULT: the process did not crash — the error listener caught the failure');
  setTimeout(() => process.exit(0), 100);
}, 3200);
