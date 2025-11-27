'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/Button';

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
        // Cancel enrollment
        await updateDoc(courseRef, {
          students: arrayRemove(userProfile.uid)
        });
        alert('Đã hủy đăng ký khóa học!');
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
              <div key={course.id} className="bg-white rounded-xl border-2 border-brand-500 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white" />
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <CheckCircle size={14} />
                    Đã đăng ký
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                    {getLevelBadge(course.level)}
                  </div>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>👨‍🏫 {course.teacherName}</span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.students?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock size={14} />
                      {course.duration}h
                    </span>
                    <span className="font-bold text-brand-600">{course.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewCourse(course.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      Học ngay
                    </Button>
                    <Button
                      onClick={() => handleEnroll(course)}
                      disabled={enrolling === course.id}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      {enrolling === course.id ? 'Đang xử lý...' : 'Hủy'}
                    </Button>
                  </div>
                </div>
              </div>
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
              <div key={course.id} className="bg-white rounded-xl border-2 border-yellow-500 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white" />
                  )}
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    ⏳ Chờ duyệt
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                    {getLevelBadge(course.level)}
                  </div>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>👨‍🏫 {course.teacherName}</span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.students?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock size={14} />
                      {course.duration}h
                    </span>
                    <span className="font-bold text-brand-600">{course.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <Button
                    onClick={() => handleEnroll(course)}
                    disabled={enrolling === course.id}
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                  >
                    {enrolling === course.id ? 'Đang xử lý...' : 'Hủy yêu cầu'}
                  </Button>
                </div>
              </div>
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
              <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
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
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>👨‍🏫 {course.teacherName}</span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.students?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock size={14} />
                      {course.duration}h
                    </span>
                    <span className="font-bold text-brand-600">{course.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <Button
                    onClick={() => handleEnroll(course)}
                    disabled={enrolling === course.id}
                    className="w-full"
                  >
                    {enrolling === course.id ? 'Đang xử lý...' : 'Đăng ký ngay'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
