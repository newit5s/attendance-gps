// src/components/layout/MainLayout.jsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children, currentView, setCurrentView }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
