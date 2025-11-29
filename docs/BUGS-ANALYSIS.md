# 🐛 BÁO CÁO PHÂN TÍCH BUGS & CONFLICTS

## Sau khi review toàn bộ code, tôi phát hiện các vấn đề sau:

---

## 🔴 BUGS NGHIÊM TRỌNG (Cần fix ngay)

### Bug 1: createUser() làm logout Admin đang đăng nhập

**File:** `services/auth.js` (line 51-69)

**Vấn đề:**
```javascript
export const createUser = async (email, password, userData) => {
  // Khi gọi createUserWithEmailAndPassword, Firebase tự động
  // đăng nhập bằng user mới tạo → Admin bị logout!
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  ...
}
```

**Hậu quả:**
- Admin tạo nhân viên mới → Admin bị logout
- Admin phải đăng nhập lại
- Trải nghiệm rất tệ

**Fix:**
```javascript
// Cách 1: Dùng Firebase Admin SDK (cần backend)
// Cách 2: Tạo secondary Firebase app
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export const createUser = async (email, password, userData) => {
  // Tạo app tạm để không ảnh hưởng auth chính
  const tempApp = initializeApp(FIREBASE_CONFIG, 'tempApp');
  const tempAuth = getAuth(tempApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    const uid = userCredential.user.uid;
    
    // Lưu vào Firestore
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      email,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return uid;
  } finally {
    // Xóa app tạm và logout user vừa tạo
    await signOut(tempAuth);
    await deleteApp(tempApp);
  }
};
```

---

### Bug 2: QR Code chấm công không kiểm tra GPS

**File:** `pages/Attendance/index.jsx` (line 86-103)

**Vấn đề:**
```javascript
const handleQRResult = async (qrContent) => {
  const isValid = await verifyQRCode(qrContent);
  if (!isValid) {
    setMessage({ type: 'error', text: 'QR Code không hợp lệ!' });
    return;
  }
  // Chấm công luôn mà KHÔNG kiểm tra location!
  await handleAttendance('QR Code');
};
```

**Hậu quả:**
- Nhân viên có thể quét QR từ xa (ở nhà, quán cafe...)
- QR Code bị leak ra ngoài → ai cũng chấm công được
- Không có bằng chứng vị trí

**Fix:**
```javascript
const handleQRResult = async (qrContent) => {
  setProcessing(true);
  try {
    const isValid = await verifyQRCode(qrContent);
    if (!isValid) {
      setMessage({ type: 'error', text: 'QR Code không hợp lệ hoặc đã hết hạn!' });
      return;
    }

    // THÊM: Vẫn cần verify GPS khi quét QR
    if (!location) {
      await fetchLocation(); // Lấy GPS
    }
    
    if (!isInRange) {
      setMessage({ 
        type: 'error', 
        text: `QR Code hợp lệ nhưng bạn đang ngoài phạm vi văn phòng (${formatDistance(distance)})` 
      });
      return;
    }

    await handleAttendance('QR Code');
  } catch (err) {
    setMessage({ type: 'error', text: err.message });
  } finally {
    setProcessing(false);
  }
};
```

---

### Bug 3: deleteUser() không xóa Firebase Auth

**File:** `services/users.js` (line 126-133)

**Vấn đề:**
```javascript
export const deleteUser = async (uid) => {
  // Chỉ xóa document trong Firestore
  await deleteDoc(doc(db, COLLECTION, uid));
  // KHÔNG xóa user trong Firebase Authentication!
};
```

**Hậu quả:**
- User bị "xóa" vẫn có thể đăng nhập được
- Auth account vẫn tồn tại
- Confusion khi tạo user mới với email cũ

**Fix:** Cần Firebase Admin SDK hoặc Cloud Function để xóa Auth user

```javascript
// Tạm thời: Disable thay vì xóa
export const deleteUser = async (uid) => {
  try {
    // Soft delete - đánh dấu inactive
    await updateDoc(doc(db, COLLECTION, uid), {
      status: 'deleted',
      deletedAt: Timestamp.now()
    });
    // Lưu ý: Cần Cloud Function để xóa Auth user
  } catch (error) {
    console.error('Lỗi xóa user:', error);
    throw error;
  }
};

// Cập nhật login để check status
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userData = await getUserData(userCredential.user.uid);
  
  if (userData?.status === 'deleted') {
    await signOut(auth);
    throw new Error('Tài khoản đã bị xóa');
  }
  
  return userCredential.user;
};
```

---

## 🟡 LOGIC ISSUES (Cần cải thiện)

### Issue 1: Race condition khi check attendance

**File:** `hooks/useAttendance.js`

**Vấn đề:**
```javascript
const checkIn = useCallback(async (method, location, distance, deviceId = null) => {
  if (todayCheckIn) {  // Check state cũ
    throw new Error('Bạn đã check-in hôm nay rồi!');
  }
  // Nếu 2 request gần nhau, cả 2 đều thấy todayCheckIn = null
  // → Tạo 2 records check-in
  await createAttendance({...});
}, [user, userData, todayCheckIn, loadData]);
```

**Fix:** Double-check từ Firestore trước khi tạo

```javascript
const checkIn = useCallback(async (method, location, distance, deviceId = null) => {
  if (!user || !userData) {
    throw new Error('Chưa đăng nhập');
  }
  
  // THÊM: Verify lại từ Firestore (source of truth)
  const existingCheckIn = await checkTodayAttendance(user.uid, 'check-in');
  if (existingCheckIn) {
    throw new Error('Bạn đã check-in hôm nay rồi!');
  }
  
  setLoading(true);
  try {
    await createAttendance({...});
    await loadData();
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, [user, userData, loadData]);
```

---

### Issue 2: Timezone không nhất quán

**Files:** `services/attendance.js`, `services/reports.js`

**Vấn đề:**
```javascript
// attendance.js
const now = new Date();
date: now.toISOString().split('T')[0], // Dùng UTC!

// Nhưng isLateCheckIn dùng local time
const hours = timestamp.getHours();  // Local timezone
```

**Ví dụ:**
- Server timezone: UTC
- User timezone: UTC+7 (Việt Nam)
- Check-in lúc 8:30 AM VN = 1:30 AM UTC
- `toISOString()` trả về date của ngày hôm trước!

**Fix:**
```javascript
// Dùng local date consistently
const now = new Date();
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// Hoặc dùng date-fns/moment với timezone
import { format } from 'date-fns';
date: format(now, 'yyyy-MM-dd');
```

---

### Issue 3: Không validate location trước khi lưu

**File:** `hooks/useAttendance.js`

**Vấn đề:**
```javascript
await createAttendance({
  userId: user.uid,
  userName: userData.name,
  type: 'check-in',
  method,
  location,    // Có thể là null nếu GPS fail
  distance,    // Có thể là null
  deviceId
});
```

**Fix:**
```javascript
// Validate trước khi lưu
if (!location || !location.lat || !location.lng) {
  throw new Error('Không có dữ liệu vị trí');
}

if (distance === null || distance === undefined) {
  throw new Error('Không thể tính khoảng cách');
}

await createAttendance({
  userId: user.uid,
  userName: userData.name,
  type: 'check-in',
  method,
  location: {
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy || null
  },
  distance: Math.round(distance),
  deviceId
});
```

---

### Issue 4: getMonthlyStats trả về data sai khi cross-year

**File:** `services/attendance.js`

**Vấn đề:** Nếu query tháng 12/2024 nhưng có record từ tháng 1/2025 bị lưu sai month, sẽ không phát hiện được.

**Fix:** Thêm validation date range

```javascript
export const getMonthlyStats = async (userId, month, year) => {
  // Validate input
  if (month < 1 || month > 12) {
    throw new Error('Tháng không hợp lệ');
  }
  if (year < 2020 || year > 2100) {
    throw new Error('Năm không hợp lệ');
  }
  
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );
  // ...
};
```

---

## 🟢 MINOR ISSUES (Nên fix)

### Issue 5: Memory leak với QR Scanner

**File:** `pages/Attendance/index.jsx`

**Vấn đề:** Nếu component unmount trong khi scanner đang chạy, có thể leak

**Hiện tại đã có cleanup:**
```javascript
useEffect(() => {
  return () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
  };
}, []);
```

**Nhưng cần thêm flag để prevent state update after unmount:**
```javascript
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
  };
}, []);

const handleQRResult = async (qrContent) => {
  // ...
  if (!isMountedRef.current) return;
  setMessage({ type: 'success', text: '...' });
};
```

---

### Issue 6: Không handle offline mode

**Vấn đề:** App crash khi offline, không có feedback cho user

**Fix:** Thêm error boundary và offline detection

```javascript
// hooks/useOnlineStatus.js
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

---

### Issue 7: Export CSV có thể crash với data lớn

**File:** `services/reports.js`

**Vấn đề:** Tạo string rất dài trong memory

**Fix:** Stream hoặc chunk data (cho app nhỏ có thể chấp nhận được)

---

## 📊 SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 3 | Bugs cần fix ngay trước khi deploy |
| 🟡 Medium | 4 | Logic issues cần cải thiện |
| 🟢 Low | 3 | Minor issues nên fix khi có thời gian |

---

## ✅ ACTION PLAN

### Trước khi deploy (MUST FIX):
1. [ ] Fix Bug 1: createUser logout admin
2. [ ] Fix Bug 2: QR không check GPS
3. [ ] Fix Bug 3: deleteUser không xóa Auth

### Sau deploy (SHOULD FIX):
4. [ ] Fix Issue 1: Race condition
5. [ ] Fix Issue 2: Timezone
6. [ ] Fix Issue 3: Validate location
7. [ ] Fix Issue 4: Cross-year validation

### Nice to have:
8. [ ] Fix Issue 5: Memory leak
9. [ ] Fix Issue 6: Offline mode
10. [ ] Fix Issue 7: Large CSV export

---

## 🔧 Bạn muốn tôi fix bugs nào trước?

1. **Fix tất cả bugs nghiêm trọng** (Bug 1, 2, 3)
2. **Fix từng bug một** (chỉ định bug number)
3. **Tạo version mới với tất cả fixes**
