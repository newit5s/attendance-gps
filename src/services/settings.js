// src/services/settings.js
// System settings service

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = 'settings/system';

/**
 * Default system settings
 */
const DEFAULT_SETTINGS = {
  // Working hours
  workingHours: {
    start: { hour: 8, minute: 30 },
    end: { hour: 17, minute: 30 },
    lateThreshold: 15, // minutes
    earlyThreshold: 15 // minutes
  },

  // Office location
  officeLocation: {
    lat: 10.8231,
    lng: 106.6297,
    radius: 100, // meters
    address: 'Hồ Chí Minh, Việt Nam'
  },

  // Leave settings
  leave: {
    annualDaysPerYear: 12,
    maxConsecutiveDays: 15,
    requireDocumentAfterDays: 3,
    advanceNoticeDays: 1
  },

  // Device settings
  device: {
    maxDevicesPerUser: 2,
    requireDeviceRegistration: false
  },

  // QR Code settings
  qrCode: {
    expiryDays: 30,
    requireGPSWithQR: true
  },

  // Attendance settings
  attendance: {
    allowCheckInBefore: 60, // minutes before work start
    allowCheckOutAfter: 60, // minutes after work end
    requirePhoto: false
  },

  // Notification settings
  notifications: {
    emailEnabled: false,
    pushEnabled: true,
    dailyReminder: true,
    reminderTime: '08:00'
  },

  // System
  system: {
    appName: 'Attendance System',
    version: '2.0.1',
    maintenanceMode: false
  }
};

/**
 * Get system settings
 * @returns {Promise<object>}
 */
export const getSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      // Initialize with default settings
      await initializeSettings();
      return DEFAULT_SETTINGS;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
      updatedAt: snapshot.data().updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Lỗi lấy settings:', error);
    throw error;
  }
};

/**
 * Initialize settings with defaults
 * @returns {Promise<void>}
 */
export const initializeSettings = async () => {
  try {
    await setDoc(doc(db, SETTINGS_DOC), {
      ...DEFAULT_SETTINGS,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi initialize settings:', error);
    throw error;
  }
};

/**
 * Update working hours
 * @param {object} workingHours
 * @returns {Promise<void>}
 */
export const updateWorkingHours = async (workingHours) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      workingHours,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update working hours:', error);
    throw error;
  }
};

/**
 * Update office location
 * @param {object} officeLocation
 * @returns {Promise<void>}
 */
export const updateOfficeLocation = async (officeLocation) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      officeLocation,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update office location:', error);
    throw error;
  }
};

/**
 * Update leave settings
 * @param {object} leaveSettings
 * @returns {Promise<void>}
 */
export const updateLeaveSettings = async (leaveSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      leave: leaveSettings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update leave settings:', error);
    throw error;
  }
};

/**
 * Update device settings
 * @param {object} deviceSettings
 * @returns {Promise<void>}
 */
export const updateDeviceSettings = async (deviceSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      device: deviceSettings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update device settings:', error);
    throw error;
  }
};

/**
 * Update QR code settings
 * @param {object} qrCodeSettings
 * @returns {Promise<void>}
 */
export const updateQRCodeSettings = async (qrCodeSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      qrCode: qrCodeSettings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update QR code settings:', error);
    throw error;
  }
};

/**
 * Update attendance settings
 * @param {object} attendanceSettings
 * @returns {Promise<void>}
 */
export const updateAttendanceSettings = async (attendanceSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      attendance: attendanceSettings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update attendance settings:', error);
    throw error;
  }
};

/**
 * Update notification settings
 * @param {object} notificationSettings
 * @returns {Promise<void>}
 */
export const updateNotificationSettings = async (notificationSettings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      notifications: notificationSettings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update notification settings:', error);
    throw error;
  }
};

/**
 * Update all settings
 * @param {object} settings
 * @returns {Promise<void>}
 */
export const updateAllSettings = async (settings) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      ...settings,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update all settings:', error);
    throw error;
  }
};

/**
 * Enable maintenance mode
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
export const setMaintenanceMode = async (enabled) => {
  try {
    await updateDoc(doc(db, SETTINGS_DOC), {
      'system.maintenanceMode': enabled,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi set maintenance mode:', error);
    throw error;
  }
};

/**
 * Reset settings to default
 * @returns {Promise<void>}
 */
export const resetToDefault = async () => {
  try {
    await setDoc(doc(db, SETTINGS_DOC), {
      ...DEFAULT_SETTINGS,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi reset settings:', error);
    throw error;
  }
};

/**
 * Export settings as JSON
 * @returns {Promise<string>}
 */
export const exportSettings = async () => {
  try {
    const settings = await getSettings();
    return JSON.stringify(settings, null, 2);
  } catch (error) {
    console.error('Lỗi export settings:', error);
    throw error;
  }
};

/**
 * Import settings from JSON
 * @param {string} jsonString
 * @returns {Promise<void>}
 */
export const importSettings = async (jsonString) => {
  try {
    const settings = JSON.parse(jsonString);
    await updateAllSettings(settings);
  } catch (error) {
    console.error('Lỗi import settings:', error);
    throw error;
  }
};
