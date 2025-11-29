# STRUCTURE - Cau truc Project v2.1.0

## Tong quan
```
attendance-system-v2/
  docs/
  public/
  src/
    components/
    constants/
    context/
    hooks/
    pages/
    services/
    utils/
    App.js
    index.js
    index.css
  package.json
```

## src/services/
- firebase.js
- auth.js
- users.js
- attendance.js
- qrcode.js
- reports.js
- devices.js *(moi)*
- storage.js *(moi - upload file)*
- leave.js *(moi - don nghiphep & balance)*
- lateEarly.js *(moi - di tre/ve som)*
- notification.js *(moi)*
- approval.js *(moi)*
- settings.js *(moi)*

## src/pages/
- Login/
- Dashboard/
- Attendance/
- History/
- Notifications/ *(moi)*
- Employee/
  - DeviceRegister/ *(moi)*
  - LeaveBalance/ *(moi)*
  - LeaveRequest/ *(moi)*
  - LateEarly/ *(moi)*
- Admin/
  - Users/
  - QRCode/
  - Reports/
  - Devices/ *(moi)*
  - Settings/ *(moi)*
- Manager/
  - Approval/ *(moi)*
  - TeamReport/ *(moi)*

## src/components/
- common/: Button, Input, Card, Modal, Badge, Loading
- layout/: Header, Sidebar, MainLayout
- charts/: StatCard

## Hooks
- useAuth, useTheme, useGPS, useAttendance (cap nhat: verify thiet bi)

## Constants
- config.js, roles.js (da co role manager)

## Ghi chu
- Sidebar cap nhat v2.1.0 voi cac menu cho Employee/Manager/Admin.
- App.js route theo currentView va quyen.
- Doc nay chi liet ke nhanh cac file chinh, khong ke node_modules.
