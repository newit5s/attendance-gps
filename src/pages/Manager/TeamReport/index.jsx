// src/pages/Manager/TeamReport/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Award, Clock, Calendar, Download } from 'lucide-react';
import { getDepartmentReport, getTopEmployees, exportToCSV } from '../../../services/reports';
import { getAllDepartments } from '../../../services/users';
import Card from '../../../components/common/Card';
import StatCard from '../../../components/charts/StatCard';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';
import { getMonthName, formatDate, formatTime } from '../../../utils/formatters';

const TeamReport = () => {
  const [departmentReport, setDepartmentReport] = useState(null);
  const [topEmployees, setTopEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts);
      if (depts.length > 0 && !selectedDepartment) {
        setSelectedDepartment(depts[0]);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadData = useCallback(async () => {
    if (!selectedDepartment) return;

    setLoading(true);
    try {
      const [deptReport, top] = await Promise.all([
        getDepartmentReport(selectedDepartment, selectedMonth, selectedYear),
        getTopEmployees(selectedMonth, selectedYear, 10)
      ]);
      setDepartmentReport(deptReport);
      // Filter top employees by selected department
      const filteredTop = top.filter(emp => emp.department === selectedDepartment);
      setTopEmployees(filteredTop);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDepartment) {
      loadData();
    }
  }, [loadData, selectedDepartment]);

  const handleExportCSV = () => {
    if (!departmentReport) return;

    let csv = `BÁO CÁO PHÒNG BAN\n`;
    csv += `Phòng ban: ${selectedDepartment}\n`;
    csv += `Tháng: ${selectedMonth}/${selectedYear}\n\n`;

    csv += `THỐNG KÊ TỔNG QUAN\n`;
    csv += `Tổng nhân viên,${departmentReport.totalEmployees}\n`;
    csv += `Tổng lượt check-in,${departmentReport.totalCheckIns}\n`;
    csv += `Số lượt đi muộn,${departmentReport.lateDays}\n`;
    csv += `Tỷ lệ đúng giờ,${departmentReport.onTimeRate}%\n\n`;

    csv += `NHÂN VIÊN XUẤT SẮC\n`;
    csv += `Tên,Phòng ban,Tổng ngày,Đúng giờ,Tỷ lệ\n`;
    topEmployees.forEach(emp => {
      csv += `${emp.name},${emp.department},${emp.totalDays},${emp.onTimeDays},${emp.onTimeRate}%\n`;
    });

    exportToCSV(csv, `baocao_phongban_${selectedDepartment}_${selectedMonth}_${selectedYear}.csv`);
  };

  if (loading && !departmentReport) {
    return <Loading text="Đang tải báo cáo..." />;
  }

  if (departments.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Chưa có phòng ban nào</p>
            <p className="text-gray-400 text-sm mt-2">Vui lòng thêm nhân viên với phòng ban trước</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Báo cáo phòng ban</h2>
          <p className="text-gray-500">{getMonthName(selectedMonth)} {selectedYear}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

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

          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {departmentReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng nhân viên"
            value={departmentReport.totalEmployees || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Tổng check-in"
            value={departmentReport.totalCheckIns || 0}
            icon={Calendar}
            color="green"
          />
          <StatCard
            title="Đi muộn"
            value={departmentReport.lateDays || 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Tỷ lệ đúng giờ"
            value={`${departmentReport.onTimeRate || 0}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      )}

      {/* Performance Chart */}
      {departmentReport && (
        <Card title="Thống kê hiệu suất">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Đúng giờ</span>
                <span className="text-sm font-medium text-green-600">
                  {departmentReport.totalCheckIns - departmentReport.lateDays} lượt
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{
                    width: `${departmentReport.onTimeRate || 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Đi muộn</span>
                <span className="text-sm font-medium text-yellow-600">
                  {departmentReport.lateDays} lượt
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-yellow-500 h-4 rounded-full transition-all"
                  style={{
                    width: `${departmentReport.totalCheckIns > 0
                      ? (departmentReport.lateDays / departmentReport.totalCheckIns * 100)
                      : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Performers */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>Nhân viên xuất sắc - {selectedDepartment}</span>
          </div>
        }
      >
        {topEmployees.length > 0 ? (
          <div className="space-y-3">
            {topEmployees.map((emp, index) => (
              <div
                key={emp.userId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-amber-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.department}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-base">
                      {emp.onTimeRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {emp.onTimeDays}/{emp.totalDays} ngày đúng giờ
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có dữ liệu nhân viên</p>
          </div>
        )}
      </Card>

      {/* Recent Attendances Table */}
      {departmentReport && departmentReport.attendances && departmentReport.attendances.length > 0 && (
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
                {departmentReport.attendances.slice(0, 20).map((att) => (
                  <tr key={att.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <div>{formatDate(att.timestamp)}</div>
                      <div className="text-gray-500">{formatTime(att.timestamp)}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{att.userName || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={att.type === 'check-in' ? 'success' : 'info'}>
                        {att.type === 'check-in' ? 'Vào' : 'Ra'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{att.method || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {att.distance ? `${att.distance}m` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {departmentReport && departmentReport.totalEmployees === 0 && (
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Chưa có nhân viên trong phòng ban {selectedDepartment}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Vui lòng thêm nhân viên vào phòng ban này
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeamReport;
