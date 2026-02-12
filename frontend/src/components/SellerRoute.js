import React from 'react';
import { Navigate } from 'react-router-dom';

function SellerRoute({ children }) {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userType !== 'seller') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default SellerRoute;
