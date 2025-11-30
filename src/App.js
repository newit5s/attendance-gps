// src/App.js
// Main App component with routing

import React, { useState } from 'react';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import History from './pages/History';
import Notifications from './pages/Notifications';

// Employee Pages
import DeviceRegister from './pages/Employee/DeviceRegister';
import LeaveRequest from './pages/Employee/LeaveRequest';
import LeaveBalance from './pages/Employee/LeaveBalance';
import LateEarly from './pages/Employee/LateEarly';

// Manager Pages
import Approval from './pages/Manager/Approval';
import TeamReport from './pages/Manager/TeamReport';

// Admin Pages
import Users from './pages/Admin/Users';
import QRCodeManager from './pages/Admin/QRCode';
import Reports from './pages/Admin/Reports';
import Devices from './pages/Admin/Devices';
import Settings from './pages/Admin/Settings';

// Loading
import Loading from './components/common/Loading';

/**
 * App Content - handles routing based on auth state
 */
const AppContent = () => {
  const { isAuthenticated, loading, isAdmin, isManager } = useAuthContext();
  const [currentView, setCurrentView] = useState('dashboard');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="lg" text="Đang tải ứng dụng..." />
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render current view
  const renderView = () => {
    switch (currentView) {
      // Common pages
      case 'dashboard':
        return <Dashboard />;
      case 'attendance':
        return <Attendance />;
      case 'history':
        return <History />;
      case 'notifications':
        return <Notifications />;

      // Employee pages
      case 'devices':
        return <DeviceRegister />;
      case 'leave-request':
        return <LeaveRequest />;
      case 'leave-balance':
        return <LeaveBalance />;
      case 'late-early':
        return <LateEarly />;

      // Manager pages
      case 'approval':
        return isManager ? <Approval /> : <Dashboard />;
      case 'team-report':
        return isManager ? <TeamReport /> : <Dashboard />;

      // Admin pages
      case 'users':
        return isAdmin ? <Users /> : <Dashboard />;
      case 'qrcode':
        return isAdmin ? <QRCodeManager /> : <Dashboard />;
      case 'reports':
        return isAdmin ? <Reports /> : <Dashboard />;
      case 'admin-devices':
        return isAdmin ? <Devices /> : <Dashboard />;
      case 'settings':
        return isAdmin ? <Settings /> : <Dashboard />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </MainLayout>
  );
};

/**
 * Main App component
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
