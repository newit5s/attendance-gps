// src/pages/Admin/Settings/index.jsx
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, MapPin, Calendar, Save, RefreshCw } from 'lucide-react';
import {
  getSettings,
  updateWorkingHours,
  updateOfficeLocation,
  updateLeaveSettings
} from '../../../services/settings';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Loading from '../../../components/common/Loading';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  // Working Hours State
  const [workingHours, setWorkingHours] = useState({
    start: { hour: 8, minute: 30 },
    end: { hour: 17, minute: 30 },
    lateThreshold: 15,
    earlyThreshold: 15
  });

  // Office Location State
  const [officeLocation, setOfficeLocation] = useState({
    lat: 10.8231,
    lng: 106.6297,
    radius: 100,
    address: ''
  });

  // Leave Settings State
  const [leaveSettings, setLeaveSettings] = useState({
    annualDaysPerYear: 12,
    maxConsecutiveDays: 15,
    requireDocumentAfterDays: 3,
    advanceNoticeDays: 1
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);

      if (data.workingHours) {
        setWorkingHours(data.workingHours);
      }
      if (data.officeLocation) {
        setOfficeLocation(data.officeLocation);
      }
      if (data.leave) {
        setLeaveSettings(data.leave);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkingHours = async () => {
    setSaving({ ...saving, workingHours: true });
    try {
      await updateWorkingHours(workingHours);
      alert('Đã lưu cài đặt giờ làm việc');
      await loadSettings();
    } catch (error) {
      console.error('Error saving working hours:', error);
      alert('Không thể lưu: ' + error.message);
    } finally {
      setSaving({ ...saving, workingHours: false });
    }
  };

  const handleSaveOfficeLocation = async () => {
    setSaving({ ...saving, officeLocation: true });
    try {
      await updateOfficeLocation(officeLocation);
      alert('Đã lưu cài đặt vị trí văn phòng');
      await loadSettings();
    } catch (error) {
      console.error('Error saving office location:', error);
      alert('Không thể lưu: ' + error.message);
    } finally {
      setSaving({ ...saving, officeLocation: false });
    }
  };

  const handleSaveLeaveSettings = async () => {
    setSaving({ ...saving, leaveSettings: true });
    try {
      await updateLeaveSettings(leaveSettings);
      alert('Đã lưu cài đặt nghỉ phép');
      await loadSettings();
    } catch (error) {
      console.error('Error saving leave settings:', error);
      alert('Không thể lưu: ' + error.message);
    } finally {
      setSaving({ ...saving, leaveSettings: false });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeLocation({
          ...officeLocation,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Không thể lấy vị trí hiện tại');
      }
    );
  };

  if (loading) {
    return <Loading text="Đang tải cài đặt..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h2>
          <p className="text-gray-500">Cấu hình thông số hệ thống</p>
        </div>
      </div>

      {/* Working Hours Settings */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Giờ làm việc</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ bắt đầu
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={workingHours.start.hour}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      start: { ...workingHours.start, hour: Number(e.target.value) }
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Giờ"
                />
                <span className="flex items-center">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={workingHours.start.minute}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      start: { ...workingHours.start, minute: Number(e.target.value) }
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phút"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giờ kết thúc
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={workingHours.end.hour}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      end: { ...workingHours.end, hour: Number(e.target.value) }
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Giờ"
                />
                <span className="flex items-center">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={workingHours.end.minute}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      end: { ...workingHours.end, minute: Number(e.target.value) }
                    })
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phút"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Ngưỡng đi muộn (phút)"
              value={workingHours.lateThreshold}
              onChange={(e) =>
                setWorkingHours({
                  ...workingHours,
                  lateThreshold: Number(e.target.value)
                })
              }
              min="0"
            />
            <Input
              type="number"
              label="Ngưỡng về sớm (phút)"
              value={workingHours.earlyThreshold}
              onChange={(e) =>
                setWorkingHours({
                  ...workingHours,
                  earlyThreshold: Number(e.target.value)
                })
              }
              min="0"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveWorkingHours}
              loading={saving.workingHours}
              disabled={saving.workingHours}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu giờ làm việc
            </Button>
          </div>
        </div>
      </Card>

      {/* Office Location Settings */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span>Vị trí văn phòng</span>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Địa chỉ"
            value={officeLocation.address}
            onChange={(e) =>
              setOfficeLocation({ ...officeLocation, address: e.target.value })
            }
            placeholder="Nhập địa chỉ văn phòng..."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Vĩ độ (Latitude)"
              value={officeLocation.lat}
              onChange={(e) =>
                setOfficeLocation({ ...officeLocation, lat: Number(e.target.value) })
              }
              step="0.000001"
            />
            <Input
              type="number"
              label="Kinh độ (Longitude)"
              value={officeLocation.lng}
              onChange={(e) =>
                setOfficeLocation({ ...officeLocation, lng: Number(e.target.value) })
              }
              step="0.000001"
            />
            <Input
              type="number"
              label="Bán kính cho phép (m)"
              value={officeLocation.radius}
              onChange={(e) =>
                setOfficeLocation({ ...officeLocation, radius: Number(e.target.value) })
              }
              min="10"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Tọa độ hiện tại: {officeLocation.lat.toFixed(6)}, {officeLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Bán kính cho phép: {officeLocation.radius}m
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Lấy vị trí
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveOfficeLocation}
              loading={saving.officeLocation}
              disabled={saving.officeLocation}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu vị trí
            </Button>
          </div>
        </div>
      </Card>

      {/* Leave Settings */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>Cài đặt nghỉ phép</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Số ngày phép năm"
              value={leaveSettings.annualDaysPerYear}
              onChange={(e) =>
                setLeaveSettings({
                  ...leaveSettings,
                  annualDaysPerYear: Number(e.target.value)
                })
              }
              min="0"
            />
            <Input
              type="number"
              label="Số ngày nghỉ liên tiếp tối đa"
              value={leaveSettings.maxConsecutiveDays}
              onChange={(e) =>
                setLeaveSettings({
                  ...leaveSettings,
                  maxConsecutiveDays: Number(e.target.value)
                })
              }
              min="1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Yêu cầu giấy tờ sau (ngày)"
              value={leaveSettings.requireDocumentAfterDays}
              onChange={(e) =>
                setLeaveSettings({
                  ...leaveSettings,
                  requireDocumentAfterDays: Number(e.target.value)
                })
              }
              min="1"
            />
            <Input
              type="number"
              label="Thông báo trước (ngày)"
              value={leaveSettings.advanceNoticeDays}
              onChange={(e) =>
                setLeaveSettings({
                  ...leaveSettings,
                  advanceNoticeDays: Number(e.target.value)
                })
              }
              min="0"
            />
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Quy định hiện tại:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Mỗi nhân viên có {leaveSettings.annualDaysPerYear} ngày phép năm</li>
              <li>• Nghỉ tối đa {leaveSettings.maxConsecutiveDays} ngày liên tiếp</li>
              <li>
                • Cần giấy tờ nếu nghỉ trên {leaveSettings.requireDocumentAfterDays} ngày
              </li>
              <li>• Phải đăng ký trước {leaveSettings.advanceNoticeDays} ngày</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveLeaveSettings}
              loading={saving.leaveSettings}
              disabled={saving.leaveSettings}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu cài đặt nghỉ phép
            </Button>
          </div>
        </div>
      </Card>

      {/* System Info */}
      {settings && (
        <Card title="Thông tin hệ thống">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tên hệ thống</p>
              <p className="font-medium text-gray-800 mt-1">
                {settings.system?.appName || 'Attendance System'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phiên bản</p>
              <p className="font-medium text-gray-800 mt-1">
                {settings.system?.version || '2.0.1'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
              <p className="font-medium text-gray-800 mt-1">
                {settings.updatedAt
                  ? new Date(settings.updatedAt).toLocaleString('vi-VN')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;
