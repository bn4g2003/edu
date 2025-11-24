'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/Button';
import { MyCourses } from '@/components/teacher/MyCourses';

export default function TeacherPage() {
  const { userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        router.push('/');
      } else if (userProfile.role !== 'teacher') {
        router.push('/');
      }
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'teacher') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Teacher Dashboard</h1>
                <p className="text-xs text-slate-500">Quản lý giảng dạy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{userProfile.displayName}</p>
                <p className="text-xs text-slate-500">{userProfile.email}</p>
              </div>
              <Button onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut size={16} />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Chào mừng, {userProfile.displayName}!</h2>
          <p className="text-blue-100">Quản lý khóa học và học sinh của bạn</p>
        </div>

        {/* My Courses */}
        <MyCourses />
      </main>
    </div>
  );
}
