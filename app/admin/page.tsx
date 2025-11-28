'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardSimple } from '@/components/admin/DashboardSimple';
import { UserManagement } from '@/components/admin/UserManagement';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { AttendanceManagement } from '@/components/admin/AttendanceManagement';
import { StudentApprovalPage } from '@/components/admin/StudentApprovalPage';
import { CourseEnrollment } from '@/components/student/CourseEnrollment';
import { StaffCheckIn } from '@/components/staff/StaffCheckIn';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { PermissionProvider } from '@/contexts/PermissionContext';

export default function AdminPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showApprovalPage, setShowApprovalPage] = useState(false);

  // Set default menu based on role
  useEffect(() => {
    if (userProfile) {
      // Staff mặc định vào tab "Chấm công", Admin vào Dashboard
      const defaultMenu = userProfile.role === 'staff' ? 'checkin' : 'dashboard';
      
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const menu = params.get('menu');
        if (menu) {
          setActiveMenu(menu);
        } else {
          setActiveMenu(defaultMenu);
        }
      } else {
        setActiveMenu(defaultMenu);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        router.push('/');
      } else if (userProfile.role !== 'admin' && userProfile.role !== 'staff') {
        // Chỉ admin và staff được vào trang này
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

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'staff')) {
    return null;
  }

  const renderContent = () => {
    if (showApprovalPage) {
      return (
        <ProtectedRoute requiredPermission="manage_courses">
          <StudentApprovalPage onBack={() => setShowApprovalPage(false)} />
        </ProtectedRoute>
      );
    }

    switch (activeMenu) {
      case 'checkin':
        // Chấm công - Không cần quyền, luôn hiển thị cho staff
        return <StaffCheckIn />;
      case 'dashboard':
        return (
          <ProtectedRoute requiredPermission="view_dashboard">
            <DashboardSimple />
          </ProtectedRoute>
        );
      case 'learning':
        // Học bài - Không cần quyền, luôn hiển thị
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Học bài</h1>
            <CourseEnrollment />
          </div>
        );
      case 'users':
        return (
          <ProtectedRoute requiredPermission="view_users">
            <UserManagement />
          </ProtectedRoute>
        );
      case 'courses':
        return (
          <ProtectedRoute requiredPermission="view_courses">
            <CourseManagement onNavigateToApproval={() => setShowApprovalPage(true)} />
          </ProtectedRoute>
        );
      case 'departments':
        return (
          <ProtectedRoute requiredPermission="view_departments">
            <DepartmentManagement />
          </ProtectedRoute>
        );
      case 'attendance':
        return (
          <ProtectedRoute requiredPermission="view_salary">
            <AttendanceManagement />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute requiredPermission="view_dashboard">
            <DashboardSimple />
          </ProtectedRoute>
        );
    }
  };

  return (
    <PermissionProvider>
      <AdminLayout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
        {renderContent()}
      </AdminLayout>
    </PermissionProvider>
  );
}
