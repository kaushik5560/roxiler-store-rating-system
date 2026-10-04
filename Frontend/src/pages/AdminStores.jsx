import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';
import { getAdminStores, createAdminStore, getAdminUsers } from '../services/api';
import Navbar from '../components/Navbar';

const initialFilters = {
  name: '',
  email: '',
  address: '',
};

const initialFormData = {
  name: '',
  email: '',
  address: '',
  ownerId: '',
};

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [storesError, setStoresError] = useState('');

  const [filters, setFilters] = useState(initialFilters);

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'name',
    order: 'ASC',
  });

  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [ownersError, setOwnersError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(initialFormData);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    setStoresError('');

    try {
      const params = {
        name: filters.name.trim() || undefined,
        email: filters.email.trim() || undefined,
        address: filters.address.trim() || undefined,
        sortBy: sortConfig.sortBy,
        order: sortConfig.order,
      };

      const response = await getAdminStores(params);

      const storeList = Array.isArray(response?.stores)
        ? response.stores
        : Array.isArray(response)
          ? response
          : [];

      setStores(storeList);
    } catch (error) {
      setStores([]);
      setStoresError(
        error?.message ||
          'Unable to load stores. Please try again.'
      );
    } finally {
      setLoadingStores(false);
    }
  }, [filters, sortConfig]);

  const fetchOwners = useCallback(async () => {
    setLoadingOwners(true);
    setOwnersError('');

    try {
      const response = await getAdminUsers({
        role: 'owner',
      });

      const userList = Array.isArray(response?.users)
        ? response.users
        : Array.isArray(response)
          ? response
          : [];

      const ownerList = userList.filter(
        (user) => user?.role === 'owner'
      );

      setOwners(ownerList);
    } catch (error) {
      setOwners([]);
      setOwnersError(
        error?.message ||
          'Unable to load store owners.'
      );
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage('');
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const handleSort = (field) => {
    setSortConfig((current) => {
      if (current.sortBy === field) {
        return {
          sortBy: field,
          order:
            current.order === 'ASC'
              ? 'DESC'
              : 'ASC',
        };
      }

      return {
        sortBy: field,
        order: 'ASC',
      };
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);

    setSortConfig({
      sortBy: 'name',
      order: 'ASC',
    });
  };

  const handleOpenCreateModal = () => {
    setCreateFormData(initialFormData);
    setCreateError('');
    setOwnersError('');
    setIsCreateModalOpen(true);

    if (owners.length === 0) {
      fetchOwners();
    }
  };

  const handleCloseCreateModal = () => {
    if (createLoading) return;

    setIsCreateModalOpen(false);
    setCreateFormData(initialFormData);
    setCreateError('');
  };

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;

    setCreateFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (createError) {
      setCreateError('');
    }
  };

  const validateCreateForm = () => {
    const name = createFormData.name.trim();
    const email = createFormData.email.trim();
    const address = createFormData.address.trim();
    const ownerId = Number(createFormData.ownerId);

    if (name.length < 20 || name.length > 60) {
      return 'Store Name must be between 20 and 60 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return 'Please enter a valid store email address.';
    }

    if (address.length > 400) {
      return 'Address cannot exceed 400 characters.';
    }

    if (
      !createFormData.ownerId ||
      !Number.isInteger(ownerId) ||
      ownerId <= 0
    ) {
      return 'Please select a valid store owner.';
    }

    const selectedOwner = owners.find(
      (owner) => Number(owner.id) === ownerId
    );

    if (!selectedOwner) {
      return 'Please select a valid store owner from the list.';
    }

    return '';
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    setCreateError('');
    setSuccessMessage('');

    const validationError = validateCreateForm();

    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreateLoading(true);

    try {
      await createAdminStore({
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        address:
          createFormData.address.trim() || undefined,
        ownerId: Number(createFormData.ownerId),
      });

      setIsCreateModalOpen(false);
      setCreateFormData(initialFormData);
      setCreateError('');

      setSuccessMessage(
        'Store created and assigned successfully.'
      );

      await fetchStores();
    } catch (error) {
      setCreateError(
        error?.message ||
          'Unable to create store. Please try again.'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const formatRating = (rating) => {
    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating <= 0
    ) {
      return 'No ratings yet';
    }

    return `${numericRating.toFixed(2)} / 5`;
  };

  const hasActiveFilters =
    Boolean(filters.name.trim()) ||
    Boolean(filters.email.trim()) ||
    Boolean(filters.address.trim());

  const renderSortIndicator = (field) => {
    if (sortConfig.sortBy !== field) {
      return null;
    }

    return (
      <span
        className="sort-indicator"
        aria-label={
          sortConfig.order === 'ASC'
            ? 'Ascending'
            : 'Descending'
        }
      >
        {sortConfig.order === 'ASC' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="admin-stores-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-stores-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;
        }

        .admin-stores-main {
          width: min(1200px, calc(100% - 32px));
          margin: 0 auto;
          padding: 34px 0 48px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .page-title {
          margin: 0;
          color: #0f172a;
          font-size: 27px;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .page-description {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .primary-button {
          min-height: 42px;
          padding: 0 17px;
          border: 0;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition:
            background 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease;
          white-space: nowrap;
        }

        .primary-button:hover:not(:disabled) {
          background: #1d4ed8;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18);
        }

        .primary-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .primary-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .message {
          padding: 12px 15px;
          margin-bottom: 18px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
        }

        .success-message {
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
          color: #065f46;
        }

        .error-message {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #991b1b;
        }

        .filter-card {
          padding: 20px;
          margin-bottom: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        .filter-heading {
          margin: 0 0 15px;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .filter-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr))
            auto;
          gap: 13px;
          align-items: end;
        }

        .field {
          min-width: 0;
        }

        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #475569;
          font-size: 12px;
          font-weight: 650;
        }

        .field-input,
        .field-textarea,
        .field-select {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .field-input,
        .field-select {
          height: 40px;
          padding: 0 11px;
        }

        .field-textarea {
          min-height: 90px;
          padding: 10px 11px;
          resize: vertical;
        }

        .field-input::placeholder,
        .field-textarea::placeholder {
          color: #94a3b8;
        }

        .field-input:focus,
        .field-textarea:focus,
        .field-select:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .clear-button {
          height: 40px;
          padding: 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }

        .clear-button:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .clear-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .table-card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }

        .table-header {
          min-height: 60px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-title {
          margin: 0;
          color: #1e293b;
          font-size: 14px;
          font-weight: 700;
        }

        .store-count {
          color: #64748b;
          font-size: 12px;
        }

        .table-scroll {
          overflow-x: auto;
        }

        .stores-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }

        .stores-table th {
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .sortable-header {
          cursor: pointer;
          user-select: none;
        }

        .sortable-header:hover {
          background: #f1f5f9;
        }

        .header-content {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .sort-indicator {
          color: #2563eb;
          font-size: 10px;
        }

        .stores-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 13px;
          vertical-align: middle;
        }

        .stores-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .stores-table tbody tr:hover td {
          background: #fafcff;
        }

        .store-name {
          color: #0f172a;
          font-weight: 700;
        }

        .store-email {
          color: #475569;
        }

        .store-address {
          max-width: 300px;
          color: #64748b;
          line-height: 1.4;
        }

        .rating-value {
          color: #0f172a;
          font-weight: 700;
          white-space: nowrap;
        }

        .rating-empty {
          color: #94a3b8;
          font-style: italic;
          font-weight: 500;
          white-space: nowrap;
        }

        .table-state {
          padding: 48px 20px;
          color: #64748b;
          text-align: center;
          font-size: 13px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(3px);
        }

        .modal-card {
          width: min(520px, 100%);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
          border-radius: 13px;
          box-shadow: 0 25px 50px rgba(15, 23, 42, 0.25);
        }

        .modal-header {
          min-height: 64px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 750;
        }

        .close-button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }

        .close-button:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
        }

        .modal-field {
          margin-bottom: 16px;
        }

        .owner-info {
          margin-top: 6px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
        }

        .owner-warning {
          margin-top: 7px;
          padding: 10px 11px;
          border: 1px solid #fde68a;
          border-radius: 7px;
          background: #fffbeb;
          color: #92400e;
          font-size: 12px;
          line-height: 1.45;
        }

        .modal-footer {
          min-height: 68px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .secondary-button {
          min-height: 40px;
          padding: 0 15px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          background: #ffffff;
          color: #475569;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        }

        .secondary-button:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .filter-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .clear-button {
            width: 100%;
          }
        }

        @media (max-width: 700px) {
          .admin-stores-main {
            width: min(100% - 20px, 1200px);
            padding-top: 24px;
          }

          .page-header {
            align-items: stretch;
            flex-direction: column;
          }

          .primary-button {
            width: 100%;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .table-header {
            padding: 0 15px;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal-card {
            max-height: 95vh;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 23px;
          }

          .filter-card {
            padding: 15px;
          }

          .modal-body {
            padding: 16px;
          }

          .modal-footer {
            padding: 11px 16px;
          }

          .modal-footer .primary-button,
          .modal-footer .secondary-button {
            flex: 1;
          }
        }
      `}</style>

      <Navbar />

      <main className="admin-stores-main">
        <section className="page-header">
          <div>
            <h2 className="page-title">
              Store Management
            </h2>

            <p className="page-description">
              View, search, sort, and register stores
              across the platform.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={handleOpenCreateModal}
          >
            <span aria-hidden="true">+</span>
            Add New Store
          </button>
        </section>

        {successMessage && (
          <div
            className="message success-message"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        {storesError && (
          <div
            className="message error-message"
            role="alert"
          >
            {storesError}
          </div>
        )}

        <section
          className="filter-card"
          aria-label="Store filters"
        >
          <h3 className="filter-heading">
            Search & Filters
          </h3>

          <div className="filter-grid">
            <div className="field">
              <label
                className="field-label"
                htmlFor="store-filter-name"
              >
                Store Name
              </label>

              <input
                id="store-filter-name"
                name="name"
                type="search"
                className="field-input"
                placeholder="Search store name..."
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>

            <div className="field">
              <label
                className="field-label"
                htmlFor="store-filter-email"
              >
                Email
              </label>

              <input
                id="store-filter-email"
                name="email"
                type="search"
                className="field-input"
                placeholder="Search email..."
                value={filters.email}
                onChange={handleFilterChange}
              />
            </div>

            <div className="field">
              <label
                className="field-label"
                htmlFor="store-filter-address"
              >
                Address
              </label>

              <input
                id="store-filter-address"
                name="address"
                type="search"
                className="field-input"
                placeholder="Search address..."
                value={filters.address}
                onChange={handleFilterChange}
              />
            </div>

            <button
              type="button"
              className="clear-button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section
          className="table-card"
          aria-label="Stores directory"
        >
          <div className="table-header">
            <h3 className="table-title">
              Registered Stores
            </h3>

            <span className="store-count">
              {loadingStores
                ? 'Loading...'
                : `${stores.length} ${
                    stores.length === 1
                      ? 'store'
                      : 'stores'
                  }`}
            </span>
          </div>

          <div className="table-scroll">
            <table className="stores-table">
              <thead>
                <tr>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                    scope="col"
                  >
                    <span className="header-content">
                      Store Name
                      {renderSortIndicator('name')}
                    </span>
                  </th>

                  <th
                    className="sortable-header"
                    onClick={() => handleSort('email')}
                    scope="col"
                  >
                    <span className="header-content">
                      Email
                      {renderSortIndicator('email')}
                    </span>
                  </th>

                  <th
                    className="sortable-header"
                    onClick={() => handleSort('address')}
                    scope="col"
                  >
                    <span className="header-content">
                      Address
                      {renderSortIndicator('address')}
                    </span>
                  </th>

                  <th
                    className="sortable-header"
                    onClick={() => handleSort('rating')}
                    scope="col"
                  >
                    <span className="header-content">
                      Overall Rating
                      {renderSortIndicator('rating')}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingStores ? (
                  <tr>
                    <td colSpan="4">
                      <div className="table-state">
                        Loading stores...
                      </div>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <div className="table-state">
                        {hasActiveFilters
                          ? 'No stores found matching the selected filters.'
                          : 'No stores have been registered yet.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => {
                    const numericRating =
                      Number(store.overallRating);

                    const hasRating =
                      Number.isFinite(numericRating) &&
                      numericRating > 0;

                    return (
                      <tr key={store.id}>
                        <td>
                          <div className="store-name">
                            {store.name}
                          </div>
                        </td>

                        <td>
                          <div className="store-email">
                            {store.email}
                          </div>
                        </td>

                        <td>
                          <div className="store-address">
                            {store.address || '—'}
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              hasRating
                                ? 'rating-value'
                                : 'rating-empty'
                            }
                          >
                            {formatRating(
                              store.overallRating
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isCreateModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-store-title"
        >
          <div className="modal-card">
            <header className="modal-header">
              <h3
                id="create-store-title"
                className="modal-title"
              >
                Add New Store
              </h3>

              <button
                type="button"
                className="close-button"
                onClick={handleCloseCreateModal}
                disabled={createLoading}
                aria-label="Close dialog"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div
                    className="message error-message"
                    role="alert"
                  >
                    {createError}
                  </div>
                )}

                {ownersError && (
                  <div
                    className="message error-message"
                    role="alert"
                  >
                    {ownersError}
                  </div>
                )}

                <div className="modal-field">
                  <label
                    className="field-label"
                    htmlFor="create-store-name"
                  >
                    Store Name
                  </label>

                  <input
                    id="create-store-name"
                    name="name"
                    type="text"
                    className="field-input"
                    placeholder="Enter store name"
                    value={createFormData.name}
                    onChange={handleCreateInputChange}
                    minLength={20}
                    maxLength={60}
                    autoComplete="organization"
                    required
                  />

                  <div className="owner-info">
                    Required: 20–60 characters
                  </div>
                </div>

                <div className="modal-field">
                  <label
                    className="field-label"
                    htmlFor="create-store-email"
                  >
                    Store Email
                  </label>

                  <input
                    id="create-store-email"
                    name="email"
                    type="email"
                    className="field-input"
                    placeholder="store@example.com"
                    value={createFormData.email}
                    onChange={handleCreateInputChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="modal-field">
                  <label
                    className="field-label"
                    htmlFor="create-store-address"
                  >
                    Address
                  </label>

                  <textarea
                    id="create-store-address"
                    name="address"
                    className="field-textarea"
                    placeholder="Enter store address"
                    value={createFormData.address}
                    onChange={handleCreateInputChange}
                    maxLength={400}
                  />

                  <div className="owner-info">
                    Optional · Maximum 400 characters
                  </div>
                </div>

                <div className="modal-field">
                  <label
                    className="field-label"
                    htmlFor="create-store-owner"
                  >
                    Store Owner
                  </label>

                  {loadingOwners ? (
                    <div className="owner-info">
                      Loading available store owners...
                    </div>
                  ) : owners.length === 0 ? (
                    <div
                      className="owner-warning"
                      role="alert"
                    >
                      No Store Owner account is available.
                      Create a user with the{' '}
                      <strong>owner</strong> role first.
                    </div>
                  ) : (
                    <>
                      <select
                        id="create-store-owner"
                        name="ownerId"
                        className="field-select"
                        value={createFormData.ownerId}
                        onChange={handleCreateInputChange}
                        required
                      >
                        <option value="">
                          Select Store Owner
                        </option>

                        {owners.map((owner) => (
                          <option
                            key={owner.id}
                            value={owner.id}
                          >
                            {owner.name} — {owner.email}
                          </option>
                        ))}
                      </select>

                      <div className="owner-info">
                        Only users with the{' '}
                        <strong>owner</strong> role are shown.
                      </div>
                    </>
                  )}
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCloseCreateModal}
                  disabled={createLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    createLoading ||
                    loadingOwners ||
                    owners.length === 0
                  }
                >
                  {createLoading
                    ? 'Creating Store...'
                    : 'Create Store'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStores;