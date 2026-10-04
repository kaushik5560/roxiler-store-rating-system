const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Validate password complexity:
 * - Length: 8–16 characters
 * - At least one uppercase letter
 * - At least one special character
 */
const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;

  if (password.length < 8 || password.length > 16) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  return hasUpperCase && hasSpecialChar;
};

/**
 * Validate standard email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    typeof email === 'string' &&
    emailRegex.test(email.trim())
  );
};

/**
 * @desc    Get admin dashboard metrics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getAdminDashboard = async (req, res) => {
  try {
    const [usersResult, storesResult, ratingsResult] =
      await Promise.all([
        db.query('SELECT COUNT(*) AS totalUsers FROM users'),
        db.query('SELECT COUNT(*) AS totalStores FROM stores'),
        db.query('SELECT COUNT(*) AS totalRatings FROM ratings')
      ]);

    const totalUsers =
      Number(usersResult[0][0].totalUsers) || 0;

    const totalStores =
      Number(storesResult[0][0].totalStores) || 0;

    const totalRatings =
      Number(ratingsResult[0][0].totalRatings) || 0;

    return res.status(200).json({
      message: 'Admin dashboard data fetched successfully.',
      dashboard: {
        totalUsers,
        totalStores,
        totalRatings
      }
    });
  } catch (error) {
    console.error(
      'Error fetching admin dashboard statistics:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while fetching dashboard data.'
    });
  }
};

/**
 * @desc    Create a new user with assigned role
 * @route   POST /api/admin/users
 * @access  Private (Admin only)
 */
const createUserByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      role
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message:
          'Name, email, password, and role are required fields.'
      });
    }

    // Name: 20–60 characters
    const trimmedName =
      typeof name === 'string'
        ? name.trim()
        : '';

    if (
      trimmedName.length < 20 ||
      trimmedName.length > 60
    ) {
      return res.status(400).json({
        message:
          'Name must be between 20 and 60 characters.'
      });
    }

    // Email validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message:
          'Please provide a valid email address.'
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    // Address: maximum 400 characters
    if (
      address &&
      (
        typeof address !== 'string' ||
        address.length > 400
      )
    ) {
      return res.status(400).json({
        message:
          'Address must not exceed 400 characters.'
      });
    }

    // Password validation
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          'Password must be 8–16 characters and contain at least one uppercase letter and one special character.'
      });
    }

    // Allowed roles
    const allowedRoles = [
      'user',
      'admin',
      'owner'
    ];

    const normalizedRole =
      typeof role === 'string'
        ? role.toLowerCase().trim()
        : '';

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message:
          "Invalid role. Role must be one of: 'user', 'admin', or 'owner'."
      });
    }

    // Duplicate email check
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message:
          'An account with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    const formattedAddress =
      address &&
      typeof address === 'string'
        ? address.trim()
        : null;

    // Create user
    const [result] = await db.query(
      `
      INSERT INTO users
      (name, email, password, address, role)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        trimmedName,
        normalizedEmail,
        hashedPassword,
        formattedAddress,
        normalizedRole
      ]
    );

    return res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        address: formattedAddress,
        role: normalizedRole
      }
    });
  } catch (error) {
    console.error(
      'Error creating user by admin:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while creating user.'
    });
  }
};

/**
 * @desc    Create a new store assigned to a store owner
 * @route   POST /api/admin/stores
 * @access  Private (Admin only)
 */
const createStoreByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      ownerId
    } = req.body;

    const targetOwnerId =
      ownerId !== undefined
        ? ownerId
        : req.body.owner_id;

    if (
      !name ||
      !email ||
      targetOwnerId === undefined ||
      targetOwnerId === null
    ) {
      return res.status(400).json({
        message:
          'Name, email, and ownerId are required fields.'
      });
    }

    // Store name: 20–60 characters
    const trimmedName =
      typeof name === 'string'
        ? name.trim()
        : '';

    if (
      trimmedName.length < 20 ||
      trimmedName.length > 60
    ) {
      return res.status(400).json({
        message:
          'Name must be between 20 and 60 characters.'
      });
    }

    // Email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message:
          'Please provide a valid email address.'
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    // Address
    if (
      address &&
      (
        typeof address !== 'string' ||
        address.length > 400
      )
    ) {
      return res.status(400).json({
        message:
          'Address must not exceed 400 characters.'
      });
    }

    // Owner ID
    const parsedOwnerId =
      Number(targetOwnerId);

    if (
      !Number.isInteger(parsedOwnerId) ||
      parsedOwnerId <= 0
    ) {
      return res.status(400).json({
        message:
          'ownerId must be a valid positive integer.'
      });
    }

    // Verify owner
    const [users] = await db.query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = ?
      `,
      [parsedOwnerId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message:
          'Store owner not found with the provided ownerId.'
      });
    }

    if (users[0].role !== 'owner') {
      return res.status(400).json({
        message:
          "The specified user does not have the 'owner' role."
      });
    }

    // Duplicate store email
    const [existingStores] = await db.query(
      'SELECT id FROM stores WHERE email = ?',
      [normalizedEmail]
    );

    if (existingStores.length > 0) {
      return res.status(409).json({
        message:
          'A store with this email already exists.'
      });
    }

    const formattedAddress =
      address &&
      typeof address === 'string'
        ? address.trim()
        : null;

    // Create store
    const [result] = await db.query(
      `
      INSERT INTO stores
      (name, email, address, owner_id)
      VALUES (?, ?, ?, ?)
      `,
      [
        trimmedName,
        normalizedEmail,
        formattedAddress,
        parsedOwnerId
      ]
    );

    return res.status(201).json({
      message: 'Store created successfully.',
      store: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        address: formattedAddress,
        owner_id: parsedOwnerId
      }
    });
  } catch (error) {
    console.error(
      'Error creating store by admin:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while creating store.'
    });
  }
};

/**
 * @desc    Get all stores with overall average rating
 * @route   GET /api/admin/stores
 * @access  Private (Admin only)
 */
const getAllStoresByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      sortBy,
      order
    } = req.query;

    let query = `
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        COALESCE(AVG(r.rating), 0) AS overallRating
      FROM stores s
      LEFT JOIN ratings r
        ON s.id = r.store_id
    `;

    const conditions = [];
    const values = [];

    if (name) {
      conditions.push('s.name LIKE ?');
      values.push(`%${name.trim()}%`);
    }

    if (email) {
      conditions.push('s.email LIKE ?');
      values.push(`%${email.trim()}%`);
    }

    if (address) {
      conditions.push('s.address LIKE ?');
      values.push(`%${address.trim()}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY
        s.id,
        s.name,
        s.email,
        s.address
    `;

    const allowedSortFields = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'overallRating'
    };

    const selectedSortField =
      allowedSortFields[sortBy] || 's.name';

    const selectedOrder =
      String(order).toUpperCase() === 'DESC'
        ? 'DESC'
        : 'ASC';

    query += `
      ORDER BY
      ${selectedSortField}
      ${selectedOrder}
    `;

    const [stores] =
      await db.query(query, values);

    const formattedStores =
      stores.map((store) => ({
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        overallRating:
          Number(
            Number(store.overallRating).toFixed(2)
          )
      }));

    return res.status(200).json({
      message: 'Stores fetched successfully.',
      count: formattedStores.length,
      stores: formattedStores
    });
  } catch (error) {
    console.error(
      'Error fetching stores:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while fetching stores.'
    });
  }
};

/**
 * @desc    Get users/admins/owners with filters and sorting
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 *
 * role can be:
 * - user
 * - admin
 * - owner
 */
const getAllUsersByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy,
      order
    } = req.query;

    let query = `
      SELECT
        id,
        name,
        email,
        address,
        role
      FROM users
    `;

    const conditions = [];
    const values = [];

    // Role filter
    if (role) {
      const normalizedRole =
        String(role).toLowerCase().trim();

      const allowedRoles = [
        'user',
        'admin',
        'owner'
      ];

      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({
          message:
            "Invalid role. Role must be one of: 'user', 'admin', or 'owner'."
        });
      }

      conditions.push('role = ?');
      values.push(normalizedRole);
    }

    // Name filter
    if (name) {
      conditions.push('name LIKE ?');
      values.push(`%${name.trim()}%`);
    }

    // Email filter
    if (email) {
      conditions.push('email LIKE ?');
      values.push(`%${email.trim()}%`);
    }

    // Address filter
    if (address) {
      conditions.push('address LIKE ?');
      values.push(`%${address.trim()}%`);
    }

    if (conditions.length > 0) {
      query += `
        WHERE ${conditions.join(' AND ')}
      `;
    }

    const allowedSortFields = {
      name: 'name',
      email: 'email',
      address: 'address',
      role: 'role'
    };

    const selectedSortField =
      allowedSortFields[sortBy] || 'name';

    const selectedOrder =
      String(order).toUpperCase() === 'DESC'
        ? 'DESC'
        : 'ASC';

    query += `
      ORDER BY
      ${selectedSortField}
      ${selectedOrder}
    `;

    const [users] =
      await db.query(query, values);

    return res.status(200).json({
      message: 'Users fetched successfully.',
      count: users.length,
      users
    });
  } catch (error) {
    console.error(
      'Error fetching users:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while fetching users.'
    });
  }
};

/**
 * @desc    Get details of a specific user
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserDetailsByAdmin = async (req, res) => {
  try {
    const userId =
      Number(req.params.id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return res.status(400).json({
        message:
          'User ID must be a valid positive integer.'
      });
    }

    const [users] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        address,
        role
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Store-owner specific details
    if (user.role === 'owner') {
      const [stores] = await db.query(
        `
        SELECT
          s.id,
          s.name,
          s.email,
          s.address,
          COALESCE(AVG(r.rating), 0) AS overallRating
        FROM stores s
        LEFT JOIN ratings r
          ON s.id = r.store_id
        WHERE s.owner_id = ?
        GROUP BY
          s.id,
          s.name,
          s.email,
          s.address
        `,
        [userId]
      );

      const formattedStores =
        stores.map((store) => ({
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          overallRating:
            Number(
              Number(store.overallRating).toFixed(2)
            )
        }));

      return res.status(200).json({
        message:
          'User details fetched successfully.',
        user: {
          ...user,
          stores: formattedStores
        }
      });
    }

    return res.status(200).json({
      message:
        'User details fetched successfully.',
      user: {
        ...user
      }
    });
  } catch (error) {
    console.error(
      'Error fetching user details:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error while fetching user details.'
    });
  }
};

module.exports = {
  getAdminDashboard,
  createUserByAdmin,
  createStoreByAdmin,
  getAllStoresByAdmin,
  getAllUsersByAdmin,
  getUserDetailsByAdmin
};