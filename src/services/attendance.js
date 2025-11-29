// src/services/attendance.js
// Attendance management service

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { WORKING_HOURS } from '../constants/config';

const COLLECTION = 'attendances';

/**
 * Helper: Lấy ngày local (không dùng UTC)
 * ✅ Fixed: Sử dụng local timezone thay vì UTC
 */
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
};

/**
 * Tạo bản ghi chấm công
 * ✅ Fixed: Sử dụng local timezone
 * @param {object} data - {userId, userName, type, method, location, distance, deviceId}
 * @returns {Promise<string>} Document ID
 */
export const createAttendance = async (data) => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      status: 'success',
      timestamp: Timestamp.now(),
      date: getLocalDateString(now), // Use local timezone
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
    return docRef.id;
  } catch (error) {
    console.error('Lỗi tạo chấm công:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử chấm công của 1 user
 * @param {string} userId
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getUserAttendances = async (userId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy attendances:', error);
    throw error;
  }
};

/**
 * Lấy tất cả chấm công (admin)
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getAllAttendances = async (limitCount = 500) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy all attendances:', error);
    throw error;
  }
};

/**
 * Kiểm tra đã chấm công hôm nay chưa
 * ✅ Fixed: Sử dụng local timezone
 * @param {string} userId
 * @param {string} type - 'check-in' hoặc 'check-out'
 * @returns {Promise<object|null>}
 */
export const checkTodayAttendance = async (userId, type) => {
  try {
    const today = getLocalDateString(); // Use local timezone
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('date', '==', today),
      where('type', '==', type)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Lỗi check today attendance:', error);
    throw error;
  }
};

/**
 * Lấy thống kê chấm công theo tháng
 * @param {string} userId
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getMonthlyStats = async (userId, month, year) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map(doc => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    
    const checkIns = attendances.filter(a => a.type === 'check-in');
    const checkOuts = attendances.filter(a => a.type === 'check-out');
    
    let lateDays = 0;
    let earlyDays = 0;
    
    checkIns.forEach(record => {
      if (isLateCheckIn(record.timestamp)) lateDays++;
    });
    
    checkOuts.forEach(record => {
      if (isEarlyCheckOut(record.timestamp)) earlyDays++;
    });
    
    return {
      totalDays: checkIns.length,
      lateDays,
      earlyDays,
      onTimeDays: checkIns.length - lateDays,
      checkIns,
      checkOuts
    };
  } catch (error) {
    console.error('Lỗi lấy monthly stats:', error);
    throw error;
  }
};

/**
 * Lấy attendances theo khoảng thời gian
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} userId - optional
 * @returns {Promise<Array>}
 */
export const getAttendancesByDateRange = async (startDate, endDate, userId = null) => {
  try {
    let q;
    
    if (userId) {
      q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy attendances by date range:', error);
    throw error;
  }
};

/**
 * Kiểm tra có phải đi muộn không
 * @param {Date} timestamp
 * @returns {boolean}
 */
export const isLateCheckIn = (timestamp) => {
  if (!timestamp) return false;
  const { start, lateThreshold } = WORKING_HOURS;
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const allowedMinutes = start.hour * 60 + start.minute + lateThreshold;
  return totalMinutes > allowedMinutes;
};

/**
 * Kiểm tra có phải về sớm không
 * @param {Date} timestamp
 * @returns {boolean}
 */
export const isEarlyCheckOut = (timestamp) => {
  if (!timestamp) return false;
  const { end, earlyThreshold } = WORKING_HOURS;
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const requiredMinutes = end.hour * 60 + end.minute - earlyThreshold;
  return totalMinutes < requiredMinutes;
};

/**
 * Tính khoảng cách GPS (Haversine formula)
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Khoảng cách (mét)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Bán kính trái đất (mét)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
