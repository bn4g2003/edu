export interface LessonProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  watchedSeconds: number;
  totalSeconds: number;
  completed: boolean;
  lastWatchedAt: Date;
}
