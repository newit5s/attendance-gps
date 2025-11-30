#!/usr/bin/env node
/**
 * Script khởi tạo Firestore collections và dữ liệu mẫu
 * Chạy: node scripts/init-firestore.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`)
};

async function initializeFirebase() {
  try {
    // Kiểm tra service account key
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
    const fs = require('fs');

    if (!fs.existsSync(serviceAccountPath)) {
      log.error('Không tìm thấy file firebase-service-account.json');
      console.log('\nCách lấy Service Account Key:');
      console.log('1. Vào Firebase Console > Project Settings > Service Accounts');
      console.log('2. Click "Generate new private key"');
      console.log('3. Lưu file JSON vào thư mục gốc với tên: firebase-service-account.json\n');
      process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    log.success('Đã khởi tạo Firebase Admin SDK');
    return admin.firestore();

  } catch (error) {
    log.error(`Lỗi khởi tạo Firebase: ${error.message}`);
    process.exit(1);
  }
}

async function createAdminSettings(db) {
  log.info('Tạo admin settings...');

  const settings = {
    version: '2.1.0',
    enableGPS: true,
    enableQRCode: true,
    enableFaceRecognition: false,
    officeLocation: {
      lat: 10.8231,
      lng: 106.6297,
      radius: 100
    },
    workingHours: {
      start: { hour: 8, minute: 30 },
      end: { hour: 17, minute: 30 },
      lateThreshold: 15,
      earlyThreshold: 15
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('admin-settings').doc('general').set(settings);
  log.success('Đã tạo admin settings');
}

async function createSampleAdmin(db) {
  log.info('Tạo tài khoản admin mẫu...');

  const adminUser = {
    email: 'admin@example.com',
    fullName: 'Quản trị viên',
    role: 'admin',
    department: 'IT',
    position: 'System Administrator',
    phoneNumber: '0123456789',
    status: 'active',
    avatar: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Tạo user trong Authentication
  let authUser;
  try {
    authUser = await admin.auth().createUser({
      email: adminUser.email,
      password: 'admin123456', // Mật khẩu mặc định
      displayName: adminUser.fullName
    });
    log.success(`Đã tạo auth user: ${authUser.uid}`);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      log.warning('Email admin đã tồn tại, sử dụng user hiện có');
      authUser = await admin.auth().getUserByEmail(adminUser.email);
    } else {
      throw error;
    }
  }

  // Tạo document trong Firestore
  await db.collection('users').doc(authUser.uid).set(adminUser);
  log.success('Đã tạo admin user trong Firestore');

  console.log(`\n${colors.bright}Thông tin đăng nhập Admin:${colors.reset}`);
  console.log(`Email: ${colors.green}${adminUser.email}${colors.reset}`);
  console.log(`Password: ${colors.green}admin123456${colors.reset}`);
  console.log(`${colors.yellow}⚠ Nhớ đổi mật khẩu sau khi đăng nhập lần đầu!${colors.reset}\n`);
}

async function createSampleUser(db) {
  log.info('Tạo tài khoản user mẫu...');

  const sampleUser = {
    email: 'user@example.com',
    fullName: 'Nguyễn Văn A',
    role: 'user',
    department: 'Marketing',
    position: 'Marketing Executive',
    phoneNumber: '0987654321',
    status: 'active',
    avatar: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Tạo user trong Authentication
  let authUser;
  try {
    authUser = await admin.auth().createUser({
      email: sampleUser.email,
      password: 'user123456',
      displayName: sampleUser.fullName
    });
    log.success(`Đã tạo auth user: ${authUser.uid}`);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      log.warning('Email user đã tồn tại, sử dụng user hiện có');
      authUser = await admin.auth().getUserByEmail(sampleUser.email);
    } else {
      throw error;
    }
  }

  // Tạo document trong Firestore
  await db.collection('users').doc(authUser.uid).set(sampleUser);
  log.success('Đã tạo sample user trong Firestore');

  console.log(`\n${colors.bright}Thông tin đăng nhập User:${colors.reset}`);
  console.log(`Email: ${colors.green}${sampleUser.email}${colors.reset}`);
  console.log(`Password: ${colors.green}user123456${colors.reset}\n`);

  return authUser.uid;
}

async function createSampleAttendance(db, userId) {
  log.info('Tạo dữ liệu chấm công mẫu...');

  const today = new Date();
  const records = [];

  // Tạo 7 ngày chấm công
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Check-in
    const checkinTime = new Date(date);
    checkinTime.setHours(8, Math.floor(Math.random() * 45), 0); // 8:00 - 8:45

    records.push({
      userId: userId,
      type: 'checkin',
      timestamp: admin.firestore.Timestamp.fromDate(checkinTime),
      location: {
        lat: 10.8231 + (Math.random() - 0.5) * 0.001,
        lng: 106.6297 + (Math.random() - 0.5) * 0.001
      },
      method: Math.random() > 0.5 ? 'gps' : 'qrcode',
      status: checkinTime.getHours() === 8 && checkinTime.getMinutes() <= 30 ? 'ontime' : 'late',
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows'
      },
      createdAt: admin.firestore.Timestamp.fromDate(checkinTime)
    });

    // Check-out
    const checkoutTime = new Date(date);
    checkoutTime.setHours(17, Math.floor(Math.random() * 60), 0); // 17:00 - 18:00

    records.push({
      userId: userId,
      type: 'checkout',
      timestamp: admin.firestore.Timestamp.fromDate(checkoutTime),
      location: {
        lat: 10.8231 + (Math.random() - 0.5) * 0.001,
        lng: 106.6297 + (Math.random() - 0.5) * 0.001
      },
      method: Math.random() > 0.5 ? 'gps' : 'qrcode',
      status: checkoutTime.getHours() >= 17 && checkoutTime.getMinutes() >= 30 ? 'ontime' : 'early',
      deviceInfo: {
        browser: 'Chrome',
        os: 'Windows'
      },
      createdAt: admin.firestore.Timestamp.fromDate(checkoutTime)
    });
  }

  // Thêm vào Firestore
  const batch = db.batch();
  records.forEach(record => {
    const docRef = db.collection('attendance').doc();
    batch.set(docRef, record);
  });

  await batch.commit();
  log.success(`Đã tạo ${records.length} bản ghi chấm công mẫu`);
}

async function createCollectionIndexes(db) {
  log.info('Tạo indexes cho collections...');
  log.warning('Indexes cần được tạo trên Firebase Console');

  console.log('\nCác indexes cần thiết:');
  console.log('1. attendance: userId (Ascending) + timestamp (Descending)');
  console.log('2. attendance: timestamp (Descending)');
  console.log('3. devices: userId (Ascending)');
  console.log('\nTạo tại: Firebase Console > Firestore Database > Indexes\n');
}

async function main() {
  log.title('🔥 KHỞI TẠO FIRESTORE DATABASE');

  try {
    // Khởi tạo Firebase
    const db = await initializeFirebase();

    // Tạo admin settings
    await createAdminSettings(db);

    // Tạo admin user
    await createSampleAdmin(db);

    // Tạo sample user
    const userId = await createSampleUser(db);

    // Tạo sample attendance
    await createSampleAttendance(db, userId);

    // Hướng dẫn tạo indexes
    await createCollectionIndexes(db);

    log.title('✅ HOÀN THÀNH!');
    console.log('Firestore đã được khởi tạo với:');
    console.log('- Admin settings');
    console.log('- 1 admin user');
    console.log('- 1 sample user');
    console.log('- 14 attendance records\n');

    log.warning('Nhớ thay đổi mật khẩu mặc định sau khi đăng nhập!');

  } catch (error) {
    log.error(`Lỗi: ${error.message}`);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
