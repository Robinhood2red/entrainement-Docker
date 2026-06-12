const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ? GET /api/stats/progression - Retrieve user progression stats ?
// ! Route protected by authMiddleware (requires a valid JWT token) !
router.get('/progression', authMiddleware, StatsController.getProgression);

module.exports = router;