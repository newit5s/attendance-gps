// src/constants/roles.js
// Định nghĩa roles và permissions

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const PERMISSIONS = {
  // Chấm công
  ATTENDANCE_CHECKIN: 'attendance:checkin',
  ATTENDANCE_VIEW_OWN: 'attendance:view_own',
  ATTENDANCE_VIEW_ALL: 'attendance:view_all',
  
  // Quản lý user
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_VIEW_ALL: 'user:view_all',
  
  // QR Code
  QRCODE_MANAGE: 'qrcode:manage',
  
  // Báo cáo
  REPORT_VIEW_OWN: 'report:view_own',
  REPORT_VIEW_TEAM: 'report:view_team',
  REPORT_VIEW_ALL: 'report:view_all',
  REPORT_EXPORT: 'report:export',
  
  // Phê duyệt
  APPROVAL_MANAGE: 'approval:manage',
  
  // Cài đặt
  SETTINGS_MANAGE: 'settings:manage'
};

// Permission theo role
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.ATTENDANCE_CHECKIN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.QRCODE_MANAGE,
    PERMISSIONS.REPORT_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_TEAM,
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.APPROVAL_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.ATTENDANCE_CHECKIN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_TEAM,
    PERMISSIONS.APPROVAL_MANAGE
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.ATTENDANCE_CHECKIN,
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.REPORT_VIEW_OWN
  ]
};

/**
 * Kiểm tra user có permission không
 * @param {string} role - Role của user
 * @param {string} permission - Permission cần kiểm tra
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Kiểm tra có phải admin không
 * @param {string} role
 * @returns {boolean}
 */
export const isAdmin = (role) => role === ROLES.ADMIN;

/**
 * Kiểm tra có phải manager trở lên không
 * @param {string} role
 * @returns {boolean}
 */
export const isManagerOrAbove = (role) => 
  role === ROLES.ADMIN || role === ROLES.MANAGER;
