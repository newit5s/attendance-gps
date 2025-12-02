// src/pages/Dashboard/index.jsx
import React from 'react';
import { Clock, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useAttendance } from '../../hooks/useAttendance';
import StatCard from '../../components/charts/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { formatTime } from '../../utils/formatters';

const Dashboard = () => {
  const { userData } = useAuthContext();
  const { todayCheckIn, todayCheckOut, monthlyStats, loading } = useAttendance();

  if (loading) {
    return <Loading text="Đang tải dữ liệu..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-2xl p-6 text-white transition-colors duration-300">
        <h2 className="text-2xl font-bold">Xin chào, {userData?.name}!</h2>
        <p className="mt-2 opacity-90">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Today's Status */}
      <Card title="Trạng thái hôm nay" subtitle="Thông tin chấm công trong ngày">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in */}
          <div className={`p-4 rounded-xl border-2 transition-colors duration-300 ${todayCheckIn ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {todayCheckIn ? formatTime(todayCheckIn.timestamp) : '--:--:--'}
                </p>
                {todayCheckIn && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {todayCheckIn.method} • {todayCheckIn.distance}m
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${todayCheckIn ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Check-out */}
          <div className={`p-4 rounded-xl border-2 transition-colors duration-300 ${todayCheckOut ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {todayCheckOut ? formatTime(todayCheckOut.timestamp) : '--:--:--'}
                </p>
                {todayCheckOut && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {todayCheckOut.method} • {todayCheckOut.distance}m
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${todayCheckOut ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng ngày làm"
          value={monthlyStats?.totalDays || 0}
          icon={Calendar}
          color="blue"
          subtitle="Trong tháng này"
        />
        <StatCard
          title="Đúng giờ"
          value={monthlyStats?.onTimeDays || 0}
          icon={CheckCircle}
          color="green"
          subtitle="Trong tháng này"
        />
        <StatCard
          title="Đi muộn"
          value={monthlyStats?.lateDays || 0}
          icon={Clock}
          color="yellow"
          subtitle="Trong tháng này"
        />
        <StatCard
          title="Về sớm"
          value={monthlyStats?.earlyDays || 0}
          icon={TrendingUp}
          color="red"
          subtitle="Trong tháng này"
        />
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Thông tin cá nhân">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Họ tên</span>
              <span className="font-medium text-gray-800 dark:text-white">{userData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-800 dark:text-white">{userData?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Phòng ban</span>
              <span className="font-medium text-gray-800 dark:text-white">{userData?.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Vai trò</span>
              <Badge variant={userData?.role === 'admin' ? 'primary' : 'default'}>
                {userData?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card title="Hướng dẫn nhanh">
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Vào mục <strong>Chấm công</strong> để check-in/check-out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>Chọn phương thức: <strong>GPS</strong> hoặc <strong>QR Code</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Xem lịch sử tại mục <strong>Lịch sử</strong></span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
