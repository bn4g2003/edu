'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, BookOpen, Building2, Clock, Award, CheckCircle, Trophy } from 'lucide-react';
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
    topQuizScorers: []
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
        topQuizScorers
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
