const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  updatePassword
} = require('../controllers/authController');

const authenticateToken = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.put('/password', authenticateToken, updatePassword);

module.exports = router;