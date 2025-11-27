export type UserRole = 'admin' | 'staff' | 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  departmentId?: string; // ID phòng ban
  monthlySalary?: number; // Lương tháng cơ bản
  approved: boolean; // Trạng thái duyệt tài khoản (mặc định false)
  createdAt: Date;
  updatedAt: Date;
}
