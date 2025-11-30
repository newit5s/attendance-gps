# 🤖 Firebase Automation - Hướng dẫn Tự động hóa

Tài liệu hướng dẫn sử dụng các scripts tự động để cấu hình Firebase nhanh chóng.

---

## 📋 Tổng quan

Dự án cung cấp các scripts tự động hóa để:
- ✅ **Tự động cấu hình** Firebase config
- ✅ **Tự động deploy** Security Rules
- ✅ **Tự động khởi tạo** Firestore với dữ liệu mẫu
- ⚠️ **Bán tự động** một số tác vụ cần Firebase Console

---

## 🎯 Phần có thể tự động hóa

### ✅ Hoàn toàn tự động
- Cấu hình file `config.js`
- Tạo file `.env.local`
- Deploy Firestore Security Rules
- Deploy Storage Security Rules
- Deploy Firestore Indexes
- Tạo Collections và dữ liệu mẫu
- Tạo tài khoản admin/user mẫu

### ⚠️ Cần làm thủ công trên Firebase Console
- Tạo Firebase Project
- Enable Authentication (Email/Password)
- Tạo Firestore Database
- Enable Cloud Storage
- Lấy Service Account Key (cho init script)

---

## 🚀 Hướng dẫn sử dụng

### Bước 1: Cài đặt Dependencies

```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Cài đặt Firebase Admin SDK
npm install --save-dev firebase-admin

# Đăng nhập Firebase
firebase login
```

### Bước 2: Tạo Firebase Project (Thủ công)

1. Truy cập: https://console.firebase.google.com/
2. Click **"Add project"**
3. Nhập tên project (ví dụ: `attendance-system`)
4. Bật/tắt Google Analytics tùy chọn
5. Click **"Create project"**

### Bước 3: Enable Services (Thủ công)

#### 3.1 Enable Authentication
1. Click **Authentication** > **Get started**
2. Click **Email/Password**
3. Bật **Enable**
4. Click **Save**

#### 3.2 Enable Firestore
1. Click **Firestore Database** > **Create database**
2. Chọn location: `asia-southeast1` (Singapore - gần VN nhất)
3. Chọn **"Start in production mode"**
4. Click **Enable**

#### 3.3 Enable Storage
1. Click **Storage** > **Get started**
2. Chọn **"Start in production mode"**
3. Chọn location: `asia-southeast1` (cùng với Firestore)
4. Click **Done**

### Bước 4: Cấu hình tự động với Script

#### 4.1 Chạy Setup Script

```bash
# Chạy script setup
node scripts/setup-firebase.js
```

Script sẽ hỏi bạn:
- Firebase Configuration (API Key, Project ID, etc.)
- Office Location (Latitude, Longitude, Radius)
- Working Hours (Giờ vào, giờ ra, ngưỡng trễ/sớm)

**Cách lấy Firebase Config:**
1. Vào Firebase Console > Project Settings
2. Scroll xuống **"Your apps"**
3. Click icon **Web** (</>) để thêm app (nếu chưa có)
4. Copy toàn bộ `firebaseConfig` object

**Kết quả:**
- ✅ File `src/constants/config.js` được cập nhật
- ✅ File `.env.local` được tạo

#### 4.2 Lấy Service Account Key

Để chạy init script, bạn cần Service Account Key:

1. Vào Firebase Console > **Project Settings** > **Service Accounts**
2. Click **"Generate new private key"**
3. Lưu file JSON vào thư mục gốc với tên: `firebase-service-account.json`

⚠️ **LƯU Ý:** File này chứa thông tin nhạy cảm, đừng commit lên Git!

#### 4.3 Cấu hình Firebase Project

```bash
# Tạo file .firebaserc
cp .firebaserc.example .firebaserc

# Sửa file .firebaserc, thay "your-project-id" bằng Project ID thực
# Ví dụ:
{
  "projects": {
    "default": "attendance-system-abc123"
  }
}
```

### Bước 5: Deploy Security Rules

```bash
# Deploy Firestore và Storage rules
npm run firebase:deploy

# Hoặc deploy riêng từng phần
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

**Kết quả:**
- ✅ Firestore Security Rules được deploy
- ✅ Storage Security Rules được deploy
- ✅ Firestore Indexes được tạo

### Bước 6: Khởi tạo Firestore với dữ liệu mẫu

```bash
# Chạy init script
npm run firebase:init
```

**Script sẽ tạo:**
- ✅ Admin settings collection
- ✅ Tài khoản admin: `admin@example.com` / `admin123456`
- ✅ Tài khoản user mẫu: `user@example.com` / `user123456`
- ✅ 14 bản ghi chấm công mẫu (7 ngày)

⚠️ **Nhớ đổi mật khẩu sau khi đăng nhập lần đầu!**

---

## 📦 Các Scripts có sẵn

### `npm run firebase:setup`
Chạy script setup tự động, hỏi và lưu cấu hình.

```bash
npm run firebase:setup
```

### `npm run firebase:deploy`
Deploy tất cả Firebase configurations (rules + indexes).

```bash
npm run firebase:deploy
```

### `npm run firebase:init`
Khởi tạo Firestore với collections và dữ liệu mẫu.

```bash
npm run firebase:init
```

### `npm run firebase:rules`
Chỉ deploy security rules (không deploy indexes).

```bash
npm run firebase:rules
```

---

## 🔄 Quy trình Setup hoàn chỉnh

```bash
# 1. Tạo Firebase Project trên Console (thủ công)
# 2. Enable Authentication, Firestore, Storage (thủ công)

# 3. Cài đặt dependencies
npm install -g firebase-tools
npm install --save-dev firebase-admin
firebase login

# 4. Cấu hình tự động
node scripts/setup-firebase.js

# 5. Lấy Service Account Key (thủ công)
# Lưu vào: firebase-service-account.json

# 6. Cấu hình Firebase Project
cp .firebaserc.example .firebaserc
# Sửa .firebaserc với Project ID của bạn

# 7. Deploy security rules
npm run firebase:deploy

# 8. Khởi tạo Firestore
npm run firebase:init

# 9. Start ứng dụng
npm start
```

---

## 📁 Cấu trúc Files

```
attendance-gps/
├── scripts/
│   ├── setup-firebase.js          # Script setup tự động
│   └── init-firestore.js          # Script init Firestore
├── firestore.rules                # Firestore Security Rules
├── storage.rules                  # Storage Security Rules
├── firestore.indexes.json         # Firestore Indexes
├── firebase.json                  # Firebase config
├── .firebaserc.example            # Firebase project config template
├── firebase-service-account.json  # Service Account Key (KHÔNG commit)
└── src/
    └── constants/
        └── config.js              # App configuration
```

---

## 🔒 Security Rules

### Firestore Rules
File: `firestore.rules`

**Quy tắc chính:**
- Users phải đăng nhập để đọc/ghi
- User chỉ được cập nhật data của chính họ
- Admin có full quyền
- Attendance records chỉ được tạo bởi chính user đó
- Validation data trước khi ghi

### Storage Rules
File: `storage.rules`

**Quy tắc chính:**
- Avatars: User chỉ upload avatar của chính mình
- QR Codes: Chỉ admin được tạo/xóa
- Exports: Chỉ admin được đọc/ghi
- Giới hạn: Max 5MB per file, chỉ accept image files

---

## 🔍 Firestore Indexes

File: `firestore.indexes.json`

**Indexes được tạo:**
1. `attendance`: `userId` + `timestamp` (DESC)
2. `attendance`: `userId` + `type` + `timestamp` (DESC)
3. `devices`: `userId` + `createdAt` (DESC)

**Tại sao cần indexes?**
- Tăng tốc query lấy attendance theo user và thời gian
- Hỗ trợ sắp xếp và filter nhanh hơn
- Tránh lỗi "Missing index" khi query phức tạp

---

## 🐛 Troubleshooting

### Lỗi: "Command not found: firebase"

**Nguyên nhân:** Chưa cài Firebase CLI.

**Giải pháp:**
```bash
npm install -g firebase-tools
```

---

### Lỗi: "No project active"

**Nguyên nhân:** Chưa cấu hình `.firebaserc`.

**Giải pháp:**
```bash
cp .firebaserc.example .firebaserc
# Sửa file, thay "your-project-id" bằng Project ID thực
```

---

### Lỗi: "Permission denied" khi deploy

**Nguyên nhân:** Chưa đăng nhập hoặc không có quyền.

**Giải pháp:**
```bash
firebase logout
firebase login
```

---

### Lỗi: "firebase-service-account.json not found"

**Nguyên nhân:** Chưa tải Service Account Key.

**Giải pháp:**
1. Vào Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Lưu file vào thư mục gốc với tên `firebase-service-account.json`

---

### Script setup không chạy được

**Nguyên nhân:** File không có quyền execute.

**Giải pháp:**
```bash
chmod +x scripts/setup-firebase.js
chmod +x scripts/init-firestore.js
```

---

## ⚡ Tips & Best Practices

### 1. Multiple Environments

Tạo nhiều Firebase projects cho các môi trường khác nhau:

```json
// .firebaserc
{
  "projects": {
    "default": "attendance-dev",
    "production": "attendance-prod",
    "staging": "attendance-staging"
  }
}
```

Deploy theo môi trường:
```bash
firebase use default      # Dev
firebase use production   # Production
firebase deploy
```

### 2. Backup Rules trước khi Deploy

```bash
# Backup rules hiện tại
firebase firestore:rules:release > firestore.rules.backup

# Deploy rules mới
firebase deploy --only firestore:rules
```

### 3. Test Rules Local

Sử dụng Firebase Emulator để test rules:

```bash
# Cài emulator
firebase init emulators

# Chạy emulator
firebase emulators:start

# Test với UI
open http://localhost:4000
```

### 4. Gitignore

Đảm bảo file `.gitignore` có:

```gitignore
# Firebase
firebase-service-account.json
.firebaserc
.env.local
.firebase/

# Config backups
src/constants/config.js.backup.*
```

### 5. Environment Variables

Sử dụng `.env.local` thay vì hardcode config:

```javascript
// src/constants/config.js
export const FIREBASE_CONFIG = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  // ...
};
```

### 6. Monitor Usage

Theo dõi usage để tránh vượt free tier:
- Firebase Console > Usage and billing
- Set up budget alerts
- Monitor daily active users

---

## 📊 So sánh: Thủ công vs Tự động

| Tác vụ | Thủ công | Tự động | Thời gian tiết kiệm |
|--------|----------|---------|---------------------|
| Tạo Firebase Project | ✅ Bắt buộc | ❌ | - |
| Enable Services | ✅ Bắt buộc | ❌ | - |
| Cấu hình config.js | ⏱️ 10 phút | ⚡ 2 phút | **80%** |
| Deploy Rules | ⏱️ 15 phút | ⚡ 1 phút | **93%** |
| Tạo Collections | ⏱️ 20 phút | ⚡ 30 giây | **97%** |
| Tạo Admin User | ⏱️ 5 phút | ⚡ 10 giây | **97%** |
| **TỔNG** | **~50 phút** | **~5 phút** | **90%** |

---

## 📚 Tham khảo

- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)

---

## 🔗 Liên quan

- [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) - Hướng dẫn setup thủ công chi tiết
- [API-REFERENCE.md](./API-REFERENCE.md) - API documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

**Cập nhật lần cuối:** 2025-11-30
**Phiên bản:** 1.0.0
