# Shared Components

Thư mục này chứa các components được dùng chung giữa nhiều roles (admin, teacher, student).

## ClassDetailManagement

Component quản lý chi tiết lớp học, bao gồm:
- Quản lý bài học (video, tài liệu, quiz)
- Xem thống kê giáo viên
- Theo dõi tiến độ học tập

### Sử dụng

```tsx
import { ClassDetailManagement } from '@/components/shared/ClassDetailManagement';

// Cho Admin
<ClassDetailManagement
  course={course}
  onClose={() => setDetailCourse(null)}
  isAdmin={true}
/>

// Cho Teacher
<ClassDetailManagement
  course={course}
  onClose={() => setSelectedCourse(null)}
  isAdmin={false}
/>
```

### Props

- `course`: Course object cần quản lý
- `onClose`: Callback khi đóng modal
- `isAdmin`: Boolean để hiển thị badge admin (optional, default: false)
