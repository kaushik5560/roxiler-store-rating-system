import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getRedirectPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';

    case 'owner':
      return '/owner/dashboard';

    case 'user':
    default:
      return '/user/stores';
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage('');

    const trimmedEmail = email.trim();

    // Frontend validation
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await login(trimmedEmail, password);

      const role = data?.user?.role || 'user';

      navigate(getRedirectPath(role), { replace: true });
    } catch (err) {
      setErrorMessage(
        err?.message ||
          'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="login-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>

        <style>{`
          .login-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #475569;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
              "Segoe UI", sans-serif;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #dbeafe;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: loginLoadingSpin 0.7s linear infinite;
            margin-bottom: 12px;
          }

          @keyframes loginLoadingSpin {
            to {
              transform: rotate(360deg);
            }
          }

          .login-loading p {
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="brand-header">
          <div className="brand-logo-badge" aria-hidden="true">
            R
          </div>

          <h1 className="brand-title">
            Roxiler Systems
          </h1>

          <p className="brand-subtitle">
            Store Rating Platform
          </p>

          <p className="brand-description">
            Sign in to manage stores, ratings and your account.
          </p>
        </header>

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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>

            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
              className="input-control"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              disabled={isSubmitting}
              required
            />
          </div>

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
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
                disabled={isSubmitting}
                required
              />

              <button
                type="button"
                className="toggle-password-btn"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner"
                  aria-hidden="true"
                ></span>

                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <footer className="login-footer">
          <span>Don't have an account?</span>

          <Link
            to="/register"
            className="register-link"
          >
            Create an account
          </Link>
        </footer>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              circle at top left,
              rgba(37, 99, 235, 0.10),
              transparent 35%
            ),
            #f8fafc;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px 32px;
          box-shadow:
            0 20px 25px -5px rgba(15, 23, 42, 0.10),
            0 8px 10px -6px rgba(15, 23, 42, 0.08);
        }

        .brand-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-logo-badge {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border-radius: 12px;
          background: #2563eb;
          color: #ffffff;
          font-size: 21px;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.22);
        }

        .brand-title {
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .brand-subtitle {
          margin: 0;
          color: #334155;
          font-size: 15px;
          font-weight: 600;
        }

        .brand-description {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .alert-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 20px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 14px;
          line-height: 1.45;
        }

        .alert-error svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }

        .input-control {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-size: 15px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .input-control::placeholder {
          color: #94a3b8;
        }

        .input-control:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .input-control:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .password-container {
          position: relative;
        }

        .password-container .input-control {
          padding-right: 72px;
        }

        .toggle-password-btn {
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          padding: 6px 8px;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: #2563eb;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .toggle-password-btn:hover {
          background: #eff6ff;
        }

        .toggle-password-btn:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .btn-submit {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 6px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition:
            background-color 0.15s ease,
            transform 0.1s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(1px);
        }

        .btn-submit:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: loginSpin 0.65s linear infinite;
        }

        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .register-link {
          margin-left: 5px;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .register-link:hover {
          text-decoration: underline;
        }

        .register-link:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
          border-radius: 3px;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 16px;
          }

          .login-card {
            padding: 32px 22px;
            border-radius: 14px;
          }

          .brand-title {
            font-size: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner,
          .loading-spinner {
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

export default Login;