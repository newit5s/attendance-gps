# PHÂN TÍCH LOGIC - Hệ thống Chấm công v2.0

## 🔍 PHÂN TÍCH HIỆN TRẠNG

### 1. Logic Report hiện tại

#### ✅ Đã có và hoạt động đúng:
- `getCompanyStats()` - Thống kê tổng công ty theo tháng
- `getEmployeeReport()` - Báo cáo chi tiết 1 nhân viên
- `getDepartmentReport()` - Báo cáo theo phòng ban
- `getTopEmployees()` - Bảng xếp hạng nhân viên
- `isLateCheckIn()` / `isEarlyCheckOut()` - Kiểm tra đi muộn/về sớm

#### ⚠️ Vấn đề tiềm ẩn:

**Vấn đề 1: Query hiệu suất kém với getDepartmentReport()**
```javascript
// Hiện tại: Loop qua từng user → N queries
for (const userId of userIds) {
  const q = query(...where('userId', '==', userId)...);
}
// Nếu 100 users → 100 queries!
```

**Vấn đề 2: getTopEmployees() gọi getEmployeeReport() N lần**
```javascript
for (const user of users) {
  const report = await getEmployeeReport(user.id, month, year);
  // Mỗi user = 1 query → 50 users = 50 queries
}
```

**Vấn đề 3: Chưa xử lý edge cases**
- Ngày không có check-out (quên check-out)
- Check-in nhiều lần trong ngày (lỗi hệ thống)
- Timezone khác nhau

---

### 2. Logic Phê duyệt (CHƯA CÓ!)

Theo ROADMAP, hệ thống **CHƯA CÓ** chức năng phê duyệt:
- ❌ Không có `services/approval.js`
- ❌ Không có `services/leave.js` (nghỉ phép)
- ❌ Không có `services/lateEarly.js` (đi trễ/về sớm)
- ❌ Không có role Manager
- ❌ Không có workflow phê duyệt

---

## 🎯 ĐỀ XUẤT THIẾT KẾ LOGIC PHÊ DUYỆT

### Workflow tổng quan

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Employee   │────▶│   Manager   │────▶│    Admin    │
│  Tạo đơn    │     │  Phê duyệt  │     │  Override   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────┐
│                   Firestore                         │
│  requests/{id}                                      │
│  - status: pending → approved/rejected              │
└─────────────────────────────────────────────────────┘
```

### Các loại đơn cần phê duyệt

| Loại đơn | Ai tạo | Ai duyệt | Ảnh hưởng |
|----------|--------|----------|-----------|
| Nghỉ phép (Leave) | Employee | Manager → Admin | Trừ ngày phép |
| Đi trễ có lý do | Employee | Manager | Không tính đi muộn |
| Về sớm có lý do | Employee | Manager | Không tính về sớm |
| Bổ sung chấm công | Employee | Manager → Admin | Thêm record attendance |
| Đăng ký thiết bị | Employee | Admin | Cho phép chấm công |

### Trạng thái đơn (Status Flow)

```
                    ┌──────────────┐
                    │   PENDING    │
                    │  (Chờ duyệt) │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   APPROVED   │ │   REJECTED   │ │  CANCELLED   │
    │  (Đã duyệt)  │ │  (Từ chối)   │ │  (Đã hủy)    │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📝 THIẾT KẾ CHI TIẾT

### 1. Firestore Collections mới

```javascript
// ========================================
// COLLECTION: leaveRequests (Đơn nghỉ phép)
// ========================================
leaveRequests/{requestId}: {
  // Thông tin người tạo
  userId: string,
  userName: string,
  userDepartment: string,
  
  // Thông tin đơn
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'other',
  startDate: string,        // "2025-01-15"
  endDate: string,          // "2025-01-17"  
  totalDays: number,        // 3
  reason: string,
  attachmentUrls: string[], // Files đính kèm
  
  // Trạng thái
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  
  // Thông tin phê duyệt
  approvalFlow: [
    {
      level: 1,
      approverId: string,
      approverName: string,
      approverRole: 'manager',
      status: 'pending' | 'approved' | 'rejected',
      comment: string,
      timestamp: timestamp
    },
    {
      level: 2,
      approverId: string,
      approverName: string, 
      approverRole: 'admin',
      status: 'pending',
      comment: null,
      timestamp: null
    }
  ],
  currentApprovalLevel: 1,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp
}

// ========================================
// COLLECTION: lateEarlyRequests (Đơn đi trễ/về sớm)
// ========================================
lateEarlyRequests/{requestId}: {
  userId: string,
  userName: string,
  
  type: 'late' | 'early',   // Đi trễ hoặc về sớm
  date: string,             // Ngày áp dụng
  
  // Nếu đi trễ
  expectedCheckIn: string,  // "08:30"
  actualCheckIn: string,    // "09:15"
  lateMinutes: number,      // 45
  
  // Nếu về sớm  
  expectedCheckOut: string, // "17:30"
  actualCheckOut: string,   // "16:00"
  earlyMinutes: number,     // 90
  
  reason: string,
  attachmentUrl: string,
  
  status: 'pending' | 'approved' | 'rejected',
  approverId: string,
  approverName: string,
  approverComment: string,
  approvedAt: timestamp,
  
  createdAt: timestamp
}

// ========================================
// COLLECTION: attendanceCorrections (Bổ sung chấm công)
// ========================================
attendanceCorrections/{requestId}: {
  userId: string,
  userName: string,
  
  date: string,
  correctionType: 'add_checkin' | 'add_checkout' | 'modify',
  
  // Dữ liệu cần sửa/thêm
  requestedCheckIn: string,   // "08:30"
  requestedCheckOut: string,  // "17:30"
  
  reason: string,
  attachmentUrl: string,
  
  status: 'pending' | 'approved' | 'rejected',
  
  // 2 cấp duyệt
  managerApproval: {
    status: 'pending' | 'approved' | 'rejected',
    approverId: string,
    comment: string,
    timestamp: timestamp
  },
  adminApproval: {
    status: 'pending' | 'approved' | 'rejected',
    approverId: string,
    comment: string,
    timestamp: timestamp
  },
  
  createdAt: timestamp
}

// ========================================
// COLLECTION: leaveBalances (Số ngày phép)
// ========================================
leaveBalances/{userId}: {
  year: 2025,
  
  // Quota
  annualQuota: 12,        // Phép năm
  sickQuota: 5,           // Phép bệnh
  personalQuota: 3,       // Phép việc riêng
  
  // Đã dùng
  annualUsed: 3,
  sickUsed: 1,
  personalUsed: 0,
  
  // Còn lại (computed)
  annualRemaining: 9,
  sickRemaining: 4,
  personalRemaining: 3,
  
  updatedAt: timestamp
}

// ========================================
// COLLECTION: users (Cập nhật thêm fields)
// ========================================
users/{userId}: {
  ...existingFields,
  
  // Thêm mới
  managerId: string,      // ID của manager trực tiếp
  managerName: string,    // Tên manager (denormalized)
  
  // Nếu là manager
  subordinateIds: string[], // Danh sách ID nhân viên dưới quyền
}
```

### 2. Services mới cần tạo

```javascript
// ========================================
// services/leave.js - Quản lý nghỉ phép
// ========================================

// Employee
createLeaveRequest(data)        // Tạo đơn nghỉ phép
getMyLeaveRequests(userId)      // Xem đơn của mình
cancelLeaveRequest(requestId)   // Hủy đơn (chỉ khi pending)
getMyLeaveBalance(userId)       // Xem số ngày phép còn lại

// Manager
getPendingRequestsForManager(managerId)  // Đơn chờ duyệt
approveLeaveRequest(requestId, comment)  // Duyệt
rejectLeaveRequest(requestId, comment)   // Từ chối

// Admin  
getAllPendingRequests()         // Tất cả đơn chờ duyệt
adminApproveRequest(requestId)  // Duyệt cấp 2
adminRejectRequest(requestId)   // Từ chối cấp 2
updateLeaveBalance(userId, data) // Sửa quota

// ========================================
// services/lateEarly.js - Đơn đi trễ/về sớm
// ========================================

createLateRequest(data)         // Tạo đơn đi trễ
createEarlyRequest(data)        // Tạo đơn về sớm
getMyLateEarlyRequests(userId)  // Xem đơn của mình

approveLateEarly(requestId)     // Manager duyệt
rejectLateEarly(requestId)      // Manager từ chối

// ========================================
// services/correction.js - Bổ sung chấm công
// ========================================

createCorrectionRequest(data)   // Tạo đơn bổ sung
getCorrectionRequests(userId)   // Xem đơn của mình

managerApproveCorrection(id)    // Manager duyệt
adminApproveCorrection(id)      // Admin duyệt cuối
applyCorrection(id)             // Tự động thêm vào attendances sau khi duyệt

// ========================================
// services/approval.js - Tổng hợp phê duyệt
// ========================================

getAllPendingForApprover(approverId, role)  // Lấy tất cả đơn cần duyệt
getApprovalStats(approverId)                // Thống kê: pending, approved, rejected
```

### 3. Logic phê duyệt chi tiết

```javascript
// ========================================
// Ví dụ: Workflow đơn nghỉ phép
// ========================================

// Bước 1: Employee tạo đơn
const createLeaveRequest = async (data) => {
  // Validate
  if (data.totalDays > leaveBalance.remaining) {
    throw new Error('Không đủ ngày phép');
  }
  
  // Lấy manager của employee
  const user = await getUserData(data.userId);
  const manager = await getUserData(user.managerId);
  
  // Tạo đơn với approval flow
  const request = {
    ...data,
    status: 'pending',
    approvalFlow: [
      {
        level: 1,
        approverId: manager.id,
        approverName: manager.name,
        approverRole: 'manager',
        status: 'pending',
        comment: null,
        timestamp: null
      }
    ],
    currentApprovalLevel: 1,
    createdAt: Timestamp.now()
  };
  
  // Nếu nghỉ > 3 ngày, cần Admin duyệt thêm
  if (data.totalDays > 3) {
    const admins = await getUsersByRole('admin');
    request.approvalFlow.push({
      level: 2,
      approverId: admins[0].id,
      approverName: admins[0].name,
      approverRole: 'admin',
      status: 'pending',
      comment: null,
      timestamp: null
    });
  }
  
  await addDoc(collection(db, 'leaveRequests'), request);
  
  // TODO: Send notification to manager
};

// Bước 2: Manager duyệt
const managerApproveLeave = async (requestId, managerId, comment) => {
  const request = await getDoc(doc(db, 'leaveRequests', requestId));
  const data = request.data();
  
  // Validate: Đúng manager không?
  if (data.approvalFlow[0].approverId !== managerId) {
    throw new Error('Bạn không có quyền duyệt đơn này');
  }
  
  // Update approval flow
  data.approvalFlow[0].status = 'approved';
  data.approvalFlow[0].comment = comment;
  data.approvalFlow[0].timestamp = Timestamp.now();
  
  // Check xem còn level nào không
  if (data.approvalFlow.length > 1) {
    // Còn cần Admin duyệt
    data.currentApprovalLevel = 2;
    // TODO: Send notification to admin
  } else {
    // Đã xong
    data.status = 'approved';
    // Trừ ngày phép
    await deductLeaveBalance(data.userId, data.type, data.totalDays);
  }
  
  await updateDoc(doc(db, 'leaveRequests', requestId), data);
};

// Bước 3: Admin duyệt (nếu cần)
const adminApproveLeave = async (requestId, adminId, comment) => {
  // Tương tự manager, nhưng level 2
  // Sau khi duyệt → trừ ngày phép
};
```

### 4. Cập nhật Report để tính đúng

```javascript
// ========================================
// Cập nhật isLateCheckIn để check approved requests
// ========================================

export const isLateCheckIn = async (userId, date, timestamp) => {
  // Kiểm tra có đơn đi trễ được duyệt không
  const lateRequest = await getApprovedLateRequest(userId, date);
  
  if (lateRequest) {
    // Có đơn được duyệt → không tính đi muộn
    return false;
  }
  
  // Logic cũ
  const { start, lateThreshold } = WORKING_HOURS;
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const allowedMinutes = start.hour * 60 + start.minute + lateThreshold;
  return totalMinutes > allowedMinutes;
};

// ========================================
// Cập nhật getEmployeeReport
// ========================================

export const getEmployeeReport = async (userId, month, year) => {
  // ... existing code ...
  
  // Thêm: Lấy các đơn đã được duyệt
  const approvedLateRequests = await getApprovedLateRequests(userId, month, year);
  const approvedEarlyRequests = await getApprovedEarlyRequests(userId, month, year);
  const approvedLeaveRequests = await getApprovedLeaveRequests(userId, month, year);
  
  // Khi tính stats, loại trừ những ngày có đơn được duyệt
  records.forEach(day => {
    const hasApprovedLate = approvedLateRequests.find(r => r.date === day.date);
    const hasApprovedEarly = approvedEarlyRequests.find(r => r.date === day.date);
    
    if (day.checkIn && isLateCheckInTime(day.checkIn.timestamp)) {
      if (hasApprovedLate) {
        day.status = 'approved-late';  // Đi muộn có phép
        day.lateReason = hasApprovedLate.reason;
      } else {
        lateDays++;
        day.status = 'late';  // Đi muộn không phép
      }
    }
    // ... tương tự cho về sớm
  });
  
  return {
    ...existingData,
    stats: {
      ...existingStats,
      approvedLateDays,     // Số ngày đi muộn có phép
      unapprovedLateDays,   // Số ngày đi muộn không phép  
      approvedEarlyDays,
      unapprovedEarlyDays,
      leaveDays,            // Số ngày nghỉ phép
    }
  };
};
```

---

## 📊 SƠ ĐỒ LOGIC ĐẦY ĐỦ

```
┌─────────────────────────────────────────────────────────────────┐
│                         EMPLOYEE                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Chấm công]     [Xem lịch sử]    [Tạo đơn]    [Xem ngày phép]  │
│      │                │               │               │          │
│      ▼                ▼               ▼               ▼          │
│  attendance.js   reports.js      leave.js      leaveBalance     │
└──────────┬───────────────────────────┬──────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MANAGER                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Xem team]      [Duyệt đơn]     [Báo cáo team]                 │
│      │               │                │                          │
│      ▼               ▼                ▼                          │
│  users.js       approval.js      reports.js                      │
│  (subordinates)  (pending list)  (getDepartmentReport)          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ADMIN                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Quản lý users]  [Duyệt cấp 2]  [Báo cáo]  [Cài đặt]  [QR]    │
│       │                │            │           │         │      │
│       ▼                ▼            ▼           ▼         ▼      │
│   users.js       approval.js   reports.js  settings.js qrcode.js│
│   (CRUD all)    (final approve) (company)  (working hours)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ ACTION ITEMS

### Ưu tiên cao (Cần làm trước)
1. [ ] Thêm field `managerId` vào users collection
2. [ ] Tạo `services/leave.js` với CRUD cơ bản
3. [ ] Tạo `services/approval.js` cho workflow duyệt
4. [ ] Tạo `pages/Employee/LeaveRequest/index.jsx`
5. [ ] Tạo `pages/Manager/Approval/index.jsx`
6. [ ] Cập nhật `constants/roles.js` thêm role Manager

### Ưu tiên trung bình
7. [ ] Tạo `services/lateEarly.js`
8. [ ] Tạo `services/correction.js`
9. [ ] Cập nhật `services/reports.js` để tính đúng với approved requests
10. [ ] Thêm notification system

### Ưu tiên thấp
11. [ ] Email notifications
12. [ ] Dashboard cho Manager
13. [ ] Export báo cáo chi tiết với approval history

---

## 🔄 TRƯỚC VÀ SAU

### Report TRƯỚC (hiện tại)
```
Tháng 11/2025
- Tổng ngày làm: 20
- Đúng giờ: 15
- Đi muộn: 5      ← Tất cả đều tính là đi muộn
- Về sớm: 2
```

### Report SAU (có approval)
```
Tháng 11/2025
- Tổng ngày làm: 20
- Đúng giờ: 15
- Đi muộn có phép: 3   ← Có lý do được duyệt
- Đi muộn không phép: 2 ← Không có lý do
- Về sớm có phép: 1
- Về sớm không phép: 1
- Nghỉ phép: 2 ngày
```
