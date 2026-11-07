/**
 * AI routes — protected by the same JWT auth as tasks, because generating a
 * description is per-user work and must never be callable anonymously.
 */
const express = require('express');
const router = express.Router();

const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/generate-description', aiController.generateDescriptionHandler);

module.exports = router;
