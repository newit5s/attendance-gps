// src/pages/Admin/QRCode/index.jsx
import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, Download, Trash2, Calendar } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getQRCode, saveQRCode, generateQRContent, deleteQRCode } from '../../../services/qrcode';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import { formatDateTime } from '../../../utils/formatters';

const QRCodeManager = () => {
  const [qrData, setQrData] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      const data = await getQRCode();
      setQrData(data);
      
      if (data?.code) {
        const url = await QRCodeLib.toDataURL(data.code, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        setQrImageUrl(url);
      } else {
        setQrImageUrl('');
      }
    } catch (error) {
      console.error('Error loading QR Code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    setGenerating(true);
    try {
      const newCode = generateQRContent();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      await saveQRCode({
        code: newCode,
        expiryDate: expiryDate.toISOString()
      });

      await loadQRCode();
    } catch (error) {
      console.error('Error generating QR Code:', error);
      alert('Không thể tạo QR Code mới');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQR = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa QR Code hiện tại?')) {
      return;
    }

    try {
      await deleteQRCode();
      setQrData(null);
      setQrImageUrl('');
    } catch (error) {
      console.error('Error deleting QR Code:', error);
      alert('Không thể xóa QR Code');
    }
  };

  const handleDownloadQR = () => {
    if (!qrImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `qrcode_chamcong_${Date.now()}.png`;
    link.href = qrImageUrl;
    link.click();
  };

  const isExpired = qrData?.expiryDate && new Date() > new Date(qrData.expiryDate);

  if (loading) {
    return <Loading text="Đang tải QR Code..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý QR Code</h2>
        <p className="text-gray-500 mt-2">Tạo và quản lý QR Code để nhân viên chấm công</p>
      </div>

      {/* Current QR Code */}
      <Card title="QR Code hiện tại">
        {qrData?.code ? (
          <div className="space-y-6">
            {/* QR Image */}
            <div className="flex justify-center">
              <div className={`p-4 bg-white rounded-xl shadow-lg ${isExpired ? 'opacity-50' : ''}`}>
                <img src={qrImageUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>

            {/* Status */}
            {isExpired ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
                ⚠️ QR Code đã hết hạn! Vui lòng tạo mới.
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center">
                ✓ QR Code đang hoạt động
              </div>
            )}

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã:</span>
                <span className="font-mono text-sm">{qrData.code.substring(0, 30)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span>{qrData.createdAt ? formatDateTime(qrData.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hết hạn:</span>
                <span className={isExpired ? 'text-red-600' : ''}>
                  {qrData.expiryDate ? formatDateTime(qrData.expiryDate) : 'Không giới hạn'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleDownloadQR} variant="outline" fullWidth>
                <Download className="w-4 h-4 mr-2" />
                Tải xuống
              </Button>
              <Button onClick={handleDeleteQR} variant="danger" fullWidth>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có QR Code nào được tạo</p>
          </div>
        )}
      </Card>

      {/* Generate New QR */}
      <Card title="Tạo QR Code mới">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Thời hạn (ngày)
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={60}>60 ngày</option>
              <option value={90}>90 ngày</option>
              <option value={365}>1 năm</option>
            </select>
          </div>

          <Button 
            onClick={handleGenerateQR} 
            loading={generating} 
            fullWidth
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {qrData?.code ? 'Tạo QR Code mới (thay thế cũ)' : 'Tạo QR Code'}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            QR Code cũ sẽ bị vô hiệu hóa khi tạo mới
          </p>
        </div>
      </Card>

      {/* Instructions */}
      <Card title="Hướng dẫn sử dụng">
        <ol className="space-y-3 text-gray-600">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
            <span>Tạo QR Code mới với thời hạn phù hợp</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
            <span>Tải xuống và in QR Code</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
            <span>Dán QR Code tại cổng vào/ra văn phòng</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
            <span>Nhân viên quét QR để chấm công</span>
          </li>
        </ol>
      </Card>
    </div>
  );
};

export default QRCodeManager;
