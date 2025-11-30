# 🔥 Hướng dẫn Cấu hình Firebase

Tài liệu hướng dẫn chi tiết cách cấu hình Firebase cho Hệ thống Chấm công GPS & QR Code.

---

## 📋 Mục lục

1. [Tạo Firebase Project](#1-tạo-firebase-project)
2. [Lấy Firebase Configuration](#2-lấy-firebase-configuration)
3. [Cấu hình Authentication](#3-cấu-hình-authentication)
4. [Cấu hình Firestore Database](#4-cấu-hình-firestore-database)
5. [Cấu hình Storage](#5-cấu-hình-storage)
6. [Cấu hình trong Code](#6-cấu-hình-trong-code)
7. [Security Rules](#7-security-rules)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Tạo Firebase Project

### Bước 1.1: Truy cập Firebase Console
1. Mở trình duyệt và truy cập: https://console.firebase.google.com/
2. Đăng nhập bằng tài khoản Google của bạn

### Bước 1.2: Tạo Project mới
1. Click nút **"Add project"** hoặc **"Thêm dự án"**
2. Nhập tên project (ví dụ: `attendance-system`)
3. Click **"Continue"** để tiếp tục

### Bước 1.3: Cấu hình Google Analytics (Optional)
1. Chọn **"Enable Google Analytics"** nếu muốn theo dõi analytics
2. Hoặc tắt nếu không cần thiết
3. Click **"Continue"**

### Bước 1.4: Hoàn tất
1. Chọn Google Analytics account (nếu đã bật)
2. Click **"Create project"**
3. Đợi Firebase khởi tạo project (khoảng 30 giây)
4. Click **"Continue"** để vào Firebase Console

---

## 2. Lấy Firebase Configuration

### Bước 2.1: Thêm Web App
1. Trong Firebase Console, click vào icon **Web** (</>) để thêm app
2. Nhập nickname cho app (ví dụ: `attendance-web`)
3. **Không** check "Also set up Firebase Hosting" (chưa cần)
4. Click **"Register app"**

### Bước 2.2: Copy Configuration
Firebase sẽ hiển thị code configuration như sau:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

**⚠️ LƯU Ý:** Sao chép toàn bộ object này, bạn sẽ cần dán vào code.

### Bước 2.3: Lưu Configuration
1. Click **"Continue to console"**
2. Nếu cần xem lại config, vào **Project Settings** > **General** > **Your apps**

---

## 3. Cấu hình Authentication

### Bước 3.1: Enable Authentication
1. Trong Firebase Console, click **"Authentication"** ở menu bên trái
2. Click tab **"Sign-in method"**
3. Click **"Get started"** (nếu lần đầu sử dụng)

### Bước 3.2: Enable Email/Password
1. Click vào **"Email/Password"** trong danh sách providers
2. Bật **Enable** switch
3. Click **"Save"**

### Bước 3.3: Thêm Authorized Domains (Nếu deploy)
1. Trong tab **"Settings"**
2. Scroll xuống **"Authorized domains"**
3. Thêm domain của bạn (ví dụ: `yourdomain.com`)
4. Localhost đã được tự động authorized

---

## 4. Cấu hình Firestore Database

### Bước 4.1: Tạo Firestore Database
1. Click **"Firestore Database"** ở menu bên trái
2. Click **"Create database"**

### Bước 4.2: Chọn Location
1. Chọn location gần nhất (ví dụ: `asia-southeast1` cho Việt Nam)
2. Click **"Next"**

**⚠️ CHÚ Ý:** Location không thể thay đổi sau khi tạo!

### Bước 4.3: Chọn Security Rules
1. Chọn **"Start in production mode"** (an toàn hơn)
2. Click **"Enable"**
3. Đợi Firestore khởi tạo (khoảng 1-2 phút)

### Bước 4.4: Tạo Collections
Sau khi Firestore được tạo, hệ thống sẽ tự động tạo các collections khi có dữ liệu đầu tiên. Các collections cần thiết:

- `users` - Thông tin người dùng
- `attendance` - Dữ liệu chấm công
- `devices` - Thiết bị đã đăng ký
- `qr-codes` - Mã QR code
- `admin-settings` - Cấu hình admin

**Không cần tạo thủ công**, app sẽ tự tạo khi chạy.

---

## 5. Cấu hình Storage

### Bước 5.1: Enable Cloud Storage
1. Click **"Storage"** ở menu bên trái
2. Click **"Get started"**

### Bước 5.2: Chọn Security Rules
1. Chọn **"Start in production mode"**
2. Click **"Next"**

### Bước 5.3: Chọn Location
1. Chọn cùng location với Firestore (ví dụ: `asia-southeast1`)
2. Click **"Done"**

### Bước 5.4: Tạo Folder Structure (Optional)
Storage sẽ tự động tạo các folders khi upload file:
- `avatars/` - Ảnh đại diện người dùng
- `qr-codes/` - QR code images
- `exports/` - File export dữ liệu

---

## 6. Cấu hình trong Code

### Bước 6.1: Mở file config
Mở file `src/constants/config.js`

### Bước 6.2: Thay thế Firebase Config
Thay thế toàn bộ object `FIREBASE_CONFIG` bằng config từ Firebase Console:

```javascript
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Thay bằng API Key của bạn
  authDomain: "your-project.firebaseapp.com",    // Thay bằng Auth Domain
  projectId: "your-project-id",                   // Thay bằng Project ID
  storageBucket: "your-project.appspot.com",      // Thay bằng Storage Bucket
  messagingSenderId: "123456789012",              // Thay bằng Sender ID
  appId: "1:123456789012:web:abcdef123456"       // Thay bằng App ID
};
```

### Bước 6.3: Cấu hình Office Location
Cập nhật vị trí văn phòng của bạn:

```javascript
export const OFFICE_LOCATION = {
  lat: 10.8231,      // Vĩ độ văn phòng (tìm trên Google Maps)
  lng: 106.6297,     // Kinh độ văn phòng
  radius: 100        // Bán kính cho phép chấm công (mét)
};
```

**Cách lấy tọa độ:**
1. Mở Google Maps
2. Click phải vào vị trí văn phòng
3. Click vào tọa độ (ví dụ: `10.8231, 106.6297`)
4. Copy và paste vào config

### Bước 6.4: Cấu hình giờ làm việc
Điều chỉnh theo giờ làm việc của công ty:

```javascript
export const WORKING_HOURS = {
  start: { hour: 8, minute: 30 },   // Giờ vào: 8:30 AM
  end: { hour: 17, minute: 30 },    // Giờ ra: 5:30 PM
  lateThreshold: 15,                 // Trễ nếu đến sau 15 phút
  earlyThreshold: 15                 // Về sớm nếu về trước 15 phút
};
```

### Bước 6.5: Lưu file
1. Lưu file `config.js`
2. Restart development server nếu đang chạy:
   ```bash
   npm start
   ```

---

## 7. Security Rules

### 7.1: Firestore Security Rules

Trong Firebase Console > Firestore Database > Rules, paste rules sau:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isAdmin();
    }

    // Attendance collection
    match /attendance/{recordId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // Devices collection
    match /devices/{deviceId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
                     request.resource.data.userId == request.auth.uid;
    }

    // QR Codes collection
    match /qr-codes/{qrId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Admin settings
    match /admin-settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

**Click "Publish"** để apply rules.

### 7.2: Storage Security Rules

Trong Firebase Console > Storage > Rules, paste rules sau:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Avatar images
    match /avatars/{userId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // QR code images
    match /qr-codes/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Export files
    match /exports/{fileName} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

**Click "Publish"** để apply rules.

---

## 8. Troubleshooting

### Lỗi: "Firebase: Error (auth/configuration-not-found)"
**Nguyên nhân:** Firebase Config chưa được cấu hình đúng.

**Giải pháp:**
1. Kiểm tra file `src/constants/config.js`
2. Đảm bảo đã thay thế tất cả giá trị `YOUR_XXX` bằng config thực
3. Restart development server

---

### Lỗi: "Missing or insufficient permissions"
**Nguyên nhân:** Security Rules quá strict hoặc chưa được cấu hình.

**Giải pháp:**
1. Kiểm tra Firestore Security Rules
2. Đảm bảo user đã đăng nhập
3. Kiểm tra role của user trong collection `users`

---

### Lỗi: "Failed to get document because the client is offline"
**Nguyên nhân:** Không có kết nối internet hoặc Firebase đang bị block.

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Kiểm tra firewall/proxy có block Firebase không
3. Thử clear cache browser

---

### Lỗi: "Firebase: Error (auth/unauthorized-domain)"
**Nguyên nhân:** Domain chưa được authorized.

**Giải pháp:**
1. Vào Firebase Console > Authentication > Settings
2. Thêm domain vào **Authorized domains**
3. Đợi vài phút để thay đổi có hiệu lực

---

### App chậm khi load dữ liệu
**Nguyên nhân:** Firestore location xa hoặc query không tối ưu.

**Giải pháp:**
1. Chọn Firestore location gần người dùng nhất
2. Thêm indexes cho các query phức tạp
3. Implement pagination cho danh sách dài

---

## 📝 Checklist Hoàn thành

Sau khi hoàn thành tất cả các bước, check list này:

- [ ] ✅ Đã tạo Firebase Project
- [ ] ✅ Đã lấy và lưu Firebase Configuration
- [ ] ✅ Đã enable Authentication (Email/Password)
- [ ] ✅ Đã tạo Firestore Database
- [ ] ✅ Đã enable Cloud Storage
- [ ] ✅ Đã cập nhật `src/constants/config.js`
- [ ] ✅ Đã cấu hình Office Location
- [ ] ✅ Đã cấu hình Working Hours
- [ ] ✅ Đã apply Firestore Security Rules
- [ ] ✅ Đã apply Storage Security Rules
- [ ] ✅ App chạy thành công không lỗi

---

## 🔗 Tài liệu tham khảo

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage](https://firebase.google.com/docs/storage)

---

## 💡 Tips

1. **Backup Configuration:** Lưu Firebase Config vào file `.env` hoặc secret manager
2. **Multiple Environments:** Tạo 2 Firebase projects riêng cho Development và Production
3. **Monitor Usage:** Theo dõi usage trong Firebase Console để tránh vượt free tier
4. **Security:** Không commit Firebase Config lên public repository
5. **Testing:** Test kỹ Security Rules trước khi deploy production

---

**Cập nhật lần cuối:** 2025-11-30
**Phiên bản:** 1.0.0
