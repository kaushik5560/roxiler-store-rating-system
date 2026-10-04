import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

import {
  createAdminUser,
  getAdminUsers,
  getAdminUserById,
} from '../services/api';

const INITIAL_FILTERS = {
  name: '',
  email: '',
  address: '',
  role: '',
};

const INITIAL_SORT = {
  sortBy: 'name',
  order: 'ASC',
};

const INITIAL_CREATE_FORM = {
  name: '',
  email: '',
  password: '',
  address: '',
  role: 'user',
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchControllerRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sortConfig, setSortConfig] = useState(INITIAL_SORT);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [createFormData, setCreateFormData] = useState(
    INITIAL_CREATE_FORM
  );

  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const showTemporarySuccess = useCallback((message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  }, []);

  const fetchUsers = useCallback(
    async (customFilters = filters, customSort = sortConfig) => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }

      const controller = new AbortController();
      fetchControllerRef.current = controller;

      setLoading(true);
      setTableError(null);

      try {
        const params = {
          name:
            customFilters.name.trim() || undefined,
          email:
            customFilters.email.trim() || undefined,
          address:
            customFilters.address.trim() || undefined,
          role: customFilters.role || undefined,
          sortBy: customSort.sortBy,
          order: customSort.order,
        };

        const response = await getAdminUsers(params);

        if (controller.signal.aborted) {
          return;
        }

        const userList = Array.isArray(response?.users)
          ? response.users
          : Array.isArray(response)
            ? response
            : [];

        setUsers(userList);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        setTableError(
          error?.message ||
            'Failed to load users. Please try again.'
        );
      } finally {
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [filters, sortConfig]
  );

  /*
   * Debounced server-side filtering and sorting.
   * This prevents an API request on every single keystroke.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchUsers]);

  /*
   * Abort any active request when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  const handleSort = (field) => {
    setSortConfig((previous) => {
      if (previous.sortBy === field) {
        return {
          sortBy: field,
          order:
            previous.order === 'ASC'
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

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSortConfig(INITIAL_SORT);
    setTableError(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleOpenCreateModal = () => {
    setCreateFormData(INITIAL_CREATE_FORM);
    setCreateError(null);
    setShowPassword(false);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (createLoading) {
      return;
    }

    setIsCreateModalOpen(false);
    setCreateFormData(INITIAL_CREATE_FORM);
    setCreateError(null);
    setShowPassword(false);
  };

  const handleCreateInputChange = (event) => {
    const { name, value } = event.target;

    setCreateFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (createError) {
      setCreateError(null);
    }
  };

  const validateCreateForm = () => {
    const {
      name,
      email,
      password,
      address,
      role,
    } = createFormData;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAddress = address.trim();

    if (
      trimmedName.length < 20 ||
      trimmedName.length > 60
    ) {
      return 'Name must be between 20 and 60 characters.';
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (
      password.length < 8 ||
      password.length > 16
    ) {
      return 'Password must be 8–16 characters long.';
    }

    if (!/[A-Z]/.test(password)) {
      return (
        'Password must contain at least one uppercase letter.'
      );
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
      return (
        'Password must contain at least one special character.'
      );
    }

    if (trimmedAddress.length > 400) {
      return 'Address cannot exceed 400 characters.';
    }

    if (!['user', 'admin', 'owner'].includes(role)) {
      return 'Please select a valid role.';
    }

    return null;
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    setCreateError(null);

    const validationError = validateCreateForm();

    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreateLoading(true);

    try {
      await createAdminUser({
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        password: createFormData.password,
        address:
          createFormData.address.trim() || undefined,
        role: createFormData.role,
      });

      handleCloseCreateModal();

      showTemporarySuccess(
        'User account created successfully.'
      );

      /*
       * Immediately refresh the users table so the
       * newly-created user appears in the directory.
       */
      await fetchUsers();
    } catch (error) {
      setCreateError(
        error?.message ||
          'Failed to create user. Please try again.'
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    setIsDetailModalOpen(true);
    setSelectedUser(null);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await getAdminUserById(id);

      const userData =
        response?.user || response;

      if (!userData || typeof userData !== 'object') {
        throw new Error(
          'Invalid user details received from server.'
        );
      }

      setSelectedUser(userData);
    } catch (error) {
      setDetailError(
        error?.message ||
          'Failed to load user details.'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    if (detailLoading) {
      return;
    }

    setIsDetailModalOpen(false);
    setSelectedUser(null);
    setDetailError(null);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';

      case 'owner':
        return 'Store Owner';

      case 'user':
        return 'Normal User';

      default:
        return role || 'Unknown';
    }
  };

  const getRoleClass = (role) => {
    if (
      ['admin', 'owner', 'user'].includes(role)
    ) {
      return `role-${role}`;
    }

    return 'role-user';
  };

  const renderSortIndicator = (field) => {
    if (sortConfig.sortBy !== field) {
      return null;
    }

    return (
      <span
        className="sort-indicator"
        aria-hidden="true"
      >
        {sortConfig.order === 'ASC' ? '▲' : '▼'}
      </span>
    );
  };

  const renderOwnerStores = () => {
    if (!selectedUser) {
      return null;
    }

    const stores = Array.isArray(
      selectedUser.stores
    )
      ? selectedUser.stores
      : selectedUser.store
        ? [selectedUser.store]
        : [];

    if (stores.length === 0) {
      return (
        <div className="store-empty-message">
          No active store profile is currently linked
          to this owner account.
        </div>
      );
    }

    return stores.map((store, index) => {
      const averageRating = Number(
        store.overallRating
      );

      const hasRating =
        Number.isFinite(averageRating) &&
        averageRating > 0;

      return (
        <div
          key={store.id || `store-${index}`}
          className="owner-store-item"
        >
          <div className="owner-store-row">
            <strong>Store Name:</strong>
            <span>{store.name || '—'}</span>
          </div>

          <div className="owner-store-row">
            <strong>Store Email:</strong>
            <span>{store.email || '—'}</span>
          </div>

          <div className="owner-store-row">
            <strong>Address:</strong>
            <span>{store.address || '—'}</span>
          </div>

          <div className="owner-store-row">
            <strong>Average Rating:</strong>
            <span>
              {hasRating
                ? `${averageRating.toFixed(2)} / 5`
                : 'No ratings yet'}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="admin-users-root">
      <style>
        {`
          .admin-users-root {
            min-height: 100vh;
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

          .admin-navbar {
            position: sticky;
            top: 0;
            z-index: 100;
            min-height: 72px;
            padding: 0 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            background: #0f172a;
            color: #ffffff;
            box-shadow:
              0 2px 8px rgba(15, 23, 42, 0.15);
          }

          .navbar-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .brand-badge {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: #2563eb;
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
          }

          .brand-titles h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 750;
          }

          .brand-titles span {
            display: block;
            margin-top: 3px;
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .navbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .btn-nav-action,
          .btn-nav-logout {
            padding: 9px 14px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 650;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease,
              transform 0.2s ease;
          }

          .btn-nav-action {
            background: #1e293b;
            color: #f1f5f9;
            border: 1px solid #334155;
          }

          .btn-nav-action:hover {
            background: #334155;
            transform: translateY(-1px);
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

          .main-container {
            width: min(1200px, calc(100% - 40px));
            margin: 0 auto;
            padding: 40px 0 60px;
          }

          .page-header-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
          }

          .page-header-text h2 {
            margin: 0;
            color: #0f172a;
            font-size: 28px;
            line-height: 1.2;
            font-weight: 780;
            letter-spacing: -0.4px;
          }

          .page-header-text p {
            margin: 8px 0 0;
            color: #64748b;
            font-size: 14px;
            line-height: 1.55;
          }

          .btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 40px;
            padding: 9px 16px;
            border: 0;
            border-radius: 8px;
            background: #2563eb;
            color: #ffffff;
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition:
              background 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .btn-primary:hover:not(:disabled) {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow:
              0 5px 14px rgba(37, 99, 235, 0.2);
          }

          .btn-primary:disabled {
            cursor: not-allowed;
            opacity: 0.65;
          }

          .banner-success,
          .banner-error {
            margin-bottom: 20px;
            padding: 13px 16px;
            border-radius: 9px;
            font-size: 13px;
            line-height: 1.5;
          }

          .banner-success {
            border: 1px solid #a7f3d0;
            background: #ecfdf5;
            color: #065f46;
          }

          .banner-error {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
          }

          .filters-card {
            margin-bottom: 22px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: #ffffff;
            box-shadow:
              0 3px 12px rgba(15, 23, 42, 0.04);
          }

          .filters-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr))
              auto;
            gap: 14px;
            align-items: end;
          }

          .filter-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .filter-item label {
            color: #475569;
            font-size: 12px;
            font-weight: 700;
          }

          .filter-input {
            width: 100%;
            min-height: 40px;
            padding: 9px 11px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            outline: none;
            background: #ffffff;
            color: #0f172a;
            font-family: inherit;
            font-size: 13px;
          }

          .filter-input:focus {
            border-color: #2563eb;
            box-shadow:
              0 0 0 3px rgba(37, 99, 235, 0.12);
          }

          .btn-clear-filters {
            min-height: 40px;
            padding: 9px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            background: #f8fafc;
            color: #475569;
            font-family: inherit;
            font-size: 13px;
            font-weight: 650;
            cursor: pointer;
            white-space: nowrap;
          }

          .btn-clear-filters:hover {
            background: #e2e8f0;
          }

          .table-card {
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: #ffffff;
            box-shadow:
              0 3px 12px rgba(15, 23, 42, 0.04);
          }

          .table-wrapper {
            width: 100%;
            overflow-x: auto;
          }

          .data-table {
            width: 100%;
            min-width: 850px;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
          }

          .data-table th {
            padding: 13px 15px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            font-weight: 750;
            text-transform: uppercase;
            letter-spacing: 0.35px;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
          }

          .data-table th:last-child {
            cursor: default;
          }

          .data-table th:hover:not(:last-child) {
            background: #f1f5f9;
          }

          .data-table td {
            padding: 14px 15px;
            border-bottom: 1px solid #f1f5f9;
            color: #475569;
            vertical-align: middle;
          }

          .data-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .data-table tbody tr:hover td {
            background: #fafcff;
          }

          .data-table td strong {
            color: #0f172a;
            font-weight: 700;
          }

          .sort-indicator {
            margin-left: 6px;
            color: #2563eb;
            font-size: 9px;
          }

          .role-badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 750;
            text-transform: uppercase;
            letter-spacing: 0.35px;
            white-space: nowrap;
          }

          .role-admin {
            background: #ede9fe;
            color: #6d28d9;
          }

          .role-owner {
            background: #fef3c7;
            color: #b45309;
          }

          .role-user {
            background: #e0f2fe;
            color: #0369a1;
          }

          .btn-action-view {
            padding: 7px 11px;
            border: 1px solid #93c5fd;
            border-radius: 7px;
            background: #ffffff;
            color: #2563eb;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease;
          }

          .btn-action-view:hover {
            background: #2563eb;
            color: #ffffff;
          }

          .table-state-box {
            padding: 48px 20px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(2px);
          }

          .modal-card {
            width: 100%;
            max-width: 540px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 13px;
            background: #ffffff;
            box-shadow:
              0 24px 60px rgba(15, 23, 42, 0.25);
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 18px 22px;
            border-bottom: 1px solid #e2e8f0;
          }

          .modal-header h3 {
            margin: 0;
            color: #0f172a;
            font-size: 18px;
            font-weight: 750;
          }

          .btn-close-modal {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #64748b;
            font-size: 20px;
            cursor: pointer;
          }

          .btn-close-modal:hover {
            background: #f1f5f9;
            color: #0f172a;
          }

          .modal-body {
            overflow-y: auto;
            padding: 22px;
          }

          .modal-form-group {
            margin-bottom: 18px;
          }

          .modal-form-group:last-child {
            margin-bottom: 0;
          }

          .modal-form-group label {
            display: block;
            margin-bottom: 6px;
            color: #334155;
            font-size: 12px;
            font-weight: 700;
          }

          .modal-input {
            width: 100%;
            min-height: 42px;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            outline: none;
            background: #ffffff;
            color: #0f172a;
            font-family: inherit;
            font-size: 13px;
            resize: vertical;
          }

          .modal-input:focus {
            border-color: #2563eb;
            box-shadow:
              0 0 0 3px rgba(37, 99, 235, 0.12);
          }

          .modal-input:disabled {
            background: #f8fafc;
            cursor: not-allowed;
          }

          .password-input-wrapper {
            position: relative;
          }

          .password-input-wrapper .modal-input {
            padding-right: 62px;
          }

          .btn-toggle-pwd {
            position: absolute;
            top: 50%;
            right: 7px;
            transform: translateY(-50%);
            padding: 5px 7px;
            border: 0;
            background: transparent;
            color: #2563eb;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 14px 22px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
          }

          .btn-secondary {
            min-height: 40px;
            padding: 9px 15px;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            background: #ffffff;
            color: #475569;
            font-family: inherit;
            font-size: 13px;
            font-weight: 650;
            cursor: pointer;
          }

          .btn-secondary:hover:not(:disabled) {
            background: #f1f5f9;
          }

          .btn-secondary:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .detail-item {
            margin-bottom: 18px;
          }

          .detail-item:last-child {
            margin-bottom: 0;
          }

          .detail-item-label {
            margin-bottom: 5px;
            color: #64748b;
            font-size: 10px;
            font-weight: 750;
            text-transform: uppercase;
            letter-spacing: 0.55px;
          }

          .detail-item-value {
            color: #0f172a;
            font-size: 14px;
            line-height: 1.5;
            word-break: break-word;
          }

          .store-details-card {
            margin-top: 20px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            background: #f8fafc;
          }

          .store-details-card h4 {
            margin: 0 0 12px;
            color: #1e293b;
            font-size: 14px;
            font-weight: 750;
          }

          .owner-store-item {
            padding: 12px 0;
            border-top: 1px solid #e2e8f0;
          }

          .owner-store-item:first-of-type {
            padding-top: 0;
            border-top: 0;
          }

          .owner-store-item:last-child {
            padding-bottom: 0;
          }

          .owner-store-row {
            display: grid;
            grid-template-columns: 130px 1fr;
            gap: 10px;
            margin-bottom: 7px;
            color: #475569;
            font-size: 12px;
            line-height: 1.5;
          }

          .owner-store-row:last-child {
            margin-bottom: 0;
          }

          .owner-store-row strong {
            color: #334155;
          }

          .store-empty-message {
            color: #64748b;
            font-size: 12px;
            line-height: 1.5;
          }

          @media (max-width: 900px) {
            .filters-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .btn-clear-filters {
              width: 100%;
            }
          }

          @media (max-width: 700px) {
            .admin-navbar {
              padding: 14px 16px;
            }

            .main-container {
              width: calc(100% - 24px);
              padding-top: 28px;
            }

            .page-header-row {
              align-items: stretch;
              flex-direction: column;
            }

            .btn-primary {
              width: 100%;
            }

            .filters-grid {
              grid-template-columns: 1fr;
            }

            .navbar-actions {
              gap: 6px;
            }

            .btn-nav-action,
            .btn-nav-logout {
              padding: 8px 10px;
              font-size: 11px;
            }
          }

          @media (max-width: 480px) {
            .brand-titles span {
              display: none;
            }

            .brand-titles h1 {
              font-size: 14px;
            }

            .modal-overlay {
              padding: 10px;
            }

            .modal-header,
            .modal-body,
            .modal-footer {
              padding-left: 16px;
              padding-right: 16px;
            }

            .modal-footer {
              flex-direction: column-reverse;
            }

            .modal-footer button {
              width: 100%;
            }

            .owner-store-row {
              grid-template-columns: 1fr;
              gap: 2px;
            }
          }
        `}
      </style>

      {/* =========================
          Navigation
      ========================== */}

      <header className="admin-navbar">
        <div className="navbar-brand">
          <div
            className="brand-badge"
            aria-hidden="true"
          >
            R
          </div>

          <div className="brand-titles">
            <h1>Roxiler Systems</h1>
            <span>Admin Management</span>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn-nav-action"
            onClick={() =>
              navigate('/admin/dashboard')
            }
          >
            Dashboard
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

      {/* =========================
          Main Content
      ========================== */}

      <main className="main-container">
        <div className="page-header-row">
          <div className="page-header-text">
            <h2>User Management</h2>

            <p>
              View, filter, sort, inspect, and register
              platform users and administrators.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreateModal}
          >
            + Add New User
          </button>
        </div>

        {/* Success */}

        {successMessage && (
          <div
            className="banner-success"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </div>
        )}

        {/* Table Error */}

        {tableError && (
          <div
            className="banner-error"
            role="alert"
          >
            {tableError}
          </div>
        )}

        {/* =========================
            Filters
        ========================== */}

        <section
          className="filters-card"
          aria-label="User Filters"
        >
          <div className="filters-grid">
            <div className="filter-item">
              <label htmlFor="filter-name">
                Name
              </label>

              <input
                id="filter-name"
                name="name"
                type="text"
                className="filter-input"
                placeholder="Search by name..."
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-item">
              <label htmlFor="filter-email">
                Email
              </label>

              <input
                id="filter-email"
                name="email"
                type="email"
                className="filter-input"
                placeholder="Search by email..."
                value={filters.email}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-item">
              <label htmlFor="filter-address">
                Address
              </label>

              <input
                id="filter-address"
                name="address"
                type="text"
                className="filter-input"
                placeholder="Search by address..."
                value={filters.address}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-item">
              <label htmlFor="filter-role">
                Role
              </label>

              <select
                id="filter-role"
                name="role"
                className="filter-input"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">
                  All Roles
                </option>

                <option value="user">
                  Normal User
                </option>

                <option value="admin">
                  Administrator
                </option>

                <option value="owner">
                  Store Owner
                </option>
              </select>
            </div>

            <button
              type="button"
              className="btn-clear-filters"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* =========================
            Users Table
        ========================== */}

        <section
          className="table-card"
          aria-label="Users Directory"
        >
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    scope="col"
                    onClick={() =>
                      handleSort('name')
                    }
                  >
                    Name
                    {renderSortIndicator('name')}
                  </th>

                  <th
                    scope="col"
                    onClick={() =>
                      handleSort('email')
                    }
                  >
                    Email
                    {renderSortIndicator('email')}
                  </th>

                  <th
                    scope="col"
                    onClick={() =>
                      handleSort('address')
                    }
                  >
                    Address
                    {renderSortIndicator('address')}
                  </th>

                  <th
                    scope="col"
                    onClick={() =>
                      handleSort('role')
                    }
                  >
                    Role
                    {renderSortIndicator('role')}
                  </th>

                  <th scope="col">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      <div className="table-state-box">
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="table-state-box">
                        No users found matching the
                        specified criteria.
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.name || '—'}
                        </strong>
                      </td>

                      <td>
                        {item.email || '—'}
                      </td>

                      <td>
                        {item.address || '—'}
                      </td>

                      <td>
                        <span
                          className={`role-badge ${getRoleClass(
                            item.role
                          )}`}
                        >
                          {getRoleLabel(item.role)}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-action-view"
                          onClick={() =>
                            handleViewDetails(
                              item.id
                            )
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* =========================
          Create User Modal
      ========================== */}

      {isCreateModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
        >
          <div className="modal-card">
            <header className="modal-header">
              <h3 id="create-user-title">
                Add New User
              </h3>

              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseCreateModal}
                disabled={createLoading}
                aria-label="Close create user dialog"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div
                    className="banner-error"
                    role="alert"
                  >
                    {createError}
                  </div>
                )}

                <div className="modal-form-group">
                  <label htmlFor="create-name">
                    Full Name (20–60 characters)
                  </label>

                  <input
                    id="create-name"
                    name="name"
                    type="text"
                    className="modal-input"
                    value={createFormData.name}
                    onChange={
                      handleCreateInputChange
                    }
                    placeholder="Enter full name"
                    minLength={20}
                    maxLength={60}
                    required
                    disabled={createLoading}
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="create-email">
                    Email Address
                  </label>

                  <input
                    id="create-email"
                    name="email"
                    type="email"
                    className="modal-input"
                    value={createFormData.email}
                    onChange={
                      handleCreateInputChange
                    }
                    placeholder="name@example.com"
                    required
                    disabled={createLoading}
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="create-password">
                    Password (8–16 chars, 1 uppercase,
                    1 special character)
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="create-password"
                      name="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      className="modal-input"
                      value={
                        createFormData.password
                      }
                      onChange={
                        handleCreateInputChange
                      }
                      placeholder="Enter secure password"
                      minLength={8}
                      maxLength={16}
                      required
                      disabled={createLoading}
                    />

                    <button
                      type="button"
                      className="btn-toggle-pwd"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      disabled={createLoading}
                    >
                      {showPassword
                        ? 'Hide'
                        : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="create-address">
                    Address (Optional, max 400
                    characters)
                  </label>

                  <textarea
                    id="create-address"
                    name="address"
                    className="modal-input"
                    rows="3"
                    value={
                      createFormData.address
                    }
                    onChange={
                      handleCreateInputChange
                    }
                    placeholder="Enter physical address"
                    maxLength={400}
                    disabled={createLoading}
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="create-role">
                    Role
                  </label>

                  <select
                    id="create-role"
                    name="role"
                    className="modal-input"
                    value={createFormData.role}
                    onChange={
                      handleCreateInputChange
                    }
                    disabled={createLoading}
                  >
                    <option value="user">
                      Normal User
                    </option>

                    <option value="admin">
                      Administrator
                    </option>

                    <option value="owner">
                      Store Owner
                    </option>
                  </select>
                </div>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    handleCloseCreateModal
                  }
                  disabled={createLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createLoading}
                >
                  {createLoading
                    ? 'Creating User...'
                    : 'Create User'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          User Details Modal
      ========================== */}

      {isDetailModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
        >
          <div className="modal-card">
            <header className="modal-header">
              <h3 id="user-details-title">
                User Details
              </h3>

              <button
                type="button"
                className="btn-close-modal"
                onClick={
                  handleCloseDetailsModal
                }
                disabled={detailLoading}
                aria-label="Close user details dialog"
              >
                ×
              </button>
            </header>

            <div className="modal-body">
              {detailLoading ? (
                <div className="table-state-box">
                  Loading user details...
                </div>
              ) : detailError ? (
                <div
                  className="banner-error"
                  role="alert"
                >
                  {detailError}
                </div>
              ) : selectedUser ? (
                <>
                  <div className="detail-item">
                    <div className="detail-item-label">
                      Full Name
                    </div>

                    <div className="detail-item-value">
                      {selectedUser.name || '—'}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-item-label">
                      Email Address
                    </div>

                    <div className="detail-item-value">
                      {selectedUser.email || '—'}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-item-label">
                      Physical Address
                    </div>

                    <div className="detail-item-value">
                      {selectedUser.address ||
                        'Not specified'}
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-item-label">
                      Assigned Role
                    </div>

                    <div className="detail-item-value">
                      <span
                        className={`role-badge ${getRoleClass(
                          selectedUser.role
                        )}`}
                      >
                        {getRoleLabel(
                          selectedUser.role
                        )}
                      </span>
                    </div>
                  </div>

                  {selectedUser.role ===
                    'owner' && (
                    <div className="store-details-card">
                      <h4>
                        Associated Store Profile
                      </h4>

                      {renderOwnerStores()}
                    </div>
                  )}
                </>
              ) : (
                <div className="table-state-box">
                  User details are unavailable.
                </div>
              )}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={
                  handleCloseDetailsModal
                }
                disabled={detailLoading}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;