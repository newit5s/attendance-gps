# CHANGELOG - Hệ thống Chấm công GPS & QR Code

## 📌 Trạng thái hiện tại: v2.0.1

---

## [v2.0.1] - 2025-11-27 ✅ CURRENT

### Mục tiêu
Hoàn thiện core modules từ v2.0.0 refactor

### ✅ Đã hoàn thành (38 files)

| Category | Files | Status |
|----------|-------|--------|
| Services | 6 | ✅ |
| Context | 2 | ✅ |
| Hooks | 4 | ✅ |
| Utils | 2 | ✅ |
| Constants | 2 | ✅ |
| Components | 10 | ✅ |
| Pages | 7 | ✅ |
| Core | 4 | ✅ |

**Chi tiết:**
- Services: firebase, auth, users, attendance, qrcode, reports
- Context: AuthContext, ThemeContext
- Hooks: useAuth, useTheme, useGPS, useAttendance
- Components: Button, Input, Card, Modal, Badge, Loading, Header, Sidebar, MainLayout, StatCard
- Pages: Login, Dashboard, Attendance, History, Admin/Users, Admin/QRCode, Admin/Reports

### ⚠️ Known Bugs (6 bugs)

| # | Severity | Description | File |
|---|----------|-------------|------|
| 1 | 🔴 Critical | createUser() logout Admin | services/auth.js |
| 2 | 🔴 Critical | QR không check GPS | pages/Attendance |
| 3 | 🔴 Critical | deleteUser() ko xóa Auth | services/users.js |
| 4 | 🟡 Medium | Race condition check-in | hooks/useAttendance.js |
| 5 | 🟡 Medium | Timezone không nhất quán | services/attendance.js |
| 6 | 🟡 Medium | N+1 query trong reports | services/reports.js |

### ❌ Chưa có (planned)
- Services: devices, storage, leave, lateEarly, notification, approval, settings
- Pages: Employee/*, Manager/*, Admin/Devices, Admin/Settings
- Features: Device fingerprinting, Leave management, Approval workflow

---

## [v2.0.0] - 2025-11-26

- Refactor từ single-file App.js (~2000 lines) sang modular structure
- Setup folder structure: services/, hooks/, context/, etc.
- Chưa hoàn thiện (thiếu nhiều modules)

---

## [v1.0.0] - 2025-11-25

- Initial release
- Deploy Firebase Hosting
- Basic GPS/QR attendance
- User management (CRUD)
- Basic reports

---

## 🗓️ Roadmap

```
v2.0.1 ✅ Current    - Core modules complete (38 files)
v2.0.2 🔲 Next       - Bug fixes (3 critical + 3 medium)
v2.1.0 🔲 Planned    - Employee features (device, leave, late/early)
v2.2.0 🔲 Planned    - Manager features (approval, team reports)
v2.3.0 🔲 Planned    - Admin+ (devices, settings)
v2.4.0 🔲 Future     - PWA, multi-branch, email, i18n
```
