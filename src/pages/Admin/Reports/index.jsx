// src/pages/Admin/Reports/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Clock, TrendingUp, Download } from 'lucide-react';
import { getCompanyStats, getTopEmployees, exportToCSV } from '../../../services/reports';
import { getAllAttendances } from '../../../services/attendance';
import Card from '../../../components/common/Card';
import StatCard from '../../../components/charts/StatCard';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';
import { getMonthName, formatDate, formatTime } from '../../../utils/formatters';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [topEmployees, setTopEmployees] = useState([]);
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [companyStats, top, attendances] = await Promise.all([
        getCompanyStats(selectedMonth, selectedYear),
        getTopEmployees(selectedMonth, selectedYear, 5),
        getAllAttendances(50)
      ]);
      setStats(companyStats);
      setTopEmployees(top);
      setRecentAttendances(attendances);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = async () => {
    try {
      const attendances = await getAllAttendances(1000);
      
      let csv = 'BÁO CÁO CHẤM CÔNG TỔNG HỢP\n';
      csv += `Tháng: ${selectedMonth}/${selectedYear}\n\n`;
      
      csv += 'THỐNG KÊ TỔNG QUAN\n';
      csv += `Tổng lượt chấm công,${stats?.totalAttendances}\n`;
      csv += `Check-in,${stats?.totalCheckIns}\n`;
      csv += `Check-out,${stats?.totalCheckOuts}\n`;
      csv += `Đi muộn,${stats?.lateCheckIns}\n`;
      csv += `Về sớm,${stats?.earlyCheckOuts}\n`;
      csv += `Tỷ lệ đúng giờ,${stats?.onTimeRate}%\n\n`;
      
      csv += 'CHI TIẾT CHẤM CÔNG\n';
      csv += 'Ngày,Nhân viên,Loại,Phương thức,Thời gian,Khoảng cách\n';
      
      attendances.forEach(a => {
        csv += `${formatDate(a.timestamp)},${a.userName},${a.type},${a.method},${formatTime(a.timestamp)},${a.distance}m\n`;
      });
      
      exportToCSV(csv, `baocao_chamcong_${selectedMonth}_${selectedYear}.csv`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Không thể xuất báo cáo');
    }
  };

  if (loading) {
    return <Loading text="Đang tải báo cáo..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Báo cáo tổng hợp</h2>
          <p className="text-gray-500">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng lượt chấm công"
          value={stats?.totalAttendances || 0}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Số nhân viên"
          value={stats?.uniqueEmployees || 0}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Đi muộn"
          value={stats?.lateCheckIns || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Tỷ lệ đúng giờ"
          value={`${stats?.onTimeRate || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Distribution */}
        <Card title="Phương thức chấm công">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">GPS</span>
                <span className="font-medium">{stats?.gpsAttendances || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${stats?.totalAttendances 
                      ? (stats.gpsAttendances / stats.totalAttendances * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">QR Code</span>
                <span className="font-medium">{stats?.qrAttendances || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${stats?.totalAttendances 
                      ? (stats.qrAttendances / stats.totalAttendances * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Employees */}
        <Card title="Nhân viên xuất sắc">
          {topEmployees.length > 0 ? (
            <div className="space-y-3">
              {topEmployees.map((emp, index) => (
                <div key={emp.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">{emp.onTimeRate}%</Badge>
                    <p className="text-xs text-gray-500 mt-1">{emp.totalDays} ngày</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Chưa có dữ liệu</p>
          )}
        </Card>
      </div>

      {/* Recent Attendances */}
      <Card title="Lịch sử chấm công gần đây" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Thời gian</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nhân viên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Loại</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Phương thức</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Khoảng cách</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendances.slice(0, 10).map(att => (
                <tr key={att.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    <div>{formatDate(att.timestamp)}</div>
                    <div className="text-gray-500">{formatTime(att.timestamp)}</div>
                  </td>
                  <td className="py-3 px-4 font-medium">{att.userName}</td>
                  <td className="py-3 px-4">
                    <Badge variant={att.type === 'check-in' ? 'success' : 'info'}>
                      {att.type === 'check-in' ? 'Vào' : 'Ra'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{att.method}</td>
                  <td className="py-3 px-4 text-gray-600">{att.distance}m</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentAttendances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có dữ liệu chấm công
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
