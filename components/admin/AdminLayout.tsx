'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Building2, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  Clock,
  Fingerprint
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
  const [departments, setDepartments] = useState<Array<{id: string, managerId?: string}>>([]);

  useEffect(() => {
    const loadDepartments = async () => {
      const snapshot = await getDocs(collection(db, 'departments'));
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, managerId: doc.data().managerId })));
    };
    loadDepartments();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isManager = departments.some(d => d.managerId === userProfile?.uid);

  const menuItems = [
    { 
      id: 'checkin', 
      label: 'Chấm công', 
      icon: Fingerprint,
      permission: null, // Không cần quyền
      hideForStaff: false, // Staff luôn thấy
      hideForAdmin: true // Admin KHÔNG thấy
    },
    { 
      id: 'dashboard', 
      label: 'Tổng quan', 
      icon: LayoutDashboard,
      permission: 'view_dashboard' as const,
      hideForStaff: false,
      hideForManager: true // Trưởng phòng KHÔNG thấy
    },
    { 
      id: 'learning', 
      label: 'Học bài', 
      icon: GraduationCap,
      permission: null,
      hideForStaff: false,
      hideForAdmin: true
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
      id: 'attendance', 
      label: 'Quản lý chấm công', 
      icon: Clock,
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
                <img src="/logo.png" alt="Kama Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h1 className="font-bold text-lg">Chào mừng bạn</h1>
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
            const isManager = userProfile?.position === 'Trưởng phòng';
            
            // Ẩn menu nếu role không phù hợp
            if (isAdmin && item.hideForAdmin) {
              return null; // Admin không thấy "Học bài"
            }
            if (isStaff && item.hideForStaff) {
              return null;
            }
            if (isManager && item.hideForManager) {
              return null; // Trưởng phòng không thấy "Tổng quan"
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
