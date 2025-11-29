// src/constants/config.js
// Cấu hình ứng dụng

// ⚠️ THAY BẰNG FIREBASE CONFIG CỦA BẠN
export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Vị trí văn phòng
export const OFFICE_LOCATION = {
  lat: 10.8231,      // Vĩ độ văn phòng
  lng: 106.6297,     // Kinh độ văn phòng
  radius: 100        // Bán kính cho phép (mét)
};

// Giờ làm việc
export const WORKING_HOURS = {
  start: { hour: 8, minute: 30 },   // 8:30 AM
  end: { hour: 17, minute: 30 },    // 5:30 PM
  lateThreshold: 15,                 // Trễ sau 15 phút
  earlyThreshold: 15                 // Về sớm trước 15 phút
};

// App config
export const APP_CONFIG = {
  appName: 'Hệ thống Chấm công GPS & QR Code',
  version: '2.0.0',
  maxDevicesPerUser: 2,
  qrCodeExpiryDays: 30
};
