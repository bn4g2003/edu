'use client';

import React, { useState } from 'react';
import { Course } from '@/types/course';
import { ArrowLeft, PlayCircle, Users, UserPlus } from 'lucide-react';
import { LessonManagement } from '@/components/teacher/LessonManagement';
import { CourseDetail } from '@/components/teacher/CourseDetail';
import { CourseStudents } from '@/components/admin/CourseStudents';

interface CourseDetailPageProps {
  course: Course;
  onBack: () => void;
  isAdmin?: boolean;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBack,
  isAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'students'>('lessons');
  const [showStudentManagement, setShowStudentManagement] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#5e3ed0]/20 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="p-6">
          <button
            onClick={onBack}
            className="text-[#53cafd] hover:text-[#3db9f5] flex items-center gap-2 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{course.title}</h2>
              <p className="text-slate-300">{course.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                <span>Danh mục: {course.category}</span>
                <span>•</span>
                <span>Thời lượng: {course.duration}h</span>
                <span>•</span>
                <span>Học viên: {course.students?.length || 0}</span>
              </div>
            </div>
            {isAdmin && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                Chế độ Admin
              </span>
            )}
          </div>
        </div>

        <div className="flex border-t border-white/10">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'lessons'
                ? 'text-[#53cafd] border-b-2 border-[#53cafd] bg-[#53cafd]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <PlayCircle size={20} />
            Quản lý bài học
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'students'
                ? 'text-[#53cafd] border-b-2 border-[#53cafd] bg-[#53cafd]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Users size={20} />
            Học viên & Thống kê
          </button>
        </div>
      </div>

      {/* Student Management Button */}
      {activeTab === 'students' && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowStudentManagement(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
          >
            <UserPlus size={18} />
            Quản lý học viên
          </button>
        </div>
      )}

      {/* Content */}
      <div>
        {activeTab === 'lessons' ? (
          <LessonManagement course={course} onBack={() => { }} />
        ) : (
          <CourseDetail key={refreshKey} course={course} onBack={() => { }} />
        )}
      </div>

      {/* Student Management Modal */}
      {showStudentManagement && (
        <CourseStudents
          course={course}
          onClose={() => setShowStudentManagement(false)}
          onUpdate={() => {
            setRefreshKey(prev => prev + 1);
            setShowStudentManagement(false);
          }}
        />
      )}
    </div>
  );
};
