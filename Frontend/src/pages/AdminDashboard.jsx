import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAdminDashboard } from '../services/api';
import Navbar from '../components/Navbar';

const initialMetrics = {
  totalUsers: 0,
  totalStores: 0,
  totalRatings: 0,
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await getAdminDashboard();

      const data =
        response?.dashboard ??
        response?.stats ??
        response ??
        {};

      setMetrics({
        totalUsers: Number(data.totalUsers) || 0,
        totalStores: Number(data.totalStores) || 0,
        totalRatings: Number(data.totalRatings) || 0,
      });
    } catch (error) {
      setErrorMessage(
        error?.message ||
          'Unable to load dashboard data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-IN');
  };

  return (
    <div className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: calc(100vh - 72px);
          background: #f8fafc;
          color: #0f172a;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
        }

        .dashboard-content {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 38px 24px 50px;
        }

        .dashboard-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 28px;
        }

        .dashboard-heading h1 {
          margin: 0;
          color: #0f172a;
          font-size: 28px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .dashboard-heading p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 108px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .refresh-button:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }

        .refresh-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .refresh-icon {
          width: 16px;
          height: 16px;
        }

        .refresh-icon.spinning {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .error-banner {
          margin-bottom: 24px;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #991b1b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }

        .error-icon {
          flex-shrink: 0;
        }

        .retry-button {
          flex-shrink: 0;
          border: 0;
          border-radius: 6px;
          background: #dc2626;
          color: #ffffff;
          padding: 8px 13px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .metric-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          min-height: 185px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.04),
            0 4px 12px rgba(15, 23, 42, 0.03);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 5px 12px rgba(15, 23, 42, 0.07),
            0 12px 25px rgba(15, 23, 42, 0.05);
        }

        .metric-card::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 3px;
          background: #2563eb;
        }

        .metric-card.stores::after {
          background: #059669;
        }

        .metric-card.ratings::after {
          background: #d97706;
        }

        .metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .metric-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .metric-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.users {
          background: #eff6ff;
          color: #2563eb;
        }

        .metric-icon.stores {
          background: #ecfdf5;
          color: #059669;
        }

        .metric-icon.ratings {
          background: #fffbeb;
          color: #d97706;
        }

        .metric-number {
          margin: 24px 0 7px;
          color: #0f172a;
          font-size: 36px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .metric-description {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
        }

        .loading-value {
          width: 95px;
          height: 34px;
          margin-top: 25px;
          margin-bottom: 8px;
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            #e2e8f0 25%,
            #f1f5f9 50%,
            #e2e8f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .quick-action {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          text-align: left;
          cursor: pointer;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.04),
            0 4px 12px rgba(15, 23, 42, 0.03);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .quick-action:hover {
          transform: translateY(-2px);
          border-color: #bfdbfe;
          box-shadow:
            0 6px 15px rgba(15, 23, 42, 0.06),
            0 12px 24px rgba(15, 23, 42, 0.04);
        }

        .quick-action-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .quick-action-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-action-icon.users {
          background: #eff6ff;
          color: #2563eb;
        }

        .quick-action-icon.stores {
          background: #ecfdf5;
          color: #059669;
        }

        .quick-action-title {
          margin: 0;
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
        }

        .quick-action-description {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .quick-action-arrow {
          color: #94a3b8;
          flex-shrink: 0;
          font-size: 20px;
          transition:
            transform 0.2s ease,
            color 0.2s ease;
        }

        .quick-action:hover .quick-action-arrow {
          transform: translateX(3px);
          color: #2563eb;
        }

        .info-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.04),
            0 4px 12px rgba(15, 23, 42, 0.03);
        }

        .info-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 8px;
        }

        .info-panel h2 {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 700;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }

        .info-panel p {
          margin: 0;
          max-width: 800px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        @media (max-width: 850px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .dashboard-content {
            padding: 30px 18px 40px;
          }
        }

        @media (max-width: 620px) {
          .dashboard-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .refresh-button {
            align-self: flex-start;
          }

          .dashboard-heading h1 {
            font-size: 24px;
          }

          .error-banner {
            align-items: stretch;
            flex-direction: column;
          }

          .retry-button {
            align-self: flex-start;
          }

          .quick-action {
            padding: 17px;
          }

          .quick-action-description {
            font-size: 11px;
          }
        }
      `}</style>

      <Navbar />

      <main className="dashboard-content">

        <div className="dashboard-toolbar">
          <div className="dashboard-heading">
            <h1>
              Dashboard Overview
            </h1>

            <p>
              Monitor users, stores, and ratings across the platform.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <svg
              className={`refresh-icon ${
                isLoading ? 'spinning' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-15.3-6.4L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 15.3 6.4L21 16" />
              <path d="M21 21v-5h-5" />
            </svg>

            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {errorMessage && (
          <div
            className="error-banner"
            role="alert"
          >
            <div className="error-content">
              <svg
                className="error-icon"
                width="19"
                height="19"
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

              <span>
                {errorMessage}
              </span>
            </div>

            <button
              type="button"
              className="retry-button"
              onClick={loadDashboardData}
            >
              Retry
            </button>
          </div>
        )}

        <section
          className="metrics-grid"
          aria-label="System statistics"
        >
          <article className="metric-card">
            <div className="metric-top">
              <span className="metric-label">
                Total Users
              </span>

              <div className="metric-icon users">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-value" />
            ) : (
              <div className="metric-number">
                {formatNumber(metrics.totalUsers)}
              </div>
            )}

            <div className="metric-description">
              Registered users in the system
            </div>
          </article>

          <article className="metric-card stores">
            <div className="metric-top">
              <span className="metric-label">
                Total Stores
              </span>

              <div className="metric-icon stores">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M5 9v11h14V9" />
                  <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-value" />
            ) : (
              <div className="metric-number">
                {formatNumber(metrics.totalStores)}
              </div>
            )}

            <div className="metric-description">
              Stores registered on the platform
            </div>
          </article>

          <article className="metric-card ratings">
            <div className="metric-top">
              <span className="metric-label">
                Total Ratings
              </span>

              <div className="metric-icon ratings">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-value" />
            ) : (
              <div className="metric-number">
                {formatNumber(metrics.totalRatings)}
              </div>
            )}

            <div className="metric-description">
              Ratings submitted by users
            </div>
          </article>
        </section>

        <section
          className="quick-actions"
          aria-label="Administration shortcuts"
        >
          <button
            type="button"
            className="quick-action"
            onClick={() => navigate('/admin/users')}
          >
            <div className="quick-action-left">
              <div className="quick-action-icon users">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                  />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div>
                <h2 className="quick-action-title">
                  Manage Users
                </h2>

                <p className="quick-action-description">
                  View, filter, sort and create platform users.
                </p>
              </div>
            </div>

            <span
              className="quick-action-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>

          <button
            type="button"
            className="quick-action"
            onClick={() => navigate('/admin/stores')}
          >
            <div className="quick-action-left">
              <div className="quick-action-icon stores">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M5 9v11h14V9" />
                  <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              </div>

              <div>
                <h2 className="quick-action-title">
                  Manage Stores
                </h2>

                <p className="quick-action-description">
                  View stores and add new stores with owners.
                </p>
              </div>
            </div>

            <span
              className="quick-action-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        </section>

        <section className="info-panel">
          <div className="info-panel-header">
            <h2>
              System Status
            </h2>

            <span className="status-badge">
              <span className="status-dot" />
              Connected
            </span>
          </div>

          <p>
            The administrator dashboard is connected to the Roxiler
            Systems backend. Use the administration shortcuts above
            to manage users and stores.
          </p>
        </section>

      </main>
    </div>
  );
};

export default AdminDashboard;