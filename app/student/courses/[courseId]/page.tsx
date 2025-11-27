'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { CourseViewer } from '@/components/student/CourseViewer';

export default function CourseDetailPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!userProfile) {
        router.push('/');
      } else if (userProfile.role !== 'student' && userProfile.role !== 'staff') {
        router.push('/');
      }
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    if (courseId && userProfile) {
      loadCourse();
    }
  }, [courseId, userProfile]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        setError('Không tìm thấy khóa học');
        return;
      }
      
      const courseData = {
        ...courseSnap.data(),
        createdAt: courseSnap.data().createdAt?.toDate(),
        updatedAt: courseSnap.data().updatedAt?.toDate()
      } as Course;
      
      // Check if user is enrolled (staff can access all courses)
      if (userProfile?.role !== 'staff' && !courseData.students?.includes(userProfile?.uid || '')) {
        setError('Bạn chưa đăng ký khóa học này');
        return;
      }
      
      setCourse(courseData);
    } catch (err) {
      console.error('Error loading course:', err);
      setError('Lỗi khi tải khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Use router.back() to go back in history, which works better with browser back button
    router.back();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || (userProfile.role !== 'student' && userProfile.role !== 'staff')) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return <CourseViewer course={course} onBack={handleBack} />;
}
