'use client';

import React, { useState } from 'react';
import { Course } from '@/types/course';
import { ArrowLeft, PlayCircle, Users } from 'lucide-react';
import { LessonManagement } from '@/components/teacher/LessonManagement';
import { CourseDetail } from '@/components/teacher/CourseDetail';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6">
          <button 
            onClick={onBack} 
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{course.title}</h2>
              <p className="text-slate-600">{course.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                <span>Danh mục: {course.category}</span>
                <span>•</span>
                <span>Thời lượng: {course.duration}h</span>
                <span>•</span>
                <span>Học viên: {course.students?.length || 0}</span>
              </div>
            </div>
            {isAdmin && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Chế độ Admin
              </span>
            )}
          </div>
        </div>
        
        <div className="flex border-t border-slate-200">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'lessons'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlayCircle size={20} />
            Quản lý bài học
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'students'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users size={20} />
            Học viên & Thống kê
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'lessons' ? (
          <LessonManagement course={course} onBack={() => {}} />
        ) : (
          <CourseDetail course={course} onBack={() => {}} />
        )}
      </div>
    </div>
  );
};
