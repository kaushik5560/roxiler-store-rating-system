import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const API_BASE_URL = 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // Restore authentication state on app start
  // ==========================================
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setToken(null);
        setUser(null);

        return;
      }

      const parsedUser = JSON.parse(storedUser);

      // Validate stored user data
      if (
        !parsedUser ||
        typeof parsedUser !== 'object' ||
        !parsedUser.id ||
        !parsedUser.role
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setToken(null);
        setUser(null);

        return;
      }

      setToken(storedToken);
      setUser(parsedUser);
    } catch (error) {
      console.error(
        'Failed to restore authentication state:',
        error
      );

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // Login
  // ==========================================
  const login = async (email, password) => {
    let response;

    try {
      response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
    } catch (error) {
      const networkError = new Error(
        'Unable to connect to the server. Please make sure the backend is running.'
      );

      networkError.status = 0;

      throw networkError;
    }

    const contentType = response.headers.get('content-type');

    let data = null;

    if (
      contentType &&
      contentType.toLowerCase().includes('application/json')
    ) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        'Login failed. Please check your email and password.';

      const error = new Error(errorMessage);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    // Validate successful authentication response
    if (!data?.token || !data?.user) {
      throw new Error(
        'Invalid authentication response received from server.'
      );
    }

    // Store authentication data
    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    // Update React state
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // ==========================================
  // Logout
  // ==========================================
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  // ==========================================
  // Update Password
  // ==========================================
  const updatePassword = async (
    currentPassword,
    newPassword
  ) => {
    if (!token) {
      throw new Error(
        'Authentication required to update your password.'
      );
    }

    let response;

    try {
      response = await fetch(
        `${API_BASE_URL}/api/auth/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );
    } catch (error) {
      const networkError = new Error(
        'Unable to connect to the server. Please make sure the backend is running.'
      );

      networkError.status = 0;

      throw networkError;
    }

    const contentType = response.headers.get('content-type');

    let data = null;

    if (
      contentType &&
      contentType.toLowerCase().includes('application/json')
    ) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        'Failed to update password. Please try again.';

      const error = new Error(errorMessage);

      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  };

  // ==========================================
  // Context Value
  // ==========================================
  const value = {
    user,
    token,
    loading,

    isAuthenticated: Boolean(token && user),

    login,
    logout,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// useAuth Hook
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider.'
    );
  }

  return context;
};