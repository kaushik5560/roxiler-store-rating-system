import React, { useCallback, useEffect, useState } from 'react';
import {
  getUserStores,
  submitOrUpdateRating,
} from '../services/api';
import Navbar from '../components/Navbar';

const UserDashboard = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ratingError, setRatingError] = useState('');

  const [filters, setFilters] = useState({
    name: '',
    address: '',
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'name',
    order: 'ASC',
  });

  const [selectedRatings, setSelectedRatings] = useState({});
  const [ratingSubmittingId, setRatingSubmittingId] =
    useState(null);

  /*
   * Fetch stores from backend.
   * Backend handles filtering and sorting.
   */
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        name: filters.name.trim() || undefined,
        address: filters.address.trim() || undefined,
        sortBy: sortConfig.sortBy,
        order: sortConfig.order,
      };

      const response = await getUserStores(params);

      const storeList = Array.isArray(response?.stores)
        ? response.stores
        : Array.isArray(response)
          ? response
          : [];

      setStores(storeList);

      /*
       * Keep selected ratings synchronized with backend data.
       */
      const initialRatings = {};

      storeList.forEach((store) => {
        if (
          store.userRating !== null &&
          store.userRating !== undefined &&
          Number(store.userRating) >= 1 &&
          Number(store.userRating) <= 5
        ) {
          initialRatings[store.id] = Number(
            store.userRating
          );
        }
      });

      setSelectedRatings(initialRatings);
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load stores. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig]);

  /*
   * Debounced store fetching.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchStores]);

  /*
   * Automatically hide success message.
   */
  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  /*
   * Handle search fields.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Clear search and sorting filters.
   */
  const handleClearFilters = () => {
    setFilters({
      name: '',
      address: '',
    });

    setSortConfig({
      sortBy: 'name',
      order: 'ASC',
    });
  };

  /*
   * Handle sorting.
   */
  const handleSortChange = (event) => {
    const { name, value } = event.target;

    setSortConfig((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Select a rating between 1 and 5.
   */
  const handleRatingSelect = (
    storeId,
    ratingValue
  ) => {
    setSelectedRatings((previous) => ({
      ...previous,
      [storeId]: ratingValue,
    }));

    setRatingError('');
  };

  /*
   * Submit or modify rating.
   */
  const handleRatingSubmit = async (store) => {
    const selectedRating = Number(
      selectedRatings[store.id]
    );

    if (
      !Number.isInteger(selectedRating) ||
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setRatingError(
        `Please select a rating between 1 and 5 for "${store.name}".`
      );
      return;
    }

    setRatingSubmittingId(store.id);
    setRatingError('');
    setSuccessMessage('');

    try {
      const alreadyRated =
        store.userRating !== null &&
        store.userRating !== undefined;

      await submitOrUpdateRating(
        store.id,
        selectedRating
      );

      setSuccessMessage(
        alreadyRated
          ? `Your rating for "${store.name}" has been updated successfully.`
          : `Your rating for "${store.name}" has been submitted successfully.`
      );

      /*
       * Refresh store data so overall and user ratings
       * are immediately updated.
       */
      await fetchStores();
    } catch (err) {
      setRatingError(
        err?.message ||
          'Unable to save your rating. Please try again.'
      );
    } finally {
      setRatingSubmittingId(null);
    }
  };

  const hasActiveFilters =
    Boolean(filters.name.trim()) ||
    Boolean(filters.address.trim());

  /*
   * Format overall rating safely.
   */
  const formatOverallRating = (rating) => {
    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating <= 0
    ) {
      return 'No ratings yet';
    }

    return `${numericRating.toFixed(2)} / 5`;
  };

  return (
    <div className="user-dashboard-root">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .user-dashboard-root {
          min-height: calc(100vh - 72px);
          background: #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;
        }

        /* =========================
           MAIN
        ========================== */

        .dashboard-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 24px 56px;
        }

        .page-intro-header {
          margin-bottom: 28px;
        }

        .page-intro-header h2 {
          margin: 0 0 7px;
          color: #0f172a;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 750;
        }

        .page-intro-header p {
          max-width: 760px;
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        /* =========================
           ALERTS
        ========================== */

        .banner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          padding: 13px 16px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }

        .banner-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .banner-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .banner-message {
          flex: 1;
        }

        .banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-retry,
        .btn-dismiss {
          border: 0;
          border-radius: 7px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-retry {
          background: #dc2626;
          color: #ffffff;
        }

        .btn-retry:hover {
          background: #b91c1c;
        }

        .btn-dismiss {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-dismiss:hover {
          background: #fecaca;
        }

        .btn-retry:focus-visible,
        .btn-dismiss:focus-visible,
        .control-input:focus-visible,
        .btn-clear-filters:focus-visible,
        .star-button:focus-visible,
        .btn-submit-rating:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.25);
          outline-offset: 2px;
        }

        /* =========================
           CONTROLS
        ========================== */

        .controls-card {
          margin-bottom: 28px;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .controls-header {
          margin-bottom: 16px;
        }

        .controls-header h3 {
          margin: 0 0 4px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
        }

        .controls-header p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
        }

        .controls-grid {
          display: grid;
          grid-template-columns:
            minmax(180px, 1.2fr)
            minmax(180px, 1.2fr)
            minmax(150px, 0.8fr)
            minmax(150px, 0.8fr)
            auto;
          gap: 12px;
          align-items: end;
        }

        .control-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .control-item label {
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .control-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .control-input::placeholder {
          color: #94a3b8;
        }

        .control-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          outline: none;
        }

        .btn-clear-filters {
          height: 40px;
          padding: 0 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .btn-clear-filters:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-clear-filters:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* =========================
           STORE GRID
        ========================== */

        .stores-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .store-card {
          min-width: 0;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .store-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }

        .store-card-header {
          min-height: 82px;
          margin-bottom: 18px;
        }

        .store-card-title {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 750;
          word-break: break-word;
        }

        .store-card-address {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
        }

        /* =========================
           RATING SUMMARY
        ========================== */

        .ratings-summary-box {
          margin-bottom: 18px;
          padding: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .rating-row {
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .rating-row + .rating-row {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid #e2e8f0;
        }

        .rating-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .rating-value {
          color: #0f172a;
          font-size: 13px;
          font-weight: 750;
          text-align: right;
        }

        .overall-rating {
          color: #b45309;
        }

        .user-rating-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 750;
        }

        .user-unrated-pill {
          color: #94a3b8;
          font-size: 12px;
          font-style: italic;
        }

        /* =========================
           RATING ACTION
        ========================== */

        .rating-action-section {
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
        }

        .rating-action-prompt {
          margin-bottom: 10px;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
        }

        .stars-selector {
          display: flex;
          gap: 7px;
          margin-bottom: 12px;
        }

        .star-button {
          width: 38px;
          height: 38px;
          padding: 0;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #cbd5e1;
          font-size: 17px;
          line-height: 1;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease,
            transform 0.15s ease;
        }

        .star-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #f59e0b;
          background: #fffbeb;
          color: #f59e0b;
        }

        .star-button.active {
          border-color: #f59e0b;
          background: #fffbeb;
          color: #f59e0b;
        }

        .star-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-submit-rating {
          width: 100%;
          min-height: 40px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .btn-submit-rating:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-submit-rating:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        /* =========================
           STATES
        ========================== */

        .state-box {
          width: 100%;
          padding: 54px 24px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .state-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 14px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: 800;
        }

        .state-box h3 {
          margin: 0 0 7px;
          color: #1e293b;
          font-size: 17px;
          font-weight: 750;
        }

        .state-box p {
          max-width: 520px;
          margin: 0 auto;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto 16px;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: user-dashboard-spin 0.8s linear infinite;
        }

        @keyframes user-dashboard-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================
           RESPONSIVE
        ========================== */

        @media (max-width: 1050px) {
          .stores-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .controls-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .btn-clear-filters {
            width: 100%;
          }
        }

        @media (max-width: 700px) {
          .dashboard-container {
            padding: 28px 16px 40px;
          }

          .page-intro-header h2 {
            font-size: 25px;
          }

          .controls-grid {
            grid-template-columns: 1fr;
          }

          .stores-grid {
            grid-template-columns: 1fr;
          }

          .banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .banner-actions {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .dashboard-container {
            padding-left: 12px;
            padding-right: 12px;
          }

          .controls-card,
          .store-card {
            padding: 16px;
          }

          .star-button {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>

      {/* =========================
          COMMON NAVBAR
      ========================== */}

      <Navbar />

      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main className="dashboard-container">

        <div className="page-intro-header">
          <h2>Store Ratings</h2>

          <p>
            Browse stores, view overall ratings, and submit or
            update your personal rating.
          </p>
        </div>

        {/* Success Message */}

        {successMessage && (
          <div
            className="banner banner-success"
            role="status"
            aria-live="polite"
          >
            <span className="banner-message">
              {successMessage}
            </span>
          </div>
        )}

        {/* Store Loading Error */}

        {error && (
          <div
            className="banner banner-error"
            role="alert"
          >
            <span className="banner-message">
              {error}
            </span>

            <div className="banner-actions">
              <button
                type="button"
                className="btn-retry"
                onClick={fetchStores}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Rating Error */}

        {ratingError && (
          <div
            className="banner banner-error"
            role="alert"
          >
            <span className="banner-message">
              {ratingError}
            </span>

            <div className="banner-actions">
              <button
                type="button"
                className="btn-dismiss"
                onClick={() => setRatingError('')}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* =========================
            SEARCH / SORT
        ========================== */}

        <section
          className="controls-card"
          aria-label="Store search and sorting controls"
        >
          <div className="controls-header">
            <h3>Find a Store</h3>

            <p>
              Search by store name or address and sort the results.
            </p>
          </div>

          <div className="controls-grid">

            <div className="control-item">
              <label htmlFor="filter-store-name">
                Store Name
              </label>

              <input
                id="filter-store-name"
                name="name"
                type="search"
                className="control-input"
                placeholder="Search by store name"
                value={filters.name}
                onChange={handleFilterChange}
                maxLength={60}
                autoComplete="off"
              />
            </div>

            <div className="control-item">
              <label htmlFor="filter-store-address">
                Address
              </label>

              <input
                id="filter-store-address"
                name="address"
                type="search"
                className="control-input"
                placeholder="Search by address"
                value={filters.address}
                onChange={handleFilterChange}
                maxLength={400}
                autoComplete="off"
              />
            </div>

            <div className="control-item">
              <label htmlFor="sort-field">
                Sort By
              </label>

              <select
                id="sort-field"
                name="sortBy"
                className="control-input"
                value={sortConfig.sortBy}
                onChange={handleSortChange}
              >
                <option value="name">
                  Store Name
                </option>

                <option value="address">
                  Address
                </option>

                <option value="rating">
                  Overall Rating
                </option>
              </select>
            </div>

            <div className="control-item">
              <label htmlFor="sort-order">
                Order
              </label>

              <select
                id="sort-order"
                name="order"
                className="control-input"
                value={sortConfig.order}
                onChange={handleSortChange}
              >
                <option value="ASC">
                  Ascending
                </option>

                <option value="DESC">
                  Descending
                </option>
              </select>
            </div>

            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleClearFilters}
              disabled={
                !hasActiveFilters &&
                sortConfig.sortBy === 'name' &&
                sortConfig.order === 'ASC'
              }
            >
              Clear Filters
            </button>

          </div>
        </section>

        {/* =========================
            STORE DIRECTORY
        ========================== */}

        {loading ? (
          <div className="state-box">
            <div
              className="loading-spinner"
              aria-hidden="true"
            />

            <h3>Loading stores...</h3>

            <p>
              Fetching the latest store and rating information.
            </p>
          </div>
        ) : stores.length === 0 ? (
          <div className="state-box">
            <div
              className="state-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h3>No Stores Found</h3>

            <p>
              {hasActiveFilters
                ? 'No stores match your current search criteria. Try changing your search filters.'
                : 'There are currently no registered stores available to rate.'}
            </p>
          </div>
        ) : (
          <div className="stores-grid">
            {stores.map((store) => {
              const currentUserRating =
                store.userRating !== null &&
                store.userRating !== undefined
                  ? Number(store.userRating)
                  : 0;

              const activeRating =
                selectedRatings[store.id] || 0;

              const isSubmitting =
                ratingSubmittingId === store.id;

              const hasExistingRating =
                currentUserRating >= 1 &&
                currentUserRating <= 5;

              return (
                <article
                  key={store.id}
                  className="store-card"
                >
                  {/* Store Information */}

                  <div className="store-card-header">
                    <h3 className="store-card-title">
                      {store.name}
                    </h3>

                    <p className="store-card-address">
                      {store.address ||
                        'Address not available'}
                    </p>
                  </div>

                  {/* Rating Summary */}

                  <div className="ratings-summary-box">

                    <div className="rating-row">
                      <span className="rating-label">
                        Overall Rating
                      </span>

                      <span className="rating-value overall-rating">
                        ★{' '}
                        {formatOverallRating(
                          store.overallRating
                        )}
                      </span>
                    </div>

                    <div className="rating-row">
                      <span className="rating-label">
                        Your Rating
                      </span>

                      {hasExistingRating ? (
                        <span className="user-rating-pill">
                          ★ {currentUserRating} / 5
                        </span>
                      ) : (
                        <span className="user-unrated-pill">
                          Not rated yet
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Rating Action */}

                  <div className="rating-action-section">

                    <div className="rating-action-prompt">
                      {hasExistingRating
                        ? 'Modify your rating'
                        : 'Rate this store'}
                    </div>

                    <div
                      className="stars-selector"
                      role="radiogroup"
                      aria-label={`Select rating for ${store.name}`}
                    >
                      {[1, 2, 3, 4, 5].map(
                        (starNumber) => {
                          const isActive =
                            activeRating >=
                            starNumber;

                          return (
                            <button
                              key={starNumber}
                              type="button"
                              className={`star-button ${
                                isActive
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() =>
                                handleRatingSelect(
                                  store.id,
                                  starNumber
                                )
                              }
                              disabled={isSubmitting}
                              role="radio"
                              aria-checked={
                                activeRating ===
                                starNumber
                              }
                              aria-label={`Give ${starNumber} out of 5 stars`}
                            >
                              ★
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-submit-rating"
                      onClick={() =>
                        handleRatingSubmit(store)
                      }
                      disabled={
                        isSubmitting ||
                        activeRating < 1 ||
                        activeRating > 5
                      }
                    >
                      {isSubmitting
                        ? 'Saving Rating...'
                        : hasExistingRating
                          ? 'Update Rating'
                          : 'Submit Rating'}
                    </button>

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

export default UserDashboard;