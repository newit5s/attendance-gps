# TEST CHECKLIST - Kiểm tra Logic Hệ thống Chấm công v2.0

## 🔧 Chuẩn bị Test

### 1. Setup Firebase
- [ ] Đã thay `FIREBASE_CONFIG` trong `src/constants/config.js`
- [ ] Đã enable Authentication (Email/Password) trong Firebase Console
- [ ] Đã tạo Firestore Database
- [ ] Đã set Security Rules (xem bên dưới)
- [ ] Đã tạo Composite Indexes (xem bên dưới)

### 2. Tạo tài khoản test
```
Admin:    admin@test.com / 123456
Employee: nhanvien@test.com / 123456
```

### 3. Cập nhật vị trí văn phòng
Trong `src/constants/config.js`:
```javascript
export const OFFICE_LOCATION = {
  lat: YOUR_OFFICE_LAT,    // Lấy từ Google Maps
  lng: YOUR_OFFICE_LNG,
  radius: 100              // hoặc 500 để test dễ hơn
};
```

---

## ✅ TEST CASES

### 1. Authentication (services/auth.js)

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Login thành công | Nhập đúng email/password | Chuyển sang Dashboard | ⬜ |
| Login sai password | Nhập sai password | Hiện lỗi "Email hoặc mật khẩu không đúng" | ⬜ |
| Login email không tồn tại | Nhập email chưa đăng ký | Hiện lỗi | ⬜ |
| Logout | Click nút Logout | Quay về trang Login | ⬜ |
| Session persist | Login rồi refresh trang | Vẫn ở Dashboard, không bị logout | ⬜ |

**Console test:**
```javascript
// Trong browser console sau khi login
import { getCurrentUser } from './services/auth';
console.log(getCurrentUser()); // Phải có user object
```

---

### 2. User Management (services/users.js)

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Lấy user data | Login và xem Dashboard | Hiện đúng tên, email, role | ⬜ |
| Lấy all users (Admin) | Vào Admin > Nhân viên | Hiện danh sách tất cả users | ⬜ |
| Tạo user mới | Click "Thêm nhân viên", điền form | User mới xuất hiện trong list | ⬜ |
| Sửa user | Click Edit, đổi tên | Tên được cập nhật | ⬜ |
| Xóa user | Click Delete, confirm | User biến mất khỏi list | ⬜ |
| Search user | Gõ tên vào ô search | Filter đúng kết quả | ⬜ |

**Kiểm tra Firestore:**
```
Firebase Console > Firestore > users collection
- Xem có documents không
- Xem fields có đúng không (name, email, role, createdAt...)
```

---

### 3. Attendance - Check-in/out (services/attendance.js)

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| GPS - Trong phạm vi | Đứng trong văn phòng, check-in GPS | Thành công, hiện thời gian | ⬜ |
| GPS - Ngoài phạm vi | Đứng xa văn phòng, check-in GPS | Lỗi "ngoài phạm vi" | ⬜ |
| GPS - Refresh location | Click nút refresh GPS | Khoảng cách cập nhật | ⬜ |
| QR - Quét đúng | Quét QR Code của công ty | Check-in thành công | ⬜ |
| QR - Quét sai | Quét QR Code random | Lỗi "QR không hợp lệ" | ⬜ |
| Check-in 2 lần | Check-in rồi check-in lại | Lỗi "đã check-in rồi" | ⬜ |
| Check-out trước check-in | Chưa check-in mà check-out | Lỗi "chưa check-in" | ⬜ |
| Check-out thành công | Sau khi check-in, check-out | Thành công, hiện cả 2 thời gian | ⬜ |
| Check-out 2 lần | Check-out rồi check-out lại | Lỗi "đã check-out rồi" | ⬜ |

**Kiểm tra Firestore:**
```
Firebase Console > Firestore > attendances collection
- Document có đủ fields: userId, userName, type, method, location, distance, timestamp, date, month, year
- type là "check-in" hoặc "check-out"
- timestamp là Firestore Timestamp
```

---

### 4. Attendance - History & Stats

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Xem lịch sử | Vào trang Lịch sử | Hiện danh sách chấm công | ⬜ |
| Filter theo tháng | Chọn tháng khác | Data thay đổi theo tháng | ⬜ |
| Thống kê đúng | Check-in 3 ngày, 1 ngày trễ | Hiện: 3 ngày làm, 1 đi muộn | ⬜ |
| Export CSV | Click "Xuất CSV" | File CSV được download | ⬜ |
| CSV content đúng | Mở file CSV | Data khớp với trên web | ⬜ |

**Test đi muộn:**
```javascript
// Trong config.js
WORKING_HOURS = {
  start: { hour: 8, minute: 30 },
  lateThreshold: 15  // Trễ sau 8:45
}

// Test: Check-in lúc 9:00 → Phải được đánh dấu "Đi muộn"
```

---

### 5. QR Code Management (services/qrcode.js)

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Tạo QR mới | Admin > QR Code > Tạo mới | QR hiện ra, có mã và ngày hết hạn | ⬜ |
| Download QR | Click "Tải xuống" | File PNG được download | ⬜ |
| QR hết hạn | Tạo QR với 1 ngày, đợi hết hạn | Hiện "QR đã hết hạn" | ⬜ |
| Xóa QR | Click "Xóa" | QR biến mất | ⬜ |
| Verify QR | Quét QR vừa tạo | Chấm công thành công | ⬜ |

**Kiểm tra Firestore:**
```
Firebase Console > Firestore > settings/qrcode
- code: string (mã QR)
- expiryDate: timestamp
- createdAt: timestamp
```

---

### 6. Reports (services/reports.js)

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Company stats | Admin > Báo cáo | Hiện tổng số chấm công, đi muộn... | ⬜ |
| Stats đúng số liệu | So sánh với Firestore | Số liệu khớp | ⬜ |
| Top employees | Xem bảng xếp hạng | Sắp xếp đúng theo % đúng giờ | ⬜ |
| Filter tháng | Chọn tháng khác | Data thay đổi | ⬜ |
| Export báo cáo | Click "Xuất CSV" | File được download | ⬜ |

---

### 7. Role-based Access

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Employee không thấy Admin menu | Login employee | Sidebar không có Users, QR, Reports | ⬜ |
| Employee vào URL admin | Gõ /admin/users vào URL | Redirect về Dashboard | ⬜ |
| Admin thấy tất cả | Login admin | Sidebar có đủ menu | ⬜ |

---

### 8. Dark Mode

| Test | Cách test | Expected | Status |
|------|-----------|----------|--------|
| Toggle theme | Click icon moon/sun | Màu sắc thay đổi | ⬜ |
| Persist theme | Đổi theme, refresh trang | Theme vẫn giữ | ⬜ |
| All pages support | Duyệt qua tất cả trang | Không có phần nào bị trắng/đen lạc | ⬜ |

---

## 🔥 FIREBASE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Attendances collection
    match /attendances/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Settings (QR Code, etc.)
    match /settings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📊 FIRESTORE COMPOSITE INDEXES

Cần tạo các indexes sau (Firebase Console > Firestore > Indexes):

### Index 1: Attendances by user + timestamp
```
Collection: attendances
Fields: 
  - userId (Ascending)
  - timestamp (Descending)
```

### Index 2: Attendances by user + date + type
```
Collection: attendances
Fields:
  - userId (Ascending)
  - date (Ascending)
  - type (Ascending)
```

### Index 3: Attendances by month + year
```
Collection: attendances
Fields:
  - month (Ascending)
  - year (Ascending)
```

### Index 4: Attendances by user + month + year
```
Collection: attendances
Fields:
  - userId (Ascending)
  - month (Ascending)
  - year (Ascending)
  - timestamp (Ascending)
```

**Lưu ý:** Nếu thiếu index, Firebase sẽ báo lỗi trong Console và cho link để tạo index.

---

## 🐛 COMMON ERRORS & FIXES

### Error 1: "Missing or insufficient permissions"
**Nguyên nhân:** Security Rules chưa đúng
**Fix:** Copy Security Rules ở trên vào Firebase Console

### Error 2: "The query requires an index"
**Nguyên nhân:** Thiếu Composite Index
**Fix:** Click link trong error message để tạo index

### Error 3: "Cannot read property 'toDate' of undefined"
**Nguyên nhân:** Timestamp null hoặc không phải Firestore Timestamp
**Fix:** Kiểm tra data trong Firestore, đảm bảo dùng `Timestamp.now()`

### Error 4: GPS không hoạt động
**Nguyên nhân:** Browser chưa được cấp quyền location
**Fix:** 
- Chrome: Settings > Privacy > Location > Allow
- Phải chạy trên HTTPS hoặc localhost

### Error 5: QR Scanner không mở camera
**Nguyên nhân:** Browser chưa được cấp quyền camera
**Fix:** Tương tự GPS, cần allow camera permission

### Error 6: Login thành công nhưng Dashboard trống
**Nguyên nhân:** User document không tồn tại trong Firestore
**Fix:** Tạo document trong `users` collection với uid làm document ID

---

## 📱 TEST TRÊN MOBILE

1. **Build production:**
```bash
npm run build
firebase deploy --only hosting
```

2. **Test trên điện thoại:**
- Mở URL Firebase Hosting trên điện thoại
- Test GPS (cần đứng đúng vị trí)
- Test QR Scanner (quét từ màn hình khác)
- Test responsive UI

---

## ✅ FINAL CHECKLIST

Trước khi deploy production:

- [ ] Tất cả test cases PASS
- [ ] Security Rules đã set
- [ ] Composite Indexes đã tạo
- [ ] OFFICE_LOCATION đúng địa chỉ thực
- [ ] WORKING_HOURS đúng giờ làm việc
- [ ] Đã tạo tài khoản Admin thật
- [ ] Test trên mobile OK
- [ ] Dark mode hoạt động
- [ ] Export CSV hoạt động

---

## 🔄 Cách test nhanh từng service

Mở Browser Console (F12) và chạy:

```javascript
// Test auth
import { getCurrentUser } from './services/auth';
console.log('Current user:', getCurrentUser());

// Test users
import { getAllUsers } from './services/users';
getAllUsers().then(users => console.log('Users:', users));

// Test attendance
import { checkTodayAttendance } from './services/attendance';
checkTodayAttendance('USER_ID', 'check-in').then(r => console.log('Today check-in:', r));

// Test QR
import { getQRCode } from './services/qrcode';
getQRCode().then(qr => console.log('QR Code:', qr));

// Test reports
import { getCompanyStats } from './services/reports';
getCompanyStats(11, 2025).then(stats => console.log('Stats:', stats));
```