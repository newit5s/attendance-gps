# CHANGELOG - He thong Cham cong GPS & QR Code

## [v2.1.0] - 2025-11-27
### Muc tieu
Hoan thien tinh nang nhan vien, manager va admin+ co ban.

### Hoan thanh
- Them `services/devices.js`, `services/storage.js`, `services/leave.js`, `services/lateEarly.js`, `services/notification.js`, `services/approval.js`, `services/settings.js`.
- Cap nhat `hooks/useAttendance.js` de verify thiet bi khi check-in/out.
- Cap nhat `pages/Attendance` de truyen fingerprint thiet bi.
- Them trang Employee: DeviceRegister, LeaveBalance, LeaveRequest, LateEarly.
- Them trang Notifications cho user.
- Them trang Admin: Devices, Settings; cap nhat Users ho tro role Manager.
- Them trang Manager: Approval, TeamReport.
- Cap nhat Sidebar/App routing (v2.1.0 menu moi).
- Cap nhat docs (ROADMAP, STRUCTURE).

### Ghi chu
- Phase 5 (PWA, email, i18n, multi-branch) chua thuc hien.

## [v2.0.1] - 2025-11-27
### Muc tieu
Hoan thien tat ca services va modules thieu tu v2.0.0

### Hoan thanh
- Services: firebase, auth, users, attendance, qrcode, reports
- Context: AuthContext, ThemeContext
- Hooks: useAuth, useTheme, useGPS, useAttendance
- Utils: formatters, validators
- Constants: config, roles
- Components: Button, Input, Card, Modal, Badge, Loading, Header, Sidebar, MainLayout, StatCard
- Pages: Login, Dashboard, Attendance, History, Admin Users/QRCode/Reports
- Core: App.js, index.js, index.css, public/index.html

## [v2.0.0] - 2025-11-26
- Refactor tu single-file App.js sang cau truc module
- Chua day du services (fix o v2.0.1)

## [v1.0.0] - 2025-11-25
- Deploy Firebase Hosting, cham cong GPS/QR, quan ly nhan vien, bao cao co ban
