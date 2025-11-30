// src/pages/Employee/LeaveRequest/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import {
  createLeaveRequest,
  getLeaveRequestsByUser,
  cancelLeaveRequest,
  getLeaveBalance
} from '../../../services/leave';
import { uploadLeaveDocument } from '../../../services/storage';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';
import { formatDate } from '../../../utils/formatters';

const LeaveRequest = () => {
  const { user, userData } = useAuthContext();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    document: null
  });
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [leaveRequests, leaveBalance] = await Promise.all([
        getLeaveRequestsByUser(user.uid),
        getLeaveBalance(user.uid)
      ]);
      setRequests(leaveRequests);
      setBalance(leaveBalance);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    setFormError('');

    // Validation
    if (!formData.startDate || !formData.endDate) {
      setFormError('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setFormError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Vui lòng nhập lý do');
      return;
    }

    setSubmitting(true);
    try {
      let documentUrl = null;

      // Upload document if provided
      if (formData.document) {
        documentUrl = await uploadLeaveDocument(formData.document, user.uid);
      }

      await createLeaveRequest({
        userId: user.uid,
        userName: userData.name,
        leaveType: formData.leaveType,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        reason: formData.reason.trim(),
        documentUrl
      });

      await loadData();
      setShowModal(false);
      setFormData({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
        document: null
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;

    try {
      await cancelLeaveRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Error canceling request:', error);
      alert('Không thể hủy đơn');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
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

  if (loading) {
    return <Loading text="Đang tải đơn xin nghỉ..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Đơn xin nghỉ phép
          </h2>
          <p className="text-gray-500 mt-1">{requests.length} đơn</p>
        </div>

        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn mới
        </Button>
      </div>

      {/* Balance Info */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Phép năm</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {balance.annualLeave}
              </p>
              <p className="text-xs text-gray-500 mt-1">ngày</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Đã dùng</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {balance.usedLeave}
              </p>
              <p className="text-xs text-gray-500 mt-1">ngày</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Còn lại</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {balance.remainingLeave}
              </p>
              <p className="text-xs text-gray-500 mt-1">ngày</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Nghỉ ốm (năm)</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {balance.sickLeaveTaken}
              </p>
              <p className="text-xs text-gray-500 mt-1">ngày</p>
            </div>
          </Card>
        </div>
      )}

      {/* Requests List */}
      <Card title="Danh sách đơn xin nghỉ" noPadding>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có đơn xin nghỉ nào</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn mới
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Loại phép</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Từ ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Đến ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Số ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lý do</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{getLeaveTypeName(request.leaveType)}</span>
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
                            Xem tài liệu
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCancel(request.id)}
                        >
                          Hủy
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Request Modal */}
      {showModal && (
        <Modal
          title="Tạo đơn xin nghỉ phép"
          onClose={() => {
            setShowModal(false);
            setFormData({
              leaveType: 'annual',
              startDate: '',
              endDate: '',
              reason: '',
              document: null
            });
            setFormError('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại phép
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="annual">Nghỉ phép năm</option>
                <option value="sick">Nghỉ ốm</option>
                <option value="personal">Nghỉ cá nhân</option>
                <option value="unpaid">Nghỉ không lương</option>
                <option value="maternity">Nghỉ thai sản</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Từ ngày"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                type="date"
                label="Đến ngày"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập lý do xin nghỉ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài liệu đính kèm (nếu có)
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
                accept="image/*,.pdf"
                className="w-full"
              />
              {formData.document && (
                <p className="text-sm text-gray-600 mt-2">
                  Đã chọn: {formData.document.name}
                </p>
              )}
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    leaveType: 'annual',
                    startDate: '',
                    endDate: '',
                    reason: '',
                    document: null
                  });
                  setFormError('');
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Gửi đơn
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveRequest;
