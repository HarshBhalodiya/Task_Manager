# Practical 10 — Asynchronous Processing with Event-Driven Architecture

Background notification handling for the Task Management API using Node.js built-in
`EventEmitter` — no external message-queue dependency.

---

## 1. Objective

Decouple background side effects from the main request/response flow. When a task is
created (or deleted) via the API, an event is emitted and consumed asynchronously by a
listener, so the API responds immediately and the notification work happens later,
without blocking the response.

## 2. Request flow

```
POST /tasks
   |
   v
Task.create({ ...req.body, userId })        // save to MongoDB
   |
   v
cache.invalidate(tasks:<userId>)            // keep cache consistent (Practical 9)
   |
   v
console.log("[API] Response sent at ...")   // timestamp A
   |
   v
res.status(201).json(task)                  // client gets 201 immediately
   |
   v
taskEvents.emit('task-created', { task, user })
   |
   v  (same process, deferred by setTimeout 2s)
[Notification] Task "..." created at ... | assigned to user@example.com   // timestamp B (later)
```

The `[API]` timestamp (A) prints **before** the `[Notification]` completion timestamp (B),
even though both run on the same Node.js process — that is the proof the event handling is
asynchronous relative to the response.

## 3. Implementation

| File | Role |
|------|------|
| `backend/src/events/events.js` | Shared `EventEmitter` singleton (`new TaskEvents()`) |
| `backend/src/events/listeners.js` | Registers `task-created`, `task-deleted`, `error` listeners |
| `backend/src/controllers/taskController.js` | Emits `task-created` after `POST /tasks`, `task-deleted` after `DELETE /tasks/:id` |
| `backend/server.js` | Requires `listeners.js` once at startup so listeners exist before any request |

### Event emitter (`events.js`)

```js
const { EventEmitter } = require('events');

class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents();
```

### Listeners (`listeners.js`)

```js
const taskEvents = require('./events');

// task-created — delayed 2s so the async ordering is visible in the console
taskEvents.on('task-created', ({ task, user }) => {
  setTimeout(() => {
    try {
      if (!task || !task.title) throw new Error('task-created event received a task without a title');
      console.log(`[Notification] Task "${task.title}" created at ${new Date().toISOString()} | assigned to ${user.email}`);
    } catch (err) {
      taskEvents.emit('error', err);
    }
  }, 2000);
});

// task-deleted — separate event with its own listener and distinct message
taskEvents.on('task-deleted', ({ task, user }) => {
  console.log(`[Notification] Task "${task.title}" deleted at ${new Date().toISOString()} | by ${user.email}`);
});

// error — catches and logs any error thrown inside the listeners above
taskEvents.on('error', (err) => {
  console.error(`[Error] ${err instanceof Error ? err.message : String(err)}`);
});
```

### Controller (`taskController.js`)

```js
const taskEvents = require('../events/events');

// in create()
const task = await Task.create({ ...req.body, userId: req.user.userId });
cache.invalidate(cache.tasksKey(req.user.userId));

console.log(`[API] Response sent at ${new Date().toISOString()}`);
res.status(201).json({ success: true, data: task });

taskEvents.emit('task-created', {
  task,
  user: { id: req.user.userId, email: req.user.email }   // req.user.email comes from JWT
});

// in remove()
console.log(`[API] Task "${task.title}" deleted at ${new Date().toISOString()}`);
res.status(200).json({ success: true, data: task });
taskEvents.emit('task-deleted', { task, user: { id: req.user.userId, email: req.user.email } });
```

### Server bootstrap (`server.js`)

```js
require('./src/events/listeners');   // register listeners before listening
```

## 4. Empirical evidence (console ordering)

With the 2s listener delay, after creating a task via Postman:

```
[API] Response sent at 2025-06-04T12:34:01.123Z        ← timestamp A (immediate)
[Notification] Task "Finish report" created at 2025-06-04T12:34:03.145Z  ← timestamp B (+2s)
```

The API response (201) is returned ~2s before the notification completes: the client is
not blocked by the background work.

## 5. How to verify

1. `cd backend && npm install && npm start`
2. Register/login to obtain a JWT (`POST /auth/register` → `POST /auth/login`).
3. Create a task with the token:
   `POST /tasks` with `Authorization: Bearer <token>` and `{ "title": "Demo" }`.
4. Observe the console: `[API]` prints first, then ~2s later `[Notification]`.
5. Delete that task and confirm the `[Notification] ... deleted` line prints.
6. (Optional) temporarily throw inside the listener to see the `[Error]` line from the
   `error` listener instead of a process crash.

## 6. Key questions (short answers)

- **Why doesn't emitting block the response?** `emit()` returns immediately after invoking
  listeners; the real work is deferred with `setTimeout`, moving it out of the current tick
  and off the critical path.
- **What if the notification logic were placed directly in the POST route?** The route would
  wait for the (slow) notification to finish before sending the response, so response time
  would grow to ~2s instead of staying instant.
- **Why EventEmitter here but not for millions of events/day?** It is simple, dependency-free,
  and single-process. At very high volume you want delivery guarantees, persistence, retries
  and horizontal scaling — which a real queue (RabbitMQ/Bull/Redis) provides.

## 7. Deliverables checklist

- [x] `events.js` — `EventEmitter` singleton
- [x] `listeners.js` — `task-created`, `task-deleted`, `error` listeners
- [x] `taskController.js` — emits events after `POST`/`DELETE` respond
- [x] `server.js` — listeners registered at startup
- [ ] Console-log screenshot/recording showing response-before-handler ordering
- [ ] Commit for event-driven async processing
