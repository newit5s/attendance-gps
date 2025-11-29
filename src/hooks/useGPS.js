// src/hooks/useGPS.js
// GPS location hook

import { useState, useCallback, useEffect } from 'react';
import { OFFICE_LOCATION } from '../constants/config';
import { calculateDistance } from '../services/attendance';

/**
 * Hook lấy vị trí GPS và tính khoảng cách
 * @param {object} options - { autoFetch: boolean, targetLocation: object }
 */
export const useGPS = (options = {}) => {
  const { 
    autoFetch = false, 
    targetLocation = OFFICE_LOCATION 
  } = options;

  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy vị trí hiện tại
   */
  const fetchLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        const err = 'Trình duyệt không hỗ trợ GPS';
        setError(err);
        setLoading(false);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const newLocation = { lat: latitude, lng: longitude, accuracy };
          setLocation(newLocation);

          // Tính khoảng cách đến văn phòng
          if (targetLocation) {
            const dist = calculateDistance(
              latitude, longitude,
              targetLocation.lat, targetLocation.lng
            );
            setDistance(Math.round(dist));
          }

          setLoading(false);
          resolve(newLocation);
        },
        (err) => {
          let errorMsg = 'Không thể lấy vị trí';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Vui lòng cho phép truy cập vị trí';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Không thể xác định vị trí';
              break;
            case err.TIMEOUT:
              errorMsg = 'Hết thời gian chờ lấy vị trí';
              break;
            default:
              errorMsg = 'Lỗi không xác định';
          }
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }, [targetLocation]);

  /**
   * Refresh location
   */
  const refresh = useCallback(() => {
    return fetchLocation();
  }, [fetchLocation]);

  /**
   * Kiểm tra có trong phạm vi không
   */
  const isInRange = useCallback(() => {
    if (distance === null || !targetLocation) return false;
    return distance <= targetLocation.radius;
  }, [distance, targetLocation]);

  // Auto fetch khi mount
  useEffect(() => {
    if (autoFetch) {
      fetchLocation().catch(() => {});
    }
  }, [autoFetch, fetchLocation]);

  return {
    location,
    distance,
    loading,
    error,
    isInRange: isInRange(),
    refresh,
    fetchLocation
  };
};

export default useGPS;
