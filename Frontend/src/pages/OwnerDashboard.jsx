import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_BASE_URL = 'http://localhost:5000';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return '—';

    try {
      const parsedDate = new Date(dateString);

      if (Number.isNaN(parsedDate.getTime())) {
        return '—';
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsedDate);
    } catch {
      return '—';
    }
  };

  const renderStarVisual = (numericRating) => {
    const rating = Math.max(
      0,
      Math.min(5, Math.round(Number(numericRating) || 0))
    );

    return (
      '★'.repeat(rating) +
      '☆'.repeat(5 - rating)
    );
  };

  const fetchDashboardData = useCallback(
    async (abortSignal) => {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      if (!token) {
        setError(
          'Authentication token not found. Please log in again.'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/owner/dashboard`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortSignal,
          }
        );

        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        if (response.status === 403) {
          setError(
            'You do not have permission to access the Store Owner Portal.'
          );
          return;
        }

        const contentType =
          response.headers.get('content-type');

        let data = null;

        if (
          contentType &&
          contentType
            .toLowerCase()
            .includes('application/json')
        ) {
          data = await response.json();
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to fetch dashboard data. HTTP ${response.status}.`
          );
        }

        const storeList = Array.isArray(data?.stores)
          ? data.stores
          : Array.isArray(data)
            ? data
            : [];

        setStores(storeList);
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }

        setError(
          err?.message ||
            'Unable to connect to the server. Please try again.'
        );
      } finally {
        if (!abortSignal?.aborted) {
          setLoading(false);
        }
      }
    },
    [logout, navigate]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchDashboardData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  /*
   * Backend ratingsCount is authoritative.
   */
  const totalStores = stores.length;

  const totalRatings = stores.reduce(
    (sum, store) =>
      sum + (Number(store.ratingsCount) || 0),
    0
  );

  /*
   * Weighted average across all owned stores.
   */
  const weightedRatingSum = stores.reduce(
    (sum, store) => {
      const averageRating =
        Number(store.averageRating) || 0;

      const ratingsCount =
        Number(store.ratingsCount) || 0;

      return (
        sum +
        averageRating * ratingsCount
      );
    },
    0
  );

  const overallAverage =
    totalRatings > 0
      ? weightedRatingSum / totalRatings
      : 0;

  const overallAverageFormatted =
    totalRatings > 0
      ? overallAverage.toFixed(2)
      : null;

  return (
    <div className="owner-dashboard-root">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .owner-dashboard-root {
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

        .dashboard-container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 40px 0 60px;
        }

        .page-intro-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .intro-text h2 {
          margin: 0;
          color: #0f172a;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 780;
          letter-spacing: -0.5px;
        }

        .intro-text p {
          max-width: 700px;
          margin: 9px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .btn-refresh,
        .btn-retry {
          border: 0;
          cursor: pointer;
          font-family: inherit;
          transition:
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .btn-refresh {
          flex-shrink: 0;
          padding: 11px 17px;
          border-radius: 9px;
          background: #2563eb;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow:
            0 5px 15px rgba(37, 99, 235, 0.2);
        }

        .btn-refresh:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .error-banner {
          margin-bottom: 24px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid #fecaca;
          border-radius: 10px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.5;
        }

        .btn-retry {
          flex-shrink: 0;
          padding: 8px 13px;
          border-radius: 7px;
          background: #991b1b;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .btn-retry:hover {
          background: #7f1d1d;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 38px;
        }

        .metric-card {
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 4px 15px rgba(15, 23, 42, 0.04);
        }

        .metric-title {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          min-height: 43px;
          margin: 12px 0 6px;
          color: #0f172a;
          font-size: 29px;
          font-weight: 800;
          line-height: 1.2;
        }

        .metric-sub {
          min-height: 20px;
          color: #64748b;
          font-size: 12px;
        }

        .stores-section-title {
          margin: 0 0 17px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 750;
        }

        .store-card {
          overflow: hidden;
          margin-bottom: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.045);
        }

        .store-header-panel {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          gap: 28px;
          border-bottom: 1px solid #e2e8f0;
        }

        .store-primary-info {
          min-width: 0;
        }

        .store-primary-info h3 {
          margin: 0 0 12px;
          color: #0f172a;
          font-size: 20px;
          font-weight: 750;
        }

        .store-detail-line {
          margin: 6px 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
        }

        .store-detail-line strong {
          color: #334155;
        }

        .store-rating-overview {
          min-width: 190px;
          padding: 15px 18px;
          align-self: flex-start;
          text-align: center;
          border: 1px solid #dbeafe;
          border-radius: 11px;
          background: #eff6ff;
        }

        .overview-rating-num {
          color: #1e3a8a;
          font-size: 21px;
          font-weight: 800;
        }

        .overview-stars {
          margin: 6px 0;
          color: #f59e0b;
          font-size: 17px;
          letter-spacing: 1px;
        }

        .overview-count {
          color: #64748b;
          font-size: 11px;
        }

        .raters-panel {
          padding: 22px 24px 24px;
        }

        .raters-panel h4 {
          margin: 0 0 16px;
          color: #334155;
          font-size: 14px;
          font-weight: 750;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .raters-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .raters-table th {
          padding: 11px 12px;
          text-align: left;
          background: #f8fafc;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.35px;
          white-space: nowrap;
        }

        .raters-table td {
          padding: 14px 12px;
          color: #475569;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          vertical-align: middle;
        }

        .raters-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .raters-table tbody tr:hover {
          background: #fafcff;
        }

        .score-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 7px;
          background: #fff7ed;
          color: #9a3412;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .score-pill span:first-child {
          color: #ea580c;
        }

        .empty-ratings-box,
        .state-card-empty {
          padding: 28px;
          text-align: center;
          border: 1px dashed #cbd5e1;
          border-radius: 11px;
          background: #f8fafc;
          color: #64748b;
        }

        .empty-ratings-box {
          font-size: 13px;
        }

        .state-card-empty {
          padding: 50px 24px;
          margin-bottom: 20px;
        }

        .state-card-empty h3 {
          margin: 0 0 8px;
          color: #334155;
          font-size: 17px;
        }

        .state-card-empty p {
          max-width: 560px;
          margin: 0 auto;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .btn-refresh:focus-visible,
        .btn-retry:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.25);
          outline-offset: 2px;
        }

        @media (max-width: 850px) {
          .dashboard-container {
            width: min(100% - 28px, 1180px);
            padding-top: 30px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .page-intro-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .btn-refresh {
            width: 100%;
          }

          .store-header-panel {
            flex-direction: column;
          }

          .store-rating-overview {
            width: 100%;
          }
        }

        @media (max-width: 620px) {
          .dashboard-container {
            width: calc(100% - 22px);
            padding-top: 24px;
          }

          .intro-text h2 {
            font-size: 24px;
          }

          .store-header-panel,
          .raters-panel {
            padding: 18px;
          }

          .error-banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .btn-retry {
            width: 100%;
          }
        }
      `}</style>

      {/* =========================
          COMMON NAVBAR
      ========================= */}

      <Navbar />

      {/* =========================
          MAIN DASHBOARD
      ========================= */}

      <main className="dashboard-container">

        <div className="page-intro-header">
          <div className="intro-text">
            <h2>
              Store Performance & Ratings
            </h2>

            <p>
              Review customer feedback, rating metrics,
              and store activity across your locations.
            </p>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh dashboard data"
          >
            {loading
              ? 'Refreshing...'
              : 'Refresh Data'}
          </button>
        </div>

        {/* Error */}

        {error && (
          <div
            className="error-banner"
            role="alert"
            aria-live="assertive"
          >
            <span>{error}</span>

            <button
              type="button"
              className="btn-retry"
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Metrics */}

        <section
          className="metrics-grid"
          aria-label="Key Performance Metrics"
        >
          <article className="metric-card">
            <div className="metric-title">
              Owned Stores
            </div>

            <p className="metric-value">
              {loading ? '—' : totalStores}
            </p>

            <div className="metric-sub">
              Locations under your account
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-title">
              Total Ratings Received
            </div>

            <p className="metric-value">
              {loading ? '—' : totalRatings}
            </p>

            <div className="metric-sub">
              Submitted customer evaluations
            </div>
          </article>

          <article className="metric-card">
            <div className="metric-title">
              Overall Average Rating
            </div>

            <p className="metric-value">
              {loading
                ? '—'
                : overallAverageFormatted
                  ? `${overallAverageFormatted} / 5`
                  : 'No ratings yet'}
            </p>

            <div className="metric-sub">
              {overallAverageFormatted
                ? renderStarVisual(
                    overallAverage
                  )
                : 'Awaiting feedback'}
            </div>
          </article>
        </section>

        {/* Stores */}

        <h3 className="stores-section-title">
          My Stores
        </h3>

        {loading ? (
          <div className="state-card-empty">
            <h3>
              Loading dashboard information...
            </h3>

            <p>
              Fetching your stores and customer reviews
              from the database.
            </p>
          </div>
        ) : stores.length === 0 ? (
          <div className="state-card-empty">
            <h3>
              No stores assigned to your account yet.
            </h3>

            <p>
              Once a platform administrator assigns a
              store to your account, it will appear here.
            </p>
          </div>
        ) : (
          <div>
            {stores.map((store) => {
              const ratersList = Array.isArray(
                store.raters
              )
                ? store.raters
                : [];

              const rawAverageRating =
                Number(store.averageRating) || 0;

              /*
               * Always use backend's authoritative
               * ratingsCount.
               */
              const ratingsCount =
                Number(store.ratingsCount) || 0;

              const hasRatings =
                ratingsCount > 0;

              return (
                <article
                  key={store.id}
                  className="store-card"
                >
                  {/* Store Header */}

                  <div className="store-header-panel">

                    <div className="store-primary-info">
                      <h3>
                        {store.name ||
                          'Unnamed Store'}
                      </h3>

                      <p className="store-detail-line">
                        <strong>Email:</strong>{' '}
                        {store.email || '—'}
                      </p>

                      <p className="store-detail-line">
                        <strong>Address:</strong>{' '}
                        {store.address ||
                          'Address not listed'}
                      </p>
                    </div>

                    {/* Rating Summary */}

                    <div
                      className="store-rating-overview"
                      aria-label={`Store rating summary for ${
                        store.name || 'store'
                      }`}
                    >
                      <div className="overview-rating-num">
                        {hasRatings
                          ? `${rawAverageRating.toFixed(
                              2
                            )} / 5`
                          : 'No ratings yet'}
                      </div>

                      <div
                        className="overview-stars"
                        aria-label={
                          hasRatings
                            ? `Average rating ${rawAverageRating.toFixed(
                                2
                              )} out of 5`
                            : 'No ratings'
                        }
                      >
                        {hasRatings
                          ? renderStarVisual(
                              rawAverageRating
                            )
                          : '☆☆☆☆☆'}
                      </div>

                      <div className="overview-count">
                        {ratingsCount} total rating
                        {ratingsCount === 1
                          ? ''
                          : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Customers */}

                  <div className="raters-panel">
                    <h4>
                      Customers & Feedback (
                      {ratingsCount})
                    </h4>

                    {ratingsCount === 0 ? (
                      <div className="empty-ratings-box">
                        No ratings have been submitted
                        for this store yet.
                      </div>
                    ) : ratersList.length === 0 ? (
                      <div className="empty-ratings-box">
                        Rating summary is available,
                        but customer details could not
                        be loaded.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="raters-table">
                          <thead>
                            <tr>
                              <th>
                                Customer Name
                              </th>

                              <th>
                                Email
                              </th>

                              <th>
                                Address
                              </th>

                              <th>
                                Rating
                              </th>

                              <th>
                                Submitted On
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {ratersList.map(
                              (
                                rater,
                                index
                              ) => {
                                const raterKey =
                                  rater.id ||
                                  rater.userId ||
                                  `${store.id}-${index}`;

                                const score =
                                  Number(
                                    rater.rating
                                  ) || 0;

                                return (
                                  <tr
                                    key={raterKey}
                                  >
                                    <td>
                                      <strong>
                                        {rater.name ||
                                          'Anonymous User'}
                                      </strong>
                                    </td>

                                    <td>
                                      {rater.email ||
                                        '—'}
                                    </td>

                                    <td>
                                      {rater.address ||
                                        '—'}
                                    </td>

                                    <td>
                                      <span
                                        className="score-pill"
                                        aria-label={`${score} out of 5 stars`}
                                      >
                                        <span>
                                          {score} ★
                                        </span>

                                        <span>
                                          (
                                          {score} out
                                          of 5)
                                        </span>
                                      </span>
                                    </td>

                                    <td>
                                      {formatDate(
                                        rater.ratedAt
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;