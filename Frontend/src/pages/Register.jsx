import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const initialFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: ''
};

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  const validateForm = () => {
    const errors = {};

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedAddress = formData.address.trim();

    // Name: 20–60 characters
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (
      trimmedName.length < 20 ||
      trimmedName.length > 60
    ) {
      errors.name =
        'Name must be between 20 and 60 characters.';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email =
        'Please enter a valid email address.';
    }

    // Password
    const specialCharacterRegex =
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (
      formData.password.length < 8 ||
      formData.password.length > 16
    ) {
      errors.password =
        'Password must be 8–16 characters long.';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password =
        'Password must include at least one uppercase letter.';
    } else if (
      !specialCharacterRegex.test(formData.password)
    ) {
      errors.password =
        'Password must include at least one special character.';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword =
        'Confirm password is required.';
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword =
        'Passwords do not match.';
    }

    // Address: optional, maximum 400 characters
    if (trimmedAddress.length > 400) {
      errors.address =
        'Address cannot exceed 400 characters.';
    }

    return errors;
  };

  // ============================================================
  // INPUT CHANGE HANDLER
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    // Clear individual field error as user types
    if (fieldErrors[name]) {
      setFieldErrors((previous) => ({
        ...previous,
        [name]: ''
      }));
    }

    // Clear general API/server error
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // ============================================================
  // FORM SUBMIT
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage('');
    setFieldErrors({});

    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address.trim() || undefined
      });

      setSuccessMessage(
        'Account created successfully. Redirecting to login...'
      );

      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (error) {
      setErrorMessage(
        error?.message ||
          'Registration failed. Please check your information and try again.'
      );

      setIsSubmitting(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Brand Header */}
        <header className="brand-header">
          <div
            className="brand-logo-badge"
            aria-hidden="true"
          >
            R
          </div>

          <h1 className="brand-title">
            Roxiler Systems
          </h1>

          <p className="brand-subtitle">
            Store Rating Platform • Create an account
          </p>
        </header>

        {/* Error Message */}
        {errorMessage && (
          <div
            className="alert-error"
            role="alert"
            aria-live="polite"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />

              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
              />

              <line
                x1="12"
                y1="16"
                x2="12.01"
                y2="16"
              />
            </svg>

            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            className="alert-success"
            role="status"
            aria-live="polite"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />

              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>

            <span>{successMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
        >

          {/* Full Name */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="name"
            >
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              className={`input-control ${
                fieldErrors.name
                  ? 'has-error'
                  : ''
              }`}
              autoComplete="name"
              placeholder="Enter your full name (20–60 characters)"
              value={formData.name}
              onChange={handleChange}
              disabled={
                isSubmitting ||
                Boolean(successMessage)
              }
              required
            />

            {fieldErrors.name && (
              <span
                className="field-error-text"
                role="alert"
              >
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="email"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className={`input-control ${
                fieldErrors.email
                  ? 'has-error'
                  : ''
              }`}
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={
                isSubmitting ||
                Boolean(successMessage)
              }
              required
            />

            {fieldErrors.email && (
              <span
                className="field-error-text"
                role="alert"
              >
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="password"
            >
              Password
            </label>

            <div className="password-container">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                className={`input-control ${
                  fieldErrors.password
                    ? 'has-error'
                    : ''
                }`}
                autoComplete="new-password"
                placeholder="8–16 chars, 1 uppercase, 1 special char"
                value={formData.password}
                onChange={handleChange}
                disabled={
                  isSubmitting ||
                  Boolean(successMessage)
                }
                required
              />

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>

            {fieldErrors.password && (
              <span
                className="field-error-text"
                role="alert"
              >
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>

            <div className="password-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                className={`input-control ${
                  fieldErrors.confirmPassword
                    ? 'has-error'
                    : ''
                }`}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={
                  isSubmitting ||
                  Boolean(successMessage)
                }
                required
              />

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword
                  ? 'Hide'
                  : 'Show'}
              </button>
            </div>

            {fieldErrors.confirmPassword && (
              <span
                className="field-error-text"
                role="alert"
              >
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Address */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="address"
            >
              Address
              <span className="form-label-optional">
                (Optional)
              </span>
            </label>

            <textarea
              id="address"
              name="address"
              className={`input-control ${
                fieldErrors.address
                  ? 'has-error'
                  : ''
              }`}
              autoComplete="street-address"
              placeholder="Enter your address (max 400 characters)"
              value={formData.address}
              onChange={handleChange}
              disabled={
                isSubmitting ||
                Boolean(successMessage)
              }
              maxLength={400}
              rows={3}
            />

            {fieldErrors.address && (
              <span
                className="field-error-text"
                role="alert"
              >
                {fieldErrors.address}
              </span>
            )}

            <div className="character-counter">
              {formData.address.length} / 400 characters
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit"
            disabled={
              isSubmitting ||
              Boolean(successMessage)
            }
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner"
                  aria-hidden="true"
                ></span>

                <span>
                  Creating Account...
                </span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <footer className="register-footer">
          <span>
            Already have an account?
          </span>

          <Link
            to="/login"
            className="login-link"
          >
            Sign In
          </Link>
        </footer>
      </div>

      {/* ========================================================
          COMPONENT STYLES
          ======================================================== */}
      <style>{`
        .register-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f8fafc;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .register-card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 36px;
          box-shadow:
            0 20px 25px -5px rgba(15, 23, 42, 0.10),
            0 8px 10px -6px rgba(15, 23, 42, 0.08);
        }

        .brand-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          font-size: 21px;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .brand-title {
          font-size: 25px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 6px;
          letter-spacing: -0.025em;
        }

        .brand-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .alert-error,
        .alert-success {
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          line-height: 1.45;
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
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 7px;
        }

        .form-label-optional {
          font-weight: 400;
          color: #94a3b8;
          font-size: 13px;
          margin-left: 5px;
        }

        .input-control {
          width: 100%;
          padding: 12px 14px;
          font-size: 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .input-control::placeholder {
          color: #94a3b8;
        }

        .input-control:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .input-control.has-error {
          border-color: #ef4444;
          background: #fffafa;
        }

        .input-control.has-error:focus {
          border-color: #ef4444;
          box-shadow:
            0 0 0 3px rgba(239, 68, 68, 0.12);
        }

        .input-control:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        textarea.input-control {
          resize: vertical;
          min-height: 84px;
          line-height: 1.5;
        }

        .field-error-text {
          font-size: 13px;
          color: #dc2626;
          margin-top: 5px;
          display: block;
        }

        .password-container {
          position: relative;
        }

        .password-container .input-control {
          padding-right: 70px;
        }

        .toggle-password-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #2563eb;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 8px;
          cursor: pointer;
          border-radius: 5px;
        }

        .toggle-password-btn:hover {
          background: #eff6ff;
        }

        .toggle-password-btn:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .character-counter {
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
          margin-top: 5px;
        }

        .btn-submit {
          width: 100%;
          padding: 13px 16px;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          background: #2563eb;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition:
            background-color 0.15s ease,
            opacity 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-submit:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .register-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #64748b;
        }

        .login-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          margin-left: 5px;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        .login-link:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
          border-radius: 3px;
        }

        @media (max-width: 540px) {
          .register-page {
            padding: 16px;
          }

          .register-card {
            padding: 32px 22px;
            border-radius: 14px;
          }

          .brand-title {
            font-size: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner {
            animation: none;
          }

          .input-control,
          .btn-submit {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;