const express = require('express');

const router = express.Router();

const {
  getAdminDashboard,
  createUserByAdmin,
  createStoreByAdmin,
  getAllStoresByAdmin,
  getAllUsersByAdmin,
  getUserDetailsByAdmin
} = require('../controllers/adminController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Protected admin dashboard route
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('admin'),
  getAdminDashboard
);

// Protected route to create a user with assigned role by admin
router.post(
  '/users',
  authenticateToken,
  authorizeRoles('admin'),
  createUserByAdmin
);

router.get(
  '/users',
  authenticateToken,
  authorizeRoles('admin'),
  getAllUsersByAdmin
);

router.get(
  '/users/:id',
  authenticateToken,
  authorizeRoles('admin'),
  getUserDetailsByAdmin
);

// Protected route to create a store by admin
router.post(
  '/stores',
  authenticateToken,
  authorizeRoles('admin'),
  createStoreByAdmin
);
router.get(
  '/stores',
  authenticateToken,
  authorizeRoles('admin'),
  getAllStoresByAdmin
);
console.log("POST /api/admin/users route registered");
console.log("GET /api/admin/users route registered");
console.log("GET /api/admin/users/:id route registered");
console.log("POST /api/admin/stores route registered");
console.log("GET /api/admin/stores route registered");

module.exports = router;