// src/pages/Employee/LeaveBalance/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, Award, Activity } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import { getLeaveBalance, getLeaveRequestsByUser } from '../../../services/leave';
import Card from '../../../components/common/Card';
import StatCard from '../../../components/charts/StatCard';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';
import { formatDate, getMonthName } from '../../../utils/formatters';

const LeaveBalance = () => {
  const { user } = useAuthContext();
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [leaveBalance, leaveRequests] = await Promise.all([
        getLeaveBalance(user.uid),
        getLeaveRequestsByUser(user.uid)
      ]);
      setBalance(leaveBalance);
      setRequests(leaveRequests.filter(r =>
        new Date(r.startDate).getFullYear() === selectedYear
      ));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <Loading text="Đang tải thông tin phép..." />;
  }

  const approvedRequests = requests.filter(r => r.status === 'approved');
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthRequests = approvedRequests.filter(r =>
      new Date(r.startDate).getMonth() + 1 === month
    );
    return {
      month,
      count: monthRequests.reduce((sum, r) => sum + r.days, 0)
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Số dư phép năm
          </h2>
          <p className="text-gray-500 mt-1">Theo dõi số ngày phép và lịch sử sử dụng</p>
        </div>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>Năm {year}</option>
          ))}
        </select>
      </div>

      {/* Balance Stats */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Phép năm"
            value={balance.annualLeave}
            icon={Calendar}
            color="blue"
            subtitle="ngày"
          />
          <StatCard
            title="Đã sử dụng"
            value={balance.usedLeave}
            icon={Activity}
            color="purple"
            subtitle="ngày"
          />
          <StatCard
            title="Còn lại"
            value={balance.remainingLeave}
            icon={TrendingUp}
            color="green"
            subtitle="ngày"
          />
          <StatCard
            title="Nghỉ ốm"
            value={balance.sickLeaveTaken}
            icon={Activity}
            color="yellow"
            subtitle="ngày (năm nay)"
          />
        </div>
      )}

      {/* Monthly Chart */}
      <Card title={`Biểu đồ sử dụng phép năm ${selectedYear}`}>
        <div className="space-y-3">
          {monthlyData.map(({ month, count }) => (
            <div key={month} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-600">{getMonthName(month)}</div>
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full flex items-center justify-end px-3 text-white text-sm font-medium transition-all"
                    style={{ width: `${Math.min(count / (balance?.annualLeave || 12) * 100, 100)}%` }}
                  >
                    {count > 0 && `${count} ngày`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Leave Types Breakdown */}
      <Card title="Phân loại nghỉ phép">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Nghỉ phép năm</h4>
            <p className="text-2xl font-bold text-blue-600">
              {approvedRequests.filter(r => r.leaveType === 'annual').reduce((sum, r) => sum + r.days, 0)}
            </p>
            <p className="text-xs text-blue-700 mt-1">ngày</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Nghỉ ốm</h4>
            <p className="text-2xl font-bold text-purple-600">
              {approvedRequests.filter(r => r.leaveType === 'sick').reduce((sum, r) => sum + r.days, 0)}
            </p>
            <p className="text-xs text-purple-700 mt-1">ngày</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 mb-2">Nghỉ cá nhân</h4>
            <p className="text-2xl font-bold text-green-600">
              {approvedRequests.filter(r => r.leaveType === 'personal').reduce((sum, r) => sum + r.days, 0)}
            </p>
            <p className="text-xs text-green-700 mt-1">ngày</p>
          </div>
        </div>
      </Card>

      {/* Recent Requests */}
      <Card title="Lịch sử xin phép gần đây" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Loại</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Từ ngày</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Đến ngày</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Số ngày</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 10).map((request) => (
                <tr key={request.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-900">{request.leaveType}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(request.startDate)}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(request.endDate)}</td>
                  <td className="py-3 px-4 font-medium text-blue-600">{request.days} ngày</td>
                  <td className="py-3 px-4">
                    {request.status === 'approved' && <Badge variant="success">Đã duyệt</Badge>}
                    {request.status === 'pending' && <Badge variant="warning">Chờ duyệt</Badge>}
                    {request.status === 'rejected' && <Badge variant="error">Từ chối</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaveBalance;
