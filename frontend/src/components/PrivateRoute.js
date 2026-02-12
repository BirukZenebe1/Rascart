import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;