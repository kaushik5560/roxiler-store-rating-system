
const API_BASE_URL = 'http://localhost:5000';

/**
 * Helper to construct a URL query string from an object safely
 */
const buildQueryString = (params) => {
  if (!params || typeof params !== 'object') return '';

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Reusable core API request function
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {}, params } = options;

  const queryString = buildQueryString(params);
  const url = `${API_BASE_URL}${endpoint}${queryString}`;

  // Read latest token from storage dynamically per request
  const token = localStorage.getItem('token');

  const requestHeaders = {
    ...headers
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: requestHeaders
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    const networkError = new Error('Network error. Unable to communicate with the server.');
    networkError.status = 0;
    throw networkError;
  }

  // Safely parse JSON if content-type indicates JSON
  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

/**
 * Register a normal user
 * @param {Object} data - { name, email, password, address }
 */
export const registerUser = async (data) => {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: data
  });
};

/**
 * Authenticate a user and receive JWT
 * @param {Object} data - { email, password }
 */
export const loginUser = async (data) => {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: data
  });
};

/**
 * Update authenticated user's password
 * @param {Object} data - { currentPassword, newPassword }
 */
export const updatePassword = async (data) => {
  return apiRequest('/api/auth/password', {
    method: 'PUT',
    body: data
  });
};

/* ==========================================================================
   ADMIN ENDPOINTS
   ========================================================================== */

/**
 * Fetch admin dashboard summary statistics
 */
export const getAdminDashboard = async () => {
  return apiRequest('/api/admin/dashboard', {
    method: 'GET'
  });
};

/**
 * Create a new user with an assigned role
 * @param {Object} data - { name, email, password, address, role }
 */
export const createAdminUser = async (data) => {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: data
  });
};

/**
 * Fetch all users with optional filtering and sorting
 * @param {Object} [params] - { name, email, address, role, sortBy, order }
 */
export const getAdminUsers = async (params) => {
  return apiRequest('/api/admin/users', {
    method: 'GET',
    params
  });
};

/**
 * Fetch user details by ID
 * @param {number|string} id - User ID
 */
export const getAdminUserById = async (id) => {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'GET'
  });
};

/**
 * Create a new store assigned to a store owner
 * @param {Object} data - { name, email, address, ownerId }
 */
export const createAdminStore = async (data) => {
  return apiRequest('/api/admin/stores', {
    method: 'POST',
    body: data
  });
};

/**
 * Fetch all stores with optional filtering and sorting
 * @param {Object} [params] - { name, email, address, sortBy, order }
 */
export const getAdminStores = async (params) => {
  return apiRequest('/api/admin/stores', {
    method: 'GET',
    params
  });
};

/* ==========================================================================
   NORMAL USER ENDPOINTS
   ========================================================================== */

/**
 * Fetch stores list with ratings and user's submitted rating
 * @param {Object} [params] - { name, address, sortBy, order }
 */
export const getUserStores = async (params) => {
  return apiRequest('/api/stores', {
    method: 'GET',
    params
  });
};

/**
 * Submit or update rating for a store
 * @param {number|string} storeId - Store ID
 * @param {number} rating - Rating value (1 to 5)
 */
export const submitOrUpdateRating = async (storeId, rating) => {
  return apiRequest(`/api/ratings/${encodeURIComponent(storeId)}`, {
    method: 'POST',
    body: { rating }
  });
};

/* ==========================================================================
   STORE OWNER ENDPOINTS
   ========================================================================== */

/**
 * Fetch store owner dashboard metrics, stores, and raters list
 */
export const getOwnerDashboard = async () => {
  return apiRequest('/api/owner/dashboard', {
    method: 'GET'
  });
};