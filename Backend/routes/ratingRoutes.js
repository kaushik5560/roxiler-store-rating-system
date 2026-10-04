const express = require('express');
const router = express.Router();

const { submitOrUpdateRating } = require('../controllers/ratingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected route: submit or update a store rating (normal users only)
router.post(
  '/:storeId',
  authenticateToken,
  authorizeRoles('user'),
  submitOrUpdateRating
);

module.exports = router;