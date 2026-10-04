/**
 * Role-based authorization middleware.
 * Accepts one or more allowed roles and returns a middleware function.
 *
 * Example usage:
 *   authorizeRoles('admin')
 *   authorizeRoles('admin', 'owner')
 *
 * @param {...string|string[]} roles - Permitted roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  // Flatten roles in case an array or comma-separated strings are passed
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    // Check if user authentication payload exists
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: 'Authentication required. Access denied.'
      });
    }

    // Verify if the user's role has permission
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden. You do not have sufficient permissions to access this resource.'
      });
    }

    // Role authorized, proceed to next handler
    return next();
  };
};

module.exports = authorizeRoles;