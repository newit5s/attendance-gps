# API REFERENCE - Attendance System v2.0.1

> **Mục đích:** Cung cấp đủ context để viết code mới mà không cần đọc toàn bộ source
> **Cập nhật:** 2025-11-27

---

## 📦 Services API

### services/firebase.js
```javascript
// Exports
export const auth;      // Firebase Auth instance
export const db;        // Firestore instance  
export const storage;   // Firebase Storage instance
```

### services/auth.js
```javascript
// Login
loginUser(email: string, password: string): Promise<User>

// Logout
logoutUser(): Promise<void>

// Create user (⚠️ BUG: logout admin)
createUser(email: string, password: string, userData: {
  name: string,
  role: 'admin' | 'employee',
  department?: string,
  phone?: string
}): Promise<string> // returns uid

// Reset password
resetPassword(email: string): Promise<void>

// Change password
changePassword(newPassword: string): Promise<void>

// Auth state listener
onAuthChange(callback: (user: User | null) => void): () => void // returns unsubscribe

// Get current user
getCurrentUser(): User | null
```

### services/users.js
```javascript
// Get one user
getUserData(uid: string): Promise<UserData | null>

// Get all users
getAllUsers(): Promise<UserData[]>

// Get by department
getUsersByDepartment(department: string): Promise<UserData[]>

// Get by role
getUsersByRole(role: string): Promise<UserData[]>

// Update user
updateUser(uid: string, data: Partial<UserData>): Promise<void>

// Delete user (⚠️ BUG: không xóa Auth)
deleteUser(uid: string): Promise<void>

// Assign manager
assignManager(employeeId: string, managerId: string): Promise<void>

// Get all departments
getAllDepartments(): Promise<string[]>

// Get managers
getManagers(): Promise<UserData[]>

// Search
searchUsers(searchTerm: string): Promise<UserData[]>

// Types
interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'manager';
  department?: string;
  phone?: string;
  status: 'active' | 'deleted';
  managerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### services/attendance.js
```javascript
// Create attendance record
createAttendance(data: {
  userId: string,
  userName: string,
  type: 'check-in' | 'check-out',
  method: 'GPS' | 'QR Code',
  location: { lat: number, lng: number, accuracy?: number },
  distance: number,
  deviceId?: string
}): Promise<string> // returns docId

// Get user attendances
getUserAttendances(userId: string, limit?: number): Promise<Attendance[]>

// Get all attendances (admin)
getAllAttendances(limit?: number): Promise<Attendance[]>

// Check today
checkTodayAttendance(userId: string, type: 'check-in' | 'check-out'): Promise<Attendance | null>

// Monthly stats
getMonthlyStats(userId: string, month: number, year: number): Promise<{
  totalDays: number,
  lateDays: number,
  earlyDays: number,
  onTimeDays: number,
  checkIns: Attendance[],
  checkOuts: Attendance[]
}>

// By date range
getAttendancesByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Attendance[]>

// Check late
isLateCheckIn(timestamp: Date): boolean

// Check early leave
isEarlyCheckOut(timestamp: Date): boolean

// Calculate distance (Haversine)
calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number // meters

// Types
interface Attendance {
  id: string;
  userId: string;
  userName: string;
  type: 'check-in' | 'check-out';
  method: 'GPS' | 'QR Code';
  location: { lat: number, lng: number, accuracy?: number };
  distance: number;
  status: 'success';
  timestamp: Date;
  date: string; // 'YYYY-MM-DD'
  month: number;
  year: number;
}
```

### services/qrcode.js
```javascript
// Save QR
saveQRCode(data: { code: string, expiryDate?: string }): Promise<void>

// Get QR
getQRCode(): Promise<QRData | null>

// Verify QR
verifyQRCode(qrContent: string): Promise<boolean>

// Generate content
generateQRContent(): string // format: 'ATTENDANCE_QR_{timestamp}_{random}'

// Check valid
isQRCodeValid(qrData: QRData): boolean

// Delete QR
deleteQRCode(): Promise<void>

// Types
interface QRData {
  code: string;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### services/reports.js
```javascript
// Company stats
getCompanyStats(month: number, year: number): Promise<{
  totalAttendances: number,
  totalCheckIns: number,
  totalCheckOuts: number,
  gpsAttendances: number,
  qrAttendances: number,
  lateCheckIns: number,
  earlyCheckOuts: number,
  uniqueEmployees: number,
  onTimeRate: number // percentage
}>

// Department report
getDepartmentReport(department: string, month: number, year: number): Promise<{
  department: string,
  totalEmployees: number,
  totalCheckIns: number,
  lateDays: number,
  onTimeRate: number,
  attendances: Attendance[]
}>

// Employee report
getEmployeeReport(userId: string, month: number, year: number): Promise<{
  userId: string,
  month: number,
  year: number,
  records: DailyRecord[],
  stats: {
    totalDays: number,
    lateDays: number,
    earlyDays: number,
    onTimeDays: number,
    totalWorkingHours: string,
    avgWorkingHours: string
  }
}>

// Top employees
getTopEmployees(month: number, year: number, limit?: number): Promise<{
  userId: string,
  name: string,
  department: string,
  totalDays: number,
  onTimeDays: number,
  lateDays: number,
  onTimeRate: number
}[]>

// Export CSV
exportToCSV(data: string, filename: string): void

// Generate CSV content
generateEmployeeCSV(report: EmployeeReport, user: UserData): string
```

---

## 🎣 Hooks API

### useAuth (from context)
```javascript
const {
  user,              // Firebase User | null
  userData,          // UserData | null
  loading,           // boolean
  isAuthenticated,   // boolean
  isAdmin,           // boolean
  isManager,         // boolean
  login,             // (email, password) => Promise
  logout,            // () => Promise
  refreshUserData    // () => Promise
} = useAuth();
```

### useTheme (from context)
```javascript
const {
  darkMode,    // boolean
  toggleTheme, // () => void
  setDarkMode  // (value: boolean) => void
} = useTheme();
```

### useGPS
```javascript
const {
  location,      // { lat, lng, accuracy } | null
  distance,      // number | null (meters to office)
  loading,       // boolean
  error,         // string | null
  isInRange,     // boolean
  refresh,       // () => Promise
  fetchLocation  // () => Promise
} = useGPS({ 
  autoFetch?: boolean,      // default: false
  targetLocation?: object   // default: OFFICE_LOCATION
});
```

### useAttendance
```javascript
const {
  todayCheckIn,    // Attendance | null
  todayCheckOut,   // Attendance | null
  attendances,     // Attendance[]
  monthlyStats,    // MonthlyStats | null
  loading,         // boolean
  error,           // string | null
  hasCheckedIn,    // boolean
  hasCheckedOut,   // boolean
  checkIn,         // (method, location, distance, deviceId?) => Promise
  checkOut,        // (method, location, distance, deviceId?) => Promise
  refresh          // () => Promise
} = useAttendance();
```

---

## 🧩 Components API

### Button
```jsx
<Button
  variant="primary|secondary|success|danger|warning|outline"
  size="sm|md|lg"
  loading={boolean}
  disabled={boolean}
  fullWidth={boolean}
  onClick={function}
  type="button|submit"
  className={string}
>
  {children}
</Button>
```

### Input
```jsx
<Input
  label={string}
  type="text|email|password|..."
  value={string}
  onChange={function}
  placeholder={string}
  error={string}
  disabled={boolean}
  required={boolean}
  className={string}
  icon={LucideIcon}
/>
```

### Card
```jsx
<Card
  title={string}
  subtitle={string}
  className={string}
  headerAction={ReactNode}
  noPadding={boolean}
>
  {children}
</Card>
```

### Modal
```jsx
<Modal
  isOpen={boolean}
  onClose={function}
  title={string}
  size="sm|md|lg|xl|full"
  showCloseButton={boolean}
>
  {children}
</Modal>
```

### Badge
```jsx
<Badge
  variant="default|success|warning|danger|info|primary"
  size="sm|md|lg"
>
  {children}
</Badge>
```

### Loading
```jsx
<Loading 
  size="sm|md|lg" 
  text={string} 
/>
```

### StatCard
```jsx
<StatCard
  title={string}
  value={string|number}
  icon={LucideIcon}
  trend="up|down"
  trendValue={string}
  color="blue|green|yellow|red|purple|indigo"
  subtitle={string}
/>
```

---

## ⚙️ Constants

### config.js
```javascript
FIREBASE_CONFIG = { apiKey, authDomain, projectId, ... }

OFFICE_LOCATION = {
  lat: 10.8231,
  lng: 106.6297,
  radius: 100  // meters
}

WORKING_HOURS = {
  start: { hour: 8, minute: 30 },
  end: { hour: 17, minute: 30 },
  lateThreshold: 15,   // minutes
  earlyThreshold: 15   // minutes
}

APP_CONFIG = {
  appName: string,
  version: '2.0.0',
  maxDevicesPerUser: 2,
  qrCodeExpiryDays: 30
}
```

### roles.js
```javascript
ROLES = { ADMIN: 'admin', MANAGER: 'manager', EMPLOYEE: 'employee' }

PERMISSIONS = {
  ATTENDANCE_CHECKIN, ATTENDANCE_VIEW_OWN, ATTENDANCE_VIEW_ALL,
  USER_CREATE, USER_UPDATE, USER_DELETE, USER_VIEW_ALL,
  QRCODE_MANAGE,
  REPORT_VIEW_OWN, REPORT_VIEW_TEAM, REPORT_VIEW_ALL, REPORT_EXPORT,
  APPROVAL_MANAGE, SETTINGS_MANAGE
}

// Functions
hasPermission(role: string, permission: string): boolean
isAdmin(role: string): boolean
isManagerOrAbove(role: string): boolean
```

---

## 🗄️ Firestore Schema

### Collections hiện có:
```
users/{uid}
attendances/{docId}
settings/qrcode
```

### Collections cần thêm (v2.1.0+):
```
devices/{docId}
leaveRequests/{docId}
leaveBalances/{userId}
lateEarlyRequests/{docId}
notifications/{docId}
settings/system
```

### Indexes cần tạo:
```
attendances: userId + timestamp (desc)
attendances: userId + date + type
attendances: month + year
attendances: userId + month + year + timestamp
```

---

## 📝 Cách dùng file này

Khi bắt đầu conversation mới với Claude:

1. **Attach file này** + `STATUS.md` + `ROADMAP.md`
2. **Nói task cần làm**, ví dụ: "Tạo services/devices.js"
3. Claude sẽ có đủ context để viết code compatible

**Ví dụ prompt:**
```
Dựa vào API-REFERENCE.md, tạo services/devices.js với các functions:
- registerDevice(userId, fingerprint, deviceName)
- getDevicesByUser(userId)
- verifyDevice(userId, fingerprint)
- blockDevice(deviceId)
```

---

## ⚠️ Lưu ý quan trọng

1. **Bugs chưa fix** - Xem BUGS-ANALYSIS.md
2. **N+1 query** - reports.js cần optimize
3. **Timezone** - attendance.js dùng UTC, cần fix
4. **QR không check GPS** - pages/Attendance cần fix

---

*File này cần update mỗi khi thêm service/hook/component mới*
