/**
 * Authentication routes.
 *
 * POST /auth/register — Register new user
 * POST /auth/login    — Login existing user
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
