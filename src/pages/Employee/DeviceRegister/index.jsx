// src/pages/Employee/DeviceRegister/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext';
import {
  generateDeviceFingerprint,
  registerDevice,
  getDevicesByUser,
  deleteDevice,
  updateDeviceName
} from '../../../services/devices';
import { APP_CONFIG } from '../../../constants/config';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';
import { formatDateTime } from '../../../utils/formatters';

const DeviceRegister = () => {
  const { user } = useAuthContext();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const loadDevices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userDevices = await getDevicesByUser(user.uid);
      setDevices(userDevices);
    } catch (err) {
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleRegisterDevice = async () => {
    if (!deviceName.trim()) {
      setError('Vui lòng nhập tên thiết bị');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const fingerprint = await generateDeviceFingerprint();
      await registerDevice(user.uid, fingerprint, deviceName.trim());
      await loadDevices();
      setShowRegisterModal(false);
      setDeviceName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thiết bị này?')) return;

    try {
      await deleteDevice(deviceId);
      await loadDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
      alert('Không thể xóa thiết bị');
    }
  };

  const activeDevices = devices.filter(d => d.status === 'active');
  const canRegisterMore = activeDevices.length < APP_CONFIG.maxDevicesPerUser;

  if (loading) {
    return <Loading text="Đang tải danh sách thiết bị..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Smartphone className="w-6 h-6" />
            Thiết bị của tôi
          </h2>
          <p className="text-gray-500 mt-1">
            Quản lý các thiết bị được phép chấm công ({activeDevices.length}/{APP_CONFIG.maxDevicesPerUser})
          </p>
        </div>

        {canRegisterMore && (
          <Button onClick={() => setShowRegisterModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Đăng ký thiết bị này
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Về Device Fingerprinting</h4>
              <p className="text-sm text-blue-700 mt-1">
                Hệ thống sử dụng device fingerprinting để đảm bảo bảo mật. Mỗi nhân viên
                chỉ được phép chấm công từ tối đa {APP_CONFIG.maxDevicesPerUser} thiết bị đã đăng ký.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Devices List */}
      <Card title="Danh sách thiết bị">
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Chưa có thiết bị nào được đăng ký</p>
            <Button onClick={() => setShowRegisterModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Đăng ký thiết bị này
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Smartphone className="w-5 h-5 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {device.deviceName}
                        </h4>
                        {device.status === 'active' && (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đang hoạt động
                          </Badge>
                        )}
                        {device.status === 'blocked' && (
                          <Badge variant="error">
                            <XCircle className="w-3 h-3 mr-1" />
                            Đã chặn
                          </Badge>
                        )}
                        {device.status === 'deleted' && (
                          <Badge variant="secondary">Đã xóa</Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>Đăng ký: {formatDateTime(device.registeredAt)}</p>
                        <p>Sử dụng gần nhất: {formatDateTime(device.lastUsedAt)}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          ID: {device.fingerprint.substring(0, 32)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {device.status === 'active' && (
                    <Button
                      onClick={() => handleDeleteDevice(device.id)}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Warning if at limit */}
      {!canRegisterMore && (
        <Card>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Đã đạt giới hạn thiết bị</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Bạn đã đăng ký đủ {APP_CONFIG.maxDevicesPerUser} thiết bị.
                  Vui lòng xóa thiết bị cũ nếu muốn thêm thiết bị mới.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Register Device Modal */}
      {showRegisterModal && (
        <Modal
          title="Đăng ký thiết bị mới"
          onClose={() => {
            setShowRegisterModal(false);
            setDeviceName('');
            setError('');
          }}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Đăng ký thiết bị này để được phép chấm công. Mỗi thiết bị sẽ được
              xác thực bằng device fingerprinting.
            </p>

            <Input
              label="Tên thiết bị"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Ví dụ: iPhone 13 của tôi"
              error={error}
            />

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRegisterModal(false);
                  setDeviceName('');
                  setError('');
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleRegisterDevice}
                loading={registering}
                disabled={registering}
              >
                <Plus className="w-4 h-4 mr-2" />
                Đăng ký
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeviceRegister;
