# Missing Pages - Implementation Guide

> **Status**: Services complete ✅ | Pages need implementation ⚠️
> **Last Updated**: 2025-11-29

## Summary

All backend services are complete and functional. The following pages need UI implementation:

### ✅ What's Already Done

- All 7 services implemented (devices, storage, leave, lateEarly, notification, approval, settings)
- All 6 bugs fixed (auth logout, QR GPS, delete user, race condition, timezone, N+1 queries)
- Core pages working (Login, Dashboard, Attendance, History, Profile, Admin Users/QR/Reports)

### ⚠️ Pages to Implement

#### Employee Pages (4 pages)

1. **`src/pages/Employee/DeviceRegister/index.jsx`**
   - Register and manage user devices
   - Use: `services/devices.js`
   - Functions: `generateDeviceFingerprint()`, `registerDevice()`, `getDevicesByUser()`, `deleteDevice()`

2. **`src/pages/Employee/LeaveBalance/index.jsx`**
   - View leave balance and history
   - Use: `services/leave.js`
   - Functions: `getLeaveBalance()`, `getLeaveRequestsByUser()`

3. **`src/pages/Employee/LeaveRequest/index.jsx`**
   - Create and manage leave requests
   - Use: `services/leave.js`, `services/storage.js`
   - Functions: `createLeaveRequest()`, `getLeaveRequestsByUser()`, `cancelLeaveRequest()`, `uploadLeaveDocument()`

4. **`src/pages/Employee/LateEarly/index.jsx`**
   - Create and view late/early requests
   - Use: `services/lateEarly.js`, `services/storage.js`
   - Functions: `createLateEarlyRequest()`, `getRequestsByUser()`, `cancelRequest()`, `uploadLateEarlyDocument()`

#### Manager Pages (2 pages)

5. **`src/pages/Manager/Approval/index.jsx`**
   - Approve/reject leave and late/early requests
   - Use: `services/approval.js`
   - Functions: `getAllPendingApprovals()`, `approveLeaveRequest()`, `rejectLeaveRequest()`, `approveLateEarlyRequest()`, `rejectLateEarlyRequest()`

6. **`src/pages/Manager/TeamReport/index.jsx`**
   - View team attendance reports and statistics
   - Use: `services/reports.js`, `services/users.js`
   - Functions: `getDepartmentReport()`, `getTopEmployees()`, `getEmployeeReport()`

#### Admin Pages (2 pages)

7. **`src/pages/Admin/Devices/index.jsx`**
   - Manage all devices, block/unblock
   - Use: `services/devices.js`
   - Functions: `getAllDevices()`, `blockDevice()`, `unblockDevice()`

8. **`src/pages/Admin/Settings/index.jsx`**
   - Configure system settings
   - Use: `services/settings.js`
   - Functions: `getSettings()`, `updateWorkingHours()`, `updateOfficeLocation()`, `updateLeaveSettings()`, etc.

#### Common Pages (1 page)

9. **`src/pages/Notifications/index.jsx`**
   - View and manage notifications
   - Use: `services/notification.js`
   - Functions: `getNotificationsByUser()`, `markAsRead()`, `markAllAsRead()`, `getUnreadCount()`

---

## Implementation Notes

### Page Structure Template

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
// Import relevant services

const PageName = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch data using service functions
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Page Title">
        {/* Page content */}
      </Card>
    </div>
  );
};

export default PageName;
```

### Routing Updates Needed

Add to `src/App.jsx` or routing configuration:

```jsx
// Employee routes
<Route path="/employee/devices" element={<DeviceRegister />} />
<Route path="/employee/leave-balance" element={<LeaveBalance />} />
<Route path="/employee/leave-request" element={<LeaveRequest />} />
<Route path="/employee/late-early" element={<LateEarly />} />

// Manager routes (protected by role)
<Route path="/manager/approval" element={<Approval />} />
<Route path="/manager/team-report" element={<TeamReport />} />

// Admin routes (protected by role)
<Route path="/admin/devices" element={<Devices />} />
<Route path="/admin/settings" element={<Settings />} />

// Common
<Route path="/notifications" element={<Notifications />} />
```

### UI Components Available

Use these existing components:
- `Card` - Card container with title
- `Button` - Button with variants (primary, secondary, success, danger, etc.)
- `Input` - Form input with label and error
- `Modal` - Modal dialog
- `Badge` - Status badges
- `Loading` - Loading spinner
- `StatCard` - Statistic cards for dashboard

---

## Quick Start

To implement a page:

1. Create the file in the appropriate directory
2. Import necessary services from `/services`
3. Use existing components from `/components/common`
4. Follow the template structure above
5. Add routing in `App.jsx`
6. Test functionality

---

## Priority Order

Recommended implementation order:

1. **High Priority**: Notifications (needed by many features)
2. **High Priority**: Employee/LeaveRequest (core HR feature)
3. **Medium Priority**: Manager/Approval (needed for workflow)
4. **Medium Priority**: Employee/DeviceRegister (security feature)
5. **Medium Priority**: Employee/LateEarly
6. **Low Priority**: Admin/Settings
7. **Low Priority**: Manager/TeamReport
8. **Low Priority**: Employee/LeaveBalance
9. **Low Priority**: Admin/Devices

---

*All services are production-ready and tested. Pages just need UI implementation.*
