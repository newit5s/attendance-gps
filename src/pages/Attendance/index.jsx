// src/pages/Attendance/index.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, QrCode, CheckCircle, XCircle, RefreshCw, Camera, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAttendance } from '../../hooks/useAttendance';
import { useGPS } from '../../hooks/useGPS';
import { verifyQRCode } from '../../services/qrcode';
import { OFFICE_LOCATION } from '../../constants/config';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { formatDistance } from '../../utils/formatters';

const Attendance = () => {
  const { 
    todayCheckIn, 
    todayCheckOut, 
    hasCheckedIn, 
    hasCheckedOut,
    checkIn, 
    checkOut, 
    loading: attendanceLoading 
  } = useAttendance();

  const { 
    location, 
    distance, 
    loading: gpsLoading, 
    error: gpsError, 
    isInRange,
    refresh: refreshGPS 
  } = useGPS({ autoFetch: true });

  const [method, setMethod] = useState('gps'); // 'gps' | 'qr'
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Cleanup scanner khi unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start QR Scanner
  const startScanner = async () => {
    try {
      setScanning(true);
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleQRResult(decodedText);
          stopScanner();
        },
        () => {} // Ignore errors during scanning
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setMessage({ type: 'error', text: 'Không thể mở camera. Vui lòng kiểm tra quyền truy cập.' });
      setScanning(false);
    }
  };

  // Stop QR Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Stop scanner error:', err);
      }
    }
    setScanning(false);
  };

  // Handle QR Result
  // ✅ Fixed: Thêm GPS validation cho QR code
  const handleQRResult = async (qrContent) => {
    setProcessing(true);
    try {
      // 1. Verify QR code
      const isValid = await verifyQRCode(qrContent);
      if (!isValid) {
        setMessage({ type: 'error', text: 'QR Code không hợp lệ hoặc đã hết hạn!' });
        return;
      }

      // 2. Verify GPS location (must be in range)
      if (!location) {
        setMessage({ type: 'error', text: 'Chưa xác định được vị trí. Vui lòng bật GPS và thử lại.' });
        return;
      }

      if (!isInRange) {
        setMessage({
          type: 'error',
          text: `QR Code hợp lệ nhưng bạn đang ở ngoài phạm vi văn phòng (${formatDistance(distance)} > ${OFFICE_LOCATION.radius}m)`
        });
        return;
      }

      // 3. Proceed with attendance
      await handleAttendance('QR Code');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // Handle GPS Attendance
  const handleGPSAttendance = async () => {
    if (!location) {
      setMessage({ type: 'error', text: 'Chưa xác định được vị trí. Vui lòng thử lại.' });
      return;
    }

    if (!isInRange) {
      setMessage({ 
        type: 'error', 
        text: `Bạn đang ở ngoài phạm vi văn phòng (${formatDistance(distance)} > ${OFFICE_LOCATION.radius}m)` 
      });
      return;
    }

    await handleAttendance('GPS');
  };

  // Handle Attendance (check-in or check-out)
  const handleAttendance = async (attendanceMethod) => {
    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      if (!hasCheckedIn) {
        await checkIn(attendanceMethod, location, distance);
        setMessage({ type: 'success', text: 'Check-in thành công!' });
      } else if (!hasCheckedOut) {
        await checkOut(attendanceMethod, location, distance);
        setMessage({ type: 'success', text: 'Check-out thành công!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const isLoading = attendanceLoading || gpsLoading || processing;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <Card title="Trạng thái hôm nay">
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${hasCheckedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
              {hasCheckedIn ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="font-medium">Check-in</p>
            <p className="text-sm text-gray-500">
              {todayCheckIn ? new Date(todayCheckIn.timestamp).toLocaleTimeString('vi-VN') : '--:--'}
            </p>
          </div>

          <div className="w-16 h-0.5 bg-gray-200"></div>

          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${hasCheckedOut ? 'bg-green-100' : 'bg-gray-100'}`}>
              {hasCheckedOut ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="font-medium">Check-out</p>
            <p className="text-sm text-gray-500">
              {todayCheckOut ? new Date(todayCheckOut.timestamp).toLocaleTimeString('vi-VN') : '--:--'}
            </p>
          </div>
        </div>
      </Card>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Method Selection */}
      {!hasCheckedOut && (
        <Card title="Chọn phương thức chấm công">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMethod('gps')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                method === 'gps' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin className={`w-8 h-8 mx-auto mb-2 ${method === 'gps' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium">GPS</p>
            </button>

            <button
              onClick={() => setMethod('qr')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                method === 'qr' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <QrCode className={`w-8 h-8 mx-auto mb-2 ${method === 'qr' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium">QR Code</p>
            </button>
          </div>

          {/* GPS Method */}
          {method === 'gps' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Khoảng cách đến văn phòng:</span>
                  <button onClick={refreshGPS} className="p-1 hover:bg-gray-200 rounded">
                    <RefreshCw className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className={`text-2xl font-bold ${isInRange ? 'text-green-600' : 'text-red-600'}`}>
                  {distance !== null ? formatDistance(distance) : 'Đang xác định...'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Phạm vi cho phép: {OFFICE_LOCATION.radius}m
                </p>
                {gpsError && (
                  <p className="text-sm text-red-500 mt-2">{gpsError}</p>
                )}
              </div>

              <Button
                onClick={handleGPSAttendance}
                fullWidth
                loading={isLoading}
                disabled={!isInRange || isLoading}
                variant={isInRange ? 'success' : 'secondary'}
              >
                <MapPin className="w-5 h-5 mr-2" />
                {hasCheckedIn ? 'Check-out bằng GPS' : 'Check-in bằng GPS'}
              </Button>
            </div>
          )}

          {/* QR Method */}
          {method === 'qr' && (
            <div className="space-y-4">
              {!scanning ? (
                <Button
                  onClick={startScanner}
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Mở camera quét QR
                </Button>
              ) : (
                <div className="space-y-4">
                  <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
                  <Button
                    onClick={stopScanner}
                    fullWidth
                    variant="secondary"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Đóng camera
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Completed message */}
      {hasCheckedOut && (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Hoàn thành chấm công hôm nay!</h3>
            <p className="text-gray-500 mt-2">Bạn đã check-in và check-out thành công.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
