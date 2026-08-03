/**
 * Task routes.
 *
 * The validateId middleware is applied only to routes that carry an :id
 * parameter, so malformed ids never reach the controller code.
 */
const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const validateId = require('../middleware/validateId');

// Collection routes.
router.get('/', taskController.getAll);
router.post('/', taskController.create);

// Item routes — validate the :id format before handing off to the controller.
router.put('/:id', validateId, taskController.update);
router.delete('/:id', validateId, taskController.remove);

module.exports = router;
