// src/services/auth.js
// Authentication service

import { 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Đăng nhập với email và password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    throw error;
  }
};

/**
 * Đăng xuất
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    throw error;
  }
};

/**
 * Tạo tài khoản mới (chỉ admin được dùng)
 * @param {string} email
 * @param {string} password
 * @param {object} userData - {name, role, department, phone}
 * @returns {Promise<string>} User ID
 */
export const createUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Lưu thông tin vào Firestore
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      email: email,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return uid;
  } catch (error) {
    console.error('Lỗi tạo tài khoản:', error);
    throw error;
  }
};

/**
 * Gửi email reset password
 * @param {string} email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Lỗi gửi email reset:', error);
    throw error;
  }
};

/**
 * Đổi password
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export const changePassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập');
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error('Lỗi đổi password:', error);
    throw error;
  }
};

/**
 * Theo dõi trạng thái authentication
 * @param {function} callback - (user) => void
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Lấy current user
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};
