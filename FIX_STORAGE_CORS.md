# Fix Firebase Storage CORS Error

## Lỗi hiện tại
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Nguyên nhân
Firebase Storage chưa được kích hoạt hoặc CORS chưa được cấu hình.

## Giải pháp

### Bước 1: Kích hoạt Firebase Storage

1. Mở Firebase Console:
   https://console.firebase.google.com/project/classroom-257dc/storage

2. Nếu thấy nút "Get Started", nhấn vào để kích hoạt Storage

3. Chọn location: **asia-southeast1** (Singapore - gần VN nhất)

4. Nhấn "Done"

### Bước 2: Cấu hình CORS

**Cách 1: Qua Firebase Console (Dễ nhất)**

1. Vào Storage Rules:
   https://console.firebase.google.com/project/classroom-257dc/storage/rules

2. Thay thế rules bằng:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{lessonId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Nhấn "Publish"

**Cách 2: Qua Firebase CLI (Nếu có)**

```bash
# 1. Cài Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# 2. Đăng nhập
firebase login

# 3. Khởi tạo (nếu chưa có firebase.json)
firebase init storage

# 4. Deploy rules
firebase deploy --only storage
```

**Cách 3: Cấu hình CORS qua gsutil (Nâng cao)**

Nếu vẫn lỗi CORS sau khi deploy rules, cần cấu hình CORS:

1. Tạo file `cors.json`:
```json
[
  {
    "origin": ["http://localhost:3000", "https://classroom-257dc.web.app"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

2. Cài Google Cloud SDK:
   https://cloud.google.com/sdk/docs/install

3. Chạy lệnh:
```bash
gsutil cors set cors.json gs://classroom-257dc.firebasestorage.app
```

### Bước 3: Kiểm tra

1. Refresh trang web (Ctrl + F5)
2. Thử upload file lại
3. Kiểm tra Console không còn lỗi CORS

### Bước 4: Verify Storage đã hoạt động

Kiểm tra tại:
https://console.firebase.google.com/project/classroom-257dc/storage/files

Bạn sẽ thấy folder `documents/` sau khi upload thành công.

## Giải pháp tạm thời (Nếu không thể fix CORS ngay)

Có thể dùng Firestore để lưu file dạng base64 (không khuyến nghị cho file lớn):

```typescript
// Convert file to base64
const reader = new FileReader();
reader.onload = async (e) => {
  const base64 = e.target?.result as string;
  await setDoc(doc(db, 'lessons', lessonId), {
    documentData: base64,
    documentName: file.name
  });
};
reader.readAsDataURL(file);
```

Nhưng cách này:
- ❌ Giới hạn 1MB/document
- ❌ Chậm khi load
- ❌ Tốn băng thông

## Troubleshooting

### Lỗi: "Storage bucket not configured"
→ Chưa kích hoạt Storage, làm Bước 1

### Lỗi: "Permission denied"
→ Chưa deploy rules, làm Bước 2

### Lỗi: "CORS policy"
→ Cần cấu hình CORS, làm Bước 2 Cách 3

### Lỗi: "Quota exceeded"
→ Đã hết quota free (5GB), cần nâng cấp plan

## Kiểm tra nhanh

Mở Console và chạy:
```javascript
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Test upload
const testRef = ref(storage, 'test.txt');
const blob = new Blob(['Hello'], { type: 'text/plain' });
uploadBytes(testRef, blob)
  .then(() => console.log('✅ Storage works!'))
  .catch(err => console.error('❌ Error:', err));
```

## Liên hệ

Nếu vẫn gặp vấn đề, cung cấp:
1. Screenshot Firebase Console Storage page
2. Screenshot error trong Console
3. Output của: `firebase projects:list`
