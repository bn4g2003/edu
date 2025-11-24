'use client';

import React, { useState } from 'react';
import { Course } from '@/types/course';
import { ArrowLeft, PlayCircle, Users } from 'lucide-react';
import { LessonManagement } from './LessonManagement';
import { CourseDetail } from './CourseDetail';

interface CourseManagementProps {
  course: Course;
  onBack: () => void;
}

export const CourseManagement: React.FC<CourseManagementProps> = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'students'>('lessons');

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          Quay lại danh sách khóa học
        </button>
        
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">{course.title}</h2>
            <p className="text-slate-600">{course.teacherName}</p>
          </div>
          
          <div className="flex border-b border-slate-200">
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
              Học sinh & Thống kê
            </button>
          </div>
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
