const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Unified Dashboard Analytics (Professor/Admin only)
router.get('/dashboard', requireAdmin, analyticsController.getDashboardAnalytics);

module.exports = router;
