import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStores from './pages/AdminStores';

import UserDashboard from './pages/UserDashboard';
import UpdatePassword from './pages/UpdatePassword';

import OwnerDashboard from './pages/OwnerDashboard';

import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            Public Routes
        ========================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================
            Normal User Routes
        ========================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={['user']} />
          }
        >
          <Route
            path="/user"
            element={<UserDashboard />}
          />

          <Route
            path="/user/stores"
            element={<UserDashboard />}
          />

          <Route
            path="/user/password"
            element={<UpdatePassword />}
          />
        </Route>


        {/* =========================
            Admin Routes
        ========================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']} />
          }
        >
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="/admin/stores"
            element={<AdminStores />}
          />
        </Route>


        {/* =========================
            Store Owner Routes
        ========================== */}

        <Route
          element={
            <ProtectedRoute allowedRoles={['owner']} />
          }
        >
          <Route
            path="/owner"
            element={<OwnerDashboard />}
          />

          <Route
            path="/owner/dashboard"
            element={<OwnerDashboard />}
          />

          <Route
            path="/owner/password"
            element={<UpdatePassword />}
          />
        </Route>


        {/* =========================
            Default Route
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* =========================
            Unknown Route
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default App;