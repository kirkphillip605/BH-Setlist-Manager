import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  
  // Redirect to login if not authenticated and not already on auth pages
  useEffect(() => {
    if (initialized && !loading && !user) {
      const currentPath = location.pathname + location.search;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/auth/') && 
          !currentPath.startsWith('/tos') && !currentPath.startsWith('/privacy-policy')) {
        // Store intended destination
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
    }
  }, [initialized, loading, user]);

  // Show loading screen while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-zinc-300">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return user ? (
    children || <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default PrivateRoute;
