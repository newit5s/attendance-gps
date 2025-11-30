# 🔧 Scripts - Firebase Automation

Thư mục chứa các scripts tự động hóa cấu hình Firebase.

## 📁 Danh sách Scripts

### `setup-firebase.js`
Script interactive để cấu hình Firebase tự động.

**Chức năng:**
- Hỏi và lưu Firebase Configuration
- Cấu hình Office Location
- Cấu hình Working Hours
- Tự động tạo file `config.js` và `.env.local`
- Backup file cũ trước khi overwrite

**Sử dụng:**
```bash
npm run firebase:setup
# hoặc
node scripts/setup-firebase.js
```

---

### `init-firestore.js`
Script khởi tạo Firestore Database với dữ liệu mẫu.

**Chức năng:**
- Tạo Admin Settings collection
- Tạo tài khoản Admin mẫu
- Tạo tài khoản User mẫu
- Tạo 14 bản ghi attendance mẫu (7 ngày)
- Hướng dẫn tạo Indexes

**Yêu cầu:**
- File `firebase-service-account.json` phải tồn tại

**Sử dụng:**
```bash
npm run firebase:init
# hoặc
node scripts/init-firestore.js
```

**Tài khoản được tạo:**
- Admin: `admin@example.com` / `admin123456`
- User: `user@example.com` / `user123456`

⚠️ **Nhớ đổi mật khẩu sau khi đăng nhập!**

---

## 🔑 Yêu cầu

### Firebase Service Account Key
Để chạy `init-firestore.js`, cần file `firebase-service-account.json`:

1. Vào Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Lưu file vào thư mục gốc với tên: `firebase-service-account.json`

### Firebase CLI
Cài đặt Firebase CLI để deploy rules:

```bash
npm install -g firebase-tools
firebase login
```

---

## 📝 Quy trình đầy đủ

```bash
# 1. Setup config
npm run firebase:setup

# 2. Deploy security rules
npm run firebase:deploy

# 3. Init Firestore với dữ liệu mẫu
npm run firebase:init

# 4. Start app
npm start
```

---

## 🔗 Xem thêm

- [FIREBASE-AUTOMATION.md](../docs/FIREBASE-AUTOMATION.md) - Hướng dẫn chi tiết
- [FIREBASE-SETUP.md](../docs/FIREBASE-SETUP.md) - Hướng dẫn setup thủ công

---

**Cập nhật:** 2025-11-30
