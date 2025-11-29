'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, BookOpen, Building2, Clock, Award, CheckCircle, Trophy, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalDepartments: number;
  totalUsers: number;
  totalLessonsCompleted: number;
  totalLearningHours: number;
  totalCourses: number;
  averageProgress: number;
  usersByPosition: { name: string; value: number; color: string }[];
  learningByDepartment: { name: string; hours: number }[];
  departmentComparison: { name: string; 'Giờ học': number; 'Bài hoàn thành': number; 'Điểm TB': number; 'Số người': number }[];
  topLearners: { name: string; hours: number; department: string }[];
  topQuizScorers: { name: string; score: number; quizCount: number }[];
  learningTrend: { month: string; hours: number; lessons: number }[];
  learningForecast: { month: string; actual?: number; predicted?: number }[];
}

const POSITION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardSimple: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalDepartments: 0,
    totalUsers: 0,
    totalLessonsCompleted: 0,
    totalLearningHours: 0,
    totalCourses: 0,
    averageProgress: 0,
    usersByPosition: [],
    learningByDepartment: [],
    departmentComparison: [],
    topLearners: [],
    topQuizScorers: [],
    learningTrend: [],
    learningForecast: []
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

      // Load courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const totalCourses = coursesSnapshot.docs.length;

      // Load enrollments
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data());
      
      // Calculate average progress
      const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
      const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;

      // Learning trend by month (last 6 months)
      const learningTrend: { month: string; hours: number; lessons: number }[] = [];
      const now = new Date();
      const monthlyHours: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        
        const monthProgress = progressData.filter(p => {
          const progressDate = p.lastWatched?.toDate?.() || new Date();
          const progressMonth = `${progressDate.getFullYear()}-${String(progressDate.getMonth() + 1).padStart(2, '0')}`;
          return progressMonth === monthStr;
        });
        
        const hours = monthProgress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / 3600;
        const lessons = monthProgress.filter(p => p.completed).length;
        
        monthlyHours.push(hours);
        learningTrend.push({
          month: monthName,
          hours: parseFloat(hours.toFixed(1)),
          lessons
        });
      }

      // Simple linear regression for prediction
      const learningForecast: { month: string; actual?: number; predicted?: number }[] = [];
      
      // Add historical data (last 3 months)
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        learningForecast.push({
          month: monthName,
          actual: monthlyHours[5 - i]
        });
      }
      
      // Calculate trend (simple average growth)
      const recentHours = monthlyHours.slice(-3);
      const avgGrowth = recentHours.length > 1 
        ? (recentHours[recentHours.length - 1] - recentHours[0]) / (recentHours.length - 1)
        : 0;
      
      // Predict next 3 months
      let lastValue = monthlyHours[monthlyHours.length - 1];
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        const predictedValue = Math.max(0, lastValue + avgGrowth);
        learningForecast.push({
          month: monthName,
          predicted: parseFloat(predictedValue.toFixed(1))
        });
        lastValue = predictedValue;
      }

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
        totalCourses,
        averageProgress: parseFloat(averageProgress.toFixed(1)),
        usersByPosition,
        learningByDepartment,
        departmentComparison,
        topLearners: userLearning,
        topQuizScorers,
        learningTrend,
        learningForecast
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Building2 size={32} />
            <span className="text-3xl font-bold">{stats.totalDepartments}</span>
          </div>
          <p className="text-blue-100">Phòng ban</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={32} />
            <span className="text-3xl font-bold">{stats.totalUsers}</span>
          </div>
          <p className="text-green-100">Nhân viên</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BookOpen size={32} />
            <span className="text-3xl font-bold">{stats.totalCourses}</span>
          </div>
          <p className="text-purple-100">Khóa học</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock size={32} />
            <span className="text-3xl font-bold">{stats.totalLearningHours}h</span>
          </div>
          <p className="text-orange-100">Giờ học</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={32} />
            <span className="text-3xl font-bold">{stats.totalLessonsCompleted}</span>
          </div>
          <p className="text-pink-100">Bài hoàn thành</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={32} />
            <span className="text-3xl font-bold">{stats.averageProgress}%</span>
          </div>
          <p className="text-teal-100">Tiến độ TB</p>
        </div>
      </div>

      {/* Learning Trend Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-brand-600" size={20} />
          Xu hướng học tập 6 tháng gần đây
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={stats.learningTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" label={{ value: 'Giờ học', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Bài hoàn thành', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} name="Giờ học" />
            <Line yAxisId="right" type="monotone" dataKey="lessons" stroke="#10b981" strokeWidth={3} name="Bài hoàn thành" />
          </LineChart>
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
        {/* Learning Forecast */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Dự đoán xu hướng học tập</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-slate-600">Thực tế</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-slate-600">Dự đoán</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.learningForecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Giờ học', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                name="Thực tế"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                name="Dự đoán"
                dot={{ fill: '#8b5cf6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900">
              <span className="font-semibold">💡 Insight:</span> Dựa trên xu hướng 3 tháng gần đây, hệ thống dự đoán giờ học sẽ {
                stats.learningForecast.length > 3 && 
                stats.learningForecast[stats.learningForecast.length - 1]?.predicted && 
                stats.learningForecast[2]?.actual && 
                stats.learningForecast[stats.learningForecast.length - 1].predicted! > stats.learningForecast[2].actual 
                  ? 'tăng' 
                  : 'giảm'
              } trong 3 tháng tới.
            </p>
          </div>
        </div>

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
      </div>

      {/* Learning by Department */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Giờ học theo phòng ban</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.learningByDepartment}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Giờ học', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#3b82f6" name="Giờ học" />
          </BarChart>
        </ResponsiveContainer>
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
