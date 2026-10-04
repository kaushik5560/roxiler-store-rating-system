const express = require('express');
const router = express.Router();

const { getAllStoresForUser } = require('../controllers/storeController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected route: fetch all stores for normal users with ratings, search, and sorting
router.get(
  '/',
  authenticateToken,
  authorizeRoles('user'),
  getAllStoresForUser
);

module.exports = router;