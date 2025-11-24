# Hướng dẫn thiết lập Firebase Storage

## Vấn đề
Cần nơi lưu trữ tài liệu (PDF, Word, PowerPoint, Excel) cho các bài học.

## Giải pháp: Firebase Storage

### 1. Kích hoạt Firebase Storage

1. Mở Firebase Console: https://console.firebase.google.com/project/classroom-257dc/storage
2. Nhấn "Get Started" hoặc "Enable Storage"
3. Chọn location: `asia-southeast1` (Singapore - gần Việt Nam nhất)
4. Nhấn "Done"

### 2. Deploy Storage Rules

File `storage.rules` đã được tạo với các quy tắc:
- Cho phép đọc: Tất cả user đã đăng nhập
- Cho phép ghi/xóa: Tất cả user đã đăng nhập (nên cải thiện để chỉ teacher)

**Deploy rules:**

```bash
firebase deploy --only storage
```

Hoặc copy nội dung `storage.rules` vào Firebase Console:
https://console.firebase.google.com/project/classroom-257dc/storage/rules

### 3. Cấu hình CORS (nếu cần)

Nếu gặp lỗi CORS khi upload, tạo file `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Deploy CORS:
```bash
gsutil cors set cors.json gs://classroom-257dc.firebasestorage.app
```

## Tính năng đã tích hợp

### DocumentUploader Component

**Tính năng:**
- ✅ Drag & drop file
- ✅ Click để chọn file
- ✅ Progress bar khi upload
- ✅ Validate file type (PDF, Word, PowerPoint, Excel, Text)
- ✅ Validate file size (max 50MB)
- ✅ Xem và xóa tài liệu đã upload
- ✅ Lưu URL vào Firestore

**Sử dụng:**
```tsx
<DocumentUploader
  lessonId={lesson.id}
  currentDocumentUrl={lesson.documentUrl}
  currentDocumentName={lesson.documentName}
  onUploadComplete={(url, name) => handleUploadComplete(url, name)}
  onRemove={() => handleRemove()}
/>
```

## Cấu trúc lưu trữ

```
documents/
  └── {lessonId}/
      └── {timestamp}_{filename}
```

Ví dụ:
```
documents/
  └── lesson_123/
      ├── 1234567890_bai-giang.pdf
      └── 1234567891_tai-lieu.docx
```

## Giới hạn

**Firebase Storage Free Plan:**
- 5GB storage
- 1GB/day download
- 20,000 uploads/day
- 50,000 downloads/day

Đủ cho giai đoạn đầu. Nếu cần nhiều hơn, nâng cấp lên Blaze Plan (pay as you go).

## Kiểm tra

1. Upload tài liệu trong LessonManagement
2. Kiểm tra file trong Firebase Console: https://console.firebase.google.com/project/classroom-257dc/storage
3. Học sinh xem và tải tài liệu trong CourseViewer

## Cải thiện trong tương lai

1. **Security**: Chỉ cho phép teacher upload/delete
2. **Virus scan**: Scan file trước khi lưu
3. **CDN**: Dùng Firebase CDN để tăng tốc download
4. **Compression**: Nén file trước khi upload
5. **Preview**: Xem trước PDF trong browser
