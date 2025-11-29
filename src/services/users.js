// src/services/users.js
// User management service

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'users';

/**
 * Lấy thông tin 1 user
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTION, uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Lỗi lấy user data:', error);
    throw error;
  }
};

/**
 * Lấy tất cả users
 * @returns {Promise<Array>}
 */
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('name'))
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Lỗi lấy all users:', error);
    throw error;
  }
};

/**
 * Lấy users theo department
 * @param {string} department
 * @returns {Promise<Array>}
 */
export const getUsersByDepartment = async (department) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('department', '==', department),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Lỗi lấy users by department:', error);
    throw error;
  }
};

/**
 * Lấy users theo role
 * @param {string} role
 * @returns {Promise<Array>}
 */
export const getUsersByRole = async (role) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Lỗi lấy users by role:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin user
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<void>}
 */
export const updateUser = async (uid, data) => {
  try {
    await updateDoc(doc(db, COLLECTION, uid), {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi update user:', error);
    throw error;
  }
};

/**
 * Xóa user
 * @param {string} uid
 * @returns {Promise<void>}
 */
export const deleteUser = async (uid) => {
  try {
    await deleteDoc(doc(db, COLLECTION, uid));
  } catch (error) {
    console.error('Lỗi xóa user:', error);
    throw error;
  }
};

/**
 * Assign manager cho employee
 * @param {string} employeeId
 * @param {string} managerId
 * @returns {Promise<void>}
 */
export const assignManager = async (employeeId, managerId) => {
  try {
    await updateDoc(doc(db, COLLECTION, employeeId), {
      managerId: managerId,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Lỗi assign manager:', error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả phòng ban
 * @returns {Promise<Array<string>>}
 */
export const getAllDepartments = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const departments = new Set();
    
    snapshot.docs.forEach(doc => {
      const dept = doc.data().department;
      if (dept) departments.add(dept);
    });
    
    return Array.from(departments).sort();
  } catch (error) {
    console.error('Lỗi lấy danh sách phòng ban:', error);
    throw error;
  }
};

/**
 * Lấy danh sách managers
 * @returns {Promise<Array>}
 */
export const getManagers = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('role', 'in', ['manager', 'admin'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Lỗi lấy danh sách managers:', error);
    throw error;
  }
};

/**
 * Tìm kiếm users
 * @param {string} searchTerm
 * @returns {Promise<Array>}
 */
export const searchUsers = async (searchTerm) => {
  try {
    const allUsers = await getAllUsers();
    const term = searchTerm.toLowerCase();
    
    return allUsers.filter(user => 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.department?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Lỗi tìm kiếm users:', error);
    throw error;
  }
};
