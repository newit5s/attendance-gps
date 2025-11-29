// src/pages/History/index.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, QrCode, Download } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { getUserAttendances } from '../../services/attendance';
import { getEmployeeReport, exportToCSV, generateEmployeeCSV } from '../../services/reports';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate, formatTime, getMonthName } from '../../utils/formatters';

const History = () => {
  const { user, userData } = useAuthContext();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadData();
  }, [user, selectedMonth, selectedYear]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [history, monthReport] = await Promise.all([
        getUserAttendances(user.uid, 100),
        getEmployeeReport(user.uid, selectedMonth, selectedYear)
      ]);
      setAttendances(history);
      setReport(monthReport);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report || !userData) return;
    const csv = generateEmployeeCSV(report, userData);
    const filename = `chamcong_${userData.name}_${selectedMonth}_${selectedYear}.csv`;
    exportToCSV(csv, filename);
  };

  // Group attendances by date
  const groupedAttendances = attendances.reduce((groups, record) => {
    const date = record.date || formatDate(record.timestamp);
    if (!groups[date]) {
      groups[date] = { checkIn: null, checkOut: null };
    }
    if (record.type === 'check-in') {
      groups[date].checkIn = record;
    } else {
      groups[date].checkOut = record;
    }
    return groups;
  }, {});

  if (loading) {
    return <Loading text="Đang tải lịch sử..." />;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Năm:</label>
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

          <Button onClick={handleExportCSV} variant="outline" className="ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </Card>

      {/* Stats Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{report.stats.totalDays}</p>
            <p className="text-sm text-blue-700">Ngày làm</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{report.stats.onTimeDays}</p>
            <p className="text-sm text-green-700">Đúng giờ</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{report.stats.lateDays}</p>
            <p className="text-sm text-yellow-700">Đi muộn</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{report.stats.earlyDays}</p>
            <p className="text-sm text-red-700">Về sớm</p>
          </div>
        </div>
      )}

      {/* History Table */}
      <Card title={`Lịch sử chấm công - ${getMonthName(selectedMonth)} ${selectedYear}`}>
        {Object.keys(groupedAttendances).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Không có dữ liệu chấm công trong tháng này</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check-out</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Phương thức</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedAttendances)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([date, { checkIn, checkOut }]) => (
                    <tr key={date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {checkIn ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>{formatTime(checkIn.timestamp)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {checkOut ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>{formatTime(checkOut.timestamp)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {checkIn && (
                          <div className="flex items-center gap-1">
                            {checkIn.method === 'GPS' ? (
                              <MapPin className="w-4 h-4 text-blue-500" />
                            ) : (
                              <QrCode className="w-4 h-4 text-purple-500" />
                            )}
                            <span className="text-sm">{checkIn.method}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {checkIn && (
                          <Badge variant={checkIn.status === 'late' ? 'warning' : 'success'}>
                            {checkIn.status === 'late' ? 'Đi muộn' : 'Đúng giờ'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default History;
