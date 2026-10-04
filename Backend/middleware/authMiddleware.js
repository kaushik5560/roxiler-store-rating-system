const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token from Authorization header.
 * Expected format: Authorization: Bearer <JWT_TOKEN>
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header is provided
    if (!authHeader) {
      return res.status(401).json({
        message: 'Access denied. Authorization header is missing.'
      });
    }

    // Verify header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. Malformed authorization header. Format must be: Bearer <token>.'
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return res.status(401).json({
        message: 'Access denied. Token is missing or malformed.'
      });
    }

    // Verify token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user payload (id, role, etc.) to req.user
    req.user = decoded;

    // Proceed to the next middleware or route handler
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access denied. Token has expired.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Access denied. Invalid token.'
      });
    }

    return res.status(401).json({
      message: 'Access denied. Authentication failed.'
    });
  }
};

module.exports = authenticateToken;