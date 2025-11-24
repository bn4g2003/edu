'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from './Button';

export const UserDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();

  if (!userProfile) return null;

  const getRoleIcon = () => {
    switch (userProfile.role) {
      case 'admin':
        return <Shield className="w-6 h-6 text-red-500" />;
      case 'teacher':
        return <GraduationCap className="w-6 h-6 text-blue-500" />;
      case 'student':
        return <BookOpen className="w-6 h-6 text-green-500" />;
    }
  };

  const getRoleLabel = () => {
    switch (userProfile.role) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giáo viên';
      case 'student':
        return 'Học sinh';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {userProfile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{userProfile.displayName}</h3>
            <p className="text-slate-600 text-sm">{userProfile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {getRoleIcon()}
              <span className="text-sm font-medium text-slate-700">{getRoleLabel()}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          <LogOut size={16} />
          Đăng xuất
        </Button>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Quyền truy cập</h4>
        <div className="space-y-2 text-sm">
          {userProfile.role === 'admin' && (
            <>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Quản lý người dùng
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Quản lý khóa học
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Xem báo cáo hệ thống
              </div>
            </>
          )}
          {userProfile.role === 'teacher' && (
            <>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Tạo và quản lý khóa học
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Chấm điểm học sinh
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Xem báo cáo lớp học
              </div>
            </>
          )}
          {userProfile.role === 'student' && (
            <>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Tham gia khóa học
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Làm bài tập
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Xem kết quả học tập
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
