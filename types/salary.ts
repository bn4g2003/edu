export interface SalaryRecord {
  id: string;
  userId: string;
  userName: string;
  departmentId?: string;
  departmentName?: string;
  month: string; // Format: YYYY-MM
  baseSalary: number; // Lương cơ bản
  workingDays: number; // Số ngày làm việc (mặc định 26)
  absentDays: number; // Số ngày nghỉ
  lateDays: number; // Số ngày đi muộn
  deduction: number; // Số tiền trừ
  finalSalary: number; // Lương thực nhận
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
