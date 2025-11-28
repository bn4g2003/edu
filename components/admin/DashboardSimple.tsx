'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, BookOpen, Building2, Clock, Award, CheckCircle, Trophy, Calendar, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalDepartments: number;
  totalUsers: number;
  totalLessonsCompleted: number;
  totalLearningHours: number;
  usersByPosition: { name: string; value: number; color: string }[];
  learningByDepartment: { name: string; hours: number }[];
  departmentComparison: { name: string; 'Giờ học': number; 'Bài hoàn thành': number; 'Điểm TB': number; 'Số người': number }[];
  topLearners: { name: string; hours: number; department: string }[];
  topQuizScorers: { name: string; score: number; quizCount: number }[];
  // Attendance stats
  totalWorkDays: number;
  totalWorkHours: number;
  totalLateMinutes: number;
  todayAttendance: number;
  attendanceRate: number;
  attendanceByDepartment: { name: string; 'Ngày làm': number; 'Giờ làm': number; 'Phút muộn': number }[];
  topAttendance: { name: string; workDays: number; workHours: number; department: string }[];
  topPunctual: { name: string; lateMinutes: number; workDays: number; department: string }[];
}

const POSITION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardSimple: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalDepartments: 0,
    totalUsers: 0,
    totalLessonsCompleted: 0,
    totalLearningHours: 0,
    usersByPosition: [],
    learningByDepartment: [],
    departmentComparison: [],
    topLearners: [],
    topQuizScorers: [],
    totalWorkDays: 0,
    totalWorkHours: 0,
    totalLateMinutes: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    attendanceByDepartment: [],
    topAttendance: [],
    topPunctual: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptSnapshot = await getDocs(collection(db, 'departments'));
      const departments = deptSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || 'Unknown', ...doc.data() }));

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());
      const approvedUsers = users.filter(u => u.approved || u.role === 'admin');

      // Load progress
      const progressSnapshot = await getDocs(collection(db, 'progress'));
      const progressData = progressSnapshot.docs.map(doc => doc.data());

      // Load quiz results
      const quizSnapshot = await getDocs(collection(db, 'quizResults'));
      const quizResults = quizSnapshot.docs.map(doc => doc.data());

      // Load attendance records
      const attendanceSnapshot = await getDocs(collection(db, 'attendanceRecords'));
      const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
      
      // Calculate attendance stats
      const totalWorkDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const totalWorkHours = attendanceRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
      const totalLateMinutes = attendanceRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
      
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceRecords.filter(r => r.date === today).length;
      
      // Calculate attendance rate for current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthRecords = attendanceRecords.filter(r => r.date.startsWith(currentMonth));
      const workingDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const staffCount = approvedUsers.filter(u => u.role === 'staff').length;
      const expectedAttendance = workingDays * staffCount;
      const actualAttendance = monthRecords.filter(r => r.status === 'present' || r.status === 'late').length;
      const attendanceRate = expectedAttendance > 0 ? (actualAttendance / expectedAttendance) * 100 : 0;

      // Attendance by department
      const deptAttendance: Record<string, { workDays: number; workHours: number; lateMinutes: number }> = {};
      departments.forEach(dept => {
        const deptUsers = approvedUsers.filter(u => u.departmentId === dept.id);
        const deptUserIds = deptUsers.map(u => u.uid);
        const deptRecords = attendanceRecords.filter(r => deptUserIds.includes(r.userId));
        
        deptAttendance[dept.name] = {
          workDays: deptRecords.filter(r => r.status === 'present' || r.status === 'late').length,
          workHours: parseFloat(deptRecords.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1)),
          lateMinutes: deptRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0)
        };
      });
      
      const attendanceByDepartment = Object.entries(deptAttendance).map(([name, stats]) => ({
        name,
        'Ngày làm': stats.workDays,
        'Giờ làm': stats.workHours,
        'Phút muộn': stats.lateMinutes
      }));

      // Top attendance (most work days)
      const userAttendance = approvedUsers.filter(u => u.role === 'staff').map(u => {
        const userRecords = attendanceRecords.filter(r => r.userId === u.uid);
        const workDays = userRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const workHours = parseFloat(userRecords.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1));
        const dept = departments.find(d => d.id === u.departmentId);
        return {
          name: u.displayName,
          workDays,
          workHours,
          department: dept?.name || 'Chưa có'
        };
      }).sort((a, b) => b.workDays - a.workDays).slice(0, 10);

      // Top punctual (least late minutes among those with work days)
      const userPunctuality = approvedUsers.filter(u => u.role === 'staff').map(u => {
        const userRecords = attendanceRecords.filter(r => r.userId === u.uid);
        const workDays = userRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const lateMinutes = userRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
        const dept = departments.find(d => d.id === u.departmentId);
        return {
          name: u.displayName,
          lateMinutes,
          workDays,
          department: dept?.name || 'Chưa có'
        };
      }).filter(u => u.workDays > 0).sort((a, b) => a.lateMinutes - b.lateMinutes).slice(0, 10);

      // Calculate stats
      const totalLessonsCompleted = progressData.filter(p => p.completed).length;
      const totalLearningHours = progressData.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / 3600;

      // Users by position
      const positionCounts: Record<string, number> = {};
      approvedUsers.forEach(u => {
        const pos = u.position || 'Chưa có chức vụ';
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      const usersByPosition = Object.entries(positionCounts).map(([name, value], index) => ({
        name,
        value,
        color: POSITION_COLORS[index % POSITION_COLORS.length]
      }));

      // Department comprehensive stats
      const deptStats: Record<string, { 
        hours: number; 
        users: number; 
        lessonsCompleted: number;
        avgQuizScore: number;
        quizCount: number;
      }> = {};
      
      departments.forEach(dept => {
        const deptUsers = approvedUsers.filter(u => u.departmentId === dept.id);
        const deptUserIds = deptUsers.map(u => u.uid);
        const deptProgress = progressData.filter(p => deptUserIds.includes(p.userId));
        const deptQuizzes = quizResults.filter(q => deptUserIds.includes(q.userId));
        
        const hours = deptProgress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / 3600;
        const lessonsCompleted = deptProgress.filter(p => p.completed).length;
        const avgQuizScore = deptQuizzes.length > 0 
          ? deptQuizzes.reduce((sum, q) => sum + q.score, 0) / deptQuizzes.length 
          : 0;
        
        deptStats[dept.name] = {
          hours: parseFloat(hours.toFixed(1)),
          users: deptUsers.length,
          lessonsCompleted,
          avgQuizScore: parseFloat(avgQuizScore.toFixed(1)),
          quizCount: deptQuizzes.length
        };
      });
      
      const learningByDepartment = Object.entries(deptStats)
        .map(([name, stats]) => ({ name, hours: stats.hours }))
        .sort((a, b) => b.hours - a.hours);
      
      const departmentComparison = Object.entries(deptStats).map(([name, stats]) => ({
        name,
        'Giờ học': stats.hours,
        'Bài hoàn thành': stats.lessonsCompleted,
        'Điểm TB': stats.avgQuizScore,
        'Số người': stats.users
      }));

      // Top learners
      const userLearning = approvedUsers.map(u => {
        const userProgress = progressData.filter(p => p.userId === u.uid);
        const hours = userProgress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / 3600;
        const dept = departments.find(d => d.id === u.departmentId);
        return {
          name: u.displayName,
          hours: parseFloat(hours.toFixed(1)),
          department: dept?.name || 'Chưa có'
        };
      }).sort((a, b) => b.hours - a.hours).slice(0, 10);

      // Top quiz scorers
      const userQuizScores: Record<string, { totalScore: number; count: number; name: string }> = {};
      quizResults.forEach(q => {
        if (!userQuizScores[q.userId]) {
          const user = users.find(u => u.uid === q.userId);
          userQuizScores[q.userId] = { totalScore: 0, count: 0, name: user?.displayName || 'Unknown' };
        }
        userQuizScores[q.userId].totalScore += q.score;
        userQuizScores[q.userId].count += 1;
      });
      const topQuizScorers = Object.values(userQuizScores)
        .map(u => ({
          name: u.name,
          score: parseFloat((u.totalScore / u.count).toFixed(1)),
          quizCount: u.count
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setStats({
        totalDepartments: departments.length,
        totalUsers: approvedUsers.length,
        totalLessonsCompleted,
        totalLearningHours: parseFloat(totalLearningHours.toFixed(1)),
        usersByPosition,
        learningByDepartment,
        departmentComparison,
        topLearners: userLearning,
        topQuizScorers,
        totalWorkDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(1)),
        totalLateMinutes,
        todayAttendance,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        attendanceByDepartment,
        topAttendance: userAttendance,
        topPunctual: userPunctuality
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Building2 size={32} />
            <span className="text-3xl font-bold">{stats.totalDepartments}</span>
          </div>
          <p className="text-blue-100">Tổng phòng ban</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={32} />
            <span className="text-3xl font-bold">{stats.totalUsers}</span>
          </div>
          <p className="text-green-100">Tổng nhân viên</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={32} />
            <span className="text-3xl font-bold">{stats.totalLessonsCompleted}</span>
          </div>
          <p className="text-purple-100">Bài học hoàn thành</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock size={32} />
            <span className="text-3xl font-bold">{stats.totalLearningHours}h</span>
          </div>
          <p className="text-orange-100">Tổng giờ học</p>
        </div>
      </div>

      {/* Attendance Stats Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="text-brand-600" size={24} />
          Thống kê chấm công
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Tổng ngày làm</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalWorkDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Tổng giờ làm</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalWorkHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <AlertCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-yellow-700 font-medium">Tổng phút muộn</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.totalLateMinutes}p</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Hôm nay</p>
                <p className="text-2xl font-bold text-purple-900">{stats.todayAttendance}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <Trophy className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-teal-700 font-medium">Tỷ lệ đi làm</p>
                <p className="text-2xl font-bold text-teal-900">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Charts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="text-brand-600" size={20} />
          Chấm công theo phòng ban
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={stats.attendanceByDepartment}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" label={{ value: 'Ngày làm / Giờ làm', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Phút muộn', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Ngày làm" fill="#10b981" />
            <Bar yAxisId="left" dataKey="Giờ làm" fill="#3b82f6" />
            <Bar yAxisId="right" dataKey="Phút muộn" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Comparison Chart - Grouped Bar Chart tối ưu hơn cho so sánh categorical */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">So sánh chỉ số học tập theo phòng ban</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={stats.departmentComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" label={{ value: 'Giờ học / Bài hoàn thành', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Điểm TB / Số người', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Giờ học" fill="#3b82f6" />
            <Bar yAxisId="left" dataKey="Bài hoàn thành" fill="#10b981" />
            <Bar yAxisId="right" dataKey="Điểm TB" fill="#f59e0b" />
            <Bar yAxisId="right" dataKey="Số người" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Position */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Nhân viên theo chức vụ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.usersByPosition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.usersByPosition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Learning by Department */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Giờ học theo phòng ban</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.learningByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attendance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-green-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Top 10 Chuyên cần nhất</h3>
          </div>
          <div className="space-y-2">
            {stats.topAttendance.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.department} • {user.workHours}h</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">{user.workDays} ngày</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Punctual */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-blue-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Top 10 Đúng giờ nhất</h3>
          </div>
          <div className="space-y-2">
            {stats.topPunctual.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.department} • {user.workDays} ngày làm</p>
                  </div>
                </div>
                <span className={`font-bold ${user.lateMinutes === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.lateMinutes === 0 ? '0 phút' : `${user.lateMinutes}p`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Learners */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Top 10 Học nhiều nhất</h3>
          </div>
          <div className="space-y-2">
            {stats.topLearners.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.department}</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">{user.hours}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Quiz Scorers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-green-500" size={24} />
            <h3 className="text-lg font-bold text-slate-900">Top 10 Điểm kiểm tra cao nhất</h3>
          </div>
          <div className="space-y-2">
            {stats.topQuizScorers.length > 0 ? (
              stats.topQuizScorers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.quizCount} bài kiểm tra</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">{user.score} điểm</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Chưa có dữ liệu kiểm tra</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
