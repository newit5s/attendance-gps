// src/services/storage.js
// Firebase Storage service for file uploads

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload file to Firebase Storage
 * @param {File} file - File object to upload
 * @param {string} path - Storage path (e.g., 'avatars/userId/filename.jpg')
 * @param {function} onProgress - Optional progress callback (progress) => void
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = async (file, path, onProgress = null) => {
  try {
    const storageRef = ref(storage, path);

    if (onProgress) {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    }
  } catch (error) {
    console.error('Lỗi upload file:', error);
    throw error;
  }
};

/**
 * Upload user avatar
 * @param {string} userId
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<string>} Download URL
 */
export const uploadAvatar = async (userId, file, onProgress = null) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Kích thước file không được vượt quá 5MB');
  }

  const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
  const path = `avatars/${userId}/${fileName}`;

  return uploadFile(file, path, onProgress);
};

/**
 * Upload leave request document
 * @param {string} userId
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<string>} Download URL
 */
export const uploadLeaveDocument = async (userId, file, onProgress = null) => {
  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file ảnh, PDF hoặc Word');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Kích thước file không được vượt quá 10MB');
  }

  const fileName = `leave_${Date.now()}_${file.name}`;
  const path = `leave-documents/${userId}/${fileName}`;

  return uploadFile(file, path, onProgress);
};

/**
 * Upload late/early request document
 * @param {string} userId
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<string>} Download URL
 */
export const uploadLateEarlyDocument = async (userId, file, onProgress = null) => {
  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file ảnh hoặc PDF');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Kích thước file không được vượt quá 5MB');
  }

  const fileName = `late_early_${Date.now()}_${file.name}`;
  const path = `late-early-documents/${userId}/${fileName}`;

  return uploadFile(file, path, onProgress);
};

/**
 * Delete file from Firebase Storage
 * @param {string} fileUrl - Full download URL or storage path
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileUrl) => {
  try {
    // Extract path from URL if it's a full URL
    let path = fileUrl;
    if (fileUrl.includes('firebase')) {
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        path = decodeURIComponent(pathMatch[1]);
      }
    }

    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Lỗi xóa file:', error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param {string} path - Directory path
 * @returns {Promise<Array>} Array of file URLs
 */
export const listFiles = async (path) => {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);

    const urls = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url
        };
      })
    );

    return urls;
  } catch (error) {
    console.error('Lỗi list files:', error);
    throw error;
  }
};

/**
 * Delete all files in a user's avatar directory
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const deleteUserAvatars = async (userId) => {
  try {
    const path = `avatars/${userId}`;
    const listRef = ref(storage, path);
    const result = await listAll(listRef);

    await Promise.all(
      result.items.map((itemRef) => deleteObject(itemRef))
    );
  } catch (error) {
    console.error('Lỗi xóa user avatars:', error);
    throw error;
  }
};

/**
 * Get file size in human readable format
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate image file
 * @param {File} file
 * @param {number} maxSizeMB - Max size in MB
 * @returns {boolean}
 * @throws {Error}
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)');
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`Kích thước file không được vượt quá ${maxSizeMB}MB`);
  }

  return true;
};
