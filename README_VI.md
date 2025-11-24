# EduPro - Nền tảng học tập trực tuyến

Hệ thống quản lý học tập với Firestore và 3 vai trò: Admin, Giáo viên, Học sinh.

## 🚀 Tính năng

- ✅ Đăng nhập/Đăng ký với Email & Password
- ✅ Quản lý 3 vai trò: Admin, Giáo viên, Học sinh
- ✅ Dashboard riêng cho từng vai trò với tự động điều hướng
- ✅ Bảo vệ route theo vai trò
- ✅ Lưu trữ user trong Firestore
- ✅ Session management với localStorage
- ✅ Giao diện hiện đại với Tailwind CSS
- ✅ Responsive design cho mobile và desktop

## 📋 Yêu cầu

- Node.js 18+
- npm hoặc yarn
- Tài khoản Firebase

## 🔧 Cài đặt

### 1. Clone và cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Firebase

#### Bước 1: Cấu hình Firestore Rules

1. Truy cập [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/classroom-257dc/firestore/rules)
2. Copy nội dung từ file `firestore.rules` và paste vào
3. Click "Publish"

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

### 3. Tạo tài khoản Admin

#### Cách 1: Chạy script (Khuyến nghị)

```bash
npm run create-admin
```

#### Cách 2: Qua Firebase Console

1. Truy cập [Firestore Database](https://console.firebase.google.com/project/classroom-257dc/firestore/data)
2. Tạo collection `users`
3. Thêm document với các fields:

```
uid: "admin_1"
email: "admin@edupro.com"
password: "admin123"
displayName: "Quản trị viên"
role: "admin"
createdAt: [timestamp]
updatedAt: [timestamp]
```

## 🎯 Chạy ứng dụng

```bash
npm run dev
```

Truy cập: http://localhost:3000

## 👥 Tài khoản mặc định

Sau khi chạy `npm run seed`, bạn có các tài khoản sau:

### Admin
```
📧 Email: admin@edupro.com
🔑 Mật khẩu: admin123
```

### Giáo viên
```
📧 Email: teacher1@edupro.com
🔑 Mật khẩu: teacher123

📧 Email: teacher2@edupro.com
🔑 Mật khẩu: teacher123
```

### Học sinh
```
📧 Email: student1@edupro.com
🔑 Mật khẩu: student123

📧 Email: student2@edupro.com
🔑 Mật khẩu: student123

📧 Email: student3@edupro.com
🔑 Mật khẩu: student123
```

## 🔐 Phân quyền và Điều hướng

Sau khi đăng nhập, người dùng sẽ tự động được điều hướng đến dashboard tương ứng:

### Admin → `/admin`
- ✅ Quản lý người dùng (CRUD)
  - Thêm, sửa, xóa user
  - Tìm kiếm và lọc theo vai trò
  - Xem thống kê user
- ✅ Quản lý khóa học (CRUD)
  - Tạo, sửa, xóa khóa học
  - Gán giáo viên cho khóa học
  - Quản lý danh mục và cấp độ
- ✅ Dashboard với thống kê tổng quan
- ✅ Toàn quyền truy cập

### Giáo viên → `/teacher`
- ✅ Tạo và quản lý khóa học
- ✅ Chấm điểm học sinh
- ✅ Xem báo cáo lớp học
- 📚 Quản lý bài tập và nội dung

### Học sinh → `/student`
- ✅ Tham gia khóa học
- ✅ Làm bài tập
- ✅ Xem kết quả học tập
- 📖 Theo dõi tiến độ học tập

## �T Cấu trúc dự án

```
edu/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── teacher/           # Teacher dashboard
│   ├── student/           # Student dashboard
│   ├── layout.tsx         # Root layout với AuthProvider
│   └── page.tsx           # Trang chủ
├── components/            # React components
│   ├── Auth.tsx          # Form đăng nhập/đăng ký
│   ├── UserDashboard.tsx # Dashboard người dùng
│   ├── Navbar.tsx        # Navigation bar
│   └── ...
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Libraries
│   └── firebase.ts       # Firebase config
├── types/                # TypeScript types
│   └── user.ts          # User types
├── scripts/              # Utility scripts
│   └── createAdmin.ts   # Script tạo admin
└── firestore.rules      # Firestore security rules
```

## 🛠️ Scripts

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run start        # Chạy production server
npm run create-admin # Tạo tài khoản admin
npm run seed         # Tạo dữ liệu mẫu (users + courses)
```

## 🔒 Cấu trúc dữ liệu

### User Document (Firestore)

```json
{
  "uid": "unique_user_id",
  "email": "user@example.com",
  "password": "plaintext_password",
  "displayName": "Tên người dùng",
  "role": "admin|teacher|student",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## ⚠️ Lưu ý bảo mật

1. **Mật khẩu chưa mã hóa**: Hiện tại mật khẩu lưu dạng plaintext trong Firestore
2. **Firestore Rules**: Rules hiện tại cho phép truy cập tự do
3. **Chỉ dùng cho học tập**: Không sử dụng cho production
4. **Session storage**: Sử dụng localStorage để lưu session

## 🐛 Xử lý lỗi thường gặp

### Lỗi "Missing or insufficient permissions"
- Kiểm tra Firestore Rules đã được cấu hình đúng
- Đảm bảo đã publish rules trên Firebase Console

### Lỗi "Email already in use"
- Email đã được đăng ký, sử dụng email khác hoặc đăng nhập

### Không thể đăng nhập
- Kiểm tra email và mật khẩu
- Đảm bảo tài khoản đã được tạo trong Firestore

## 🚀 Nâng cấp trong tương lai

- [ ] Mã hóa mật khẩu với bcrypt
- [ ] Thêm JWT token authentication
- [ ] Cải thiện Firestore security rules
- [ ] Thêm rate limiting
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.

---

Made with ❤️ by EduPro Team
