import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return user ? (
    children || <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;
