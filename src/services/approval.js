// src/services/approval.js
// Unified approval workflow service

import {
  getDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
  LEAVE_STATUS
} from './leave';
import {
  getAllRequests as getAllLateEarlyRequests,
  updateRequestStatus as updateLateEarlyStatus,
  REQUEST_STATUS
} from './lateEarly';
import {
  notifyLeaveApproved,
  notifyLeaveRejected,
  notifyLateEarlyApproved,
  notifyLateEarlyRejected
} from './notification';
import { getUserData } from './users';

/**
 * Get all pending approvals (leave + late/early requests)
 * @returns {Promise<object>}
 */
export const getAllPendingApprovals = async () => {
  try {
    const [leaveRequests, lateEarlyRequests] = await Promise.all([
      getAllLeaveRequests(LEAVE_STATUS.PENDING),
      getAllLateEarlyRequests(REQUEST_STATUS.PENDING)
    ]);

    return {
      leaveRequests,
      lateEarlyRequests,
      total: leaveRequests.length + lateEarlyRequests.length
    };
  } catch (error) {
    console.error('Lỗi lấy pending approvals:', error);
    throw error;
  }
};

/**
 * Get all approvals (all statuses)
 * @returns {Promise<object>}
 */
export const getAllApprovals = async () => {
  try {
    const [leaveRequests, lateEarlyRequests] = await Promise.all([
      getAllLeaveRequests(),
      getAllLateEarlyRequests()
    ]);

    return {
      leaveRequests,
      lateEarlyRequests,
      total: leaveRequests.length + lateEarlyRequests.length
    };
  } catch (error) {
    console.error('Lỗi lấy all approvals:', error);
    throw error;
  }
};

/**
 * Approve leave request
 * @param {string} requestId
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Optional review note
 * @returns {Promise<void>}
 */
export const approveLeaveRequest = async (requestId, reviewedBy, reviewNote = null) => {
  try {
    // Get request details
    const requestDoc = await getDoc(doc(db, 'leaveRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Không tìm thấy đơn xin nghỉ');
    }

    const requestData = requestDoc.data();

    // Update status
    await updateLeaveRequestStatus(requestId, LEAVE_STATUS.APPROVED, reviewedBy, reviewNote);

    // Send notification
    await notifyLeaveApproved(requestData.userId, requestId, reviewNote);
  } catch (error) {
    console.error('Lỗi approve leave request:', error);
    throw error;
  }
};

/**
 * Reject leave request
 * @param {string} requestId
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Review note (required for rejection)
 * @returns {Promise<void>}
 */
export const rejectLeaveRequest = async (requestId, reviewedBy, reviewNote) => {
  try {
    if (!reviewNote) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }

    // Get request details
    const requestDoc = await getDoc(doc(db, 'leaveRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Không tìm thấy đơn xin nghỉ');
    }

    const requestData = requestDoc.data();

    // Update status
    await updateLeaveRequestStatus(requestId, LEAVE_STATUS.REJECTED, reviewedBy, reviewNote);

    // Send notification
    await notifyLeaveRejected(requestData.userId, requestId, reviewNote);
  } catch (error) {
    console.error('Lỗi reject leave request:', error);
    throw error;
  }
};

/**
 * Approve late/early request
 * @param {string} requestId
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Optional review note
 * @returns {Promise<void>}
 */
export const approveLateEarlyRequest = async (requestId, reviewedBy, reviewNote = null) => {
  try {
    // Get request details
    const requestDoc = await getDoc(doc(db, 'lateEarlyRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Không tìm thấy đơn xin phép');
    }

    const requestData = requestDoc.data();

    // Update status
    await updateLateEarlyStatus(requestId, REQUEST_STATUS.APPROVED, reviewedBy, reviewNote);

    // Send notification
    await notifyLateEarlyApproved(requestData.userId, requestId, reviewNote);
  } catch (error) {
    console.error('Lỗi approve late/early request:', error);
    throw error;
  }
};

/**
 * Reject late/early request
 * @param {string} requestId
 * @param {string} reviewedBy - User ID of reviewer
 * @param {string} reviewNote - Review note (required for rejection)
 * @returns {Promise<void>}
 */
export const rejectLateEarlyRequest = async (requestId, reviewedBy, reviewNote) => {
  try {
    if (!reviewNote) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }

    // Get request details
    const requestDoc = await getDoc(doc(db, 'lateEarlyRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Không tìm thấy đơn xin phép');
    }

    const requestData = requestDoc.data();

    // Update status
    await updateLateEarlyStatus(requestId, REQUEST_STATUS.REJECTED, reviewedBy, reviewNote);

    // Send notification
    await notifyLateEarlyRejected(requestData.userId, requestId, reviewNote);
  } catch (error) {
    console.error('Lỗi reject late/early request:', error);
    throw error;
  }
};

/**
 * Get approval statistics
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object>}
 */
export const getApprovalStats = async (month, year) => {
  try {
    const [allLeaveRequests, allLateEarlyRequests] = await Promise.all([
      getAllLeaveRequests(),
      getAllLateEarlyRequests()
    ]);

    // Filter by month/year
    const filterByMonth = (requests) => {
      return requests.filter(r => {
        const date = r.createdAt;
        return date.getMonth() + 1 === month && date.getFullYear() === year;
      });
    };

    const leaveRequests = filterByMonth(allLeaveRequests);
    const lateEarlyRequests = filterByMonth(allLateEarlyRequests);

    return {
      leave: {
        total: leaveRequests.length,
        pending: leaveRequests.filter(r => r.status === LEAVE_STATUS.PENDING).length,
        approved: leaveRequests.filter(r => r.status === LEAVE_STATUS.APPROVED).length,
        rejected: leaveRequests.filter(r => r.status === LEAVE_STATUS.REJECTED).length
      },
      lateEarly: {
        total: lateEarlyRequests.length,
        pending: lateEarlyRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length,
        approved: lateEarlyRequests.filter(r => r.status === REQUEST_STATUS.APPROVED).length,
        rejected: lateEarlyRequests.filter(r => r.status === REQUEST_STATUS.REJECTED).length
      },
      overall: {
        total: leaveRequests.length + lateEarlyRequests.length,
        pending: leaveRequests.filter(r => r.status === LEAVE_STATUS.PENDING).length +
          lateEarlyRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length
      }
    };
  } catch (error) {
    console.error('Lỗi lấy approval stats:', error);
    throw error;
  }
};

/**
 * Batch approve requests
 * @param {Array<{id: string, type: 'leave'|'lateEarly'}>} requests
 * @param {string} reviewedBy
 * @param {string} reviewNote
 * @returns {Promise<void>}
 */
export const batchApprove = async (requests, reviewedBy, reviewNote = null) => {
  try {
    const promises = requests.map(req => {
      if (req.type === 'leave') {
        return approveLeaveRequest(req.id, reviewedBy, reviewNote);
      } else {
        return approveLateEarlyRequest(req.id, reviewedBy, reviewNote);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Lỗi batch approve:', error);
    throw error;
  }
};

/**
 * Batch reject requests
 * @param {Array<{id: string, type: 'leave'|'lateEarly'}>} requests
 * @param {string} reviewedBy
 * @param {string} reviewNote
 * @returns {Promise<void>}
 */
export const batchReject = async (requests, reviewedBy, reviewNote) => {
  try {
    if (!reviewNote) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }

    const promises = requests.map(req => {
      if (req.type === 'leave') {
        return rejectLeaveRequest(req.id, reviewedBy, reviewNote);
      } else {
        return rejectLateEarlyRequest(req.id, reviewedBy, reviewNote);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Lỗi batch reject:', error);
    throw error;
  }
};
