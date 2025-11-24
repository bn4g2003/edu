'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface AuthProps {
  initialMode?: 'login' | 'register';
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ initialMode = 'login', onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const redirectByRole = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        router.push('/admin');
        break;
      case 'staff':
        router.push('/student');
        break;
      case 'teacher':
        router.push('/teacher');
        break;
      case 'student':
        router.push('/student');
        break;
      default:
        router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const profile = await signIn(email, password);
        if (profile) {
          redirectByRole(profile.role);
        }
      } else {
        if (!displayName.trim()) {
          setError('Vui lòng nhập họ và tên');
          setLoading(false);
          return;
        }
        const profile = await signUp(email, password, displayName, role);
        redirectByRole(profile.role);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=2070&auto=format&fit=crop" 
            alt="Library" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3 text-white/90 cursor-pointer" onClick={onBack}>
             <img src="/logo.png" alt="Kama" className="h-12 w-auto" />
             <span className="text-2xl font-bold tracking-tight">Kama</span>
          </div>

          <div className="space-y-6 max-w-md">
            <blockquote className="text-2xl font-medium leading-relaxed">
              "Kama không chỉ là một nền tảng học tập, nó là bệ phóng sự nghiệp của tôi. Từ một người mới bắt đầu, tôi đã trở thành Senior Developer chỉ sau 6 tháng."
            </blockquote>
            <div className="flex items-center gap-4">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" 
                alt="User" 
                className="w-12 h-12 rounded-full border-2 border-white/20"
              />
              <div>
                <div className="font-bold">Hoàng Nam</div>
                <div className="text-slate-400 text-sm">Senior Developer tại TechUni</div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-slate-500">
            © 2024 Kama Inc. Privacy Policy & Terms.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center text-slate-500 hover:text-brand-600 transition-colors lg:hidden"
        >
          <ArrowLeft size={20} className="mr-2" /> Quay lại
        </button>

        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right-5 duration-500">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
            </h2>
            <p className="mt-2 text-slate-600">
              {mode === 'login' 
                ? 'Nhập thông tin để tiếp tục lộ trình học tập của bạn.' 
                : 'Bắt đầu hành trình chinh phục tri thức ngay hôm nay.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Vai trò</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  >
                    <option value="student">Giáo viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
                {mode === 'login' && (
                  <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                    Quên mật khẩu?
                  </a>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all pr-10"
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full py-3.5 text-lg shadow-brand-500/25" disabled={loading}>
              {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Miễn Phí')}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600">
            {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button onClick={toggleMode} className="font-bold text-brand-600 hover:text-brand-500 hover:underline">
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};