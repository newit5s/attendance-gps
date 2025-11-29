// src/services/reports.js
// Reports and statistics service

import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { isLateCheckIn, isEarlyCheckOut } from './attendance';

/**
 * Lấy thống kê tổng quan công ty
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getCompanyStats = async (month, year) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('month', '==', month),
      where('year', '==', year)
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    const checkIns = attendances.filter(a => a.type === 'check-in');
    const checkOuts = attendances.filter(a => a.type === 'check-out');
    
    // Đếm đi muộn/về sớm
    let lateCheckIns = 0;
    let earlyCheckOuts = 0;
    
    checkIns.forEach(record => {
      if (isLateCheckIn(record.timestamp)) lateCheckIns++;
    });
    
    checkOuts.forEach(record => {
      if (isEarlyCheckOut(record.timestamp)) earlyCheckOuts++;
    });
    
    // Đếm unique users
    const uniqueUsers = new Set(attendances.map(a => a.userId));
    
    return {
      totalAttendances: attendances.length,
      totalCheckIns: checkIns.length,
      totalCheckOuts: checkOuts.length,
      gpsAttendances: attendances.filter(a => a.method === 'GPS').length,
      qrAttendances: attendances.filter(a => a.method === 'QR Code').length,
      lateCheckIns,
      earlyCheckOuts,
      uniqueEmployees: uniqueUsers.size,
      onTimeRate: checkIns.length > 0 
        ? Math.round(((checkIns.length - lateCheckIns) / checkIns.length) * 100) 
        : 0
    };
  } catch (error) {
    console.error('Lỗi lấy company stats:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo theo phòng ban
 * ✅ Fixed: Optimized N+1 query - fetch all attendances in one query
 * @param {string} department
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getDepartmentReport = async (department, month, year) => {
  try {
    // Lấy users trong department
    const usersQuery = query(
      collection(db, 'users'),
      where('department', '==', department),
      where('status', '==', 'active')
    );
    const usersSnapshot = await getDocs(usersQuery);
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return {
        department,
        totalEmployees: 0,
        attendances: [],
        stats: {}
      };
    }

    // ✅ Fixed: Fetch all attendances for the month/year in ONE query
    // then filter by userIds in memory (more efficient than N queries)
    const q = query(
      collection(db, 'attendances'),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      .filter(att => userIds.includes(att.userId)); // Filter in memory

    const checkIns = attendances.filter(a => a.type === 'check-in');
    let lateDays = 0;

    checkIns.forEach(record => {
      if (isLateCheckIn(record.timestamp)) lateDays++;
    });

    return {
      department,
      totalEmployees: userIds.length,
      totalCheckIns: checkIns.length,
      lateDays,
      onTimeRate: checkIns.length > 0
        ? Math.round(((checkIns.length - lateDays) / checkIns.length) * 100)
        : 0,
      attendances
    };
  } catch (error) {
    console.error('Lỗi lấy department report:', error);
    throw error;
  }
};

/**
 * Lấy báo cáo chi tiết của 1 nhân viên
 * @param {string} userId
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getEmployeeReport = async (userId, month, year) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year),
      orderBy('timestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    // Nhóm theo ngày
    const dailyRecords = {};
    attendances.forEach(record => {
      const date = record.date;
      if (!dailyRecords[date]) {
        dailyRecords[date] = { date, checkIn: null, checkOut: null };
      }
      if (record.type === 'check-in') {
        dailyRecords[date].checkIn = record;
      } else {
        dailyRecords[date].checkOut = record;
      }
    });
    
    // Tính stats
    const records = Object.values(dailyRecords);
    let lateDays = 0;
    let earlyDays = 0;
    let totalWorkingHours = 0;
    
    records.forEach(day => {
      if (day.checkIn && isLateCheckIn(day.checkIn.timestamp)) {
        lateDays++;
        day.status = 'late';
      } else if (day.checkIn) {
        day.status = 'on-time';
      }
      
      if (day.checkOut && isEarlyCheckOut(day.checkOut.timestamp)) {
        earlyDays++;
        day.earlyLeave = true;
      }
      
      // Tính giờ làm việc
      if (day.checkIn && day.checkOut) {
        const hours = (day.checkOut.timestamp - day.checkIn.timestamp) / (1000 * 60 * 60);
        totalWorkingHours += hours;
        day.workingHours = hours.toFixed(2);
      }
    });
    
    return {
      userId,
      month,
      year,
      records: records.sort((a, b) => new Date(b.date) - new Date(a.date)),
      stats: {
        totalDays: records.filter(r => r.checkIn).length,
        lateDays,
        earlyDays,
        onTimeDays: records.filter(r => r.checkIn).length - lateDays,
        totalWorkingHours: totalWorkingHours.toFixed(2),
        avgWorkingHours: records.length > 0 
          ? (totalWorkingHours / records.length).toFixed(2)
          : 0
      }
    };
  } catch (error) {
    console.error('Lỗi lấy employee report:', error);
    throw error;
  }
};

/**
 * Lấy bảng xếp hạng nhân viên tốt nhất
 * ✅ Fixed: Optimized N+1 query - fetch all data once, process in memory
 * @param {number} month
 * @param {number} year
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export const getTopEmployees = async (month, year, limitCount = 10) => {
  try {
    // ✅ Fetch users and attendances in parallel (2 queries instead of N+1)
    const [usersSnapshot, attendancesSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('status', '==', 'active'))),
      getDocs(query(
        collection(db, 'attendances'),
        where('month', '==', month),
        where('year', '==', year)
      ))
    ]);

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const allAttendances = attendancesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    // Group attendances by userId in memory
    const attendancesByUser = {};
    allAttendances.forEach(att => {
      if (!attendancesByUser[att.userId]) {
        attendancesByUser[att.userId] = [];
      }
      attendancesByUser[att.userId].push(att);
    });

    // Calculate stats for each user
    const rankings = [];

    for (const user of users) {
      if (user.role === 'admin') continue; // Skip admin

      const userAttendances = attendancesByUser[user.id] || [];
      const checkIns = userAttendances.filter(a => a.type === 'check-in');

      let lateDays = 0;
      checkIns.forEach(record => {
        if (isLateCheckIn(record.timestamp)) lateDays++;
      });

      const totalDays = checkIns.length;
      const onTimeDays = totalDays - lateDays;

      rankings.push({
        userId: user.id,
        name: user.name,
        department: user.department,
        totalDays,
        onTimeDays,
        lateDays,
        onTimeRate: totalDays > 0
          ? Math.round((onTimeDays / totalDays) * 100)
          : 0
      });
    }

    // Sort by on-time rate and total days
    return rankings
      .sort((a, b) => {
        if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
        return b.totalDays - a.totalDays;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error('Lỗi lấy top employees:', error);
    throw error;
  }
};

/**
 * Export dữ liệu CSV
 * @param {Array} data
 * @param {string} filename
 */
export const exportToCSV = (data, filename) => {
  const BOM = '\uFEFF';
  const csv = BOM + data;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Tạo CSV content từ employee report
 * @param {object} report
 * @param {object} user
 * @returns {string}
 */
export const generateEmployeeCSV = (report, user) => {
  let csv = `BÁO CÁO CHẤM CÔNG\n`;
  csv += `Nhân viên: ${user.name}\n`;
  csv += `Phòng ban: ${user.department || 'N/A'}\n`;
  csv += `Tháng: ${report.month}/${report.year}\n\n`;
  
  csv += `THỐNG KÊ\n`;
  csv += `Tổng ngày làm,${report.stats.totalDays}\n`;
  csv += `Đúng giờ,${report.stats.onTimeDays}\n`;
  csv += `Đi muộn,${report.stats.lateDays}\n`;
  csv += `Về sớm,${report.stats.earlyDays}\n`;
  csv += `Tổng giờ làm,${report.stats.totalWorkingHours}\n\n`;
  
  csv += `CHI TIẾT\n`;
  csv += `Ngày,Check-in,Check-out,Trạng thái,Giờ làm\n`;
  
  report.records.forEach(record => {
    const checkIn = record.checkIn 
      ? new Date(record.checkIn.timestamp).toLocaleTimeString('vi-VN')
      : '-';
    const checkOut = record.checkOut
      ? new Date(record.checkOut.timestamp).toLocaleTimeString('vi-VN')
      : '-';
    const status = record.status === 'late' ? 'Đi muộn' : 'Đúng giờ';
    const hours = record.workingHours || '-';
    
    csv += `${record.date},${checkIn},${checkOut},${status},${hours}\n`;
  });
  
  return csv;
};
