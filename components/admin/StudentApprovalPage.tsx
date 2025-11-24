'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { ArrowLeft, Users, Search } from 'lucide-react';
import { CourseStudents } from './CourseStudents';

interface StudentApprovalPageProps {
  onBack: () => void;
}

export const StudentApprovalPage: React.FC<StudentApprovalPageProps> = ({ onBack }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesRef = collection(db, 'courses');
      const coursesSnapshot = await getDocs(coursesRef);
      const coursesData = coursesSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Course[];
      
      // Only show courses with pending students
      const coursesWithPending = coursesData.filter(c => 
        c.pendingStudents && c.pendingStudents.length > 0
      );
      setCourses(coursesWithPending);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <button 
          onClick={onBack} 
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium mb-4"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Duyệt nhân viên</h2>
            <p className="text-slate-600">Quản lý yêu cầu đăng ký khóa học từ nhân viên</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{courses.length}</div>
            <div className="text-sm text-slate-600">Khóa học có yêu cầu</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm ? 'Không tìm thấy khóa học' : 'Không có yêu cầu nào'}
          </h3>
          <p className="text-slate-600">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Tất cả yêu cầu đã được xử lý'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Khóa học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Nhân viên hiện tại
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Yêu cầu chờ duyệt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{course.title}</div>
                        <div className="text-sm text-slate-500 line-clamp-1">{course.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {course.category}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-900">{course.students?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                        {course.pendingStudents?.length || 0} yêu cầu
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setManagingCourse(course)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Xử lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Students Management Modal */}
      {managingCourse && (
        <CourseStudents
          course={managingCourse}
          onClose={() => setManagingCourse(null)}
          onUpdate={loadCourses}
        />
      )}
    </div>
  );
};
