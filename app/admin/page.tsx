'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Users, BookOpen, BarChart3, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/Button';
import { UserManagement } from '@/components/admin/UserManagement';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { StudentApprovalPage } from '@/components/admin/StudentApprovalPage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
}

export default function AdminPage() {
  const { userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses'>('overview');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showApprovalPage, setShowApprovalPage] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        router.push('/');
      } else if (userProfile.role !== 'admin') {
        router.push('/');
      }
    }
  }, [userProfile, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        
        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Get total courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const totalCourses = coursesSnapshot.size;

        // Get total enrollments
        const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
        const totalEnrollments = enrollmentsSnapshot.size;

        setStats({ totalUsers, totalCourses, totalEnrollments });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (userProfile?.role === 'admin') {
      fetchStats();
    }
  }, [userProfile]);

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

  if (!userProfile || userProfile.role !== 'admin') {
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
              <div className="bg-red-500 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Quản trị hệ thống</p>
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
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Chào mừng, {userProfile.displayName}!</h2>
          <p className="text-red-100">Quản lý toàn bộ hệ thống Kama từ dashboard này</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              {loadingStats ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl font-bold text-slate-900">{stats.totalUsers}</span>
              )}
            </div>
            <h3 className="text-slate-600 text-sm font-medium">Tổng người dùng</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              {loadingStats ? (
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl font-bold text-slate-900">{stats.totalCourses}</span>
              )}
            </div>
            <h3 className="text-slate-600 text-sm font-medium">Khóa học</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              {loadingStats ? (
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl font-bold text-slate-900">{stats.totalEnrollments}</span>
              )}
            </div>
            <h3 className="text-slate-600 text-sm font-medium">Lượt đăng ký</h3>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {stats.totalCourses > 0 ? Math.round((stats.totalEnrollments / stats.totalCourses) * 10) / 10 : 0}
              </span>
            </div>
            <h3 className="text-slate-600 text-sm font-medium">TB đăng ký/khóa</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quản lý người dùng
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'courses'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quản lý khóa học
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && !showApprovalPage && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all text-left"
                  >
                    <Users className="w-8 h-8 text-brand-600 mb-2" />
                    <h4 className="font-semibold text-slate-900">Quản lý người dùng</h4>
                    <p className="text-sm text-slate-600">Thêm, sửa, xóa tài khoản</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('courses')}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all text-left"
                  >
                    <BookOpen className="w-8 h-8 text-brand-600 mb-2" />
                    <h4 className="font-semibold text-slate-900">Quản lý khóa học</h4>
                    <p className="text-sm text-slate-600">Tạo và chỉnh sửa khóa học</p>
                  </button>

                  <button className="p-4 border-2 border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all text-left">
                    <BarChart3 className="w-8 h-8 text-brand-600 mb-2" />
                    <h4 className="font-semibold text-slate-900">Báo cáo hệ thống</h4>
                    <p className="text-sm text-slate-600">Xem thống kê chi tiết</p>
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Hoạt động gần đây</h3>
                  <div className="text-center py-8 text-slate-500">
                    <p>Chưa có hoạt động nào</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && !showApprovalPage && <UserManagement />}
            {activeTab === 'courses' && !showApprovalPage && (
              <CourseManagement onNavigateToApproval={() => setShowApprovalPage(true)} />
            )}
            {showApprovalPage && <StudentApprovalPage onBack={() => setShowApprovalPage(false)} />}
          </div>
        </div>
      </main>
    </div>
  );
}
