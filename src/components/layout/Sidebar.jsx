// src/components/layout/Sidebar.jsx
import React from 'react';
import {
  Home,
  Clock,
  Calendar,
  Users,
  QrCode,
  BarChart3,
  Bell,
  Smartphone,
  FileText,
  Award,
  ClipboardCheck,
  TrendingUp,
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { isAdmin, isManager } = useAuthContext();

  const menuItems = [
    // Common
    { id: 'dashboard', label: 'Tổng quan', icon: Home, roles: ['employee', 'manager', 'admin'], section: 'common' },
    { id: 'attendance', label: 'Chấm công', icon: Clock, roles: ['employee', 'manager', 'admin'], section: 'common' },
    { id: 'history', label: 'Lịch sử', icon: Calendar, roles: ['employee', 'manager', 'admin'], section: 'common' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, roles: ['employee', 'manager', 'admin'], section: 'common' },

    // Employee
    { id: 'devices', label: 'Thiết bị', icon: Smartphone, roles: ['employee', 'manager', 'admin'], section: 'employee' },
    { id: 'leave-request', label: 'Xin nghỉ phép', icon: FileText, roles: ['employee', 'manager', 'admin'], section: 'employee' },
    { id: 'leave-balance', label: 'Số dư phép', icon: Award, roles: ['employee', 'manager', 'admin'], section: 'employee' },
    { id: 'late-early', label: 'Đi muộn/Về sớm', icon: ClipboardCheck, roles: ['employee', 'manager', 'admin'], section: 'employee' },

    // Manager
    { id: 'approval', label: 'Duyệt đơn', icon: ClipboardCheck, roles: ['manager', 'admin'], section: 'manager' },
    { id: 'team-report', label: 'Báo cáo team', icon: TrendingUp, roles: ['manager', 'admin'], section: 'manager' },

    // Admin
    { id: 'users', label: 'Nhân viên', icon: Users, roles: ['admin'], section: 'admin' },
    { id: 'qrcode', label: 'QR Code', icon: QrCode, roles: ['admin'], section: 'admin' },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3, roles: ['admin'], section: 'admin' },
    { id: 'admin-devices', label: 'Quản lý thiết bị', icon: Shield, roles: ['admin'], section: 'admin' },
    { id: 'settings', label: 'Cài đặt', icon: SettingsIcon, roles: ['admin'], section: 'admin' },
  ];

  const getUserRole = () => {
    if (isAdmin) return 'admin';
    if (isManager) return 'manager';
    return 'employee';
  };

  const filteredItems = menuItems.filter(item =>
    item.roles.includes(getUserRole())
  );

  // Group items by section
  const sections = {
    common: filteredItems.filter(item => item.section === 'common'),
    employee: filteredItems.filter(item => item.section === 'employee'),
    manager: filteredItems.filter(item => item.section === 'manager'),
    admin: filteredItems.filter(item => item.section === 'admin'),
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen sticky top-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 dark:text-white">Chấm công</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">v2.1.0</p>
          </div>
        </div>
      </div>

      <nav className="p-4 pb-20">
        {/* Common Section */}
        {sections.common.length > 0 && (
          <div className="mb-6">
            <ul className="space-y-1">
              {sections.common.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                        ${isActive
                          ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Employee Section */}
        {sections.employee.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">
              Nhân viên
            </p>
            <ul className="space-y-1">
              {sections.employee.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                        ${isActive
                          ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Manager Section */}
        {sections.manager.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">
              Quản lý
            </p>
            <ul className="space-y-1">
              {sections.manager.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                        ${isActive
                          ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Admin Section */}
        {sections.admin.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-2">
              Quản trị
            </p>
            <ul className="space-y-1">
              {sections.admin.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                        ${isActive
                          ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          © 2025 Attendance System
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
