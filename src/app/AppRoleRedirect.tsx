import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDemoAuth } from '../context/DemoAuthContext';

export const AppRoleRedirect: React.FC = () => {
  const { role } = useDemoAuth();

  if (role === 'STAFF') {
    return <Navigate to="/app/kasir" replace />;
  }
  if (role === 'ADMIN') {
    return <Navigate to="/app/admin" replace />;
  }
  // Default OWNER
  return <Navigate to="/app/owner" replace />;
};
