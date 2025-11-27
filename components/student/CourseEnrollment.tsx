'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, BookOpen } from 'lucide-react';
import { CourseCard } from './CourseCard';

export const CourseEnrollment: React.FC = () => {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterLevel]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      const coursesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Course[];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (filterLevel !== 'all') {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const isEnrolled = (course: Course) => {
    return course.students?.includes(userProfile?.uid || '');
  };

  const isPending = (course: Course) => {
    return course.pendingStudents?.includes(userProfile?.uid || '');
  };

  const handleEnroll = async (course: Course) => {
    if (!userProfile) return;

    try {
      setEnrolling(course.id);
      const courseRef = doc(db, 'courses', course.id);
      
      if (isEnrolled(course)) {
        // Mark as completed
        await updateDoc(courseRef, {
          students: arrayRemove(userProfile.uid)
        });
        alert('Chúc mừng! Bạn đã hoàn thành khóa học này!');
      } else if (isPending(course)) {
        // Cancel pending request
        await updateDoc(courseRef, {
          pendingStudents: arrayRemove(userProfile.uid)
        });
        alert('Đã hủy yêu cầu đăng ký!');
      } else {
        // Request enrollment
        await updateDoc(courseRef, {
          pendingStudents: arrayUnion(userProfile.uid)
        });
        alert('Đã gửi yêu cầu đăng ký! Vui lòng chờ phê duyệt.');
      }
      
      loadCourses();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Lỗi khi đăng ký khóa học');
    } finally {
      setEnrolling(null);
    }
  };



  const myEnrolledCourses = courses.filter(c => isEnrolled(c));
  const myPendingCourses = courses.filter(c => isPending(c));
  const availableCourses = filteredCourses.filter(c => !isEnrolled(c) && !isPending(c));

  const handleViewCourse = (courseId: string) => {
    router.push(`/student/courses/${courseId}`);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-8">
      {/* My Enrolled Courses */}
      {myEnrolledCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Khóa học đã đăng ký</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEnrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                status="enrolled"
                onEnroll={handleEnroll}
                onView={handleViewCourse}
                enrolling={enrolling === course.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Courses */}
      {myPendingCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Đang chờ phê duyệt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPendingCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                status="pending"
                onEnroll={handleEnroll}
                enrolling={enrolling === course.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Khóa học có sẵn</h2>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tất cả cấp độ</option>
            <option value="beginner">Cơ bản</option>
            <option value="intermediate">Trung cấp</option>
            <option value="advanced">Nâng cao</option>
          </select>
        </div>

        {availableCourses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Không tìm thấy khóa học nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                status="available"
                onEnroll={handleEnroll}
                enrolling={enrolling === course.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
