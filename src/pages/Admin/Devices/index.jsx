// src/pages/Admin/Devices/index.jsx
import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, ShieldOff, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllDevices, blockDevice, unblockDevice } from '../../../services/devices';
import { getUserData } from '../../../services/users';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';
import { formatDateTime } from '../../../utils/formatters';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userCache, setUserCache] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const allDevices = await getAllDevices();
      setDevices(allDevices);

      // Load user data for all devices
      const userIds = new Set(allDevices.map(d => d.userId));
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
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc muốn chặn thiết bị này?')) return;

    setActionLoading({ ...actionLoading, [deviceId]: true });
    try {
      await blockDevice(deviceId);
      await loadDevices();
    } catch (error) {
      console.error('Error blocking device:', error);
      alert('Không thể chặn thiết bị: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [deviceId]: false });
    }
  };

  const handleUnblockDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc muốn mở chặn thiết bị này?')) return;

    setActionLoading({ ...actionLoading, [deviceId]: true });
    try {
      await unblockDevice(deviceId);
      await loadDevices();
    } catch (error) {
      console.error('Error unblocking device:', error);
      alert('Không thể mở chặn thiết bị: ' + error.message);
    } finally {
      setActionLoading({ ...actionLoading, [deviceId]: false });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hoạt động
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="error">
            <ShieldOff className="w-3 h-3 mr-1" />
            Đã chặn
          </Badge>
        );
      case 'deleted':
        return <Badge variant="secondary">Đã xóa</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDeviceIcon = (userAgent) => {
    const ua = userAgent?.toLowerCase() || '';
    if (ua.includes('android')) return '🤖';
    if (ua.includes('iphone') || ua.includes('ipad')) return '🍎';
    if (ua.includes('windows')) return '💻';
    if (ua.includes('mac')) return '🖥️';
    return '📱';
  };

  const filteredDevices = devices.filter(device => {
    const userData = userCache[device.userId];
    const matchesSearch =
      userData?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.fingerprint?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    blocked: devices.filter(d => d.status === 'blocked').length,
    deleted: devices.filter(d => d.status === 'deleted').length
  };

  if (loading) {
    return <Loading text="Đang tải danh sách thiết bị..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý thiết bị</h2>
          <p className="text-gray-500">Tổng cộng {devices.length} thiết bị</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng thiết bị</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <Smartphone className="w-10 h-10 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoạt động</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã chặn</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.blocked}</p>
            </div>
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã xóa</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{stats.deleted}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">Tất cả ({stats.total})</option>
            <option value="active">Hoạt động ({stats.active})</option>
            <option value="blocked">Đã chặn ({stats.blocked})</option>
            <option value="deleted">Đã xóa ({stats.deleted})</option>
          </select>
        </div>
      </Card>

      {/* Devices Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Thiết bị</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Nhân viên</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Fingerprint</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Đăng ký</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Sử dụng gần nhất</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(device => {
                const userData = userCache[device.userId];
                return (
                  <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getDeviceIcon(device.userAgent)}</div>
                        <div>
                          <p className="font-medium text-gray-800">{device.deviceName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {device.userAgent}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-800">
                          {userData?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userData?.email || device.userId}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {device.fingerprint?.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {formatDateTime(device.registeredAt)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {formatDateTime(device.lastUsedAt)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(device.status)}
                    </td>
                    <td className="py-4 px-6">
                      {device.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="error"
                          onClick={() => handleBlockDevice(device.id)}
                          loading={actionLoading[device.id]}
                          disabled={actionLoading[device.id]}
                        >
                          <ShieldOff className="w-4 h-4 mr-1" />
                          Chặn
                        </Button>
                      ) : device.status === 'blocked' ? (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleUnblockDevice(device.id)}
                          loading={actionLoading[device.id]}
                          disabled={actionLoading[device.id]}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Mở chặn
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">Không có</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div className="text-center py-12">
              <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Không tìm thấy thiết bị nào'
                  : 'Chưa có thiết bị nào được đăng ký'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-800 mb-2">Thông tin về quản lý thiết bị</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mỗi nhân viên có thể đăng ký tối đa 2 thiết bị</li>
              <li>• Thiết bị bị chặn sẽ không thể chấm công</li>
              <li>• Fingerprint là mã định danh duy nhất của thiết bị</li>
              <li>• Thời gian sử dụng gần nhất được cập nhật mỗi lần chấm công</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Devices;
