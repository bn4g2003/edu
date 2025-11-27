'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Building2, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  Shield,
  UserCog,
  GraduationCap
} from 'lucide-react';
import { PermissionAction } from '@/types/permission';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeMenu, onMenuChange }) => {
  const { userProfile, signOut } = useAuth();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Tổng quan', 
      icon: LayoutDashboard,
      permission: 'view_dashboard' as const,
      hideForStaff: false // Staff có thể thấy nếu có quyền
    },
    { 
      id: 'learning', 
      label: 'Học bài', 
      icon: GraduationCap,
      permission: null, // Không cần quyền
      hideForStaff: false, // Staff luôn thấy
      hideForAdmin: true // Admin KHÔNG thấy
    },
    { 
      id: 'users', 
      label: 'Quản lý người dùng', 
      icon: Users,
      permission: 'view_users' as const,
      hideForStaff: false
    },
    { 
      id: 'courses', 
      label: 'Quản lý khóa học', 
      icon: BookOpen,
      permission: 'view_courses' as const,
      hideForStaff: false
    },
    { 
      id: 'departments', 
      label: 'Quản lý phòng ban', 
      icon: Building2,
      permission: 'view_departments' as const,
      hideForStaff: false
    },
    { 
      id: 'salary', 
      label: 'Quản lý lương', 
      icon: DollarSign,
      permission: 'view_salary' as const,
      hideForStaff: false
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col fixed h-screen z-50`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Admin Panel</h1>
                  <p className="text-xs text-slate-400">Kama System</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded">
                <X size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded mx-auto">
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isAdmin = userProfile?.role === 'admin';
            const isStaff = userProfile?.role === 'staff';
            
            // Ẩn menu nếu role không phù hợp
            if (isAdmin && item.hideForAdmin) {
              return null; // Admin không thấy "Học bài"
            }
            if (isStaff && item.hideForStaff) {
              return null;
            }
            
            // Check permission - nếu permission là null thì luôn hiển thị
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onMenuChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-red-500 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          {sidebarOpen ? (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{userProfile?.email}</p>
            </div>
          ) : null}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={!sidebarOpen ? 'Đăng xuất' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  );
};
