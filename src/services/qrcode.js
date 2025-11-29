// src/services/qrcode.js
// QR Code management service

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const DOC_PATH = 'settings/qrcode';

/**
 * Lưu QR Code mới
 * @param {object} data - {code, expiryDate}
 * @returns {Promise<void>}
 */
export const saveQRCode = async (data) => {
  try {
    await setDoc(doc(db, DOC_PATH), {
      code: data.code,
      expiryDate: data.expiryDate ? Timestamp.fromDate(new Date(data.expiryDate)) : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi lưu QR Code:', error);
    throw error;
  }
};

/**
 * Lấy QR Code hiện tại
 * @returns {Promise<object|null>}
 */
export const getQRCode = async () => {
  try {
    const qrDoc = await getDoc(doc(db, DOC_PATH));
    if (qrDoc.exists()) {
      const data = qrDoc.data();
      return {
        ...data,
        expiryDate: data.expiryDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null
      };
    }
    return null;
  } catch (error) {
    console.error('Lỗi lấy QR Code:', error);
    throw error;
  }
};

/**
 * Xác thực QR Code
 * @param {string} qrContent - Nội dung quét được
 * @returns {Promise<boolean>}
 */
export const verifyQRCode = async (qrContent) => {
  try {
    const qrData = await getQRCode();
    if (!qrData) return false;
    
    // Kiểm tra nội dung
    if (qrData.code !== qrContent) return false;
    
    // Kiểm tra thời gian hết hạn
    if (qrData.expiryDate) {
      const now = new Date();
      if (now > qrData.expiryDate) return false;
    }
    
    return true;
  } catch (error) {
    console.error('Lỗi xác thực QR Code:', error);
    return false;
  }
};

/**
 * Tạo nội dung QR Code mới
 * @returns {string}
 */
export const generateQRContent = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `ATTENDANCE_QR_${timestamp}_${random}`;
};

/**
 * Kiểm tra QR Code còn hạn không
 * @param {object} qrData
 * @returns {boolean}
 */
export const isQRCodeValid = (qrData) => {
  if (!qrData) return false;
  if (!qrData.expiryDate) return true; // Không có ngày hết hạn = luôn valid
  return new Date() < new Date(qrData.expiryDate);
};

/**
 * Xóa QR Code
 * @returns {Promise<void>}
 */
export const deleteQRCode = async () => {
  try {
    await setDoc(doc(db, DOC_PATH), {
      code: null,
      expiryDate: null,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi xóa QR Code:', error);
    throw error;
  }
};
