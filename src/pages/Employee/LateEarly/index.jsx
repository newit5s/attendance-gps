// src/pages/Employee/LateEarly/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import {
  createLateEarlyRequest,
  getRequestsByUser,
  cancelRequest
} from '../../../services/lateEarly';
import { uploadLateEarlyDocument } from '../../../services/storage';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';
import { formatDate, formatTime } from '../../../utils/formatters';

const LateEarly = () => {
  const { user, userData } = useAuthContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'late',
    date: '',
    time: '',
    reason: '',
    document: null
  });
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getRequestsByUser(user.uid);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    setFormError('');

    if (!formData.date || !formData.time) {
      setFormError('Vui lòng chọn ngày và giờ');
      return;
    }

    if (!formData.reason.trim()) {
      setFormError('Vui lòng nhập lý do');
      return;
    }

    setSubmitting(true);
    try {
      let documentUrl = null;
      if (formData.document) {
        documentUrl = await uploadLateEarlyDocument(formData.document, user.uid);
      }

      await createLateEarlyRequest({
        userId: user.uid,
        userName: userData.name,
        type: formData.type,
        date: new Date(formData.date),
        time: formData.time,
        reason: formData.reason.trim(),
        documentUrl
      });

      await loadData();
      setShowModal(false);
      setFormData({ type: 'late', date: '', time: '', reason: '', document: null });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn này?')) return;

    try {
      await cancelRequest(requestId);
      await loadData();
    } catch (error) {
      console.error('Error canceling:', error);
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
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
    }
  };

  if (loading) {
    return <Loading text="Đang tải đơn..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Đơn xin đi muộn / về sớm
          </h2>
          <p className="text-gray-500 mt-1">{requests.length} đơn</p>
        </div>

        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn mới
        </Button>
      </div>

      <Card title="Danh sách đơn" noPadding>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có đơn nào</p>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Loại</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Giờ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Lý do</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant={request.type === 'late' ? 'warning' : 'info'}>
                        {request.type === 'late' ? 'Đi muộn' : 'Về sớm'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(request.date)}</td>
                    <td className="py-3 px-4 font-medium">{request.time}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-4">
                      {request.status === 'pending' && (
                        <Button size="sm" variant="secondary" onClick={() => handleCancel(request.id)}>
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

      {showModal && (
        <Modal title="Tạo đơn xin đi muộn / về sớm" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại đơn</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="late">Đi muộn</option>
                <option value="early">Về sớm</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Ngày"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <Input
                type="time"
                label="Giờ"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Nhập lý do..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tài liệu</label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
                accept="image/*,.pdf"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button onClick={handleSubmit} loading={submitting}>
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

export default LateEarly;
