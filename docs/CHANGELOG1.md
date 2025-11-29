# CHANGELOG - Hệ thống Chấm công GPS & QR Code

## 📌 Trạng thái hiện tại: v2.0.3

---

## [v2.0.3] - 2025-11-29 ✅ CURRENT

### Mục tiêu
Code quality improvements and clean build

### ✅ Đã hoàn thành

**Code Quality Fixes (7 files)**
- Fixed all ESLint warnings
- Removed unused imports and variables:
  - `Settings` from src/components/layout/Sidebar.jsx
  - `Calendar` from src/pages/Admin/Reports/index.jsx
  - `Loading` from src/pages/Attendance/index.jsx
  - `formatDate` from src/pages/Dashboard/index.jsx
  - `WORKING_HOURS` from src/services/reports.js
  - `setDoc` from src/services/users.js
  - Unused variables: `scannerRef`, `users`
- Fixed React Hooks dependencies with useCallback:
  - src/pages/Admin/Reports/index.jsx
  - src/pages/History/index.jsx

**Project Configuration**
- Created .gitignore for build artifacts and node_modules
- Verified all dependencies installed (1384 packages)
- Clean production build: 285.85 kB (gzipped)

**Git Operations**
- Committed all changes
- Pushed to branch: claude/complete-app-setup-015KNLa12ka85G3LiziQhxGx

### 📊 Build Status
- ✅ Build: SUCCESS
- ✅ ESLint warnings: 0
- ✅ Bundle size: 285.85 kB (gzipped)
- ✅ CSS size: 352 B (gzipped)

---

## [v2.0.2] - 2025-11-28

### Mục tiêu
Fix all bugs and implement missing services

### ✅ Đã hoàn thành

**Bug Fixes (6 bugs)**
- Fixed createUser() logout admin issue (secondary auth)
- Fixed QR code without GPS validation
- Fixed deleteUser() not removing auth (soft delete)
- Fixed race condition in check-in/check-out
- Fixed timezone mismatch (UTC to local)
- Optimized N+1 queries in reports

**New Services (7 files)**
- devices.js - Device fingerprinting & management
- storage.js - Firebase Storage file uploads
- leave.js - Leave request & balance management
- lateEarly.js - Late/early leave request handling
- notification.js - User notification system
- approval.js - Unified approval workflow
- settings.js - System configuration management

---

## [v2.0.1] - 2025-11-27

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
v2.0.1 ✅ Done       - Core modules complete (38 files)
v2.0.2 ✅ Done       - Bug fixes (3 critical + 3 medium) + 7 services
v2.0.3 ✅ Current    - Code quality improvements, clean build
v2.1.0 🔲 Next       - UI implementation (9 missing pages)
v2.2.0 🔲 Planned    - Manager features (approval, team reports)
v2.3.0 🔲 Planned    - Admin+ (devices, settings)
v2.4.0 🔲 Future     - PWA, multi-branch, email, i18n
```
