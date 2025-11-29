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
import Users from './pages/Admin/Users';
import QRCodeManager from './pages/Admin/QRCode';
import Reports from './pages/Admin/Reports';

// Loading
import Loading from './components/common/Loading';

/**
 * App Content - handles routing based on auth state
 */
const AppContent = () => {
  const { isAuthenticated, loading, isAdmin } = useAuthContext();
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
      case 'dashboard':
        return <Dashboard />;
      case 'attendance':
        return <Attendance />;
      case 'history':
        return <History />;
      case 'users':
        return isAdmin ? <Users /> : <Dashboard />;
      case 'qrcode':
        return isAdmin ? <QRCodeManager /> : <Dashboard />;
      case 'reports':
        return isAdmin ? <Reports /> : <Dashboard />;
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
