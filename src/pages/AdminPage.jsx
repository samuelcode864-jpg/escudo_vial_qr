import React from 'react';
import { useApp } from '../context/AppContext';
import DashboardMain from '../components/dashboard/DashboardMain';
import AdminLogin from '../components/dashboard/AdminLogin';

export default function AdminPage() {
  const { isAdminAuthenticated } = useApp();

  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }

  return <DashboardMain />;
}
