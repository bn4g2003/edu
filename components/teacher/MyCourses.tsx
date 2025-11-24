'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Users, Clock } from 'lucide-react';
import { CourseManagement } from './CourseManagement';

export const MyCourses: React.FC = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (userProfile) {
      loadMyCourses();
    }
  }, [userProfile]);

  const loadMyCourses = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      // Load courses assigned to this teacher
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('teacherId', '==', userProfile.uid));
      const snapshot = await getDocs(q);
      const coursesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Course[];
      setCourses(coursesData);

      // Load all students
      const usersRef = collection(db, 'users');
      const studentsQuery = query(usersRef, where('role', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsMap: Record<string, UserProfile> = {};
      studentsSnapshot.docs.forEach(doc => {
        const student = doc.data() as UserProfile;
        studentsMap[student.uid] = student;
      });
      setStudents(studentsMap);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700'
    };
    const labels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level as keyof typeof styles]}`}>
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (selectedCourse) {
    return (
      <CourseManagement
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có khóa học nào</h3>
        <p className="text-slate-600">Admin sẽ phân công khóa học cho bạn</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Khóa học của tôi</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-16 h-16 text-white" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                {getLevelBadge(course.level)}
              </div>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Users size={14} />
                    Học sinh
                  </span>
                  <span className="font-medium text-slate-900">{course.students?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock size={14} />
                    Thời lượng
                  </span>
                  <span className="font-medium text-slate-900">{course.duration}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Danh mục</span>
                  <span className="font-medium text-slate-900">{course.category}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCourse(course)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Quản lý
              </button>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};
