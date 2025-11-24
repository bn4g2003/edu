# Hướng dẫn thiết lập Firestore Index

## Vấn đề
Firebase Firestore yêu cầu composite index cho các query phức tạp (where + orderBy).

## Giải pháp

### Cách 1: Tự động deploy index (Khuyến nghị)

1. Cài đặt Firebase CLI (nếu chưa có):
```bash
npm install -g firebase-tools
```

2. Đăng nhập Firebase:
```bash
firebase login
```

3. Khởi tạo Firebase project (nếu chưa có):
```bash
firebase init firestore
```
- Chọn project: `classroom-257dc`
- Chọn file rules: `firestore.rules`
- Chọn file indexes: `firestore.indexes.json`

4. Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Cách 2: Tạo index thủ công qua Console

1. Mở link trong error message (hoặc link dưới đây)
2. Nhấn "Create Index"
3. Đợi vài phút để index được tạo

Link tạo index:
https://console.firebase.google.com/v1/r/project/classroom-257dc/firestore/indexes?create_composite=ClNwcm9qZWN0cy9jbGFzc3Jvb20tMjU3ZGMvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3F1aXpSZXN1bHRzL2luZGV4ZXMvXxABGgwKCGxlc3NvbklkEAEaDwoLY29tcGxldGVkQXQQAhoMCghfX25hbWVfXxACOg

## Indexes cần tạo

File `firestore.indexes.json` đã được tạo với các index sau:

1. **quizResults**: lessonId (ASC) + completedAt (DESC)
   - Dùng để lấy kết quả theo bài học, sắp xếp theo thời gian

2. **quizResults**: courseId (ASC) + completedAt (DESC)
   - Dùng để lấy kết quả theo khóa học

3. **quizResults**: userId (ASC) + completedAt (DESC)
   - Dùng để lấy kết quả theo học sinh

## Giải pháp tạm thời

Code đã được cập nhật để:
- Bỏ `orderBy` trong query
- Sắp xếp dữ liệu trong memory thay vì trên Firestore
- Vẫn hoạt động bình thường nhưng có thể chậm hơn với dữ liệu lớn

## Kiểm tra

Sau khi tạo index, kiểm tra tại:
https://console.firebase.google.com/project/classroom-257dc/firestore/indexes

Status phải là "Enabled" (màu xanh).
