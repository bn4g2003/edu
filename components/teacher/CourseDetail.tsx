'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { Lesson } from '@/types/lesson';
import { LessonProgress } from '@/types/progress';
import { UserProfile } from '@/types/user';
import { ArrowLeft, Users, Clock, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack }) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
  }, [course.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load students and staff
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const allUsers = usersSnapshot.docs.map(doc => doc.data()) as UserProfile[];
      // Filter for staff and students who are enrolled in this course
      const enrolledUsers = allUsers.filter(u =>
        (u.role === 'staff' || u.role === 'student') &&
        course.students?.includes(u.uid)
      );
      setStudents(enrolledUsers);

      // Load lessons
      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(lessonsRef, where('courseId', '==', course.id));
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessonsData = lessonsSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Lesson[];
      lessonsData.sort((a, b) => a.order - b.order);
      setLessons(lessonsData);

      // Load progress
      const progressRef = collection(db, 'progress');
      const progressQuery = query(progressRef, where('courseId', '==', course.id));
      const progressSnapshot = await getDocs(progressQuery);

      const progressMap: Record<string, LessonProgress[]> = {};
      progressSnapshot.docs.forEach(doc => {
        const data = doc.data() as LessonProgress;
        if (!progressMap[data.userId]) {
          progressMap[data.userId] = [];
        }
        progressMap[data.userId].push(data);
      });

      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStudentStats = (studentId: string) => {
    const studentProgress = progress[studentId] || [];
    const totalWatched = studentProgress.reduce((sum, p) => sum + p.watchedSeconds, 0);
    const completedLessons = studentProgress.filter(p => p.completed).length;
    const totalLessons = lessons.filter(l => l.videoId).length;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return {
      totalWatched,
      completedLessons,
      totalLessons,
      completionRate
    };
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#5e3ed0]/20 rounded-xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
              <Users size={20} className="text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">{students.length}</span>
          </div>
          <p className="text-sm text-slate-300">Tổng học viên</p>
        </div>

        <div className="bg-[#5e3ed0]/20 rounded-xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg border border-green-500/30">
              <BookOpen size={20} className="text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{lessons.filter(l => l.videoId).length}</span>
          </div>
          <p className="text-sm text-slate-300">Bài học</p>
        </div>

        <div className="bg-[#5e3ed0]/20 rounded-xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
              <Clock size={20} className="text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {formatDuration(Object.values(progress).flat().reduce((sum, p) => sum + p.watchedSeconds, 0))}
            </span>
          </div>
          <p className="text-sm text-slate-300">Tổng thời gian học</p>
        </div>

        <div className="bg-[#5e3ed0]/20 rounded-xl p-4 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30">
              <CheckCircle size={20} className="text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {Object.values(progress).flat().filter(p => p.completed).length}
            </span>
          </div>
          <p className="text-sm text-slate-300">Bài đã hoàn thành</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-[#5e3ed0]/20 rounded-xl p-12 text-center border border-white/10 backdrop-blur-md">
          <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300">Chưa có học viên nào đăng ký khóa học này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-1">
            <div className="bg-[#5e3ed0]/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-white">Danh sách học viên</h3>
              </div>
              <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                {students.map((student) => {
                  const stats = getStudentStats(student.uid);
                  const isSelected = selectedStudent?.uid === student.uid;

                  return (
                    <button
                      key={student.uid}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${isSelected ? 'bg-[#53cafd]/10 border-l-4 border-[#53cafd]' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/30">
                          {student.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{student.displayName}</p>
                          <p className="text-xs text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-[#53cafd]">
                          <Clock size={12} />
                          {formatDuration(stats.totalWatched)}
                        </span>
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={12} />
                          {stats.completedLessons}/{stats.totalLessons}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Student Detail */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="bg-[#5e3ed0]/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#53cafd]/10 to-purple-500/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-green-500/30">
                      {selectedStudent.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedStudent.displayName}</h3>
                      <p className="text-slate-300">{selectedStudent.email}</p>
                    </div>
                  </div>

                  {(() => {
                    const stats = getStudentStats(selectedStudent.uid);
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#53cafd]">{formatDuration(stats.totalWatched)}</div>
                          <div className="text-xs text-slate-300">Tổng thời gian</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{stats.completedLessons}/{stats.totalLessons}</div>
                          <div className="text-xs text-slate-300">Hoàn thành</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{stats.completionRate.toFixed(0)}%</div>
                          <div className="text-xs text-slate-300">Tiến độ</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-white mb-4">Chi tiết từng bài học</h4>
                  <div className="space-y-3">
                    {lessons.filter(l => l.videoId).map((lesson) => {
                      const studentProgress = progress[selectedStudent.uid] || [];
                      const lessonProgress = studentProgress.find(p => p.lessonId === lesson.id);
                      const watchedPercent = lessonProgress
                        ? (lessonProgress.watchedSeconds / lessonProgress.totalSeconds) * 100
                        : 0;

                      return (
                        <div key={lesson.id} className="p-4 border border-white/10 rounded-lg hover:border-[#53cafd]/50 transition-colors bg-white/5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                              {lesson.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-white">{lesson.title}</h5>
                                {lessonProgress?.completed && (
                                  <CheckCircle size={20} className="text-green-400 flex-shrink-0 ml-2" />
                                )}
                              </div>
                              {lessonProgress ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-[#53cafd] to-purple-500"
                                        style={{ width: `${Math.min(100, watchedPercent)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-300 whitespace-nowrap">
                                      {watchedPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span>Đã xem: {formatDuration(lessonProgress.watchedSeconds)}</span>
                                    <span>•</span>
                                    <span>Tổng: {formatDuration(lessonProgress.totalSeconds)}</span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-slate-500">Chưa xem</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#5e3ed0]/20 rounded-xl border border-white/10 p-12 text-center backdrop-blur-md">
                <TrendingUp className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300">Chọn giáo viên để xem chi tiết tiến độ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
