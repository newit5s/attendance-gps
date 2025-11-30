// src/pages/Manager/Approval/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Calendar, Filter } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import {
  getAllPendingApprovals,
  approveLeaveRequest,
  rejectLeaveRequest,
  approveLateEarlyRequest,
  rejectLateEarlyRequest
} from '../../../services/approval';
import { getUserData } from '../../../services/users';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Loading from '../../../components/common/Loading';
import { formatDate, formatTime } from '../../../utils/formatters';

const Approval = () => {
  const { user } = useAuthContext();
  const [approvals, setApprovals] = useState({ leaveRequests: [], lateEarlyRequests: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState('approve');
  const [submitting, setSubmitting] = useState(false);
  const [userCache, setUserCache] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPendingApprovals();
      setApprovals(data);

      // Load user data for all requests
      const userIds = new Set();
      data.leaveRequests.forEach(req => userIds.add(req.userId));
      data.lateEarlyRequests.forEach(req => userIds.add(req.userId));

      const cache = {};
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userData = await getUserData(userId);
            if (userData) cache[userId] = userData;
          } catch (error) {
            console.error('Error loading user data:', error);
          }
        })
      );
      setUserCache(cache);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenReviewModal = (request, type, action) => {
    setSelectedRequest({ ...request, type });
    setReviewAction(action);
    setReviewNote('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !user) return;

    if (reviewAction === 'reject' && !reviewNote.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedRequest.type === 'leave') {
        if (reviewAction === 'approve') {
          await approveLeaveRequest(selectedRequest.id, user.uid, reviewNote || null);
        } else {
          await rejectLeaveRequest(selectedRequest.id, user.uid, reviewNote);
        }
      } else {
        if (reviewAction === 'approve') {
          await approveLateEarlyRequest(selectedRequest.id, user.uid, reviewNote || null);
        } else {
          await rejectLateEarlyRequest(selectedRequest.id, user.uid, reviewNote);
        }
      }

      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewNote('');
      await loadData();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getLeaveTypeName = (type) => {
    const types = {
      annual: 'Nghỉ phép năm',
      sick: 'Nghỉ ốm',
      personal: 'Nghỉ cá nhân',
      unpaid: 'Nghỉ không lương',
      maternity: 'Nghỉ thai sản',
      other: 'Khác'
    };
    return types[type] || type;
  };

  const getRequestTypeName = (type) => {
    const types = {
      late: 'Đi muộn',
      early: 'Về sớm',
      'late-early': 'Đi muộn/Về sớm'
    };
    return types[type] || type;
  };

  const filteredLeaveRequests = filterType === 'all' || filterType === 'leave'
    ? approvals.leaveRequests
    : [];

  const filteredLateEarlyRequests = filterType === 'all' || filterType === 'late-early'
    ? approvals.lateEarlyRequests
    : [];

  if (loading) {
    return <Loading text="Đang tải danh sách phê duyệt..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Phê duyệt</h2>
          <p className="text-gray-500">
            {approvals.total} đơn chờ duyệt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">Tất cả ({approvals.total})</option>
            <option value="leave">Nghỉ phép ({approvals.leaveRequests.length})</option>
            <option value="late-early">Đi muộn/Về sớm ({approvals.lateEarlyRequests.length})</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng chờ duyệt</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{approvals.total}</p>
            </div>
            <Clock className="w-10 h-10 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nghỉ phép</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{approvals.leaveRequests.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đi muộn/Về sớm</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{approvals.lateEarlyRequests.length}</p>
            </div>
            <FileText className="w-10 h-10 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Leave Requests Table */}
      {filteredLeaveRequests.length > 0 && (
        <Card title="Đơn xin nghỉ phép" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nhân viên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Loại phép</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Từ ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Đến ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Số ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lý do</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaveRequests.map((request) => {
                  const userData = userCache[request.userId];
                  return (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {request.userName || userData?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userData?.department || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info">
                          {getLeaveTypeName(request.leaveType)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(request.startDate)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(request.endDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600">{request.days} ngày</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">{request.reason}</p>
                          {request.documentUrl && (
                            <a
                              href={request.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Xem file
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenReviewModal(request, 'leave', 'approve')}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Duyệt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReviewModal(request, 'leave', 'reject')}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Late/Early Requests Table */}
      {filteredLateEarlyRequests.length > 0 && (
        <Card title="Đơn xin đi muộn/về sớm" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nhân viên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Loại</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thời gian</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lý do</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày tạo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLateEarlyRequests.map((request) => {
                  const userData = userCache[request.userId];
                  return (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">
                            {request.userName || userData?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userData?.department || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="warning">
                          {getRequestTypeName(request.requestType)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(request.date)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {request.time ? formatTime(request.time) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{request.reason}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenReviewModal(request, 'late-early', 'approve')}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Duyệt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReviewModal(request, 'late-early', 'reject')}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {approvals.total === 0 && (
        <Card>
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không có đơn nào chờ duyệt</p>
            <p className="text-gray-400 text-sm mt-2">Tất cả đơn đã được xử lý</p>
          </div>
        </Card>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRequest(null);
            setReviewNote('');
          }}
          title={
            reviewAction === 'approve'
              ? `Duyệt ${selectedRequest.type === 'leave' ? 'đơn nghỉ phép' : 'đơn đi muộn/về sớm'}`
              : `Từ chối ${selectedRequest.type === 'leave' ? 'đơn nghỉ phép' : 'đơn đi muộn/về sớm'}`
          }
        >
          <div className="space-y-4">
            {/* Request Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nhân viên:</span>
                <span className="font-medium">
                  {selectedRequest.userName || userCache[selectedRequest.userId]?.name || 'N/A'}
                </span>
              </div>
              {selectedRequest.type === 'leave' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loại phép:</span>
                    <span className="font-medium">{getLeaveTypeName(selectedRequest.leaveType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Từ ngày:</span>
                    <span className="font-medium">{formatDate(selectedRequest.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Đến ngày:</span>
                    <span className="font-medium">{formatDate(selectedRequest.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Số ngày:</span>
                    <span className="font-medium text-blue-600">{selectedRequest.days} ngày</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loại:</span>
                    <span className="font-medium">{getRequestTypeName(selectedRequest.requestType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ngày:</span>
                    <span className="font-medium">{formatDate(selectedRequest.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Thời gian:</span>
                    <span className="font-medium">
                      {selectedRequest.time ? formatTime(selectedRequest.time) : 'N/A'}
                    </span>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Lý do:</span>
                <p className="text-sm mt-1">{selectedRequest.reason}</p>
              </div>
            </div>

            {/* Review Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  reviewAction === 'approve'
                    ? 'Nhập ghi chú (tùy chọn)...'
                    : 'Nhập lý do từ chối...'
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedRequest(null);
                  setReviewNote('');
                }}
              >
                Hủy
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'primary' : 'error'}
                onClick={handleSubmitReview}
                loading={submitting}
                disabled={submitting}
              >
                {reviewAction === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Duyệt
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Từ chối
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Approval;
