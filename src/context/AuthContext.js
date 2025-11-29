// src/context/AuthContext.js
// Authentication Context - Global auth state

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, loginUser, logoutUser } from '../services/auth';
import { getUserData } from '../services/users';

// Tạo context
const AuthContext = createContext(null);

/**
 * Auth Provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Theo dõi auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Lỗi lấy user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Refresh user data
   */
  const refreshUserData = async () => {
    if (user) {
      try {
        const data = await getUserData(user.uid);
        setUserData(data);
      } catch (error) {
        console.error('Lỗi refresh user data:', error);
      }
    }
  };

  /**
   * Login
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      await loginUser(email, password);
      // onAuthChange sẽ tự động update state
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Lỗi logout:', error);
      throw error;
    }
  };

  const value = {
    user,                           // Firebase user object
    userData,                       // Firestore user data
    loading,                        // Loading state
    isAuthenticated: !!user,        // Boolean
    isAdmin: userData?.role === 'admin',
    isManager: userData?.role === 'manager' || userData?.role === 'admin',
    login,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook sử dụng Auth Context
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext phải dùng trong AuthProvider');
  }
  return context;
};

export default AuthContext;
