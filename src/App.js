// App.js - Hệ thống Chấm công GPS & QR Code
import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, MapPin, QrCode, Users, Clock, 
  Calendar, Download, Plus, Trash2, 
  CheckCircle, XCircle, Moon, Sun, Camera, X,
  AlertCircle, TrendingUp, TrendingDown, Home,
  RefreshCw, BarChart, FileText 
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import {
  auth,
  loginUser,
  logoutUser,
  getUserData,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createAttendance,
  getUserAttendances,
  getAllAttendances,
  checkTodayAttendance,
  calculateDistance,
  saveQRCode,
  getQRCode,
  verifyQRCode,
  getMonthlyStats,
  getCompanyStats,
  getDepartmentReport,
  getEmployeeReport,
  getAllDepartments,
  exportDetailedCSV,
  getTopEmployees
} from './firebase-config';

// ============================================
// CẤU HÌNH VỊ TRÍ VĂN PHÒNG
// ============================================
const OFFICE_LOCATION = {
  lat: 10.876501348898863, // Vĩ độ văn phòng (Thay bằng tọa độ thực của bạn)
  lng: 106.6296071401844, // Kinh độ văn phòng
  radius: 100 // Bán kính cho phép (mét)
  
};

function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // View states
  const [activeView, setActiveView] = useState('dashboard');
  
  // Attendance states
  const [attendances, setAttendances] = useState([]);
  const [todayCheckIn, setTodayCheckIn] = useState(null);
  const [todayCheckOut, setTodayCheckOut] = useState(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  // QR Code states
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const qrScannerRef = useRef(null);
  // States cho Reports
  const [reportType, setReportType] = useState('company');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Admin states
  const [allUsers, setAllUsers] = useState([]);
  const [allAttendances, setAllAttendances] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    phone: ''
  });
  
  // Stats states
  const [monthlyStats, setMonthlyStats] = useState(null);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Theo dõi trạng thái authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          loadUserData(user.uid, data.role);
        } catch (error) {
          console.error('Lỗi tải dữ liệu:', error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  // Load departments khi user là admin
  useEffect(() => {
    if (userData?.role === 'admin') {
      loadDepartments();
    }
  }, [userData]);
  // Tải dữ liệu người dùng
  const loadUserData = async (userId, role) => {
    try {
      // Lấy lịch sử chấm công
      const userAtt = await getUserAttendances(userId);
      setAttendances(userAtt);

      // Kiểm tra chấm công hôm nay
      const checkIn = await checkTodayAttendance(userId, 'check-in');
      const checkOut = await checkTodayAttendance(userId, 'check-out');
      setTodayCheckIn(checkIn);
      setTodayCheckOut(checkOut);

      // Nếu là admin, tải thêm dữ liệu
      if (role === 'admin') {
        try {
          const users = await getAllUsers();
          console.log('Loaded users:', users); // Debug
          setAllUsers(users);
          
          const allAtt = await getAllAttendances();
          setAllAttendances(allAtt);
          
          loadQRCode();
        } catch (error) {
          console.error('Lỗi load admin data:', error);
        }
      }

      // Tải thống kê tháng này
      const now = new Date();
      const stats = await getMonthlyStats(userId, now.getMonth() + 1, now.getFullYear());
      setMonthlyStats(stats);

      // Lấy vị trí hiện tại
      getCurrentLocation();
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    }
  };

  // ============================================
  // AUTHENTICATION FUNCTIONS
  // ============================================
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await loginUser(email, password);
    } catch (error) {
      setAuthError('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveView('dashboard');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  // ============================================
  // GPS FUNCTIONS
  // ============================================
  
  const getCurrentLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          
          // Tính khoảng cách đến văn phòng
          const dist = calculateDistance(
            loc.lat,
            loc.lng,
            OFFICE_LOCATION.lat,
            OFFICE_LOCATION.lng
          );
          setDistance(dist);
          setGpsLoading(false);
        },
        (error) => {
          console.error('Lỗi lấy vị trí:', error);
          alert('Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí.');
          setGpsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ GPS');
      setGpsLoading(false);
    }
  };

  const handleGPSCheckIn = async (type) => {
    if (!location) {
      alert('Đang lấy vị trí... Vui lòng thử lại.');
      getCurrentLocation();
      return;
    }

    if (distance > OFFICE_LOCATION.radius) {
      alert(`Bạn đang ở xa văn phòng ${Math.round(distance)}m. Vui lòng đến gần hơn (trong vòng ${OFFICE_LOCATION.radius}m).`);
      return;
    }

    // Kiểm tra đã chấm công chưa
    if (type === 'check-in' && todayCheckIn) {
      alert('Bạn đã check-in hôm nay rồi!');
      return;
    }
    if (type === 'check-out' && todayCheckOut) {
      alert('Bạn đã check-out hôm nay rồi!');
      return;
    }
    if (type === 'check-out' && !todayCheckIn) {
      alert('Bạn chưa check-in, không thể check-out!');
      return;
    }

    try {
      const attendanceData = {
        userId: currentUser.uid,
        userName: userData.name,
        type: type,
        method: 'GPS',
        location: {
          lat: location.lat,
          lng: location.lng
        },
        distance: Math.round(distance),
        status: 'success'
      };

      await createAttendance(attendanceData);
      alert(`${type === 'check-in' ? 'Check-in' : 'Check-out'} thành công!`);
      
      // Reload dữ liệu
      loadUserData(currentUser.uid, userData.role);
    } catch (error) {
      console.error('Lỗi chấm công:', error);
      alert('Chấm công thất bại. Vui lòng thử lại.');
    }
  };

  // ============================================
  // QR CODE FUNCTIONS
  // ============================================
  
  const loadQRCode = async () => {
    try {
      const qrData = await getQRCode();
      if (qrData && qrData.imageUrl) {
        setQrCodeImage(qrData.imageUrl);
      }
    } catch (error) {
      console.error('Lỗi tải QR Code:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrContent = `COMPANY_QR_${Date.now()}`;
      const qrImageUrl = await QRCodeLib.toDataURL(qrContent, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      await saveQRCode({
        code: qrContent,
        imageUrl: qrImageUrl,
        expiryDate: null // Không hết hạn
      });

      setQrCodeImage(qrImageUrl);
      alert('Tạo QR Code mới thành công!');
    } catch (error) {
      console.error('Lỗi tạo QR Code:', error);
      alert('Tạo QR Code thất bại.');
    }
  };

  const startQRScanner = () => {
    setQrScanning(true);
    
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Quét thành công
          stopQRScanner();
          
          // Xác thực QR Code
          const isValid = await verifyQRCode(decodedText);
          if (!isValid) {
            alert('QR Code không hợp lệ!');
            return;
          }

          // Xác định check-in hay check-out
          const type = !todayCheckIn ? 'check-in' : 'check-out';
          
          if (type === 'check-out' && todayCheckOut) {
            alert('Bạn đã check-out hôm nay rồi!');
            return;
          }

          try {
            const attendanceData = {
              userId: currentUser.uid,
              userName: userData.name,
              type: type,
              method: 'QR Code',
              location: location || { lat: 0, lng: 0 },
              distance: distance || 0,
              status: 'success'
            };

            await createAttendance(attendanceData);
            alert(`${type === 'check-in' ? 'Check-in' : 'Check-out'} bằng QR Code thành công!`);
            
            // Reload dữ liệu
            loadUserData(currentUser.uid, userData.role);
          } catch (error) {
            console.error('Lỗi chấm công:', error);
            alert('Chấm công thất bại.');
          }
        },
        (errorMessage) => {
          // Lỗi quét (bình thường, không cần xử lý)
        }
      ).catch((err) => {
        console.error('Lỗi khởi động camera:', err);
        alert('Không thể mở camera. Vui lòng cho phép truy cập camera.');
        setQrScanning(false);
      });
    }, 100);
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().then(() => {
        setQrScanning(false);
        qrScannerRef.current = null;
      }).catch((err) => {
        console.error('Lỗi dừng scanner:', err);
      });
    }
  };
  // Load danh sách phòng ban
  const loadDepartments = async () => {
    try {
      const depts = await getAllDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Lỗi load phòng ban:', error);
    }
  };

  // Tạo báo cáo
  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportData(null);
    
    try {
      let data;
      
      switch (reportType) {
        case 'company':
          data = await getCompanyStats(reportMonth, reportYear);
          break;
          
        case 'department':
          if (!selectedDepartment) {
            alert('Vui lòng chọn phòng ban!');
            setReportLoading(false);
            return;
          }
          data = await getDepartmentReport(selectedDepartment, reportMonth, reportYear);
          break;
          
        case 'employee':
          if (!selectedEmployee) {
            alert('Vui lòng chọn nhân viên!');
            setReportLoading(false);
            return;
          }
          data = await getEmployeeReport(selectedEmployee, reportMonth, reportYear);
          break;
          
        case 'top':
          data = await getTopEmployees(reportMonth, reportYear, 10);
          break;
          
        default:
          break;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Lỗi tạo báo cáo:', error);
      alert('Lỗi tạo báo cáo: ' + error.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Xuất CSV
  const handleExportReport = () => {
    if (!reportData) return;
    
    const filename = `bao-cao-${reportType}-${reportMonth}-${reportYear}.csv`;
    exportDetailedCSV(reportType, reportData, filename);
  };
  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser.email, newUser.password, {
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone
      });
      
      alert('Tạo nhân viên mới thành công!');
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        phone: ''
      });
      
      // Reload users
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Lỗi tạo người dùng:', error);
      alert('Tạo người dùng thất bại: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    
    try {
      await deleteUser(userId);
      alert('Xóa thành công!');
      
      // Reload users
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert('Xóa thất bại.');
    }
  };

  const exportToCSV = () => {
    const data = userData.role === 'admin' ? allAttendances : attendances;
    
    let csv = 'Họ tên,Email,Loại,Phương thức,Thời gian,Khoảng cách (m),Trạng thái\n';
    
    data.forEach(att => {
      const row = [
        att.userName || 'N/A',
        att.userId || 'N/A',
        att.type === 'check-in' ? 'Vào' : 'Ra',
        att.method || 'N/A',
        att.timestamp ? new Date(att.timestamp).toLocaleString('vi-VN') : 'N/A',
        att.distance || 0,
        att.status || 'N/A'
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cham-cong-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER LOGIN SCREEN
  // ============================================
  
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-2xl w-full max-w-md`}>
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Hệ thống Chấm công
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              GPS & QR Code
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Demo: admin@demo.com / admin123
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN APP UI
  // ============================================
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Clock className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Hệ thống Chấm công
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {userData?.name} - {userData?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:opacity-80 transition`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                } text-white transition`}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className={`lg:w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 h-fit sticky top-24`}>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeView === 'dashboard'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveView('attendance')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeView === 'attendance'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>Chấm công</span>
              </button>

              <button
                onClick={() => setActiveView('history')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeView === 'history'
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span>Lịch sử</span>
              </button>

              {userData?.role === 'admin' && (
                <>
                  <div className={`my-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                  
                  <button
                    onClick={() => setActiveView('users')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      activeView === 'users'
                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Nhân viên</span>
                  </button>

                  <button
                    onClick={() => setActiveView('qrcode')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      activeView === 'qrcode'
                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QR Code</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveView('reports')} 
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      activeView === 'reports'
                        ? 'bg-blue-500 text-white'
                        : darkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart size={20} />
                    <span>Báo cáo</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Dashboard
                </h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Check-in Status */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Hôm nay
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {todayCheckIn ? 'Đã vào' : 'Chưa vào'}
                        </p>
                      </div>
                      {todayCheckIn ? (
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      ) : (
                        <XCircle className="w-10 h-10 text-red-500" />
                      )}
                    </div>
                    {todayCheckIn && (
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Vào lúc: {new Date(todayCheckIn.timestamp).toLocaleTimeString('vi-VN')}
                      </p>
                    )}
                  </div>

                  {/* Check-out Status */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Check-out
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {todayCheckOut ? 'Đã ra' : 'Chưa ra'}
                        </p>
                      </div>
                      {todayCheckOut ? (
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      ) : (
                        <Clock className="w-10 h-10 text-orange-500" />
                      )}
                    </div>
                    {todayCheckOut && (
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ra lúc: {new Date(todayCheckOut.timestamp).toLocaleTimeString('vi-VN')}
                      </p>
                    )}
                  </div>

                  {/* Monthly Days */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Ngày làm/tháng
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {monthlyStats?.totalDays || 0}
                        </p>
                      </div>
                      <Calendar className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>

                  {/* Distance */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Khoảng cách
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {distance !== null ? `${Math.round(distance)}m` : 'N/A'}
                        </p>
                      </div>
                      <MapPin className={`w-10 h-10 ${
                        distance !== null && distance <= OFFICE_LOCATION.radius ? 'text-green-500' : 'text-red-500'
                      }`} />
                    </div>
                    {distance !== null && (
                      <p className={`text-sm mt-2 ${
                        distance <= OFFICE_LOCATION.radius 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {distance <= OFFICE_LOCATION.radius ? 'Trong phạm vi' : 'Ngoài phạm vi'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Monthly Stats */}
                {monthlyStats && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Thống kê tháng này
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Tổng ngày làm
                          </p>
                          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {monthlyStats.totalDays}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Đi muộn
                          </p>
                          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {monthlyStats.lateDays}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Về sớm
                          </p>
                          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {monthlyStats.earlyDays}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attendance View */}
            {activeView === 'attendance' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Chấm công
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GPS Check-in Card */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <MapPin className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Chấm công GPS
                      </h3>
                    </div>

                    {location ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${
                          distance <= OFFICE_LOCATION.radius 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                        }`}>
                          <p className={`text-sm font-medium ${
                            distance <= OFFICE_LOCATION.radius ? 'text-green-800' : 'text-red-800'
                          }`}>
                            Khoảng cách: {Math.round(distance)}m
                          </p>
                          <p className={`text-xs mt-1 ${
                            distance <= OFFICE_LOCATION.radius ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {distance <= OFFICE_LOCATION.radius 
                              ? `Trong phạm vi cho phép (${OFFICE_LOCATION.radius}m)`
                              : `Ngoài phạm vi cho phép (${OFFICE_LOCATION.radius}m)`
                            }
                          </p>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleGPSCheckIn('check-in')}
                            disabled={todayCheckIn}
                            className={`flex-1 py-3 rounded-lg font-semibold transition ${
                              todayCheckIn
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {todayCheckIn ? 'Đã Check-in' : 'Check-in'}
                          </button>

                          <button
                            onClick={() => handleGPSCheckIn('check-out')}
                            disabled={!todayCheckIn || todayCheckOut}
                            className={`flex-1 py-3 rounded-lg font-semibold transition ${
                              !todayCheckIn || todayCheckOut
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {todayCheckOut ? 'Đã Check-out' : 'Check-out'}
                          </button>
                        </div>

                        <button
                          onClick={getCurrentLocation}
                          disabled={gpsLoading}
                          className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                        >
                          <RefreshCw className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                          <span>{gpsLoading ? 'Đang lấy vị trí...' : 'Làm mới vị trí'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <button
                          onClick={getCurrentLocation}
                          disabled={gpsLoading}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {gpsLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* QR Code Scanner Card */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <QrCode className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Quét QR Code
                      </h3>
                    </div>

                    {!qrScanning ? (
                      <div className="text-center py-8">
                        <button
                          onClick={startQRScanner}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition flex items-center space-x-2 mx-auto"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Bắt đầu quét</span>
                        </button>
                        <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Quét QR Code tại cổng công ty để chấm công
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div id="qr-reader" className="rounded-lg overflow-hidden mb-4"></div>
                        <button
                          onClick={stopQRScanner}
                          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                        >
                          <X className="w-5 h-5" />
                          <span>Dừng quét</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History View */}
            {activeView === 'history' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Lịch sử chấm công
                  </h2>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất CSV</span>
                  </button>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Ngày giờ
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Loại
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Phương thức
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Khoảng cách
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {attendances.length > 0 ? (
                          attendances.slice(0, 50).map((att, index) => (
                            <tr key={index}>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {att.timestamp ? new Date(att.timestamp).toLocaleString('vi-VN') : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  att.type === 'check-in'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {att.type === 'check-in' ? 'Vào' : 'Ra'}
                                </span>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {att.method}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {att.distance}m
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Chưa có dữ liệu chấm công
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management View (Admin only) */}
            {activeView === 'users' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quản lý nhân viên ({allUsers.length} người)
                  </h2>
                  <button
                    onClick={async () => {
                      const users = await getAllUsers();
                      setAllUsers(users);
                      alert('Đã làm mới danh sách!');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Làm mới</span>
                  </button>
                </div>

                {/* Add New User Form */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Thêm nhân viên mới
                  </h3>
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Họ tên"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Phòng ban"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className={`px-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="employee">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                    <button
                      type="submit"
                      className="md:col-span-2 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm nhân viên</span>
                    </button>
                  </form>
                </div>

                {/* Users List */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Họ tên
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Email
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Phòng ban
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Vai trò
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {allUsers && allUsers.length > 0 ? (
                          allUsers.map((user) => (
                            <tr key={user.id}>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {user.name}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {user.email}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                {user.department || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Xóa nhân viên"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Chưa có nhân viên nào. Hãy thêm nhân viên mới!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Management View (Admin only) */}
            {activeView === 'qrcode' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quản lý QR Code
                </h2>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                  <div className="text-center">
                    {qrCodeImage ? (
                      <div className="space-y-4">
                        <img 
                          src={qrCodeImage} 
                          alt="QR Code" 
                          className="mx-auto border-4 border-gray-200 rounded-lg"
                          style={{ maxWidth: '300px' }}
                        />
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          QR Code hiện tại - Nhân viên quét để chấm công
                        </p>
                        <button
                          onClick={generateQRCode}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                        >
                          Tạo QR Code mới
                        </button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Chưa có QR Code
                        </p>
                        <button
                          onClick={generateQRCode}
                          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                        >
                          Tạo QR Code
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Hướng dẫn sử dụng
                  </h3>
                  <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>In QR Code và dán tại cổng công ty</li>
                    <li>Nhân viên dùng điện thoại quét QR Code để chấm công</li>
                    <li>QR Code có thể tạo lại bất cứ lúc nào</li>
                    <li>Mỗi QR Code chỉ hoạt động trong phiên bản mới nhất</li>
                    <li>Lưu ý: Chỉ tạo QR Code mới khi cần thiết</li>
                  </ul>
                </div>
              </div>
            )}
                        {/* Reports View (Admin only) */}
            {activeView === 'reports' && userData?.role === 'admin' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Báo cáo & Thống kê
                </h2>

                {/* Filter Controls */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Loại báo cáo
                      </label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="company">Tổng quan công ty</option>
                        <option value="department">Theo phòng ban</option>
                        <option value="employee">Theo nhân viên</option>
                        <option value="top">Top nhân viên</option>
                      </select>
                    </div>

                    {reportType === 'department' && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Chọn phòng ban
                        </label>
                        <select
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">-- Chọn phòng ban --</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {reportType === 'employee' && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Chọn nhân viên
                        </label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">-- Chọn nhân viên --</option>
                          {allUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.department || 'N/A'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tháng
                      </label>
                      <select
                        value={reportMonth}
                        onChange={(e) => setReportMonth(parseInt(e.target.value))}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Năm
                      </label>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(parseInt(e.target.value))}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {[2024, 2025, 2026].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleGenerateReport}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Tạo báo cáo</span>
                    </button>
                    
                    {reportData && (
                      <button
                        onClick={handleExportReport}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>Xuất CSV</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Display */}
                {reportLoading && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-12 rounded-xl shadow-lg text-center`}>
                    <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Đang tạo báo cáo...
                    </p>
                  </div>
                )}

                {reportData && !reportLoading && (
                  <>
                    {/* Company Report */}
                    {reportType === 'company' && (
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                        <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Báo cáo tổng quan - Tháng {reportMonth}/{reportYear}
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Tổng chấm công</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">{reportData.totalAttendances}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Nhân viên hoạt động</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">{reportData.uniqueUsers}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Ngày làm việc</p>
                            <p className="text-2xl font-bold text-purple-700 mt-1">{reportData.uniqueDays}</p>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Đi muộn</p>
                            <p className="text-2xl font-bold text-orange-700 mt-1">{reportData.lateCheckIns}</p>
                          </div>
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-600 font-medium">Check-in</p>
                            <p className="text-2xl font-bold text-indigo-700 mt-1">{reportData.totalCheckIns}</p>
                          </div>
                          <div className="p-4 bg-pink-50 rounded-lg">
                            <p className="text-sm text-pink-600 font-medium">Check-out</p>
                            <p className="text-2xl font-bold text-pink-700 mt-1">{reportData.totalCheckOuts}</p>
                          </div>
                          <div className="p-4 bg-teal-50 rounded-lg">
                            <p className="text-sm text-teal-600 font-medium">GPS</p>
                            <p className="text-2xl font-bold text-teal-700 mt-1">{reportData.gpsAttendances}</p>
                          </div>
                          <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Về sớm</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">{reportData.earlyCheckOuts}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Department Report */}
                    {reportType === 'department' && reportData.employeeStats && (
                      <div className="space-y-6">
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Phòng ban: {reportData.department}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Tổng nhân viên</p>
                              <p className="text-2xl font-bold text-blue-700 mt-1">{reportData.totalEmployees}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">TB ngày làm/người</p>
                              <p className="text-2xl font-bold text-green-700 mt-1">{reportData.summary.averageDaysPerEmployee}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-orange-600 font-medium">Tổng đi muộn</p>
                              <p className="text-2xl font-bold text-orange-700 mt-1">{reportData.summary.totalLateDays}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Tổng về sớm</p>
                              <p className="text-2xl font-bold text-red-700 mt-1">{reportData.summary.totalEarlyDays}</p>
                            </div>
                          </div>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Họ tên
                                  </th>
                                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Email
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Ngày làm
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Đi muộn
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Về sớm
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Tỷ lệ đúng giờ
                                  </th>
                                </tr>
                              </thead>
                              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {reportData.employeeStats.map((emp) => {
                                  const onTimeRate = emp.totalDays > 0 
                                    ? (((emp.totalDays - emp.lateDays) / emp.totalDays) * 100).toFixed(0)
                                    : 0;
                                  
                                  return (
                                    <tr key={emp.userId}>
                                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {emp.userName}
                                      </td>
                                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {emp.email}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                                          {emp.totalDays}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                          emp.lateDays > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {emp.lateDays}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                          emp.earlyDays > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {emp.earlyDays}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full ${
                                                onTimeRate >= 90 ? 'bg-green-500' : 
                                                onTimeRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${onTimeRate}%` }}
                                            ></div>
                                          </div>
                                          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {onTimeRate}%
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Employee Report */}
                    {reportType === 'employee' && reportData.user && (
                      <div className="space-y-6">
                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {reportData.user.name}
                              </h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {reportData.user.email} • {reportData.user.department || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Tổng ngày làm</p>
                              <p className="text-2xl font-bold text-blue-700 mt-1">{reportData.stats.totalDays}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Đúng giờ</p>
                              <p className="text-2xl font-bold text-green-700 mt-1">{reportData.stats.onTimeDays}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-orange-600 font-medium">Đi muộn</p>
                              <p className="text-2xl font-bold text-orange-700 mt-1">{reportData.stats.lateDays}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Về sớm</p>
                              <p className="text-2xl font-bold text-red-700 mt-1">{reportData.stats.earlyDays}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-purple-600 font-medium">Tỷ lệ đúng giờ</p>
                              <p className="text-2xl font-bold text-purple-700 mt-1">
                                {reportData.stats.totalDays > 0 
                                  ? Math.round((reportData.stats.onTimeDays / reportData.stats.totalDays) * 100)
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Ngày
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Check-in
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Check-out
                                  </th>
                                  <th className={`px-6 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>
                                    Trạng thái
                                  </th>
                                </tr>
                              </thead>
                              <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {reportData.dailyRecords.map((record, index) => (
                                  <tr key={index}>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {record.date}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {record.checkIn ? new Date(record.checkIn.timestamp).toLocaleTimeString('vi-VN') : '-'}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {record.checkOut ? new Date(record.checkOut.timestamp).toLocaleTimeString('vi-VN') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                        record.status === 'on-time' ? 'bg-green-100 text-green-800' :
                                        record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {record.status === 'on-time' ? 'Đúng giờ' :
                                        record.status === 'late' ? 'Đi muộn' : 'Vắng'}
                                      </span>
                                      {record.earlyLeave && (
                                        <span className="ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                          Về sớm
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Employees */}
                    {reportType === 'top' && reportData.length > 0 && (
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                        <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Top 10 nhân viên chấm công đúng giờ nhất
                        </h3>
                        <div className="space-y-4">
                          {reportData.map((emp, index) => (
                            <div 
                              key={emp.userId}
                              className={`flex items-center justify-between p-4 rounded-lg ${
                                index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                                index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                                index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                                darkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  index === 1 ? 'bg-gray-400 text-gray-900' :
                                  index === 2 ? 'bg-orange-400 text-orange-900' :
                                  'bg-blue-400 text-blue-900'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {emp.userName}
                                  </p>
                                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {emp.totalDays} ngày làm • {emp.onTimeDays} đúng giờ • {emp.lateDays} đi muộn
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${
                                  emp.score >= 80 ? 'text-green-600' :
                                  emp.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {emp.score}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>điểm</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
// ReportsView.jsx - Component báo cáo cho Admin
// Thêm view này vào App.js
  );
}

export default App;