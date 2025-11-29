// src/services/notification.js
// Notification service

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'notifications';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LATE_EARLY_APPROVED: 'late_early_approved',
  LATE_EARLY_REJECTED: 'late_early_rejected',
  NEW_LEAVE_REQUEST: 'new_leave_request',
  NEW_LATE_EARLY_REQUEST: 'new_late_early_request',
  SYSTEM: 'system',
  REMINDER: 'reminder'
};

/**
 * Create notification
 * @param {object} data - Notification data
 * @returns {Promise<string>} Notification ID
 */
export const createNotification = async (data) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      link = null,
      metadata = null
    } = data;

    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      type,
      title,
      message,
      link,
      metadata,
      read: false,
      createdAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Lỗi tạo notification:', error);
    throw error;
  }
};

/**
 * Create multiple notifications (broadcast)
 * @param {Array<string>} userIds
 * @param {object} notificationData
 * @returns {Promise<void>}
 */
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const promises = userIds.map(userId =>
      createNotification({ ...notificationData, userId })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Lỗi tạo bulk notifications:', error);
    throw error;
  }
};

/**
 * Get notifications by user
 * @param {string} userId
 * @param {number} limitCount
 * @returns {Promise<Array>}
 */
export const getNotificationsByUser = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Lỗi lấy unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, COLLECTION, notificationId), {
      read: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi mark as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(document =>
      updateDoc(doc(db, COLLECTION, document.id), {
        read: true,
        readAt: Timestamp.now()
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Lỗi mark all as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await updateDoc(doc(db, COLLECTION, notificationId), {
      deleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi delete notification:', error);
    throw error;
  }
};

/**
 * Notify leave request approved
 * @param {string} userId
 * @param {string} requestId
 * @param {string} reviewNote
 * @returns {Promise<string>}
 */
export const notifyLeaveApproved = async (userId, requestId, reviewNote = null) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.LEAVE_APPROVED,
    title: 'Đơn xin nghỉ được duyệt',
    message: reviewNote || 'Đơn xin nghỉ của bạn đã được phê duyệt',
    link: `/employee/leave-request`,
    metadata: { requestId }
  });
};

/**
 * Notify leave request rejected
 * @param {string} userId
 * @param {string} requestId
 * @param {string} reviewNote
 * @returns {Promise<string>}
 */
export const notifyLeaveRejected = async (userId, requestId, reviewNote = null) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.LEAVE_REJECTED,
    title: 'Đơn xin nghỉ bị từ chối',
    message: reviewNote || 'Đơn xin nghỉ của bạn đã bị từ chối',
    link: `/employee/leave-request`,
    metadata: { requestId }
  });
};

/**
 * Notify late/early request approved
 * @param {string} userId
 * @param {string} requestId
 * @param {string} reviewNote
 * @returns {Promise<string>}
 */
export const notifyLateEarlyApproved = async (userId, requestId, reviewNote = null) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.LATE_EARLY_APPROVED,
    title: 'Đơn đi muộn/về sớm được duyệt',
    message: reviewNote || 'Đơn của bạn đã được phê duyệt',
    link: `/employee/late-early`,
    metadata: { requestId }
  });
};

/**
 * Notify late/early request rejected
 * @param {string} userId
 * @param {string} requestId
 * @param {string} reviewNote
 * @returns {Promise<string>}
 */
export const notifyLateEarlyRejected = async (userId, requestId, reviewNote = null) => {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.LATE_EARLY_REJECTED,
    title: 'Đơn đi muộn/về sớm bị từ chối',
    message: reviewNote || 'Đơn của bạn đã bị từ chối',
    link: `/employee/late-early`,
    metadata: { requestId }
  });
};

/**
 * Notify managers about new leave request
 * @param {Array<string>} managerIds
 * @param {string} employeeName
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export const notifyNewLeaveRequest = async (managerIds, employeeName, requestId) => {
  return createBulkNotifications(managerIds, {
    type: NOTIFICATION_TYPES.NEW_LEAVE_REQUEST,
    title: 'Đơn xin nghỉ mới',
    message: `${employeeName} đã gửi đơn xin nghỉ`,
    link: `/manager/approval`,
    metadata: { requestId }
  });
};

/**
 * Notify managers about new late/early request
 * @param {Array<string>} managerIds
 * @param {string} employeeName
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export const notifyNewLateEarlyRequest = async (managerIds, employeeName, requestId) => {
  return createBulkNotifications(managerIds, {
    type: NOTIFICATION_TYPES.NEW_LATE_EARLY_REQUEST,
    title: 'Đơn đi muộn/về sớm mới',
    message: `${employeeName} đã gửi đơn xin phép`,
    link: `/manager/approval`,
    metadata: { requestId }
  });
};
