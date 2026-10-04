const express = require('express');
const router = express.Router();

const { getOwnerDashboard } = require('../controllers/ownerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected route: fetch store owner dashboard (store owner only)
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('owner'),
  getOwnerDashboard
);

module.exports = router;