import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false }) => {
  const { isAuthenticated, isAdmin, isAdminOrSubadmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // adminOnly = only admins
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // staffOnly = admins and subadmins
  if (staffOnly && !isAdminOrSubadmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
