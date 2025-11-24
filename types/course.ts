export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // số giờ
  price: number;
  thumbnail: string;
  students: string[]; // array of approved student IDs
  pendingStudents: string[]; // array of pending student IDs
  createdAt: Date;
  updatedAt: Date;
}
