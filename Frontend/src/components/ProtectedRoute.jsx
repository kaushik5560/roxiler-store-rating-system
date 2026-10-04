import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Returns the dashboard path associated with a valid role.
 */
const getRoleHomePath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';

    case 'owner':
      return '/owner';

    case 'user':
      return '/user';

    default:
      return null;
  }
};

/**
 * ProtectedRoute
 *
 * Handles:
 * - Authentication protection
 * - Role-based authorization
 * - Session loading
 * - Unauthorized redirects
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  /**
   * Wait until AuthContext finishes restoring
   * the existing session.
   */
  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <style>
          {`
            @keyframes protectedRouteSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>

        <div
          style={styles.spinner}
          role="status"
          aria-label="Loading"
        />

        <p style={styles.loadingText}>
          Verifying session...
        </p>
      </div>
    );
  }

  /**
   * User is not authenticated.
   */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Normalize allowedRoles.
   *
   * "admin" -> ["admin"]
   *
   * ["admin", "owner"] -> ["admin", "owner"]
   *
   * undefined -> null
   */
  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : allowedRoles
      ? [allowedRoles]
      : null;

  /**
   * Validate the user's role.
   */
  const roleHomePath = getRoleHomePath(user.role);

  /**
   * Unknown/invalid role.
   */
  if (!roleHomePath) {
    return <Navigate to="/login" replace />;
  }

  /**
   * User is authenticated but does not have
   * permission to access this route.
   */
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHomePath} replace />;
  }

  /**
   * User is authenticated and authorized.
   */
  return <Outlet />;
};

const styles = {
  loaderContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #334155',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'protectedRouteSpin 0.8s linear infinite',
    marginBottom: '16px',
  },

  loadingText: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export default ProtectedRoute;