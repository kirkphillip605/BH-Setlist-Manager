import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? (
    children || <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
