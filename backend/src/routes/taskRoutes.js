/**
 * Task routes.
 *
 * All routes are protected with JWT authentication middleware.
 * The validateId middleware is applied only to routes that carry an :id
 * parameter, so malformed ObjectIds never reach the controller code.
 */
const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const validateId = require('../middleware/validateId');
const auth = require('../middleware/auth');

// Apply authentication to all task routes
router.use(auth);

// Collection routes.
router.get('/', taskController.getAll);
router.post('/', taskController.create);

// Item routes — validate the :id format before handing off to the controller.
router.get('/:id', validateId, taskController.getById);
router.put('/:id', validateId, taskController.update);
router.delete('/:id', validateId, taskController.remove);

module.exports = router;
