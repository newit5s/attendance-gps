# ROADMAP - Kế hoạch phát triển

## 📊 Tổng quan

```
Phase 1: Core (v2.0.x)       ████████████████░░░░  80% 
Phase 2: Employee (v2.1.x)   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: Manager (v2.2.x)    ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Admin+ (v2.3.x)     ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Advanced (v2.4.x)   ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Phase 1: Core ⚠️ 80% COMPLETE

### v2.0.1 ✅ DONE - Basic Modules
- [x] Services: firebase, auth, users, attendance, qrcode, reports
- [x] Context: AuthContext, ThemeContext
- [x] Hooks: useAuth, useTheme, useGPS, useAttendance
- [x] Components: 10 components (Button, Card, Modal, etc.)
- [x] Pages: Login, Dashboard, Attendance, History, Admin/*
- [x] Routing: Simple state-based routing

### v2.0.2 🔲 TODO - Bug Fixes
**Priority: HIGH - Cần fix trước khi deploy production**

| Task | File | Priority |
|------|------|----------|
| Fix createUser logout Admin | services/auth.js | 🔴 |
| Fix QR không check GPS | pages/Attendance | 🔴 |
| Fix deleteUser không xóa Auth | services/users.js | 🔴 |
| Fix race condition | hooks/useAttendance.js | 🟡 |
| Fix timezone | services/attendance.js | 🟡 |
| Optimize N+1 queries | services/reports.js | 🟡 |

**Giải pháp đề xuất:**
```javascript
// Bug 1: Dùng secondary Firebase app
// Bug 2: Thêm GPS check trong handleQRResult
// Bug 3: Soft delete + check status khi login
// Bug 4: Double-check từ Firestore trước khi tạo
// Bug 5: Dùng local date thay vì toISOString()
// Bug 6: Query 1 lần, group trong memory
```

---

## Phase 2: Employee Features 🔲 0%

### v2.1.0 - Device & Leave Management

**Mục tiêu:** Chống gian lận + Quản lý nghỉ phép

| Task | Files cần tạo | Priority |
|------|---------------|----------|
| Device fingerprinting | services/devices.js | 🔴 High |
| Device registration UI | pages/Employee/DeviceRegister | 🔴 High |
| Verify device on check-in | hooks/useAttendance.js (update) | 🔴 High |
| Admin device management | pages/Admin/Devices | 🟡 Medium |
| Leave service | services/leave.js | 🟡 Medium |
| Leave balance UI | pages/Employee/LeaveBalance | 🟡 Medium |
| Leave request form | pages/Employee/LeaveRequest | 🟡 Medium |
| File upload | services/storage.js | 🟢 Low |

**Firestore Collections mới:**
```javascript
devices/{id}: { userId, fingerprint, deviceName, status, registeredAt }
leaveRequests/{id}: { userId, type, startDate, endDate, status, ... }
leaveBalances/{userId}: { annual, sick, used, remaining }
```

---

## Phase 3: Manager Features 🔲 0%

### v2.2.0 - Approval Workflow

**Mục tiêu:** Manager có thể duyệt đơn của team

| Task | Files cần tạo | Priority |
|------|---------------|----------|
| Add role Manager | constants/roles.js (update) | 🔴 High |
| Manager sidebar menu | components/layout/Sidebar (update) | 🔴 High |
| Approval service | services/approval.js | 🔴 High |
| Approval page | pages/Manager/Approval | 🔴 High |
| Late/Early requests | services/lateEarly.js | 🟡 Medium |
| Late/Early UI | pages/Employee/LateEarly | 🟡 Medium |
| Team reports | pages/Manager/TeamReport | 🟡 Medium |
| Assign manager to employee | services/users.js (update) | 🟡 Medium |

**Approval Workflow:**
```
Employee tạo đơn → Manager duyệt → (Admin duyệt nếu > 3 ngày) → Done
```

---

## Phase 4: Admin+ 🔲 0%

### v2.3.0 - System Management

| Task | Files cần tạo |
|------|---------------|
| Settings service | services/settings.js |
| Settings page | pages/Admin/Settings |
| Notification service | services/notification.js |
| Notification page | pages/Notifications |
| Attendance correction | services/correction.js |
| Backup/Export | Enhanced reports |

---

## Phase 5: Advanced 🔲 0%

### v2.4.0 - Production Ready

| Feature | Description |
|---------|-------------|
| PWA | Offline support, install to home screen |
| Multi-branch | Support multiple office locations |
| Email notifications | Send email on approval, etc. |
| i18n | Vietnamese + English |

---

## 📈 Ước tính thời gian

| Phase | Effort | Timeline |
|-------|--------|----------|
| v2.0.2 Bug Fixes | 1-2 ngày | Ngay |
| v2.1.0 Employee | 3-5 ngày | Tuần 1 |
| v2.2.0 Manager | 2-3 ngày | Tuần 2 |
| v2.3.0 Admin+ | 2-3 ngày | Tuần 2-3 |
| v2.4.0 Advanced | 3-5 ngày | Tuần 3-4 |

**Total:** ~2-4 tuần cho full features

---

## 🎯 Ưu tiên hiện tại

1. **FIX BUGS** (v2.0.2) - 3 critical bugs phải fix trước
2. **Device fingerprinting** - Chống gian lận quan trọng nhất
3. **Manager role** - Cần có approval workflow

---

## 📝 Notes

- Firebase Free Tier đủ cho ~100 nhân viên (sau khi optimize)
- Cần Blaze Plan nếu > 200 nhân viên hoặc cần Cloud Functions
- Tất cả docs được cập nhật 2025-11-27
