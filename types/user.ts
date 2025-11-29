export type UserRole = 'admin' | 'staff' | 'teacher' | 'student';

export type Position = 
  | 'Nhân viên'
  | 'Trưởng nhóm'
  | 'Phó phòng'
  | 'Trưởng phòng'
  | 'Phó giám đốc'
  | 'Giám đốc';

export interface UserProfile {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  position?: Position; // Chức vụ
  departmentId?: string; // ID phòng ban
  monthlySalary?: number; // Lương tháng cơ bản
  totalLearningHours?: number; // Tổng số giờ đã học
  approved: boolean; // Trạng thái duyệt tài khoản (mặc định false)
  photoURL?: string; // URL ảnh đại diện
  // Thông tin cá nhân
  dateOfBirth?: string; // Ngày sinh (YYYY-MM-DD)
  address?: string; // Địa chỉ
  country?: string; // Quốc gia
  phoneNumber?: string; // Số điện thoại
  workLocation?: string; // Vị trí học việc/làm việc
  createdAt: Date;
  updatedAt: Date;
}
