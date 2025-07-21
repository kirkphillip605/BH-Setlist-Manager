import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();

  // Show loading screen while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-lg text-slate-300">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return user ? (
    children || <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
