// src/services/auth.js
// Authentication service

import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { auth, db } from './firebase';
import { FIREBASE_CONFIG } from '../constants/config';

// Secondary app for creating users without logging out admin
let secondaryApp;
let secondaryAuth;

const getSecondaryAuth = () => {
  if (!secondaryAuth) {
    secondaryApp = initializeApp(FIREBASE_CONFIG, 'Secondary');
    secondaryAuth = getAuth(secondaryApp);
  }
  return secondaryAuth;
};

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
 * ✅ Fixed: Sử dụng secondary auth để không logout admin
 * @param {string} email
 * @param {string} password
 * @param {object} userData - {name, role, department, phone}
 * @returns {Promise<string>} User ID
 */
export const createUser = async (email, password, userData) => {
  try {
    // Sử dụng secondary auth instance để không logout admin hiện tại
    const secAuth = getSecondaryAuth();
    const userCredential = await createUserWithEmailAndPassword(secAuth, email, password);
    const uid = userCredential.user.uid;

    // Lưu thông tin vào Firestore
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      email: email,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Sign out khỏi secondary auth
    await signOut(secAuth);

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
