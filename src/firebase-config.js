// firebase-config.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Thay thế bằng config từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyDr-GMVOu5HM5xWn6hzgLNv6HFvKzXgy2A",
  authDomain: "attendance-system-97fda.firebaseapp.com",
  projectId: "attendance-system-97fda",
  storageBucket: "attendance-system-97fda.firebasestorage.app",
  messagingSenderId: "309062246468",
  appId: "1:309062246468:web:21e5ef0f77cae32ed99c11",
  measurementId: "G-1Z0WRMTK6F"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Đăng nhập với email và password
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu
 * @returns {Promise} User object nếu thành công
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    throw error;
  }
};

/**
 * Đăng xuất người dùng hiện tại
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    throw error;
  }
};

/**
 * Tạo tài khoản mới (chỉ admin được dùng)
 * @param {string} email - Email
 * @param {string} password - Mật khẩu
 * @param {object} userData - Thông tin người dùng (name, role, etc.)
 */
export const createUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Lưu thông tin người dùng vào Firestore
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      email: email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return uid;
  } catch (error) {
    console.error("Lỗi tạo tài khoản:", error);
    throw error;
  }
};

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

/**
 * Lấy thông tin người dùng từ Firestore
 * @param {string} uid - User ID
 * @returns {Promise} User data object
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả nhân viên (chỉ admin)
 * @returns {Promise} Array of users
 */
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('getAllUsers - Fetched users:', users); // Debug
    return users;
  } catch (error) {
    console.error("Lỗi lấy danh sách nhân viên:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param {string} uid - User ID
 * @param {object} data - Dữ liệu cần cập nhật
 */
export const updateUser = async (uid, data) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error);
    throw error;
  }
};

/**
 * Xóa người dùng (chỉ xóa data, không xóa auth)
 * @param {string} uid - User ID
 */
export const deleteUser = async (uid) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    throw error;
  }
};

// ============================================
// ATTENDANCE FUNCTIONS
// ============================================

/**
 * Tính khoảng cách giữa 2 tọa độ (đơn vị: mét)
 * @param {number} lat1 - Vĩ độ điểm 1
 * @param {number} lon1 - Kinh độ điểm 1
 * @param {number} lat2 - Vĩ độ điểm 2
 * @param {number} lon2 - Kinh độ điểm 2
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Bán kính trái đất (mét)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Khoảng cách tính bằng mét
};

/**
 * Tạo bản ghi chấm công
 * @param {object} attendanceData - Dữ liệu chấm công
 */
export const createAttendance = async (attendanceData) => {
  try {
    const docRef = await addDoc(collection(db, 'attendances'), {
      ...attendanceData,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Lỗi tạo bản ghi chấm công:", error);
    throw error;
  }
};

/**
 * Lấy lịch sử chấm công của một người dùng
 * @param {string} userId - User ID
 * @param {number} limit - Số lượng bản ghi (optional)
 */
export const getUserAttendances = async (userId, limit = 100) => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error("Lỗi lấy lịch sử chấm công:", error);
    throw error;
  }
};

/**
 * Lấy tất cả lịch sử chấm công (admin only)
 * @param {Date} startDate - Ngày bắt đầu (optional)
 * @param {Date} endDate - Ngày kết thúc (optional)
 */
export const getAllAttendances = async (startDate = null, endDate = null) => {
  try {
    let q = query(collection(db, 'attendances'), orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(q);
    let attendances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    // Filter by date if provided
    if (startDate) {
      attendances = attendances.filter(a => a.timestamp >= startDate);
    }
    if (endDate) {
      attendances = attendances.filter(a => a.timestamp <= endDate);
    }

    return attendances;
  } catch (error) {
    console.error("Lỗi lấy tất cả lịch sử chấm công:", error);
    throw error;
  }
};

/**
 * Kiểm tra chấm công hôm nay
 * @param {string} userId - User ID
 * @param {string} type - 'check-in' hoặc 'check-out'
 */
export const checkTodayAttendance = async (userId, type) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    // Kiểm tra có bản ghi nào hôm nay không
    const todayAttendance = attendances.find(a => {
      const attDate = new Date(a.timestamp);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === today.getTime();
    });

    return todayAttendance || null;
  } catch (error) {
    console.error("Lỗi kiểm tra chấm công hôm nay:", error);
    throw error;
  }
};

// ============================================
// QR CODE FUNCTIONS
// ============================================

/**
 * Lưu QR Code mới
 * @param {object} qrData - Dữ liệu QR Code
 */
export const saveQRCode = async (qrData) => {
  try {
    await setDoc(doc(db, 'qrcodes', 'company'), {
      ...qrData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Lỗi lưu QR Code:", error);
    throw error;
  }
};

/**
 * Lấy QR Code hiện tại
 */
export const getQRCode = async () => {
  try {
    const qrDoc = await getDoc(doc(db, 'qrcodes', 'company'));
    if (qrDoc.exists()) {
      return qrDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Lỗi lấy QR Code:", error);
    throw error;
  }
};

/**
 * Xác thực QR Code
 * @param {string} qrContent - Nội dung quét được từ QR
 */
export const verifyQRCode = async (qrContent) => {
  try {
    const qrData = await getQRCode();
    if (!qrData) return false;
    
    // Kiểm tra nội dung và thời gian hết hạn
    const now = new Date();
    const expiryDate = qrData.expiryDate ? qrData.expiryDate.toDate() : null;
    
    return qrData.code === qrContent && (!expiryDate || now < expiryDate);
  } catch (error) {
    console.error("Lỗi xác thực QR Code:", error);
    return false;
  }
};

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Thống kê chấm công trong tháng
 * @param {string} userId - User ID
 * @param {number} month - Tháng (1-12)
 * @param {number} year - Năm
 */
export const getMonthlyStats = async (userId, month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }))
      .filter(a => a.timestamp >= startDate && a.timestamp <= endDate);

    // Đếm số ngày check-in
    const checkInDays = new Set(
      attendances
        .filter(a => a.type === 'check-in')
        .map(a => a.timestamp.toDateString())
    ).size;

    // Đếm số lần đi muộn (sau 8:30 AM)
    const lateDays = attendances.filter(a => {
      if (a.type !== 'check-in') return false;
      const hours = a.timestamp.getHours();
      const minutes = a.timestamp.getMinutes();
      return hours > 8 || (hours === 8 && minutes > 30);
    }).length;

    // Đếm số lần về sớm (trước 5:00 PM)
    const earlyDays = attendances.filter(a => {
      if (a.type !== 'check-out') return false;
      const hours = a.timestamp.getHours();
      return hours < 17;
    }).length;

    return {
      totalDays: checkInDays,
      lateDays,
      earlyDays,
      attendances
    };
  } catch (error) {
    console.error("Lỗi thống kê tháng:", error);
    throw error;
  }
};

// Export auth và db để sử dụng trong component
export { auth, db };
// ==================== BÁO CÁO VÀ THỐNG KÊ CHO ADMIN ====================

/**
 * Lấy thống kê tổng quan toàn công ty
 * @param {number} month - Tháng (1-12)
 * @param {number} year - Năm
 * @returns {Promise<Object>} Thống kê tổng quan
 */
export const getCompanyStats = async (month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const q = query(
      collection(db, 'attendances'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Thống kê
    const stats = {
      totalAttendances: attendances.length,
      totalCheckIns: attendances.filter(a => a.type === 'check-in').length,
      totalCheckOuts: attendances.filter(a => a.type === 'check-out').length,
      gpsAttendances: attendances.filter(a => a.method === 'GPS').length,
      qrAttendances: attendances.filter(a => a.method === 'QR Code').length,
      
      // Đi muộn (sau 8:30 AM)
      lateCheckIns: attendances.filter(a => {
        if (a.type !== 'check-in') return false;
        const time = new Date(a.timestamp);
        const hours = time.getHours();
        const minutes = time.getMinutes();
        return hours > 8 || (hours === 8 && minutes > 30);
      }).length,
      
      // Về sớm (trước 5:00 PM)
      earlyCheckOuts: attendances.filter(a => {
        if (a.type !== 'check-out') return false;
        const time = new Date(a.timestamp);
        const hours = time.getHours();
        return hours < 17;
      }).length,
      
      // Thống kê theo ngày
      uniqueDays: new Set(attendances.map(a => 
        new Date(a.timestamp).toLocaleDateString()
      )).size,
      
      // Thống kê theo user
      uniqueUsers: new Set(attendances.map(a => a.userId)).size,
    };
    
    return stats;
  } catch (error) {
    console.error("Lỗi lấy thống kê công ty:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo chi tiết theo phòng ban
 * @param {string} department - Tên phòng ban
 * @param {number} month - Tháng
 * @param {number} year - Năm
 * @returns {Promise<Object>} Báo cáo phòng ban
 */
export const getDepartmentReport = async (department, month, year) => {
  try {
    // Lấy danh sách user trong phòng ban
    const usersQuery = query(
      collection(db, 'users'),
      where('department', '==', department)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      return {
        department,
        totalEmployees: 0,
        attendances: [],
        stats: {}
      };
    }
    
    // Lấy attendances của phòng ban
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const attendancesQuery = query(
      collection(db, 'attendances'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );
    
    const attendancesSnapshot = await getDocs(attendancesQuery);
    const allAttendances = attendancesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Filter attendances của phòng ban
    const departmentAttendances = allAttendances.filter(a => 
      userIds.includes(a.userId)
    );
    
    // Thống kê chi tiết theo từng nhân viên
    const employeeStats = users.map(user => {
      const userAttendances = departmentAttendances.filter(a => a.userId === user.id);
      const checkIns = userAttendances.filter(a => a.type === 'check-in');
      const checkOuts = userAttendances.filter(a => a.type === 'check-out');
      
      return {
        userId: user.id,
        userName: user.name,
        email: user.email,
        totalDays: checkIns.length,
        totalCheckIns: checkIns.length,
        totalCheckOuts: checkOuts.length,
        lateDays: checkIns.filter(a => {
          const time = new Date(a.timestamp);
          return time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 30);
        }).length,
        earlyDays: checkOuts.filter(a => {
          const time = new Date(a.timestamp);
          return time.getHours() < 17;
        }).length,
      };
    });
    
    return {
      department,
      totalEmployees: users.length,
      attendances: departmentAttendances,
      employeeStats,
      summary: {
        totalAttendances: departmentAttendances.length,
        averageDaysPerEmployee: (departmentAttendances.filter(a => a.type === 'check-in').length / users.length).toFixed(1),
        totalLateDays: employeeStats.reduce((sum, e) => sum + e.lateDays, 0),
        totalEarlyDays: employeeStats.reduce((sum, e) => sum + e.earlyDays, 0),
      }
    };
  } catch (error) {
    console.error("Lỗi lấy báo cáo phòng ban:", error);
    throw error;
  }
};

/**
 * Lấy báo cáo chi tiết của 1 nhân viên
 * @param {string} userId - ID nhân viên
 * @param {number} month - Tháng
 * @param {number} year - Năm
 * @returns {Promise<Object>} Báo cáo nhân viên
 */
export const getEmployeeReport = async (userId, month, year) => {
  try {
    // Lấy thông tin user
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('Không tìm thấy nhân viên');
    }
    const userData = { id: userDoc.id, ...userDoc.data() };
    
    // Lấy attendances
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const q = query(
      collection(db, 'attendances'),
      where('userId', '==', userId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    // Phân tích chi tiết theo ngày
    const dailyRecords = {};
    attendances.forEach(att => {
      const dateKey = new Date(att.timestamp).toLocaleDateString('vi-VN');
      if (!dailyRecords[dateKey]) {
        dailyRecords[dateKey] = {
          date: dateKey,
          checkIn: null,
          checkOut: null,
          status: 'absent'
        };
      }
      
      if (att.type === 'check-in') {
        dailyRecords[dateKey].checkIn = att;
        const time = new Date(att.timestamp);
        const isLate = time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 30);
        dailyRecords[dateKey].status = isLate ? 'late' : 'on-time';
      }
      
      if (att.type === 'check-out') {
        dailyRecords[dateKey].checkOut = att;
        const time = new Date(att.timestamp);
        const isEarly = time.getHours() < 17;
        if (isEarly) {
          dailyRecords[dateKey].earlyLeave = true;
        }
      }
    });
    
    // Thống kê
    const checkIns = attendances.filter(a => a.type === 'check-in');
    const checkOuts = attendances.filter(a => a.type === 'check-out');
    
    const stats = {
      totalDays: checkIns.length,
      totalCheckIns: checkIns.length,
      totalCheckOuts: checkOuts.length,
      lateDays: checkIns.filter(a => {
        const time = new Date(a.timestamp);
        return time.getHours() > 8 || (time.getHours() === 8 && time.getMinutes() > 30);
      }).length,
      earlyDays: checkOuts.filter(a => {
        const time = new Date(a.timestamp);
        return time.getHours() < 17;
      }).length,
      onTimeDays: checkIns.filter(a => {
        const time = new Date(a.timestamp);
        return time.getHours() < 8 || (time.getHours() === 8 && time.getMinutes() <= 30);
      }).length,
      gpsCheckIns: attendances.filter(a => a.method === 'GPS').length,
      qrCheckIns: attendances.filter(a => a.method === 'QR Code').length,
    };
    
    return {
      user: userData,
      attendances,
      dailyRecords: Object.values(dailyRecords),
      stats
    };
  } catch (error) {
    console.error("Lỗi lấy báo cáo nhân viên:", error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả phòng ban
 * @returns {Promise<Array>} Danh sách phòng ban
 */
export const getAllDepartments = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const departments = new Set();
    
    usersSnapshot.docs.forEach(doc => {
      const dept = doc.data().department;
      if (dept) {
        departments.add(dept);
      }
    });
    
    return Array.from(departments).sort();
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng ban:", error);
    throw error;
  }
};

/**
 * Xuất báo cáo CSV chi tiết cho admin
 * @param {string} type - Loại báo cáo: 'company', 'department', 'employee'
 * @param {Object} data - Dữ liệu báo cáo
 * @param {string} filename - Tên file
 */
export const exportDetailedCSV = (type, data, filename) => {
  let csv = '';
  
  if (type === 'company') {
    csv = 'BÁO CÁO TỔNG HỢP CÔNG TY\n\n';
    csv += 'Chỉ số,Giá trị\n';
    csv += `Tổng lượt chấm công,${data.totalAttendances}\n`;
    csv += `Tổng check-in,${data.totalCheckIns}\n`;
    csv += `Tổng check-out,${data.totalCheckOuts}\n`;
    csv += `Chấm công GPS,${data.gpsAttendances}\n`;
    csv += `Chấm công QR,${data.qrAttendances}\n`;
    csv += `Số nhân viên hoạt động,${data.uniqueUsers}\n`;
    csv += `Số ngày làm việc,${data.uniqueDays}\n`;
    csv += `Tổng số lần đi muộn,${data.lateCheckIns}\n`;
    csv += `Tổng số lần về sớm,${data.earlyCheckOuts}\n`;
  } else if (type === 'department') {
    csv = `BÁO CÁO PHÒNG BAN: ${data.department}\n\n`;
    csv += 'Họ tên,Email,Tổng ngày làm,Check-in,Check-out,Đi muộn,Về sớm\n';
    data.employeeStats.forEach(emp => {
      csv += `${emp.userName},${emp.email},${emp.totalDays},${emp.totalCheckIns},${emp.totalCheckOuts},${emp.lateDays},${emp.earlyDays}\n`;
    });
    csv += `\nTÓM TẮT\n`;
    csv += `Tổng nhân viên,${data.totalEmployees}\n`;
    csv += `Trung bình ngày làm/người,${data.summary.averageDaysPerEmployee}\n`;
    csv += `Tổng lần đi muộn,${data.summary.totalLateDays}\n`;
    csv += `Tổng lần về sớm,${data.summary.totalEarlyDays}\n`;
  } else if (type === 'employee') {
    csv = `BÁO CÁO NHÂN VIÊN: ${data.user.name}\n`;
    csv += `Email: ${data.user.email}\n`;
    csv += `Phòng ban: ${data.user.department || 'N/A'}\n\n`;
    csv += 'Ngày,Check-in,Check-out,Trạng thái,Ghi chú\n';
    data.dailyRecords.forEach(record => {
      const checkInTime = record.checkIn ? new Date(record.checkIn.timestamp).toLocaleTimeString('vi-VN') : '-';
      const checkOutTime = record.checkOut ? new Date(record.checkOut.timestamp).toLocaleTimeString('vi-VN') : '-';
      const status = record.status === 'late' ? 'Đi muộn' : record.status === 'on-time' ? 'Đúng giờ' : 'Vắng';
      const note = record.earlyLeave ? 'Về sớm' : '';
      csv += `${record.date},${checkInTime},${checkOutTime},${status},${note}\n`;
    });
    csv += `\nTHỐNG KÊ\n`;
    csv += `Tổng ngày làm,${data.stats.totalDays}\n`;
    csv += `Đúng giờ,${data.stats.onTimeDays}\n`;
    csv += `Đi muộn,${data.stats.lateDays}\n`;
    csv += `Về sớm,${data.stats.earlyDays}\n`;
  }
  
  // Download file
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/**
 * Lấy top nhân viên chấm công đúng giờ nhất
 * @param {number} month - Tháng
 * @param {number} year - Năm
 * @param {number} limit - Số lượng top
 * @returns {Promise<Array>} Top nhân viên
 */
export const getTopEmployees = async (month, year, limit = 10) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const attendancesQuery = query(
      collection(db, 'attendances'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      where('type', '==', 'check-in')
    );
    
    const snapshot = await getDocs(attendancesQuery);
    const attendances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Tính điểm cho mỗi nhân viên
    const employeeScores = {};
    
    attendances.forEach(att => {
      if (!employeeScores[att.userId]) {
        employeeScores[att.userId] = {
          userId: att.userId,
          userName: att.userName,
          totalDays: 0,
          onTimeDays: 0,
          lateDays: 0,
          score: 0
        };
      }
      
      const time = new Date(att.timestamp);
      const isOnTime = time.getHours() < 8 || (time.getHours() === 8 && time.getMinutes() <= 30);
      
      employeeScores[att.userId].totalDays++;
      if (isOnTime) {
        employeeScores[att.userId].onTimeDays++;
        employeeScores[att.userId].score += 10; // Điểm thưởng đúng giờ
      } else {
        employeeScores[att.userId].lateDays++;
        employeeScores[att.userId].score -= 5; // Trừ điểm đi muộn
      }
    });
    
    // Sắp xếp và lấy top
    const topEmployees = Object.values(employeeScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return topEmployees;
  } catch (error) {
    console.error("Lỗi lấy top nhân viên:", error);
    throw error;
  }
};