import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { user, logout, updatePassword } = useAuth();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validate password form before API request
  const validateForm = () => {
    if (!currentPassword.trim()) {
      return 'Current password is required.';
    }

    if (!newPassword) {
      return 'New password is required.';
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      return 'New password must be between 8 and 16 characters long.';
    }

    if (!/[A-Z]/.test(newPassword)) {
      return 'New password must contain at least one uppercase letter.';
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword)) {
      return 'New password must contain at least one special character.';
    }

    if (!confirmPassword) {
      return 'Please confirm your new password.';
    }

    if (newPassword !== confirmPassword) {
      return 'New password and confirmation password do not match.';
    }

    if (currentPassword === newPassword) {
      return 'New password must be different from your current password.';
    }

    return null;
  };

  // Submit password update
  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * AuthContext.updatePassword expects:
       * updatePassword(currentPassword, newPassword)
       */
      await updatePassword(currentPassword, newPassword);

      setSuccessMessage(
        'Your password has been updated successfully.'
      );

      // Clear password fields after successful update
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Reset password visibility
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      setErrorMessage(
        error?.message ||
          'Failed to update password. Please check your current password and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate according to current user's role
  const handleBackNavigation = () => {
    switch (user?.role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;

      case 'owner':
        navigate('/owner/dashboard');
        break;

      case 'user':
        navigate('/user/stores');
        break;

      default:
        navigate('/login', { replace: true });
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="update-password-root">
      <style>{`
        .update-password-root {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
          display: flex;
          flex-direction: column;
        }

        .page-navbar {
          background: #0f172a;
          color: #ffffff;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .brand-badge {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .brand-titles h1 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .brand-titles span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-nav-back,
        .btn-nav-logout {
          border-radius: 7px;
          padding: 0.5rem 0.9rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .btn-nav-back {
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid #334155;
        }

        .btn-nav-back:hover {
          background: #334155;
        }

        .btn-nav-logout {
          background: transparent;
          color: #fca5a5;
          border: 1px solid #dc2626;
        }

        .btn-nav-logout:hover {
          background: #dc2626;
          color: #ffffff;
        }

        .content-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem;
        }

        .password-card {
          width: 100%;
          max-width: 500px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 2.5rem 2rem;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          margin-bottom: 1.75rem;
        }

        .card-header h2 {
          margin: 0 0 0.4rem;
          color: #0f172a;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .card-header p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .alert-banner {
          margin-bottom: 1.5rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.4rem;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .password-input-wrapper {
          position: relative;
        }

        .input-control {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem 3.5rem 0.75rem 0.875rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.9375rem;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .input-control::placeholder {
          color: #94a3b8;
        }

        .input-control:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .input-control:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .btn-toggle-pwd {
          position: absolute;
          top: 50%;
          right: 0.45rem;
          transform: translateY(-50%);
          padding: 0.35rem 0.5rem;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-toggle-pwd:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .rules-box {
          margin-bottom: 1.5rem;
          padding: 0.9rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #475569;
          font-size: 0.8125rem;
        }

        .rules-title {
          margin-bottom: 0.4rem;
          color: #1e293b;
          font-weight: 700;
        }

        .rules-list {
          margin: 0;
          padding-left: 1.2rem;
          line-height: 1.55;
        }

        .btn-submit {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.8125rem 1rem;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-submit:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        button:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.3);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .page-navbar {
            padding: 1rem;
          }

          .navbar-actions {
            gap: 0.4rem;
          }

          .btn-nav-back,
          .btn-nav-logout {
            padding: 0.45rem 0.65rem;
            font-size: 0.75rem;
          }

          .content-container {
            padding: 1.5rem 1rem;
            align-items: flex-start;
          }

          .password-card {
            padding: 2rem 1.25rem;
          }

          .brand-titles span {
            display: none;
          }
        }
      `}</style>

      {/* Navigation */}
      <header className="page-navbar">
        <div className="navbar-brand">
          <div className="brand-badge" aria-hidden="true">
            R
          </div>

          <div className="brand-titles">
            <h1>Roxiler Systems</h1>
            <span>Account Security</span>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn-nav-back"
            onClick={handleBackNavigation}
          >
            Back to Dashboard
          </button>

          <button
            type="button"
            className="btn-nav-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-container">
        <section className="password-card">
          <div className="card-header">
            <h2>Change Password</h2>

            <p>
              Update your password regularly to help keep your account secure.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="alert-banner alert-error"
              role="alert"
              aria-live="assertive"
            >
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              className="alert-banner alert-success"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Current Password */}
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="current-password"
              >
                Current Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="current-password"
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  className="input-control"
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="btn-toggle-pwd"
                  onClick={() =>
                    setShowCurrent((previous) => !previous)
                  }
                  aria-label={
                    showCurrent
                      ? 'Hide current password'
                      : 'Show current password'
                  }
                >
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="new-password"
              >
                New Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  className="input-control"
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="btn-toggle-pwd"
                  onClick={() =>
                    setShowNew((previous) => !previous)
                  }
                  aria-label={
                    showNew
                      ? 'Hide new password'
                      : 'Show new password'
                  }
                >
                  {showNew ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="confirm-password"
              >
                Confirm New Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="input-control"
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="btn-toggle-pwd"
                  onClick={() =>
                    setShowConfirm((previous) => !previous)
                  }
                  aria-label={
                    showConfirm
                      ? 'Hide confirmation password'
                      : 'Show confirmation password'
                  }
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rules-box">
              <div className="rules-title">
                Password Requirements
              </div>

              <ul className="rules-list">
                <li>8 to 16 characters in length</li>
                <li>At least one uppercase letter (A–Z)</li>
                <li>At least one special character</li>
                <li>Must be different from your current password</li>
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? 'Updating Password...'
                : 'Update Password'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default UpdatePassword;