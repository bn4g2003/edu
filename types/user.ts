export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
