// src/services/firebase.js
// Firebase initialization

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../constants/config';

// Khởi tạo Firebase
const app = initializeApp(FIREBASE_CONFIG);

// Export các instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
