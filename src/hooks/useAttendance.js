// src/hooks/useAttendance.js
// Attendance management hook

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { 
  createAttendance, 
  checkTodayAttendance, 
  getUserAttendances,
  getMonthlyStats 
} from '../services/attendance';

/**
 * Hook quản lý chấm công
 */
export const useAttendance = () => {
  const { user, userData } = useAuthContext();
  
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [todayCheckOut, setTodayCheckOut] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load dữ liệu chấm công
   */
  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Kiểm tra chấm công hôm nay
      const [checkIn, checkOut] = await Promise.all([
        checkTodayAttendance(user.uid, 'check-in'),
        checkTodayAttendance(user.uid, 'check-out')
      ]);
      setTodayCheckIn(checkIn);
      setTodayCheckOut(checkOut);
      
      // Lấy lịch sử
      const history = await getUserAttendances(user.uid);
      setAttendances(history);
      
      // Lấy thống kê tháng
      const now = new Date();
      const stats = await getMonthlyStats(user.uid, now.getMonth() + 1, now.getFullYear());
      setMonthlyStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Check-in
   */
  const checkIn = useCallback(async (method, location, distance, deviceId = null) => {
    if (!user || !userData) {
      throw new Error('Chưa đăng nhập');
    }
    
    if (todayCheckIn) {
      throw new Error('Bạn đã check-in hôm nay rồi!');
    }
    
    setLoading(true);
    try {
      await createAttendance({
        userId: user.uid,
        userName: userData.name,
        type: 'check-in',
        method,
        location,
        distance,
        deviceId
      });
      
      // Reload data
      await loadData();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, userData, todayCheckIn, loadData]);

  /**
   * Check-out
   */
  const checkOut = useCallback(async (method, location, distance, deviceId = null) => {
    if (!user || !userData) {
      throw new Error('Chưa đăng nhập');
    }
    
    if (!todayCheckIn) {
      throw new Error('Bạn chưa check-in hôm nay!');
    }
    
    if (todayCheckOut) {
      throw new Error('Bạn đã check-out hôm nay rồi!');
    }
    
    setLoading(true);
    try {
      await createAttendance({
        userId: user.uid,
        userName: userData.name,
        type: 'check-out',
        method,
        location,
        distance,
        deviceId
      });
      
      // Reload data
      await loadData();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, userData, todayCheckIn, todayCheckOut, loadData]);

  // Load data khi mount và khi user thay đổi
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    todayCheckIn,
    todayCheckOut,
    attendances,
    monthlyStats,
    loading,
    error,
    
    // Computed
    hasCheckedIn: !!todayCheckIn,
    hasCheckedOut: !!todayCheckOut,
    
    // Actions
    checkIn,
    checkOut,
    refresh: loadData
  };
};

export default useAttendance;
