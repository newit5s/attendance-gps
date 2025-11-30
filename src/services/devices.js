// src/services/devices.js
// Device management service for device fingerprinting

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { APP_CONFIG } from '../constants/config';

const COLLECTION = 'devices';

/**
 * Generate device fingerprint
 * @returns {Promise<string>} Device fingerprint
 */
export const generateDeviceFingerprint = async () => {
  const components = [];

  // User Agent
  components.push(navigator.userAgent);

  // Screen resolution
  components.push(`${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency
  components.push(navigator.hardwareConcurrency || 'unknown');

  // Device memory (if available)
  if (navigator.deviceMemory) {
    components.push(navigator.deviceMemory);
  }

  // Create hash from components
  const fingerprint = await hashString(components.join('|'));
  return fingerprint;
};

/**
 * Hash a string using SubtleCrypto
 * @param {string} str
 * @returns {Promise<string>}
 */
const hashString = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Register a new device
 * @param {string} userId
 * @param {string} fingerprint
 * @param {string} deviceName - Optional device name
 * @returns {Promise<string>} Device ID
 */
export const registerDevice = async (userId, fingerprint, deviceName = null) => {
  try {
    // Check if user has reached max devices
    const userDevices = await getDevicesByUser(userId);
    const activeDevices = userDevices.filter(d => d.status === 'active');

    if (activeDevices.length >= APP_CONFIG.maxDevicesPerUser) {
      throw new Error(`Bạn đã đăng ký tối đa ${APP_CONFIG.maxDevicesPerUser} thiết bị. Vui lòng xóa thiết bị cũ trước.`);
    }

    // Check if device already registered
    const existing = await getDeviceByFingerprint(userId, fingerprint);
    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Thiết bị này đã bị chặn');
      }
      // Reactivate if deleted
      if (existing.status === 'deleted') {
        await updateDoc(doc(db, COLLECTION, existing.id), {
          status: 'active',
          updatedAt: Timestamp.now()
        });
        return existing.id;
      }
      return existing.id;
    }

    // Register new device
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      fingerprint,
      deviceName: deviceName || `Device ${activeDevices.length + 1}`,
      userAgent: navigator.userAgent,
      status: 'active',
      registeredAt: Timestamp.now(),
      lastUsedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Lỗi đăng ký device:', error);
    throw error;
  }
};

/**
 * Get all devices for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getDevicesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('registeredAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      registeredAt: doc.data().registeredAt?.toDate(),
      lastUsedAt: doc.data().lastUsedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy devices:', error);
    throw error;
  }
};

/**
 * Get device by fingerprint
 * @param {string} userId
 * @param {string} fingerprint
 * @returns {Promise<object|null>}
 */
export const getDeviceByFingerprint = async (userId, fingerprint) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('fingerprint', '==', fingerprint)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate(),
        lastUsedAt: doc.data().lastUsedAt?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Lỗi lấy device by fingerprint:', error);
    throw error;
  }
};

/**
 * Verify device (check if registered and active)
 * @param {string} userId
 * @param {string} fingerprint
 * @returns {Promise<boolean>}
 */
export const verifyDevice = async (userId, fingerprint) => {
  try {
    const device = await getDeviceByFingerprint(userId, fingerprint);

    if (!device) {
      return false;
    }

    if (device.status === 'blocked') {
      throw new Error('Thiết bị này đã bị chặn');
    }

    if (device.status !== 'active') {
      return false;
    }

    // Update last used time
    await updateDoc(doc(db, COLLECTION, device.id), {
      lastUsedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Lỗi verify device:', error);
    throw error;
  }
};

/**
 * Update device name
 * @param {string} deviceId
 * @param {string} deviceName
 * @returns {Promise<void>}
 */
export const updateDeviceName = async (deviceId, deviceName) => {
  try {
    await updateDoc(doc(db, COLLECTION, deviceId), {
      deviceName,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update device name:', error);
    throw error;
  }
};

/**
 * Block a device (admin only)
 * @param {string} deviceId
 * @returns {Promise<void>}
 */
export const blockDevice = async (deviceId) => {
  try {
    await updateDoc(doc(db, COLLECTION, deviceId), {
      status: 'blocked',
      blockedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi block device:', error);
    throw error;
  }
};

/**
 * Unblock a device (admin only)
 * @param {string} deviceId
 * @returns {Promise<void>}
 */
export const unblockDevice = async (deviceId) => {
  try {
    await updateDoc(doc(db, COLLECTION, deviceId), {
      status: 'active',
      blockedAt: null,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi unblock device:', error);
    throw error;
  }
};

/**
 * Delete a device (soft delete)
 * @param {string} deviceId
 * @returns {Promise<void>}
 */
export const deleteDevice = async (deviceId) => {
  try {
    await updateDoc(doc(db, COLLECTION, deviceId), {
      status: 'deleted',
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi xóa device:', error);
    throw error;
  }
};

/**
 * Get all devices (admin only)
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getAllDevices = async (limitCount = 500) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('registeredAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      registeredAt: doc.data().registeredAt?.toDate(),
      lastUsedAt: doc.data().lastUsedAt?.toDate()
    })).slice(0, limitCount);
  } catch (error) {
    console.error('Lỗi lấy all devices:', error);
    throw error;
  }
};
