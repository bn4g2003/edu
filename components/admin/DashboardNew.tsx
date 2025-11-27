'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Award,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalDepartments: number;
  totalStaff: number;
  totalSalary: number;
  usersByRole: { name: string; value: number; color: string }[];
  coursesByLevel: { name: string; value: number }[];
  monthlyData: { month: string; users: number; courses: number; revenue: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DashboardNew: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalDepartments: 0,
    totalStaff: 0,
    totalSalary: 0,
    usersByRole: [],
    coursesByLevel: [],
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      // Load courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const courses = coursesSnapshot.docs.map(doc => doc.data());
      
      // Load departments
      const departmentsSnapshot = await getDocs(collection(db, 'departments'));
      
      // Calculate stats
      const staffCount = users.filter(u => u.role === 'staff').length;
      const adminCount = users.filter(u => u.role === 'admin').length;
      
      const totalSalary = users
        .filter(u => u.role === 'staff' && u.monthlySalary)
        .reduce((sum, u) => sum + (u.monthlySalary || 0), 0);

      // Users by role for pie chart
      const usersByRole = [
        { name: 'Nhân viên', value: staffCount, color: '#3b82f6' },
        { name: 'Admin', value: adminCount, color: '#ef4444' }
      ].filter(item => item.value > 0);

      // Courses by level
      const coursesByLevel = [
        { name: 'Cơ bản', value: courses.filter(c => c.level === 'beginner').length },
        { name: 'Trung cấp', value: courses.filter(c => c.level === 'intermediate').length },
        { name: 'Nâng cao', value: courses.filter(c => c.level === 'advanced').length }
      ];

      // Mock monthly data (in real app, get from database)
      const monthlyData = [
        { month: 'T1', users: 45, courses: 12, revenue: 15000000 },
        { month: 'T2', users: 52, courses: 15, revenue: 18000000 },
        { month: 'T3', users: 61, courses: 18, revenue: 22000000 },
        { month: 'T4', users: 70, courses: 20, revenue: 25000000 },
        { month: 'T5', users: 85, courses: 24, revenue: 30000000 },
        { month: 'T6', users: users.length, courses: courses.length, revenue: totalSalary }
      ];

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalDepartments: departmentsSnapshot.size,
        totalStaff: staffCount,
        totalSalary,
        usersByRole,
        coursesByLevel,
        monthlyData
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    color: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{value}</h3>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="font-medium">{trendValue}</span>
              <span className="text-slate-500">so với tháng trước</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Tổng quan hệ thống quản lý</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Khóa học"
          value={stats.totalCourses}
          icon={BookOpen}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Phòng ban"
          value={stats.totalDepartments}
          icon={Building2}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Tổng lương"
          value={`${(stats.totalSalary / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend="up"
          trendValue="+5%"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Nhân viên</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalStaff}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              style={{ width: `${stats.totalStaff > 0 ? (stats.totalStaff / stats.totalUsers) * 100 : 0}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Award className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Admin</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers - stats.totalStaff}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
              style={{ width: `${stats.totalUsers > 0 ? ((stats.totalUsers - stats.totalStaff) / stats.totalUsers) * 100 : 0}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Area Chart - Growth */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Tăng trưởng theo tháng</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorUsers)"
                name="Người dùng"
              />
              <Area 
                type="monotone" 
                dataKey="courses" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorCourses)"
                name="Khóa học"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart - Users by Role */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Phân bổ người dùng</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.usersByRole}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.usersByRole.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Courses by Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-slate-900">Khóa học theo cấp độ</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.coursesByLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart - Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-slate-900">Doanh thu theo tháng</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 6 }}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 bg-white rounded-2xl p-6 border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900">Hoạt động gần đây</h3>
        </div>
        <div className="space-y-4">
          {[
            { action: 'Thêm khóa học mới', detail: 'React Advanced', time: '5 phút trước', color: 'bg-green-100 text-green-600' },
            { action: 'Người dùng mới đăng ký', detail: 'Nguyễn Văn A', time: '15 phút trước', color: 'bg-blue-100 text-blue-600' },
            { action: 'Cập nhật lương', detail: 'Phòng Kỹ thuật', time: '1 giờ trước', color: 'bg-orange-100 text-orange-600' },
            { action: 'Thêm phòng ban', detail: 'Phòng Marketing', time: '2 giờ trước', color: 'bg-purple-100 text-purple-600' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
              <div className={`w-2 h-2 rounded-full ${activity.color.split(' ')[0]}`} />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{activity.action}</p>
                <p className="text-sm text-slate-600">{activity.detail}</p>
              </div>
              <span className="text-sm text-slate-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
