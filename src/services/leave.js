// src/services/leave.js
// Leave management service

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

const LEAVE_REQUESTS_COLLECTION = 'leaveRequests';
const LEAVE_BALANCES_COLLECTION = 'leaveBalances';

/**
 * Leave types
 */
export const LEAVE_TYPES = {
  ANNUAL: 'annual', // Phép năm
  SICK: 'sick', // Ốm
  PERSONAL: 'personal', // Cá nhân
  MATERNITY: 'maternity', // Thai sản
  UNPAID: 'unpaid' // Không lương
};

/**
 * Leave status
 */
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

/**
 * Create leave request
 * @param {object} data - Leave request data
 * @returns {Promise<string>} Request ID
 */
export const createLeaveRequest = async (data) => {
  try {
    const {
      userId,
      userName,
      leaveType,
      startDate,
      endDate,
      reason,
      documentUrl = null
    } = data;

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const docRef = await addDoc(collection(db, LEAVE_REQUESTS_COLLECTION), {
      userId,
      userName,
      leaveType,
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(end),
      days: diffDays,
      reason,
      documentUrl,
      status: LEAVE_STATUS.PENDING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    console.error('Lỗi tạo leave request:', error);
    throw error;
  }
};

/**
 * Get leave requests by user
 * @param {string} userId
 * @param {string} status - Optional filter by status
 * @returns {Promise<Array>}
 */
export const getLeaveRequestsByUser = async (userId, status = null) => {
  try {
    let q;

    if (status) {
      q = query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy leave requests:', error);
    throw error;
  }
};

/**
 * Get all leave requests (admin/manager)
 * @param {string} status - Optional filter by status
 * @returns {Promise<Array>}
 */
export const getAllLeaveRequests = async (status = null) => {
  try {
    let q;

    if (status) {
      q = query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, LEAVE_REQUESTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Lỗi lấy all leave requests:', error);
    throw error;
  }
};

/**
 * Update leave request status (approve/reject)
 * @param {string} requestId
 * @param {string} status - approved/rejected
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Optional review note
 * @returns {Promise<void>}
 */
export const updateLeaveRequestStatus = async (requestId, status, reviewedBy, reviewNote = null) => {
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

    await updateDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId), updateData);

    // If approved, deduct from leave balance
    if (status === LEAVE_STATUS.APPROVED) {
      const request = await getDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId));
      const requestData = request.data();
      await deductLeaveBalance(requestData.userId, requestData.leaveType, requestData.days);
    }
  } catch (error) {
    console.error('Lỗi update leave request status:', error);
    throw error;
  }
};

/**
 * Cancel leave request (by user)
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export const cancelLeaveRequest = async (requestId) => {
  try {
    const request = await getDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId));
    const requestData = request.data();

    if (requestData.status !== LEAVE_STATUS.PENDING) {
      throw new Error('Chỉ có thể hủy đơn đang chờ duyệt');
    }

    await updateDoc(doc(db, LEAVE_REQUESTS_COLLECTION, requestId), {
      status: LEAVE_STATUS.CANCELLED,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi cancel leave request:', error);
    throw error;
  }
};

/**
 * Initialize leave balance for a user
 * @param {string} userId
 * @param {number} annualDays - Default annual leave days (default: 12)
 * @returns {Promise<void>}
 */
export const initializeLeaveBalance = async (userId, annualDays = 12) => {
  try {
    const year = new Date().getFullYear();

    await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, userId), {
      userId,
      year,
      annual: {
        total: annualDays,
        used: 0,
        remaining: annualDays
      },
      sick: {
        total: 0, // Unlimited sick leave
        used: 0,
        remaining: 0
      },
      personal: {
        total: 0,
        used: 0,
        remaining: 0
      },
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      const year = new Date().getFullYear();
      await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, userId), {
        userId,
        year,
        annual: {
          total: annualDays,
          used: 0,
          remaining: annualDays
        },
        sick: {
          total: 0,
          used: 0,
          remaining: 0
        },
        personal: {
          total: 0,
          used: 0,
          remaining: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      console.error('Lỗi initialize leave balance:', error);
      throw error;
    }
  }
};

/**
 * Get leave balance for a user
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getLeaveBalance = async (userId) => {
  try {
    const docRef = doc(db, LEAVE_BALANCES_COLLECTION, userId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      // Initialize if doesn't exist
      await initializeLeaveBalance(userId);
      return getLeaveBalance(userId);
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
      updatedAt: snapshot.data().updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Lỗi lấy leave balance:', error);
    throw error;
  }
};

/**
 * Deduct leave balance
 * @param {string} userId
 * @param {string} leaveType
 * @param {number} days
 * @returns {Promise<void>}
 */
const deductLeaveBalance = async (userId, leaveType, days) => {
  try {
    const balance = await getLeaveBalance(userId);

    if (leaveType === LEAVE_TYPES.ANNUAL) {
      const newUsed = balance.annual.used + days;
      const newRemaining = balance.annual.total - newUsed;

      await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, userId), {
        'annual.used': newUsed,
        'annual.remaining': newRemaining,
        updatedAt: Timestamp.now()
      });
    } else if (leaveType === LEAVE_TYPES.SICK) {
      const newUsed = balance.sick.used + days;

      await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, userId), {
        'sick.used': newUsed,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Lỗi deduct leave balance:', error);
    throw error;
  }
};

/**
 * Update leave balance
 * @param {string} userId
 * @param {string} leaveType
 * @param {number} totalDays
 * @returns {Promise<void>}
 */
export const updateLeaveBalance = async (userId, leaveType, totalDays) => {
  try {
    const balance = await getLeaveBalance(userId);
    const fieldPrefix = `${leaveType}.`;

    const used = balance[leaveType]?.used || 0;
    const remaining = totalDays - used;

    await updateDoc(doc(db, LEAVE_BALANCES_COLLECTION, userId), {
      [`${fieldPrefix}total`]: totalDays,
      [`${fieldPrefix}remaining`]: remaining,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update leave balance:', error);
    throw error;
  }
};
