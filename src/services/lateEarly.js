// src/services/lateEarly.js
// Late/Early leave request service

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'lateEarlyRequests';

/**
 * Request types
 */
export const REQUEST_TYPES = {
  LATE_CHECKIN: 'late_checkin', // Đến muộn
  EARLY_CHECKOUT: 'early_checkout' // Về sớm
};

/**
 * Request status
 */
export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

/**
 * Create late/early request
 * @param {object} data - Request data
 * @returns {Promise<string>} Request ID
 */
export const createLateEarlyRequest = async (data) => {
  try {
    const {
      userId,
      userName,
      requestType,
      date,
      expectedTime,
      reason,
      documentUrl = null
    } = data;

    const docRef = await addDoc(collection(db, COLLECTION), {
      userId,
      userName,
      requestType,
      date: Timestamp.fromDate(new Date(date)),
      expectedTime, // HH:MM format
      reason,
      documentUrl,
      status: REQUEST_STATUS.PENDING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Lỗi tạo late/early request:', error);
    throw error;
  }
};

/**
 * Get requests by user
 * @param {string} userId
 * @param {string} status - Optional filter by status
 * @returns {Promise<Array>}
 */
export const getRequestsByUser = async (userId, status = null) => {
  try {
    let q;

    if (status) {
      q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy requests:', error);
    throw error;
  }
};

/**
 * Get all requests (admin/manager)
 * @param {string} status - Optional filter by status
 * @returns {Promise<Array>}
 */
export const getAllRequests = async (status = null) => {
  try {
    let q;

    if (status) {
      q = query(
        collection(db, COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy all requests:', error);
    throw error;
  }
};

/**
 * Get pending requests count
 * @returns {Promise<number>}
 */
export const getPendingRequestsCount = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', REQUEST_STATUS.PENDING)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Lỗi lấy pending requests count:', error);
    throw error;
  }
};

/**
 * Update request status (approve/reject)
 * @param {string} requestId
 * @param {string} status - approved/rejected
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Optional review note
 * @returns {Promise<void>}
 */
export const updateRequestStatus = async (requestId, status, reviewedBy, reviewNote = null) => {
  try {
    const updateData = {
      status,
      reviewedBy,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    if (reviewNote) {
      updateData.reviewNote = reviewNote;
    }

    await updateDoc(doc(db, COLLECTION, requestId), updateData);
  } catch (error) {
    console.error('Lỗi update request status:', error);
    throw error;
  }
};

/**
 * Cancel request (by user)
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export const cancelRequest = async (requestId) => {
  try {
    const request = await getDoc(doc(db, COLLECTION, requestId));
    const requestData = request.data();

    if (requestData.status !== REQUEST_STATUS.PENDING) {
      throw new Error('Chỉ có thể hủy đơn đang chờ duyệt');
    }

    await updateDoc(doc(db, COLLECTION, requestId), {
      status: REQUEST_STATUS.CANCELLED,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi cancel request:', error);
    throw error;
  }
};

/**
 * Get requests by date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} userId - Optional filter by user
 * @returns {Promise<Array>}
 */
export const getRequestsByDateRange = async (startDate, endDate, userId = null) => {
  try {
    let q;

    if (userId) {
      q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy requests by date range:', error);
    throw error;
  }
};

/**
 * Get request statistics by user
 * @param {string} userId
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getUserRequestStats = async (userId, month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const requests = await getRequestsByDateRange(startDate, endDate, userId);

    const stats = {
      total: requests.length,
      lateCheckin: requests.filter(r => r.requestType === REQUEST_TYPES.LATE_CHECKIN).length,
      earlyCheckout: requests.filter(r => r.requestType === REQUEST_TYPES.EARLY_CHECKOUT).length,
      pending: requests.filter(r => r.status === REQUEST_STATUS.PENDING).length,
      approved: requests.filter(r => r.status === REQUEST_STATUS.APPROVED).length,
      rejected: requests.filter(r => r.status === REQUEST_STATUS.REJECTED).length
    };

    return stats;
  } catch (error) {
    console.error('Lỗi lấy user request stats:', error);
    throw error;
  }
};
