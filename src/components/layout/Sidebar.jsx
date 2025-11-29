// src/components/layout/Sidebar.jsx
import React from 'react';
import { 
  Home, 
  Clock, 
  Calendar, 
  Users, 
  QrCode, 
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { isAdmin } = useAuthContext();

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: Home, roles: ['employee', 'admin'] },
    { id: 'attendance', label: 'Chấm công', icon: Clock, roles: ['employee', 'admin'] },
    { id: 'history', label: 'Lịch sử', icon: Calendar, roles: ['employee', 'admin'] },
    { id: 'users', label: 'Nhân viên', icon: Users, roles: ['admin'] },
    { id: 'qrcode', label: 'QR Code', icon: QrCode, roles: ['admin'] },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    isAdmin ? true : item.roles.includes('employee')
  );

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Chấm công</h2>
            <p className="text-xs text-gray-500">v2.0.0</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
        <div className="text-center text-xs text-gray-400">
          © 2025 Attendance System
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
