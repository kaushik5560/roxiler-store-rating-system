import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin':
        return 'Administrator';
      case 'owner':
        return 'Store Owner';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const getInitials = () => {
    if (!user.name) return 'U';

    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  };

  const getDashboardPath = () => {
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'owner':
        return '/owner';
      case 'user':
        return '/user';
      default:
        return '/login';
    }
  };

  const getPasswordPath = () => {
    switch (user.role) {
      case 'owner':
        return '/owner/password';
      case 'user':
        return '/user/password';
      default:
        return null;
    }
  };

  const passwordPath = getPasswordPath();

  return (
    <header className="app-navbar">
      <div className="navbar-container">

        <NavLink
          to={getDashboardPath()}
          className="navbar-brand"
        >
          <div className="brand-logo">
            R
          </div>

          <div className="brand-content">
            <span className="brand-title">
              Roxiler
            </span>

            <span className="brand-subtitle">
              Store Rating System
            </span>
          </div>
        </NavLink>

        <nav className="navbar-links">

          <NavLink
            to={getDashboardPath()}
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'active' : ''}`
            }
          >
            Dashboard
          </NavLink>

          {user.role === 'admin' && (
            <>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
              >
                Users
              </NavLink>

              <NavLink
                to="/admin/stores"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
              >
                Stores
              </NavLink>
            </>
          )}

          {user.role === 'user' && (
            <NavLink
              to="/user/stores"
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Stores
            </NavLink>
          )}

          {passwordPath && (
            <NavLink
              to={passwordPath}
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
            >
              Password
            </NavLink>
          )}

        </nav>

        <div className="navbar-user-section">

          <div className="user-info">

            <div className="user-avatar">
              {getInitials()}
            </div>

            <div className="user-details">
              <span className="user-name">
                {user.name}
              </span>

              <span className="user-role">
                {getRoleLabel()}
              </span>
            </div>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    </header>
  );
};

export default Navbar;