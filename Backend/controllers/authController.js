const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Helper to validate password complexity:
 * - Length: 8–16 characters
 * - At least one uppercase letter
 * - At least one special character
 */
const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 16) return false;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

  return hasUpperCase && hasSpecialChar;
};

/**
 * Helper to validate standard email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

/**
 * 1. Register a new user
 * Enforces role 'user' and performs all required field validations
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required fields.'
      });
    }

    // Validate Name: 20–60 characters
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName.length < 20 || trimmedName.length > 60) {
      return res.status(400).json({
        message: 'Name must be between 20 and 60 characters.'
      });
    }

    // Validate Email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.'
      });
    }

    // Validate Address: maximum 400 characters (optional field)
    if (address && (typeof address !== 'string' || address.length > 400)) {
      return res.status(400).json({
        message: 'Address must not exceed 400 characters.'
      });
    }

    // Validate Password requirements
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must be 8–16 characters and contain at least one uppercase letter and one special character.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user - strictly default role to 'user', ignoring any role sent in request body
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [trimmedName, normalizedEmail, hashedPassword, address ? address.trim() : null, 'user']
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        address: address ? address.trim() : null,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Error in registerUser:', error);
    return res.status(500).json({
      message: 'Internal server error while registering user.'
    });
  }
};

/**
 * 2. Login user
 * Verifies credentials and returns JWT token + safe user profile
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    // Retrieve user by email
    const [users] = await db.query(
      'SELECT id, name, email, password, address, role FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in loginUser:', error);
    return res.status(500).json({
      message: 'Internal server error while logging in.'
    });
  }
};

/**
 * 3. Update password for authenticated user
 * Requires authenticated user ID from req.user.id
 * Requires currentPassword and newPassword in request body
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Unauthorized. Authentication required.'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Both currentPassword and newPassword are required
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Both currentPassword and newPassword are required.'
      });
    }

    // Validate new password rules
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be 8–16 characters and contain at least one uppercase letter and one special character.'
      });
    }

    // Fetch user's existing hashed password
    const [users] = await db.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const user = users[0];

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentMatch) {
      return res.status(400).json({
        message: 'Current password does not match.'
      });
    }

    // Ensure new password is not the same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from the current password.'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    return res.status(200).json({
      message: 'Password updated successfully.'
    });
  } catch (error) {
    console.error('Error in updatePassword:', error);
    return res.status(500).json({
      message: 'Internal server error while updating password.'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword
};